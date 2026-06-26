// Next.js App Router: global error boundary.
// This wraps the entire app (including the root layout). It MUST include its
// own <html> and <body> tags because the root layout is replaced when this
// boundary activates. Useful for catching errors that escape route boundaries.

'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('Global error boundary:', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          backgroundColor: '#fef3c7',
          color: '#1f2937',
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <div
          role="alert"
          aria-live="assertive"
          style={{
            maxWidth: '28rem',
            width: '100%',
            background: 'white',
            borderRadius: '0.75rem',
            border: '1px solid #fcd34d',
            padding: '1.5rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              margin: '0 auto 1rem',
              width: '3rem',
              height: '3rem',
              borderRadius: '9999px',
              background: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={24} color="#d97706" aria-hidden="true" />
          </div>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem', fontWeight: 600 }}>
            Application error
          </h2>
          <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#6b7280' }}>
            A critical error occurred and the application cannot continue. Please
            try again.
          </p>
          {error.digest && (
            <p
              style={{
                margin: '0 0 1rem',
                fontSize: '0.75rem',
                color: '#9ca3af',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
              }}
            >
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.875rem',
              borderRadius: '0.375rem',
              background: '#d97706',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            <RotateCcw size={16} aria-hidden="true" />
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
