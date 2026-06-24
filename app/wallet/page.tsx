import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LedgerType } from '@prisma/client';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TopBar } from '@/components/TopBar';
import { formatKwd } from '@/lib/money';
import { formatDateTime } from '@/lib/utils';

const LEDGER_LABEL: Record<LedgerType, string> = {
  TOPUP: 'Top-up',
  ORDER_CHARGE: 'Order',
  ADJUSTMENT: 'Adjustment',
  REFUND: 'Refund'
};

export default async function WalletPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const entries = await prisma.ledgerEntry.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { receipt: true, order: { include: { invoice: true } } }
  });

  return (
    <>
      <TopBar user={user} />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <h1>Wallet</h1>

        <div className="card mt-4" style={{ background: 'linear-gradient(135deg, #0a3d91, #1b67d5)', color: '#fff', border: 'none' }}>
          <span className="small" style={{ color: 'rgba(255,255,255,0.8)' }}>Current credit balance</span>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem' }}>
            {formatKwd(user.balanceFils)}
          </div>
          <p className="small" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Top up with cash at the cafeteria counter — they’ll add the credit and print you a receipt.
          </p>
        </div>

        <h2 className="mt-6" style={{ marginBottom: 12 }}>History</h2>
        {entries.length === 0 ? (
          <div className="card empty"><p>No credit activity yet.</p></div>
        ) : (
          <div className="table-card">
            <table>
              <thead>
                <tr><th>Date</th><th>Type</th><th>Note</th><th style={{ textAlign: 'right' }}>Amount</th><th style={{ textAlign: 'right' }}>Balance</th><th></th></tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td className="small muted">{formatDateTime(e.createdAt)}</td>
                    <td>{LEDGER_LABEL[e.type]}</td>
                    <td className="small">{e.note}</td>
                    <td style={{ textAlign: 'right', color: e.amountFils >= 0 ? 'var(--ok)' : 'var(--danger)' }}>
                      {e.amountFils >= 0 ? '+' : ''}{formatKwd(e.amountFils)}
                    </td>
                    <td style={{ textAlign: 'right' }}>{formatKwd(e.balanceAfter)}</td>
                    <td>
                      {e.receipt && <Link href={`/receipts/${e.receipt.id}`} className="small">Receipt</Link>}
                      {e.order?.invoice && <Link href={`/invoices/${e.order.invoice.id}`} className="small">Invoice</Link>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
