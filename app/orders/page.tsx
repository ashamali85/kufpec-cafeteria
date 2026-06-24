import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TopBar } from '@/components/TopBar';
import { StatusBadge } from '@/components/StatusBadge';
import { formatKwd } from '@/lib/money';
import { formatDateTime } from '@/lib/utils';

export default async function OrdersPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const orders = await prisma.order.findMany({
    where: { customerId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { items: true, invoice: true }
  });

  return (
    <>
      <TopBar user={user} />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <div className="section-title">
          <h1>My orders</h1>
          <Link href="/menu" className="btn btn-accent btn-sm">Order again</Link>
        </div>

        {orders.length === 0 ? (
          <div className="card empty">
            <div className="empty-icon">🧾</div>
            <p>You haven’t ordered yet. The menu is waiting.</p>
            <Link href="/menu" className="btn btn-primary mt-4">Browse the menu</Link>
          </div>
        ) : (
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Order</th><th>Placed</th><th>Items</th><th>Total</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><strong>{o.orderNumber}</strong></td>
                    <td className="small muted">{formatDateTime(o.createdAt)}</td>
                    <td>{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                    <td>{formatKwd(o.finalTotalFils ?? o.requestedTotalFils)}{o.finalTotalFils === null && <span className="small muted"> est.</span>}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td><Link href={`/orders/${o.id}`}>View</Link></td>
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
