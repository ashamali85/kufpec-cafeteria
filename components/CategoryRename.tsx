'use client';

import { useActionState, useState } from 'react';
import { saveCategoryAction } from '@/lib/actions';
import { SubmitButton } from '@/components/SubmitButton';

export function CategoryRename({
  id, name, isActive, displayOrder
}: { id: string; name: string; isActive: boolean; displayOrder: number }) {
  const [state, formAction] = useActionState(saveCategoryAction, null);
  const [open, setOpen] = useState(false);

  if (!open) return <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>Edit</button>;

  return (
    <form action={formAction} className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
      <input type="hidden" name="id" value={id} />
      <input name="name" defaultValue={name} style={{ width: 160, padding: '6px 8px' }} required />
      <input name="displayOrder" type="number" defaultValue={displayOrder} style={{ width: 70, padding: '6px 8px' }} />
      <label className="row small" style={{ gap: 4 }}>
        <input type="checkbox" name="isActive" defaultChecked={isActive} style={{ width: 'auto' }} /> Visible
      </label>
      {state?.error && <span className="small" style={{ color: 'var(--danger)' }}>{state.error}</span>}
      <SubmitButton className="btn btn-primary btn-sm" pendingText="…">Save</SubmitButton>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancel</button>
    </form>
  );
}
