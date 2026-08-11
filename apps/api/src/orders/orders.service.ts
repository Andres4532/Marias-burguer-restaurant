import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  OrderStatus,
  OrderType,
  OrderSource,
  Prisma,
  PaymentStatus,
  PaymentMethod,
  UserRole,
  ProductSauceMode,
  SaucePlacement,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreatePublicOrderDto } from './dto/create-public-order.dto';
import { UpdateMesaOrderDto } from './dto/update-mesa-order.dto';
import { toNumber } from '../common/utils/decimal.util';
import { getProductPromoPricing } from '../common/utils/product-pricing.util';
import { TimezoneService } from '../common/timezone/timezone.service';
import { EventsService } from '../events/events.service';
import type { JwtPayloadUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private timezone: TimezoneService,
    private eventsService: EventsService,
  ) {}

  private getTodayRange() {
    const { start, end } = this.timezone.getTodayBounds();
    return { start, end };
  }

  private async getNextOrderNumber(
    tx: Prisma.TransactionClient,
    orderDate: Date,
  ): Promise<number> {
    const maxToday = await tx.order.aggregate({
      where: { orderDate },
      _max: { orderNumber: true },
    });
    const maxExisting = maxToday._max.orderNumber ?? 0;

    const existing = await tx.dailyOrderCounter.findUnique({
      where: { date: orderDate },
    });

    if (!existing) {
      const next = maxExisting + 1;
      await tx.dailyOrderCounter.create({
        data: { date: orderDate, lastNumber: next },
      });
      return next;
    }

    if (existing.lastNumber < maxExisting) {
      await tx.dailyOrderCounter.update({
        where: { date: orderDate },
        data: { lastNumber: maxExisting },
      });
    }

    const counter = await tx.dailyOrderCounter.update({
      where: { date: orderDate },
      data: { lastNumber: { increment: 1 } },
    });

    return counter.lastNumber;
  }

  private validateDeliveryFields(fields: {
    customerName?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    deliveryLatitude?: number;
    deliveryLongitude?: number;
  }) {
    if (!fields.customerName?.trim()) {
      throw new BadRequestException('El nombre del cliente es requerido');
    }
    if (!fields.customerPhone?.trim() || fields.customerPhone.trim().length < 6) {
      throw new BadRequestException('El teléfono del cliente es requerido');
    }

    const hasAddress =
      !!fields.deliveryAddress?.trim() &&
      fields.deliveryAddress.trim().length >= 5;
    const hasCoordinates =
      typeof fields.deliveryLatitude === 'number' &&
      typeof fields.deliveryLongitude === 'number' &&
      fields.deliveryLatitude >= -90 &&
      fields.deliveryLatitude <= 90 &&
      fields.deliveryLongitude >= -180 &&
      fields.deliveryLongitude <= 180;

    if (!hasAddress && !hasCoordinates) {
      throw new BadRequestException(
        'Indica la dirección o marca la ubicación en el mapa',
      );
    }
  }

  private mapPayment(payments: Array<{
    id: string;
    method: string;
    amount: { toString(): string };
    amountReceived: { toString(): string } | null;
    changeAmount: { toString(): string } | null;
    paidAt: Date;
    status: string;
    billingNit: string | null;
    billingBusinessName: string | null;
    billingComplement: string | null;
  }>) {
    const paid = payments.find((p) => p.status === 'PAGADO');
    if (!paid) return null;
    return {
      id: paid.id,
      method: paid.method,
      amount: toNumber(paid.amount),
      amountReceived:
        paid.amountReceived != null ? toNumber(paid.amountReceived) : null,
      changeAmount:
        paid.changeAmount != null ? toNumber(paid.changeAmount) : null,
      paidAt: paid.paidAt,
      billingNit: paid.billingNit,
      billingBusinessName: paid.billingBusinessName,
      billingComplement: paid.billingComplement,
    };
  }

  private orderInclude = {
    createdBy: { select: { id: true, name: true } },
    items: { include: { extras: true, sauces: true } },
    payments: { where: { status: PaymentStatus.PAGADO } },
  };

  private mapOrder(order: {
    id: string;
    orderNumber: number;
    type: OrderType;
    source: OrderSource;
    status: OrderStatus;
    publicTrackingToken?: string | null;
    tableNumber: string | null;
    customerName: string | null;
    customerPhone: string | null;
    deliveryAddress: string | null;
    deliveryReference: string | null;
    deliveryLatitude: { toString(): string } | null;
    deliveryLongitude: { toString(): string } | null;
    customerPaymentMethod: PaymentMethod | null;
    paymentProofUrl: string | null;
    subtotal: { toString(): string };
    total: { toString(): string };
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    paidAt: Date | null;
    createdBy?: { id: string; name: string } | null;
    payments?: Array<{
      id: string;
      method: string;
      amount: { toString(): string };
      amountReceived: { toString(): string } | null;
      changeAmount: { toString(): string } | null;
      paidAt: Date;
      status: string;
      billingNit: string | null;
      billingBusinessName: string | null;
      billingComplement: string | null;
    }>;
    items: Array<{
      id: string;
      productId: string;
      productName: string;
      unitPrice: { toString(): string };
      quantity: number;
      lineTotal: { toString(): string };
      notes: string | null;
      extras: Array<{
        id: string;
        extraId: string;
        extraName: string;
        price: { toString(): string };
      }>;
      sauces: Array<{
        id: string;
        sauceId: string;
        sauceName: string;
        placement: SaucePlacement;
      }>;
    }>;
  }) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      type: order.type,
      source: order.source,
      status: order.status,
      publicTrackingToken: order.publicTrackingToken ?? null,
      tableNumber: order.tableNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deliveryAddress: order.deliveryAddress,
      deliveryReference: order.deliveryReference,
      deliveryLatitude:
        order.deliveryLatitude != null
          ? toNumber(order.deliveryLatitude)
          : null,
      deliveryLongitude:
        order.deliveryLongitude != null
          ? toNumber(order.deliveryLongitude)
          : null,
      customerPaymentMethod: order.customerPaymentMethod ?? null,
      paymentProofUrl: order.paymentProofUrl ?? null,
      subtotal: toNumber(order.subtotal),
      total: toNumber(order.total),
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      paidAt: order.paidAt,
      createdBy: order.createdBy,
      payment: this.mapPayment(order.payments ?? []),
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        unitPrice: toNumber(item.unitPrice),
        quantity: item.quantity,
        lineTotal: toNumber(item.lineTotal),
        notes: item.notes,
        extras: item.extras.map((e) => ({
          id: e.id,
          extraId: e.extraId,
          extraName: e.extraName,
          price: toNumber(e.price),
        })),
        sauces: item.sauces.map((s) => ({
          id: s.id,
          sauceId: s.sauceId,
          sauceName: s.sauceName,
          placement: s.placement,
        })),
      })),
    };
  }

  async create(dto: CreateOrderDto, userId: string) {
    if (
      (dto.type === OrderType.MESA || dto.type === OrderType.PARA_LLEVAR) &&
      !dto.customerName?.trim()
    ) {
      throw new BadRequestException('El nombre es requerido');
    }

    if (dto.type === OrderType.DELIVERY) {
      this.validateDeliveryFields({
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        deliveryAddress: dto.deliveryAddress,
        deliveryLatitude: dto.deliveryLatitude,
        deliveryLongitude: dto.deliveryLongitude,
      });
    }

    return this.createInternal({
      type: dto.type,
      source: OrderSource.CAJA,
      tableNumber: undefined,
      customerName:
        dto.type === OrderType.MESA ||
        dto.type === OrderType.PARA_LLEVAR ||
        dto.type === OrderType.DELIVERY
          ? dto.customerName?.trim()
          : undefined,
      customerPhone:
        dto.type === OrderType.DELIVERY ? dto.customerPhone?.trim() : undefined,
      deliveryAddress:
        dto.type === OrderType.DELIVERY ? dto.deliveryAddress?.trim() : undefined,
      deliveryReference:
        dto.type === OrderType.DELIVERY
          ? dto.deliveryReference?.trim()
          : undefined,
      deliveryLatitude:
        dto.type === OrderType.DELIVERY ? dto.deliveryLatitude : undefined,
      deliveryLongitude:
        dto.type === OrderType.DELIVERY ? dto.deliveryLongitude : undefined,
      notes: dto.notes,
      items: dto.items,
      createdById: userId,
    }).then((order) => {
      if (dto.type === OrderType.MESA) {
        this.eventsService.emitEntrante({
          id: order.id,
          orderNumber: order.orderNumber,
          type: order.type,
          source: order.source,
          customerName: order.customerName,
          total: order.total,
        });
      }
      return order;
    });
  }

  async createFromPublicMenu(dto: CreatePublicOrderDto) {
    const type = dto.type ?? OrderType.PARA_LLEVAR;

    if (type !== OrderType.PARA_LLEVAR && type !== OrderType.DELIVERY) {
      throw new BadRequestException('Tipo de pedido no válido para menú público');
    }

    if (type === OrderType.DELIVERY) {
      this.validateDeliveryFields({
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        deliveryAddress: dto.deliveryAddress,
        deliveryLatitude: dto.deliveryLatitude,
        deliveryLongitude: dto.deliveryLongitude,
      });
    }

    const paymentMethod = dto.paymentMethod ?? PaymentMethod.EFECTIVO;
    if (
      paymentMethod !== PaymentMethod.EFECTIVO &&
      paymentMethod !== PaymentMethod.QR
    ) {
      throw new BadRequestException('Método de pago no válido para menú público');
    }

    if (paymentMethod === PaymentMethod.QR) {
      if (!dto.paymentProofUrl?.trim()) {
        throw new BadRequestException('Sube el comprobante de pago QR');
      }
      const settings = await this.prisma.restaurantSettings.findUnique({
        where: { id: 'default' },
        select: { qrImageUrl: true },
      });
      if (!settings?.qrImageUrl) {
        throw new BadRequestException(
          'El pago por QR no está disponible en este momento',
        );
      }
    } else if (dto.paymentProofUrl?.trim()) {
      throw new BadRequestException(
        'El comprobante solo aplica para pago por QR',
      );
    }

    const order = await this.createInternal({
      type,
      source: OrderSource.MENU_PUBLICO,
      customerName: dto.customerName.trim(),
      customerPhone: dto.customerPhone.trim(),
      deliveryAddress:
        type === OrderType.DELIVERY ? dto.deliveryAddress?.trim() : undefined,
      deliveryReference:
        type === OrderType.DELIVERY ? dto.deliveryReference?.trim() : undefined,
      deliveryLatitude:
        type === OrderType.DELIVERY ? dto.deliveryLatitude : undefined,
      deliveryLongitude:
        type === OrderType.DELIVERY ? dto.deliveryLongitude : undefined,
      notes: dto.notes,
      items: dto.items,
      customerPaymentMethod: paymentMethod,
      paymentProofUrl:
        paymentMethod === PaymentMethod.QR
          ? dto.paymentProofUrl!.trim()
          : null,
      initialStatus: OrderStatus.PENDIENTE_CONFIRMACION,
      publicTrackingToken: randomUUID().replace(/-/g, ''),
    });

    const mapped = this.mapOrder(order);
    this.eventsService.emitEntrante({
      id: mapped.id,
      orderNumber: mapped.orderNumber,
      type: mapped.type,
      source: mapped.source,
      customerName: mapped.customerName,
      total: mapped.total,
    });
    return mapped;
  }

  async confirmPublicOrder(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: this.orderInclude,
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (order.source !== OrderSource.MENU_PUBLICO) {
      throw new BadRequestException(
        'Solo pedidos del menú público requieren confirmación',
      );
    }

    if (order.status !== OrderStatus.PENDIENTE_CONFIRMACION) {
      throw new BadRequestException(
        'Este pedido ya fue confirmado o no está pendiente de confirmación',
      );
    }

    if (order.customerPaymentMethod === PaymentMethod.QR) {
      if (!order.paymentProofUrl) {
        throw new BadRequestException(
          'Falta el comprobante de pago QR para confirmar',
        );
      }

      if (order.payments.length > 0) {
        throw new BadRequestException('Este pedido ya fue cobrado');
      }

      const now = new Date();
      const updated = await this.prisma.$transaction(async (tx) => {
        await tx.payment.create({
          data: {
            orderId: id,
            method: PaymentMethod.QR,
            amount: order.total,
            status: PaymentStatus.PAGADO,
            paidAt: now,
            createdById: userId,
          },
        });

        return tx.order.update({
          where: { id },
          data: {
            status: OrderStatus.EN_COCINA,
            paidAt: now,
          },
          include: this.orderInclude,
        });
      });

      return this.mapOrder(updated);
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.EN_COCINA },
      include: this.orderInclude,
    });

    return this.mapOrder(updated);
  }

  async getPublicOrderTracking(token: string) {
    const order = await this.prisma.order.findFirst({
      where: { publicTrackingToken: token, source: OrderSource.MENU_PUBLICO },
      select: {
        orderNumber: true,
        status: true,
        type: true,
        total: true,
        updatedAt: true,
        customerName: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      type: order.type,
      total: toNumber(order.total),
      updatedAt: order.updatedAt,
      customerName: order.customerName,
      message: this.getPublicTrackingMessage(order.status, order.type),
    };
  }

  private getPublicTrackingMessage(
    status: OrderStatus,
    type: OrderType = OrderType.MESA,
  ): string {
    switch (status) {
      case OrderStatus.PENDIENTE_CONFIRMACION:
        return 'Esperando confirmación del restaurante…';
      case OrderStatus.PENDIENTE:
        return 'Pedido recibido. Pronto comenzará la preparación.';
      case OrderStatus.EN_COCINA:
        return '¡Tu pedido se está preparando!';
      case OrderStatus.LISTO:
        return type === OrderType.DELIVERY
          ? '¡Tu pedido va en camino!'
          : '¡Tu pedido está listo!';
      case OrderStatus.ENTREGADO:
        return 'Pedido entregado. ¡Gracias!';
      case OrderStatus.CANCELADO:
        return 'Este pedido fue cancelado.';
      default:
        return 'Estado del pedido actualizado.';
    }
  }

  private async buildItemsData(
    items: CreateOrderDto['items'],
    orderType: OrderType,
  ) {
    if (!items.length) {
      throw new BadRequestException('El pedido debe tener al menos un producto');
    }

    const productIds = items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null, isActive: true },
      include: {
        sauces: {
          include: {
            sauce: true,
          },
        },
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Uno o más productos no son válidos');
    }

    const allExtraIds = [
      ...new Set(items.flatMap((item) => item.extraIds ?? [])),
    ];
    const extrasInDb =
      allExtraIds.length > 0
        ? await this.prisma.extra.findMany({
            where: {
              id: { in: allExtraIds },
              deletedAt: null,
              isActive: true,
            },
          })
        : [];
    const extraMap = new Map(extrasInDb.map((e) => [e.id, e]));

    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const itemsData: Array<{
      productId: string;
      productName: string;
      unitPrice: number;
      quantity: number;
      lineTotal: number;
      notes?: string;
      extras: Array<{ extraId: string; extraName: string; price: number }>;
      sauces: Array<{
        sauceId: string;
        sauceName: string;
        placement: SaucePlacement;
      }>;
    }> = [];

    for (const item of items) {
      const product = productMap.get(item.productId)!;
      const extraIds = item.extraIds ?? [];
      const requestedSauces = item.sauces ?? [];

      for (const extraId of extraIds) {
        if (!extraMap.has(extraId)) {
          throw new BadRequestException(
            `El extra seleccionado no está disponible`,
          );
        }
      }

      const allowedSauceIds = new Set(
        product.sauces
          .filter((entry) => entry.sauce.isActive && !entry.sauce.deletedAt)
          .map((entry) => entry.sauce.id),
      );

      const saucesRequired = orderType !== OrderType.MESA;

      if (product.sauceMode === ProductSauceMode.NONE) {
        if (requestedSauces.length > 0) {
          throw new BadRequestException(
            `El producto ${product.name} no permite salsas`,
          );
        }
      } else if (saucesRequired && !requestedSauces.length) {
        throw new BadRequestException(
          `Selecciona al menos una salsa para ${product.name}`,
        );
      } else if (requestedSauces.length > 0) {
        if (
          product.sauceMode === ProductSauceMode.SINGLE &&
          requestedSauces.length !== 1
        ) {
          throw new BadRequestException(
            `Selecciona solo una salsa para ${product.name}`,
          );
        } else if (product.sauceMode === ProductSauceMode.MULTIPLE) {
          const uniqueSauceIds = new Set(requestedSauces.map((s) => s.sauceId));
          if (uniqueSauceIds.size !== requestedSauces.length) {
            throw new BadRequestException(
              `No repitas la misma salsa en ${product.name}`,
            );
          }
        }
      }

      const selectedSauces =
        requestedSauces.length > 0
          ? requestedSauces.map((selection) => {
        if (!allowedSauceIds.has(selection.sauceId)) {
          throw new BadRequestException(
            `La salsa seleccionada no está disponible para ${product.name}`,
          );
        }

        const sauce = product.sauces.find(
          (entry) => entry.sauce.id === selection.sauceId,
        )!.sauce;

        const placement = product.allowSauceSeparate
          ? selection.placement
          : SaucePlacement.ON_PRODUCT;

        if (
          !product.allowSauceSeparate &&
          selection.placement === SaucePlacement.SEPARATE
        ) {
          throw new BadRequestException(
            `Este producto no permite salsa aparte`,
          );
        }

        return {
          sauceId: sauce.id,
          sauceName: sauce.name,
          placement,
        };
            })
          : [];

      const selectedExtras = extraIds.map((extraId) => {
        const extra = extraMap.get(extraId)!;
        return {
          extraId: extra.id,
          extraName: extra.name,
          price: toNumber(extra.price),
        };
      });

      const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0);
      const { effectivePrice } = getProductPromoPricing(product);
      const unitPrice = effectivePrice + extrasTotal;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      itemsData.push({
        productId: product.id,
        productName: product.name,
        unitPrice,
        quantity: item.quantity,
        lineTotal,
        notes: item.notes,
        extras: selectedExtras,
        sauces: selectedSauces,
      });
    }

    return { subtotal, itemsData };
  }

  private async createInternal(data: {
    type: OrderType;
    source: OrderSource;
    tableNumber?: string;
    customerName?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    deliveryReference?: string;
    deliveryLatitude?: number;
    deliveryLongitude?: number;
    notes?: string;
    items: CreateOrderDto['items'];
    createdById?: string;
    customerPaymentMethod?: PaymentMethod | null;
    paymentProofUrl?: string | null;
    initialStatus?: OrderStatus;
    publicTrackingToken?: string;
  }) {
    const { subtotal, itemsData } = await this.buildItemsData(
      data.items,
      data.type,
    );

    const order = await this.prisma.$transaction(async (tx) => {
      const stockByProduct = new Map<string, number>();
      for (const item of itemsData) {
        stockByProduct.set(
          item.productId,
          (stockByProduct.get(item.productId) ?? 0) + item.quantity,
        );
      }

      for (const [productId, qtyNeeded] of stockByProduct) {
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product?.trackStock) continue;

        const updated = await tx.product.updateMany({
          where: {
            id: productId,
            trackStock: true,
            stockQuantity: { gte: qtyNeeded },
          },
          data: { stockQuantity: { decrement: qtyNeeded } },
        });

        if (updated.count === 0) {
          const current = await tx.product.findUnique({ where: { id: productId } });
          const left = current?.stockQuantity ?? 0;
          throw new BadRequestException(
            `Stock insuficiente: ${product.name} (quedan ${left})`,
          );
        }
      }

      const orderDate = this.timezone.getTodayDate();
      const orderNumber = await this.getNextOrderNumber(tx, orderDate);

      return tx.order.create({
        data: {
          orderNumber,
          orderDate,
          type: data.type,
          source: data.source,
          status: data.initialStatus ?? OrderStatus.PENDIENTE,
          publicTrackingToken: data.publicTrackingToken ?? null,
          tableNumber: data.tableNumber?.trim() || null,
          customerName: data.customerName || null,
          customerPhone: data.customerPhone || null,
          deliveryAddress: data.deliveryAddress || null,
          deliveryReference: data.deliveryReference || null,
          deliveryLatitude:
            data.deliveryLatitude != null ? data.deliveryLatitude : null,
          deliveryLongitude:
            data.deliveryLongitude != null ? data.deliveryLongitude : null,
          customerPaymentMethod: data.customerPaymentMethod ?? null,
          paymentProofUrl: data.paymentProofUrl ?? null,
          subtotal,
          total: subtotal,
          notes: data.notes,
          createdById: data.createdById || null,
          items: {
            create: itemsData.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              lineTotal: item.lineTotal,
              notes: item.notes,
              extras: item.extras.length
                ? { create: item.extras }
                : undefined,
              sauces: item.sauces.length
                ? { create: item.sauces }
                : undefined,
            })),
          },
        },
        include: this.orderInclude,
      });
    });

    return this.mapOrder(order);
  }

  async findAll(
    status?: OrderStatus,
    todayOnly = true,
    source?: OrderSource,
    type?: OrderType,
    unpaid = false,
  ) {
    const where: Prisma.OrderWhereInput = {};

    if (unpaid) {
      where.payments = { none: { status: PaymentStatus.PAGADO } };
      where.status = { not: OrderStatus.CANCELADO };
    } else if (status) {
      where.status = status;
    }

    if (source) where.source = source;
    if (type) where.type = type;

    if (todayOnly) {
      const { start, end } = this.getTodayRange();
      where.createdAt = { gte: start, lte: end };
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: this.orderInclude,
    });

    return orders.map((o) => this.mapOrder(o));
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: this.orderInclude,
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return this.mapOrder(order);
  }

  async updateStatus(id: string, status: OrderStatus, user: JwtPayloadUser) {
    const order = await this.findOne(id);

    if (status === OrderStatus.CANCELADO) {
      if (order.payment) {
        throw new BadRequestException(
          'No se puede cancelar un pedido que ya fue cobrado. Contacta a la jefa.',
        );
      }

      const cajeraCanCancel =
        user.role === UserRole.CAJERA && order.status === OrderStatus.PENDIENTE;
      const jefaCanCancel = user.role === UserRole.JEFA;

      if (!cajeraCanCancel && !jefaCanCancel) {
        throw new ForbiddenException(
          'Solo la jefa puede cancelar pedidos en cocina o por confirmar.',
        );
      }
    }

    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      PENDIENTE_CONFIRMACION: [OrderStatus.EN_COCINA, OrderStatus.CANCELADO],
      PENDIENTE: [OrderStatus.CANCELADO],
      EN_COCINA: [OrderStatus.LISTO, OrderStatus.CANCELADO],
      LISTO: [OrderStatus.ENTREGADO, OrderStatus.CANCELADO],
      ENTREGADO: [],
      CANCELADO: [],
    };

    if (!validTransitions[order.status].includes(status)) {
      throw new BadRequestException(
        `No se puede cambiar de ${order.status} a ${status}`,
      );
    }

    const updated =
      status === OrderStatus.CANCELADO
        ? await this.prisma.$transaction(async (tx) => {
            const items = await tx.orderItem.findMany({
              where: { orderId: id },
            });
            for (const item of items) {
              await tx.product.updateMany({
                where: { id: item.productId, trackStock: true },
                data: { stockQuantity: { increment: item.quantity } },
              });
            }
            return tx.order.update({
              where: { id },
              data: { status },
              include: this.orderInclude,
            });
          })
        : await this.prisma.order.update({
            where: { id },
            data: { status },
            include: this.orderInclude,
          });

    return this.mapOrder(updated);
  }

  async updateMesaOrder(id: string, dto: UpdateMesaOrderDto) {
    const existing = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, payments: { where: { status: PaymentStatus.PAGADO } } },
    });

    if (!existing) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (existing.type !== OrderType.MESA) {
      throw new BadRequestException(
        'Solo se pueden editar pedidos de mesa',
      );
    }

    if (existing.source !== OrderSource.CAJA) {
      throw new BadRequestException(
        'Los pedidos del menú público no se pueden editar',
      );
    }

    if (existing.status !== OrderStatus.PENDIENTE) {
      throw new BadRequestException(
        'Solo se pueden editar pedidos pendientes de cobro',
      );
    }

    if (existing.payments.length > 0) {
      throw new BadRequestException('No se puede editar un pedido ya cobrado');
    }

    if (!dto.customerName?.trim()) {
      throw new BadRequestException('El nombre es requerido');
    }

    const { subtotal, itemsData } = await this.buildItemsData(
      dto.items,
      OrderType.MESA,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      const oldQty = new Map<string, number>();
      for (const item of existing.items) {
        oldQty.set(
          item.productId,
          (oldQty.get(item.productId) ?? 0) + item.quantity,
        );
      }

      const newQty = new Map<string, number>();
      for (const item of itemsData) {
        newQty.set(
          item.productId,
          (newQty.get(item.productId) ?? 0) + item.quantity,
        );
      }

      const productIds = new Set([...oldQty.keys(), ...newQty.keys()]);
      for (const productId of productIds) {
        const delta = (newQty.get(productId) ?? 0) - (oldQty.get(productId) ?? 0);
        if (delta === 0) continue;

        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product?.trackStock) continue;

        if (delta > 0) {
          const result = await tx.product.updateMany({
            where: {
              id: productId,
              trackStock: true,
              stockQuantity: { gte: delta },
            },
            data: { stockQuantity: { decrement: delta } },
          });

          if (result.count === 0) {
            const current = await tx.product.findUnique({ where: { id: productId } });
            throw new BadRequestException(
              `Stock insuficiente: ${product.name} (quedan ${current?.stockQuantity ?? 0})`,
            );
          }
        } else {
          await tx.product.updateMany({
            where: { id: productId, trackStock: true },
            data: { stockQuantity: { increment: -delta } },
          });
        }
      }

      return tx.order.update({
        where: { id },
        data: {
          customerName: dto.customerName.trim(),
          tableNumber: null,
          notes: dto.notes,
          subtotal,
          total: subtotal,
          items: {
            deleteMany: {},
            create: itemsData.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              lineTotal: item.lineTotal,
              notes: item.notes,
              extras: item.extras.length
                ? { create: item.extras }
                : undefined,
              sauces: item.sauces.length
                ? { create: item.sauces }
                : undefined,
            })),
          },
        },
        include: this.orderInclude,
      });
    });

    return this.mapOrder(updated);
  }
}
