'use client';

import { useFormStatus } from 'react-dom';

/**
 * Full-page processing overlay with a scrolling striped progress bar.
 * Drop this inside any <form> and it appears automatically while that form
 * is submitting (driven by useFormStatus). No props or wiring needed.
 */
export function ProcessingOverlay({ label = 'Processing…' }: { label?: string }) {
  const { pending } = useFormStatus();
  if (!pending) return null;

  return (
    <div className="processing-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="processing-card">
        <div className="processing-logo">K</div>
        <div className="processing-text">{label}</div>
        <div className="scrollbar-track">
          <div className="scrollbar-fill" />
        </div>
      </div>
    </div>
  );
}
