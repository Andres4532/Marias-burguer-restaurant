import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  OrderStatus,
  OrderType,
  OrderSource,
  Prisma,
  PaymentStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreatePublicOrderDto } from './dto/create-public-order.dto';
import { toNumber } from '../common/utils/decimal.util';
import { TimezoneService } from '../common/timezone/timezone.service';
import { EventsService } from '../events/events.service';

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

  private async getNextOrderNumber(tx: Prisma.TransactionClient): Promise<number> {
    const today = this.timezone.getTodayDate();

    const counter = await tx.dailyOrderCounter.upsert({
      where: { date: today },
      create: { date: today, lastNumber: 1 },
      update: { lastNumber: { increment: 1 } },
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
    paidAt: Date;
    status: string;
  }>) {
    const paid = payments.find((p) => p.status === 'PAGADO');
    if (!paid) return null;
    return {
      id: paid.id,
      method: paid.method,
      amount: toNumber(paid.amount),
      paidAt: paid.paidAt,
    };
  }

  private orderInclude = {
    createdBy: { select: { id: true, name: true } },
    items: { include: { extras: true } },
    payments: { where: { status: PaymentStatus.PAGADO } },
  };

  private mapOrder(order: {
    id: string;
    orderNumber: number;
    type: OrderType;
    source: OrderSource;
    status: OrderStatus;
    tableNumber: string | null;
    customerName: string | null;
    customerPhone: string | null;
    deliveryAddress: string | null;
    deliveryReference: string | null;
    deliveryLatitude: { toString(): string } | null;
    deliveryLongitude: { toString(): string } | null;
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
      paidAt: Date;
      status: string;
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
    }>;
  }) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      type: order.type,
      source: order.source,
      status: order.status,
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
      })),
    };
  }

  async create(dto: CreateOrderDto, userId: string) {
    if (dto.type === OrderType.MESA && !dto.tableNumber?.trim()) {
      throw new BadRequestException('El número de mesa es requerido');
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
      tableNumber: dto.type === OrderType.MESA ? dto.tableNumber : undefined,
      customerName:
        dto.type === OrderType.DELIVERY ? dto.customerName?.trim() : undefined,
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
    });

    this.eventsService.emitEntrante(order);
    return order;
  }

  private async buildItemsData(items: CreateOrderDto['items']) {
    if (!items.length) {
      throw new BadRequestException('El pedido debe tener al menos un producto');
    }

    const productIds = items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null, isActive: true },
      include: {
        extras: { include: { extra: true } },
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Uno o más productos no son válidos');
    }

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
    }> = [];

    for (const item of items) {
      const product = productMap.get(item.productId)!;
      const allowedExtraIds = new Set(product.extras.map((pe) => pe.extraId));
      const extraIds = item.extraIds ?? [];

      for (const extraId of extraIds) {
        if (!allowedExtraIds.has(extraId)) {
          throw new BadRequestException(
            `El extra no está disponible para ${product.name}`,
          );
        }
      }

      const selectedExtras = product.extras
        .filter((pe) => extraIds.includes(pe.extraId))
        .map((pe) => ({
          extraId: pe.extra.id,
          extraName: pe.extra.name,
          price: toNumber(pe.extra.price),
        }));

      const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0);
      const unitPrice = toNumber(product.price) + extrasTotal;
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
  }) {
    const { subtotal, itemsData } = await this.buildItemsData(data.items);

    const order = await this.prisma.$transaction(async (tx) => {
      const orderNumber = await this.getNextOrderNumber(tx);

      return tx.order.create({
        data: {
          orderNumber,
          type: data.type,
          source: data.source,
          status: OrderStatus.PENDIENTE,
          tableNumber: data.tableNumber?.trim() || null,
          customerName: data.customerName || null,
          customerPhone: data.customerPhone || null,
          deliveryAddress: data.deliveryAddress || null,
          deliveryReference: data.deliveryReference || null,
          deliveryLatitude:
            data.deliveryLatitude != null ? data.deliveryLatitude : null,
          deliveryLongitude:
            data.deliveryLongitude != null ? data.deliveryLongitude : null,
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
  ) {
    const where: Prisma.OrderWhereInput = {};

    if (status) where.status = status;
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

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.findOne(id);

    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
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

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: this.orderInclude,
    });

    return this.mapOrder(updated);
  }
}
