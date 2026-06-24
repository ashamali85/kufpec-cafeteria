'use client';

import { useActionState, useState } from 'react';
import { saveCategoryAction } from '@/lib/actions';
import { SubmitButton } from '@/components/SubmitButton';

export function CategoryEditor() {
  const [state, formAction] = useActionState(saveCategoryAction, null);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>+ New category</button>
    );
  }

  return (
    <div className="card mt-2">
      <h3 style={{ marginBottom: 10 }}>New category</h3>
      {state?.error && <div className="alert alert-error">{state.error}</div>}
      <form action={formAction}>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" name="name" placeholder="e.g. Hot drinks" required />
          </div>
          <div className="field">
            <label htmlFor="displayOrder">Display order</label>
            <input id="displayOrder" name="displayOrder" type="number" defaultValue={0} />
          </div>
        </div>
        <label className="row" style={{ gap: 8, marginBottom: 12 }}>
          <input type="checkbox" name="isActive" defaultChecked style={{ width: 'auto' }} /> Visible to employees
        </label>
        <div className="row">
          <SubmitButton pendingText="Saving…">Save category</SubmitButton>
          <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
