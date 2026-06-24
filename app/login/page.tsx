'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { loginAction } from '@/lib/actions';
import { SubmitButton } from '@/components/SubmitButton';

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, null);

  return (
    <main className="container-narrow" style={{ paddingTop: 64 }}>
      <div className="center" style={{ marginBottom: 24 }}>
        <Link href="/" className="brand-mark" style={{ justifyContent: 'center', color: 'var(--brand)' }}>
          <span className="brand-dot" /> KUFPEC Cafeteria
        </Link>
      </div>
      <div className="card card-pad-lg">
        <h1 style={{ marginBottom: 4 }}>Welcome back</h1>
        <p className="muted" style={{ marginBottom: 20 }}>Sign in to order and manage your credit.</p>

        {state?.error && <div className="alert alert-error">{state.error}</div>}

        <form action={formAction}>
          <div className="field">
            <label htmlFor="email">Work email</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <SubmitButton className="btn btn-primary btn-block" pendingText="Signing in…">Sign in</SubmitButton>
        </form>
      </div>
      <p className="center muted mt-4">
        New here? <Link href="/signup">Create an account</Link>
      </p>
    </main>
  );
}
