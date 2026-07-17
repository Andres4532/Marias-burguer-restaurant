import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject, merge, interval, map } from 'rxjs';

export interface EntranteStreamPayload {
  type: 'new_order' | 'ping';
  order?: {
    id: string;
    orderNumber: number;
    type: string;
    customerName: string | null;
    total: number;
  };
}

@Injectable()
export class EventsService {
  private entrantesEvents = new Subject<MessageEvent>();

  emitEntrante(order: {
    id: string;
    orderNumber: number;
    type: string;
    customerName: string | null;
    total: number;
  }) {
    const payload: EntranteStreamPayload = {
      type: 'new_order',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        type: order.type,
        customerName: order.customerName,
        total: order.total,
      },
    };
    this.entrantesEvents.next({ data: payload });
  }

  getEntrantesStream(): Observable<MessageEvent> {
    const heartbeat = interval(25000).pipe(
      map(
        (): MessageEvent => ({
          data: { type: 'ping' } satisfies EntranteStreamPayload,
        }),
      ),
    );
    return merge(this.entrantesEvents, heartbeat);
  }
}
