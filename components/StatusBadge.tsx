import { OrderStatus } from '@prisma/client';

const MAP: Record<OrderStatus, { label: string; cls: string }> = {
  PENDING: { label: 'Pending', cls: 'badge-pending' },
  APPROVED: { label: 'Approved', cls: 'badge-approved' },
  REJECTED: { label: 'Rejected', cls: 'badge-rejected' },
  CANCELLED: { label: 'Cancelled', cls: 'badge-cancelled' }
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const m = MAP[status];
  return <span className={`badge ${m.cls}`}>{m.label}</span>;
}
