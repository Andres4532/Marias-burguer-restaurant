'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { KitchenTicket, printKitchenTicket } from '@/components/kitchen-ticket/KitchenTicket';
import type { Order } from '@/types/orders';

interface TicketPreviewModalProps {
  order: Order;
  open: boolean;
  onClose: () => void;
}

export function TicketPreviewModal({ order, open, onClose }: TicketPreviewModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Vista previa — Ticket cocina">
      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 bg-gray-50 max-h-[60vh] overflow-y-auto">
          <div className="mx-auto" style={{ maxWidth: '80mm' }}>
            <KitchenTicket order={order} />
          </div>
        </div>
        <p className="text-xs text-gray-500 text-center">
          Así se verá el ticket impreso. Verifica productos y notas antes de imprimir.
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              printKitchenTicket();
            }}
            className="flex-1 py-3"
          >
            🖨️ Imprimir
          </Button>
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
