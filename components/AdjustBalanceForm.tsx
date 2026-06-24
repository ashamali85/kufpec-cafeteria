'use client';

import { useActionState, useState } from 'react';
import { adjustBalanceAction } from '@/lib/actions';
import { SubmitButton } from '@/components/SubmitButton';

export function AdjustBalanceForm({ employeeId, employeeName }: { employeeId: string; employeeName: string }) {
  const [state, formAction] = useActionState(adjustBalanceAction, null);
  const [open, setOpen] = useState(false);

  if (!open) return <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>Adjust</button>;

  return (
    <form action={formAction} className="stack" style={{ gap: 6, minWidth: 180 }}>
      <input type="hidden" name="employeeId" value={employeeId} />
      {state?.error && <div className="alert alert-error small">{state.error}</div>}
      {state?.ok && <div className="alert alert-ok small">{state.ok}</div>}
      <input name="amount" placeholder="e.g. 2.500 or -1.000" required />
      <input name="note" placeholder={`Note for ${employeeName}`} />
      <div className="row">
        <SubmitButton className="btn btn-primary btn-sm" pendingText="…">Apply</SubmitButton>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Close</button>
      </div>
    </form>
  );
}
