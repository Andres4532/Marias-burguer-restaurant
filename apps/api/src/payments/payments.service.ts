import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus, OrderSource } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { toNumber } from '../common/utils/decimal.util';

const ALLOWED_METHODS: PaymentMethod[] = [
  PaymentMethod.EFECTIVO,
  PaymentMethod.QR,
];

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
  ) {}

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
    const chargeTotal =
      dto.chargeAmount != null
        ? Math.round(dto.chargeAmount * 100) / 100
        : orderTotal;

    if (dto.chargeAmount != null) {
      if (chargeTotal > orderTotal) {
        throw new BadRequestException(
          `El total a cobrar no puede ser mayor a Bs. ${orderTotal.toFixed(2)}`,
        );
      }
    }

    if (dto.method === PaymentMethod.EFECTIVO) {
      if (dto.amountReceived == null) {
        throw new BadRequestException(
          'Ingrese el monto recibido en efectivo',
        );
      }
      if (dto.amountReceived < chargeTotal) {
        throw new BadRequestException(
          `Monto insuficiente. Total: Bs. ${chargeTotal.toFixed(2)}`,
        );
      }
    }

    const change =
      dto.method === PaymentMethod.EFECTIVO && dto.amountReceived != null
        ? Math.round((dto.amountReceived - chargeTotal) * 100) / 100
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
          amount: chargeTotal,
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
          total: chargeTotal,
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
      order: await this.ordersService.findOne(orderId),
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

}
