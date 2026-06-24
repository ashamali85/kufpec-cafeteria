import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TopBar } from '@/components/TopBar';
import { StatusBadge } from '@/components/StatusBadge';
import { SubmitButton } from '@/components/SubmitButton';
import { cancelOwnOrderAction } from '@/lib/actions';
import { formatKwd } from '@/lib/money';
import { formatDateTime } from '@/lib/utils';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, invoice: true }
  });
  if (!order || order.customerId !== user.id) notFound();

  return (
    <>
      <TopBar user={user} />
      <main className="container-narrow" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <Link href="/orders" className="small muted">← All orders</Link>
        <div className="card mt-4">
          <div className="row-between" style={{ marginBottom: 12 }}>
            <h1>{order.orderNumber}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="small muted">Placed {formatDateTime(order.createdAt)}</p>
          {(order.deliveryOffice || order.deliveryFloor) && (
            <p className="small">Deliver to office {order.deliveryOffice ?? '—'}, floor {order.deliveryFloor ?? '—'}</p>
          )}
          {order.customerNote && <p className="small muted">Your note: {order.customerNote}</p>}

          <table className="mt-4">
            <thead><tr><th>Item</th><th>Qty</th><th style={{ textAlign: 'right' }}>Price</th></tr></thead>
            <tbody>
              {order.items.map((it) => (
                <tr key={it.id}>
                  <td>
                    {it.nameSnapshot}
                    {it.note && <div className="small muted">{it.note}</div>}
                  </td>
                  <td>{it.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{formatKwd(it.lineTotalFils)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="row-between mt-4" style={{ fontWeight: 700, fontSize: '1.05rem' }}>
            <span>{order.status === 'APPROVED' ? 'Charged' : 'Estimated total'}</span>
            <span>{formatKwd(order.finalTotalFils ?? order.requestedTotalFils)}</span>
          </div>

          {order.status === 'PENDING' && (
            <div className="alert alert-info mt-4 small">
              Waiting for the cafeteria to confirm. The final price may change for toppings or
              extras, and your credit is only charged once it’s approved.
            </div>
          )}
          {order.adminNote && (
            <div className="alert alert-info mt-4 small">Cafeteria note: {order.adminNote}</div>
          )}

          <div className="row mt-4">
            {order.invoice && (
              <Link href={`/invoices/${order.invoice.id}`} className="btn btn-primary">View invoice</Link>
            )}
            {order.status === 'PENDING' && (
              <form action={cancelOwnOrderAction}>
                <input type="hidden" name="orderId" value={order.id} />
                <SubmitButton className="btn btn-danger" pendingText="Cancelling…">Cancel order</SubmitButton>
              </form>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
