import { getApiUrl } from './api-url';
import { getToken } from './auth';

export interface EntranteStreamEvent {
  type: 'new_order' | 'ping';
  order?: {
    id: string;
    orderNumber: number;
    type: string;
    source?: string;
    customerName: string | null;
    total: number;
  };
}

export async function subscribeEntrantesStream(
  onEvent: (event: EntranteStreamEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  const token = getToken();
  if (!token) throw new Error('Sin sesión');

  const response = await fetch(`${getApiUrl()}/events/entrantes/stream`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Stream error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Stream no disponible');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() ?? '';

    for (const chunk of chunks) {
      const dataLine = chunk
        .split('\n')
        .find((line) => line.startsWith('data:'));
      if (!dataLine) continue;

      try {
        const payload = JSON.parse(
          dataLine.replace(/^data:\s*/, ''),
        ) as EntranteStreamEvent;
        onEvent(payload);
      } catch {
        // Ignorar líneas mal formadas
      }
    }
  }
}
