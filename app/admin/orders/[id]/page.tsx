import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OrderStatus } from '@prisma/client';
import { requireCafeteriaAdmin, getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TopBar } from '@/components/TopBar';
import { StatusBadge } from '@/components/StatusBadge';
import { ProcessOrderForm } from '@/components/ProcessOrderForm';
import { formatKwd } from '@/lib/money';
import { formatDateTime } from '@/lib/utils';

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireCafeteriaAdmin();
  const user = await getSessionUser();

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, customer: true, invoice: true, handledBy: true }
  });
  if (!order) notFound();

  return (
    <>
      <TopBar user={user} />
      <main className="container-narrow" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <Link href="/admin" className="small muted">← Order queue</Link>
        <div className="card mt-4">
          <div className="row-between">
            <h1>{order.orderNumber}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="small muted">{order.customer.name} · {order.customer.email}</p>
          <p className="small">Deliver to office {order.deliveryOffice ?? '—'}, floor {order.deliveryFloor ?? '—'}</p>
          <p className="small muted">Placed {formatDateTime(order.createdAt)}</p>
          {order.customerNote && <div className="alert alert-info mt-2 small">Note: {order.customerNote}</div>}
        </div>

        <div className="mt-4">
          {order.status === OrderStatus.PENDING ? (
            <ProcessOrderForm
              orderId={order.id}
              customerBalanceFils={order.customer.balanceFils}
              items={order.items.map((i) => ({
                id: i.id,
                nameSnapshot: i.nameSnapshot,
                quantity: i.quantity,
                lineTotalFils: i.lineTotalFils,
                note: i.note
              }))}
            />
          ) : (
            <div className="card">
              <table>
                <thead><tr><th>Item</th><th>Qty</th><th style={{ textAlign: 'right' }}>Price</th></tr></thead>
                <tbody>
                  {order.items.map((it) => (
                    <tr key={it.id}>
                      <td>{it.nameSnapshot}{it.note && <div className="small muted">{it.note}</div>}</td>
                      <td>{it.quantity}</td>
                      <td style={{ textAlign: 'right' }}>{formatKwd(it.lineTotalFils)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="row-between mt-4" style={{ fontWeight: 700 }}>
                <span>Total</span>
                <span>{formatKwd(order.finalTotalFils ?? order.requestedTotalFils)}</span>
              </div>
              {order.adminNote && <div className="alert alert-info mt-2 small">Note: {order.adminNote}</div>}
              {order.invoice && (
                <Link href={`/invoices/${order.invoice.id}`} className="btn btn-primary mt-4">View invoice</Link>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
