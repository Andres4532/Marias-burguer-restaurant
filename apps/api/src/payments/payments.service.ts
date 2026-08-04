import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus, OrderSource } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { toNumber } from '../common/utils/decimal.util';

const ALLOWED_METHODS: PaymentMethod[] = [
  PaymentMethod.EFECTIVO,
  PaymentMethod.QR,
];

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async payOrder(orderId: string, dto: CreatePaymentDto, userId: string) {
    if (!ALLOWED_METHODS.includes(dto.method)) {
      throw new BadRequestException(
        'Método de pago no disponible en esta versión',
      );
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: { where: { status: PaymentStatus.PAGADO } },
        createdBy: { select: { id: true, name: true } },
        items: { include: { extras: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (order.status === OrderStatus.CANCELADO) {
      throw new BadRequestException('No se puede cobrar un pedido cancelado');
    }

    if (order.payments.length > 0) {
      throw new BadRequestException('Este pedido ya fue cobrado');
    }

    if (order.status === OrderStatus.PENDIENTE_CONFIRMACION) {
      throw new BadRequestException(
        'Confirma el pedido para cocina antes de cobrar',
      );
    }

    const payableStatuses: OrderStatus[] = [
      OrderStatus.PENDIENTE,
      OrderStatus.EN_COCINA,
      OrderStatus.LISTO,
    ];

    if (!payableStatuses.includes(order.status)) {
      throw new BadRequestException(
        'Este pedido no se puede cobrar en su estado actual',
      );
    }

    const orderTotal = toNumber(order.total);

    if (dto.method === PaymentMethod.EFECTIVO) {
      if (dto.amountReceived == null) {
        throw new BadRequestException(
          'Ingrese el monto recibido en efectivo',
        );
      }
      if (dto.amountReceived < orderTotal) {
        throw new BadRequestException(
          `Monto insuficiente. Total: Bs. ${orderTotal.toFixed(2)}`,
        );
      }
    }

    const change =
      dto.method === PaymentMethod.EFECTIVO && dto.amountReceived != null
        ? Math.round((dto.amountReceived - orderTotal) * 100) / 100
        : undefined;

    const amountReceived =
      dto.method === PaymentMethod.EFECTIVO ? dto.amountReceived : null;

    const billing = this.normalizeBilling(dto);

    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          orderId,
          method: dto.method,
          amount: order.total,
          amountReceived:
            amountReceived != null ? amountReceived : undefined,
          changeAmount: change != null ? change : undefined,
          status: PaymentStatus.PAGADO,
          paidAt: now,
          createdById: userId,
          billingNit: billing.billingNit,
          billingBusinessName: billing.billingBusinessName,
          billingComplement: billing.billingComplement,
        },
      });

      const nextStatus =
        order.source === OrderSource.CAJA &&
        order.status === OrderStatus.PENDIENTE
          ? OrderStatus.EN_COCINA
          : order.status;

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: nextStatus,
          paidAt: now,
        },
        include: {
          createdBy: { select: { id: true, name: true } },
          items: { include: { extras: true } },
          payments: true,
        },
      });

      return { payment, order: updatedOrder };
    });

    return {
      payment: this.mapPaymentRecord(result.payment),
      change,
      amountReceived: dto.amountReceived,
      order: this.mapOrderWithPayment(result.order),
    };
  }

  private normalizeBilling(dto: CreatePaymentDto) {
    const billingNit = dto.billingNit?.trim() || null;
    const billingBusinessName = dto.billingBusinessName?.trim() || null;
    const billingComplement = dto.billingComplement?.trim() || null;

    const hasAny =
      billingNit || billingBusinessName || billingComplement;

    if (!hasAny) {
      return {
        billingNit: null,
        billingBusinessName: null,
        billingComplement: null,
      };
    }

    if (!billingNit) {
      throw new BadRequestException('Ingrese el NIT para la factura');
    }
    if (!billingBusinessName) {
      throw new BadRequestException(
        'Ingrese la razón social o nombre para la factura',
      );
    }

    return { billingNit, billingBusinessName, billingComplement };
  }

  private mapPaymentRecord(payment: {
    id: string;
    method: PaymentMethod;
    amount: { toString(): string };
    amountReceived: { toString(): string } | null;
    changeAmount: { toString(): string } | null;
    paidAt: Date;
    billingNit: string | null;
    billingBusinessName: string | null;
    billingComplement: string | null;
  }) {
    return {
      id: payment.id,
      method: payment.method,
      amount: toNumber(payment.amount),
      amountReceived:
        payment.amountReceived != null
          ? toNumber(payment.amountReceived)
          : null,
      changeAmount:
        payment.changeAmount != null ? toNumber(payment.changeAmount) : null,
      paidAt: payment.paidAt,
      billingNit: payment.billingNit,
      billingBusinessName: payment.billingBusinessName,
      billingComplement: payment.billingComplement,
    };
  }

  private mapOrderWithPayment(order: {
    id: string;
    orderNumber: number;
    type: string;
    status: OrderStatus;
    tableNumber: string | null;
    subtotal: { toString(): string };
    total: { toString(): string };
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    paidAt: Date | null;
    createdBy?: { id: string; name: string } | null;
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
    payments: Array<{
      id: string;
      method: PaymentMethod;
      amount: { toString(): string };
      amountReceived: { toString(): string } | null;
      changeAmount: { toString(): string } | null;
      paidAt: Date;
      billingNit: string | null;
      billingBusinessName: string | null;
      billingComplement: string | null;
    }>;
  }) {
    const payment = order.payments[0];
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      type: order.type,
      status: order.status,
      tableNumber: order.tableNumber,
      subtotal: toNumber(order.subtotal),
      total: toNumber(order.total),
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      paidAt: order.paidAt,
      createdBy: order.createdBy,
      payment: payment ? this.mapPaymentRecord(payment) : null,
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
}
