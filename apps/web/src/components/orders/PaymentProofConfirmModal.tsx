'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/catalog';
import { normalizeMediaUrl } from '@/lib/media-url';

interface PaymentProofConfirmModalProps {
  open: boolean;
  proofUrl: string;
  total: number;
  confirming?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function PaymentProofConfirmModal({
  open,
  proofUrl,
  total,
  confirming,
  onClose,
  onConfirm,
}: PaymentProofConfirmModalProps) {
  const src = normalizeMediaUrl(proofUrl);

  return (
    <Modal open={open} onClose={() => !confirming && onClose()} title="Comprobante QR">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Revisa el comprobante antes de confirmar el pedido. Total:{' '}
          <strong className="text-foreground">{formatPrice(total)}</strong>
        </p>

        {src ? (
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl border border-border overflow-hidden bg-background"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt="Comprobante de pago QR"
              className="w-full max-h-[min(60vh,420px)] object-contain bg-black/20"
            />
          </a>
        ) : (
          <p className="text-sm text-red-300">No hay comprobante disponible.</p>
        )}

        <p className="text-xs text-text-secondary">
          Toca la imagen para abrirla en tamaño completo.
        </p>

        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
          <Button
            variant="secondary"
            className="sm:flex-1"
            disabled={confirming}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            className="sm:flex-1"
            variant="success"
            disabled={confirming || !src}
            onClick={onConfirm}
          >
            {confirming ? 'Confirmando…' : 'Confirmar pago y enviar a cocina'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
