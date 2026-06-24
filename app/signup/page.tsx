'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signupAction } from '@/lib/actions';
import { SubmitButton } from '@/components/SubmitButton';

export default function SignupPage() {
  const [state, formAction] = useActionState(signupAction, null);

  return (
    <main className="container-narrow" style={{ paddingTop: 48, paddingBottom: 48 }}>
      <div className="center" style={{ marginBottom: 24 }}>
        <Link href="/" className="brand-mark" style={{ justifyContent: 'center', color: 'var(--brand)' }}>
          <span className="brand-dot" /> KUFPEC Cafeteria
        </Link>
      </div>
      <div className="card card-pad-lg">
        <h1 style={{ marginBottom: 4 }}>Create your account</h1>
        <p className="muted" style={{ marginBottom: 20 }}>
          Use your KUFPEC work email. You can add your office and floor so orders find you.
        </p>

        {state?.error && <div className="alert alert-error">{state.error}</div>}

        <form action={formAction}>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" required />
          </div>
          <div className="field">
            <label htmlFor="email">Work email</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="new-password" required />
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="officeNumber">Office number</label>
              <input id="officeNumber" name="officeNumber" placeholder="e.g. 1204" />
            </div>
            <div className="field">
              <label htmlFor="floorNumber">Floor</label>
              <input id="floorNumber" name="floorNumber" placeholder="e.g. 12" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="phone">Phone (optional)</label>
            <input id="phone" name="phone" />
          </div>
          <SubmitButton className="btn btn-accent btn-block" pendingText="Creating…">Create account</SubmitButton>
        </form>
      </div>
      <p className="center muted mt-4">
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </main>
  );
}
