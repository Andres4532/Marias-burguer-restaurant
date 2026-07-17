'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#2b2b2b',
          color: '#f4f4f5',
          padding: '1rem',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            background: '#383838',
            border: '1px solid #4a4a4a',
            borderRadius: '0.75rem',
            padding: '2rem',
            maxWidth: '28rem',
            width: '100%',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Error del sistema
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#a1a1aa', marginBottom: '1.5rem' }}>
            {error.message || 'No se pudo cargar la aplicación.'}
          </p>
          <button
            onClick={reset}
            style={{
              background: '#f97316',
              color: '#fff',
              border: 'none',
              borderRadius: '0.75rem',
              padding: '0.625rem 1.5rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
