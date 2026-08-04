'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  KitchenTicket,
  TICKET_COPIES,
  printKitchenTicket,
} from '@/components/kitchen-ticket/KitchenTicket';
import { TicketPrintHint } from '@/components/kitchen-ticket/TicketPrintHint';
import type { Order } from '@/types/orders';

interface TicketPreviewModalProps {
  order: Order;
  open: boolean;
  onClose: () => void;
}

export function TicketPreviewModal({ order, open, onClose }: TicketPreviewModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Vista previa — Tickets">
      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 bg-gray-50 max-h-[60vh] overflow-y-auto">
          <div className="mx-auto space-y-6" style={{ maxWidth: '80mm' }}>
            {TICKET_COPIES.map((copyLabel) => (
              <div key={copyLabel} className="mb-8 pb-6 border-b-2 border-dashed border-gray-300 last:border-0 last:mb-0 last:pb-0">
                <KitchenTicket order={order} copyLabel={copyLabel} />
              </div>
            ))}
          </div>
        </div>
        <TicketPrintHint />
        <p className="text-xs text-gray-500 text-center">
          3 tickets separados (Cocina, Caja, Cliente). Copias: 1 en el diálogo.
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              printKitchenTicket();
            }}
            className="flex-1 py-3"
          >
            Imprimir 3 copias
          </Button>
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
