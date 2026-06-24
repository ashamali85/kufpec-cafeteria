import Link from 'next/link';
import { OrderStatus } from '@prisma/client';
import { requireCafeteriaAdmin } from '@/lib/auth';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TopBar } from '@/components/TopBar';
import { StatusBadge } from '@/components/StatusBadge';
import { formatKwd } from '@/lib/money';
import { formatDateTime } from '@/lib/utils';

export default async function AdminOrdersPage() {
  await requireCafeteriaAdmin();
  const user = await getSessionUser();

  const [pending, recent, pendingCount] = await Promise.all([
    prisma.order.findMany({
      where: { status: OrderStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      include: { customer: true, items: true }
    }),
    prisma.order.findMany({
      where: { status: { in: [OrderStatus.APPROVED, OrderStatus.REJECTED] } },
      orderBy: { updatedAt: 'desc' },
      take: 12,
      include: { customer: true }
    }),
    prisma.order.count({ where: { status: OrderStatus.PENDING } })
  ]);

  return (
    <>
      <TopBar user={user} />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <div className="section-title">
          <h1>Order queue</h1>
          <span className="pill-balance">{pendingCount} waiting</span>
        </div>

        {pending.length === 0 ? (
          <div className="card empty">
            <div className="empty-icon">✅</div>
            <p>No orders waiting. You’re all caught up.</p>
          </div>
        ) : (
          <div className="stack">
            {pending.map((o) => (
              <div key={o.id} className="card">
                <div className="row-between wrap">
                  <div>
                    <strong>{o.orderNumber}</strong> · {o.customer.name}
                    <div className="small muted">
                      {formatDateTime(o.createdAt)} · office {o.deliveryOffice ?? '—'}, floor {o.deliveryFloor ?? '—'}
                    </div>
                    <div className="small">{o.items.reduce((s, i) => s + i.quantity, 0)} items · est. {formatKwd(o.requestedTotalFils)}</div>
                  </div>
                  <Link href={`/admin/orders/${o.id}`} className="btn btn-accent btn-sm">Process</Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <h2 className="mt-6" style={{ marginBottom: 12 }}>Recently processed</h2>
        {recent.length === 0 ? (
          <p className="muted">Nothing yet.</p>
        ) : (
          <div className="table-card">
            <table>
              <thead><tr><th>Order</th><th>Employee</th><th>Total</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td><strong>{o.orderNumber}</strong></td>
                    <td>{o.customer.name}</td>
                    <td>{formatKwd(o.finalTotalFils ?? o.requestedTotalFils)}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td><Link href={`/admin/orders/${o.id}`}>View</Link></td>
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
