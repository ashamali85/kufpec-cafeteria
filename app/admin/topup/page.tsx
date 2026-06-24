import Link from 'next/link';
import { LedgerType, UserRole } from '@prisma/client';
import { requireCafeteriaAdmin, getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TopBar } from '@/components/TopBar';
import { TopUpForm } from '@/components/TopUpForm';
import { formatKwd } from '@/lib/money';
import { formatDateTime } from '@/lib/utils';

export default async function TopUpPage() {
  await requireCafeteriaAdmin();
  const user = await getSessionUser();

  const [employees, recent] = await Promise.all([
    prisma.user.findMany({
      where: { role: UserRole.EMPLOYEE, isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true, balanceFils: true }
    }),
    prisma.ledgerEntry.findMany({
      where: { type: LedgerType.TOPUP },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { owner: true, receipt: true }
    })
  ]);

  return (
    <>
      <TopBar user={user} />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <h1 style={{ marginBottom: 16 }}>Top-up credit</h1>
        <div className="row wrap" style={{ alignItems: 'flex-start', gap: 24 }}>
          <div className="grow" style={{ minWidth: 320 }}>
            <TopUpForm employees={employees} />
          </div>
          <div style={{ width: 360 }}>
            <h2 style={{ marginBottom: 12 }}>Recent top-ups</h2>
            {recent.length === 0 ? (
              <p className="muted">No top-ups yet.</p>
            ) : (
              <div className="table-card">
                <table>
                  <thead><tr><th>Employee</th><th>Amount</th><th></th></tr></thead>
                  <tbody>
                    {recent.map((e) => (
                      <tr key={e.id}>
                        <td>{e.owner.name}<div className="small muted">{formatDateTime(e.createdAt)}</div></td>
                        <td>{formatKwd(e.amountFils)}</td>
                        <td>{e.receipt && <Link href={`/receipts/${e.receipt.id}`} className="small">Receipt</Link>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
