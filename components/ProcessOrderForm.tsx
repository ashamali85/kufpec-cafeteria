'use client';

import { useActionState, useMemo, useState } from 'react';
import { approveOrderAction, rejectOrderAction } from '@/lib/actions';
import { formatKwd, parseKwdToFils } from '@/lib/money';
import { SubmitButton } from '@/components/SubmitButton';
import { ProcessingOverlay } from '@/components/ProcessingOverlay';

type Line = { id: string; nameSnapshot: string; quantity: number; lineTotalFils: number; note: string | null };

export function ProcessOrderForm({
  orderId,
  items,
  customerBalanceFils
}: {
  orderId: string;
  items: Line[];
  customerBalanceFils: number;
}) {
  const [approveState, approveAction] = useActionState(approveOrderAction, null);
  const [rejectState, rejectAction] = useActionState(rejectOrderAction, null);

  // Track edited line prices as KWD strings.
  const initial: Record<string, string> = {};
  for (const it of items) {
    const kwd = it.lineTotalFils / 1000;
    initial[it.id] = kwd.toFixed(3);
  }
  const [prices, setPrices] = useState<Record<string, string>>(initial);

  const totalFils = useMemo(
    () =>
      items.reduce((sum, it) => {
        const fils = parseKwdToFils(prices[it.id] ?? '');
        return sum + (fils ?? 0);
      }, 0),
    [prices, items]
  );

  const balanceAfter = customerBalanceFils - totalFils;

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Confirm the final price</h3>
        <p className="small muted" style={{ marginBottom: 12 }}>
          Adjust any line for toppings or extras. Credit is charged only when you approve.
        </p>

        {approveState?.error && <div className="alert alert-error">{approveState.error}</div>}

        <form action={approveAction}>
          <ProcessingOverlay label="Approving order…" />
          <input type="hidden" name="orderId" value={orderId} />
          <table>
            <thead><tr><th>Item</th><th>Qty</th><th style={{ width: 140 }}>Line total (KWD)</th></tr></thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>
                    {it.nameSnapshot}
                    {it.note && <div className="small muted">{it.note}</div>}
                  </td>
                  <td>{it.quantity}</td>
                  <td>
                    <input
                      name={`line_${it.id}`}
                      value={prices[it.id] ?? ''}
                      inputMode="decimal"
                      onChange={(e) => setPrices((p) => ({ ...p, [it.id]: e.target.value }))}
                      style={{ padding: '6px 8px' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="row-between mt-4" style={{ fontWeight: 700, fontSize: '1.05rem' }}>
            <span>Final total</span>
            <span>{formatKwd(totalFils)}</span>
          </div>
          <div className="row-between small muted">
            <span>Customer balance now</span>
            <span>{formatKwd(customerBalanceFils)}</span>
          </div>
          <div className="row-between small" style={{ color: balanceAfter < 0 ? 'var(--danger)' : 'var(--ink-soft)' }}>
            <span>Balance after charge</span>
            <span>{formatKwd(balanceAfter)}</span>
          </div>
          {balanceAfter < 0 && (
            <div className="alert alert-info mt-2 small">
              This will put the employee’s balance negative. It’s allowed up to the configured limit;
              if it exceeds the limit the charge is blocked.
            </div>
          )}

          <div className="field mt-4">
            <label htmlFor="adminNote">Note to employee (optional)</label>
            <input id="adminNote" name="adminNote" placeholder="e.g. added extra cheese (+0.250)" />
          </div>
          <SubmitButton className="btn btn-primary btn-block" pendingText="Approving…">
            Approve &amp; charge {formatKwd(totalFils)}
          </SubmitButton>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 8 }}>Reject this order</h3>
        {rejectState?.error && <div className="alert alert-error">{rejectState.error}</div>}
        <form action={rejectAction}>
          <ProcessingOverlay label="Rejecting order…" />
          <input type="hidden" name="orderId" value={orderId} />
          <div className="field">
            <label htmlFor="rejectNote">Reason (optional)</label>
            <input id="rejectNote" name="adminNote" placeholder="e.g. item unavailable" />
          </div>
          <SubmitButton className="btn btn-danger" pendingText="Rejecting…">Reject order</SubmitButton>
        </form>
      </div>
    </div>
  );
}
