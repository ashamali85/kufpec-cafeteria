'use client';

import { useActionState, useState } from 'react';
import { createStaffAction } from '@/lib/actions';
import { SubmitButton } from '@/components/SubmitButton';

export function CreateStaffForm() {
  const [state, formAction] = useActionState(createStaffAction, null);
  const [open, setOpen] = useState(false);

  if (!open) return <button className="btn btn-accent btn-sm" onClick={() => setOpen(true)}>+ Add staff member</button>;

  return (
    <div className="card mt-2">
      <h3 style={{ marginBottom: 10 }}>New staff account</h3>
      {state?.error && <div className="alert alert-error">{state.error}</div>}
      <form action={formAction}>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" name="name" required />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required />
          </div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="password">Temporary password</label>
            <input id="password" name="password" type="text" placeholder="min 8 characters" required />
          </div>
          <div className="field">
            <label htmlFor="role">Role</label>
            <select id="role" name="role" defaultValue="CAFETERIA_ADMIN">
              <option value="CAFETERIA_ADMIN">Cafeteria admin</option>
              <option value="SUPER_ADMIN">Super admin</option>
            </select>
          </div>
        </div>
        <div className="row">
          <SubmitButton pendingText="Creating…">Create account</SubmitButton>
          <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
