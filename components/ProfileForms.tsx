'use client';

import { useActionState } from 'react';
import { updateProfileAction, changePasswordAction } from '@/lib/actions';
import { SubmitButton } from '@/components/SubmitButton';

type Profile = {
  name: string;
  email: string;
  phone: string;
  officeNumber: string;
  floorNumber: string;
};

export function ProfileForms({ profile }: { profile: Profile }) {
  const [pState, pAction] = useActionState(updateProfileAction, null);
  const [pwState, pwAction] = useActionState(changePasswordAction, null);

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="card">
        <h2 style={{ marginBottom: 12 }}>Your details</h2>
        {pState?.error && <div className="alert alert-error">{pState.error}</div>}
        {pState?.ok && <div className="alert alert-ok">{pState.ok}</div>}
        <form action={pAction}>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" defaultValue={profile.name} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input value={profile.email} disabled />
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="officeNumber">Office number</label>
              <input id="officeNumber" name="officeNumber" defaultValue={profile.officeNumber} />
            </div>
            <div className="field">
              <label htmlFor="floorNumber">Floor</label>
              <input id="floorNumber" name="floorNumber" defaultValue={profile.floorNumber} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" name="phone" defaultValue={profile.phone} />
          </div>
          <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 12 }}>Change password</h2>
        {pwState?.error && <div className="alert alert-error">{pwState.error}</div>}
        {pwState?.ok && <div className="alert alert-ok">{pwState.ok}</div>}
        <form action={pwAction}>
          <div className="field">
            <label htmlFor="currentPassword">Current password</label>
            <input id="currentPassword" name="currentPassword" type="password" required />
          </div>
          <div className="field">
            <label htmlFor="newPassword">New password</label>
            <input id="newPassword" name="newPassword" type="password" required />
          </div>
          <SubmitButton className="btn btn-ghost" pendingText="Updating…">Update password</SubmitButton>
        </form>
      </div>
    </div>
  );
}
