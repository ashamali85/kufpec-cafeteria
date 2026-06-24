'use client';

import { useActionState } from 'react';
import { saveSettingsAction } from '@/lib/actions';
import { SubmitButton } from '@/components/SubmitButton';

export function SettingsForm({
  negativeLimitKwd,
  allowedEmailDomains,
  cafeteriaName
}: {
  negativeLimitKwd: string;
  allowedEmailDomains: string;
  cafeteriaName: string;
}) {
  const [state, formAction] = useActionState(saveSettingsAction, null);

  return (
    <div className="card">
      {state?.error && <div className="alert alert-error">{state.error}</div>}
      {state?.ok && <div className="alert alert-ok">{state.ok}</div>}
      <form action={formAction}>
        <div className="field">
          <label htmlFor="cafeteriaName">Cafeteria name</label>
          <input id="cafeteriaName" name="cafeteriaName" defaultValue={cafeteriaName} />
          <span className="small muted">Shown on receipts and invoices.</span>
        </div>
        <div className="field">
          <label htmlFor="negativeLimit">Negative balance limit (KWD)</label>
          <input id="negativeLimit" name="negativeLimit" inputMode="decimal" defaultValue={negativeLimitKwd} />
          <span className="small muted">
            How far an employee’s balance may go below zero. e.g. 5.000 lets a balance reach −5.000 KWD.
          </span>
        </div>
        <div className="field">
          <label htmlFor="allowedEmailDomains">Allowed sign-up domains</label>
          <input id="allowedEmailDomains" name="allowedEmailDomains" defaultValue={allowedEmailDomains} />
          <span className="small muted">
            Comma-separated, e.g. kufpec.com. Only these email domains can self-register. (An
            ALLOWED_EMAIL_DOMAINS environment variable, if set, overrides this.)
          </span>
        </div>
        <SubmitButton pendingText="Saving…">Save settings</SubmitButton>
      </form>
    </div>
  );
}
