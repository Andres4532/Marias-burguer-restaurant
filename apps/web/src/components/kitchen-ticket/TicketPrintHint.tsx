export function TicketPrintHint() {
  return (
    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 leading-relaxed">
      <strong>Solo el ticket:</strong> al imprimir, abre{' '}
      <strong>Más configuraciones</strong> y desactiva{' '}
      <strong>Encabezados y pies de página</strong>. Si no, Chrome agrega
      fecha, URL y número de página alrededor del ticket.
    </p>
  );
}
