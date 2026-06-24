import { formatKwd } from '@/lib/money';
import { formatDateTime } from '@/lib/utils';

type Line = { nameSnapshot: string; quantity: number; lineTotalFils: number; note: string | null };

export function InvoiceDoc({
  cafeteriaName,
  invoiceNumber,
  orderNumber,
  employeeName,
  deliveryOffice,
  deliveryFloor,
  items,
  totalFils,
  createdAt
}: {
  cafeteriaName: string;
  invoiceNumber: string;
  orderNumber: string;
  employeeName: string;
  deliveryOffice: string | null;
  deliveryFloor: string | null;
  items: Line[];
  totalFils: number;
  createdAt: Date;
}) {
  return (
    <div className="doc">
      <div className="doc-head">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kufpec-logo.png" alt="KUFPEC" style={{ height: 40, width: 'auto' }} />
          <strong style={{ color: 'var(--brand)', fontSize: '1rem' }}>{cafeteriaName}</strong>
        </div>
        <h2 style={{ marginTop: 8 }}>Invoice</h2>
        <p className="small muted">{invoiceNumber} · Order {orderNumber}</p>
      </div>

      <div className="doc-line"><span className="muted">Employee</span><span>{employeeName}</span></div>
      <div className="doc-line"><span className="muted">Delivered to</span><span>Office {deliveryOffice ?? '—'}, floor {deliveryFloor ?? '—'}</span></div>
      <div className="doc-line"><span className="muted">Date</span><span>{formatDateTime(createdAt)}</span></div>

      <table className="mt-4">
        <thead><tr><th>Item</th><th>Qty</th><th style={{ textAlign: 'right' }}>Price</th></tr></thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx}>
              <td>{it.nameSnapshot}{it.note && <div className="small muted">{it.note}</div>}</td>
              <td>{it.quantity}</td>
              <td style={{ textAlign: 'right' }}>{formatKwd(it.lineTotalFils)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="doc-line doc-total"><span>Total charged</span><span>{formatKwd(totalFils)}</span></div>
      <p className="center small muted mt-6">Charged to your cafeteria credit. Thank you.</p>
    </div>
  );
}
