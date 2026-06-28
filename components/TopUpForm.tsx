'use client';

import { useActionState, useMemo, useState } from 'react';
import { topUpAction } from '@/lib/actions';
import { formatKwd } from '@/lib/money';
import { SubmitButton } from '@/components/SubmitButton';
import { ProcessingOverlay } from '@/components/ProcessingOverlay';

type Employee = { id: string; name: string; email: string; balanceFils: number };

export function TopUpForm({ employees }: { employees: Employee[] }) {
  const [state, formAction] = useActionState(topUpAction, null);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees.slice(0, 8);
    return employees
      .filter((e) => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, employees]);

  const selected = employees.find((e) => e.id === selectedId);

  return (
    <div className="card">
      <h2 style={{ marginBottom: 12 }}>Add credit</h2>
      {state?.error && <div className="alert alert-error">{state.error}</div>}

      <div className="field">
        <label htmlFor="search">Find employee</label>
        <input
          id="search"
          placeholder="Search by name or email"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelectedId(''); }}
        />
      </div>

      {!selected && (
        <div className="stack" style={{ gap: 6, marginBottom: 12 }}>
          {filtered.map((e) => (
            <button
              key={e.id}
              className="btn btn-ghost"
              style={{ justifyContent: 'space-between' }}
              onClick={() => { setSelectedId(e.id); setQuery(e.name); }}
            >
              <span>{e.name} <span className="muted small">{e.email}</span></span>
              <span className="small">{formatKwd(e.balanceFils)}</span>
            </button>
          ))}
          {filtered.length === 0 && <p className="muted small">No matching employees.</p>}
        </div>
      )}

      {selected && (
        <form action={formAction}>
          <ProcessingOverlay label="Adding credit…" />
          <input type="hidden" name="employeeId" value={selected.id} />
          <div className="alert alert-ok">
            {selected.name} — current balance {formatKwd(selected.balanceFils)}
          </div>
          <div className="field">
            <label htmlFor="amount">Amount received (KWD)</label>
            <input id="amount" name="amount" inputMode="decimal" placeholder="e.g. 5.000" required />
          </div>
          <div className="field">
            <label htmlFor="note">Note (optional)</label>
            <input id="note" name="note" placeholder="Cash top-up" />
          </div>
          <div className="row">
            <SubmitButton className="btn btn-primary" pendingText="Adding…">
              Add credit &amp; print receipt
            </SubmitButton>
            <button type="button" className="btn btn-ghost" onClick={() => { setSelectedId(''); setQuery(''); }}>
              Change employee
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
