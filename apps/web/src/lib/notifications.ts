let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;

  if (!audioCtx) {
    audioCtx = new AudioCtx();
  }

  return audioCtx;
}

export function unlockAudio(): void {
  const ctx = getAudioContext();
  if (ctx?.state === 'suspended') {
    void ctx.resume();
  }
}

export function playNewOrderAlert() {
  try {
    unlockAudio();
    const ctx = getAudioContext();
    if (!ctx) return;

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        ctx.currentTime + start + duration,
      );
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    playTone(880, 0, 0.12);
    playTone(1100, 0.15, 0.18);
  } catch {
    // Audio no disponible
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function showNewOrderNotification(
  orderNumber: number,
  customerName?: string,
  orderType: 'DELIVERY' | 'PARA_LLEVAR' = 'PARA_LLEVAR',
) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const label = `#${String(orderNumber).padStart(3, '0')}`;
  const typeLabel = orderType === 'DELIVERY' ? 'Delivery' : 'Recojo';
  const body = customerName
    ? `${customerName} — menú app`
    : `Nuevo pedido ${typeLabel.toLowerCase()} del menú app`;

  new Notification(`${typeLabel} ${label}`, {
    body,
    icon: '/icons/icon-192.svg',
    tag: `entrante-${orderType}-${orderNumber}`,
  });
}
