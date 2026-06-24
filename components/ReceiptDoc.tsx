import { formatKwd } from '@/lib/money';
import { formatDateTime } from '@/lib/utils';

export function ReceiptDoc({
  cafeteriaName,
  receiptNumber,
  employeeName,
  employeeEmail,
  amountFils,
  balanceAfter,
  note,
  handledByName,
  createdAt
}: {
  cafeteriaName: string;
  receiptNumber: string;
  employeeName: string;
  employeeEmail: string;
  amountFils: number;
  balanceAfter: number;
  note: string | null;
  handledByName: string | null;
  createdAt: Date;
}) {
  return (
    <div className="doc">
      <div className="doc-head">
        <div className="brand-mark" style={{ justifyContent: 'center', color: 'var(--brand)' }}>
          <span className="brand-dot" /> {cafeteriaName}
        </div>
        <h2 style={{ marginTop: 8 }}>Top-up receipt</h2>
        <p className="small muted">{receiptNumber}</p>
      </div>

      <div className="doc-line"><span className="muted">Employee</span><span>{employeeName}</span></div>
      <div className="doc-line"><span className="muted">Email</span><span>{employeeEmail}</span></div>
      <div className="doc-line"><span className="muted">Date</span><span>{formatDateTime(createdAt)}</span></div>
      {handledByName && <div className="doc-line"><span className="muted">Processed by</span><span>{handledByName}</span></div>}
      {note && <div className="doc-line"><span className="muted">Note</span><span>{note}</span></div>}

      <div className="doc-line doc-total"><span>Amount added</span><span>{formatKwd(amountFils)}</span></div>
      <div className="doc-line"><span className="muted">New balance</span><span>{formatKwd(balanceAfter)}</span></div>

      <p className="center small muted mt-6">Paid by cash at the cafeteria counter. Thank you.</p>
    </div>
  );
}
