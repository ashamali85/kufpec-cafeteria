import Link from 'next/link';
import { OrderStatus, UserRole } from '@prisma/client';
import { requireSuperAdmin, getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TopBar } from '@/components/TopBar';
import { formatKwd } from '@/lib/money';
import { formatDateTime } from '@/lib/utils';

export default async function SuperDashboard() {
  await requireSuperAdmin();
  const user = await getSessionUser();

  const [employees, pending, approvedAgg, itemCount, audit] = await Promise.all([
    prisma.user.count({ where: { role: UserRole.EMPLOYEE } }),
    prisma.order.count({ where: { status: OrderStatus.PENDING } }),
    prisma.invoice.aggregate({ _sum: { totalFils: true }, _count: true }),
    prisma.menuItem.count(),
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 15, include: { actor: true } })
  ]);

  return (
    <>
      <TopBar user={user} />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <h1 style={{ marginBottom: 16 }}>Dashboard</h1>

        <div className="stat-grid">
          <div className="stat"><div className="stat-num">{employees}</div><div className="stat-label">Employees</div></div>
          <div className="stat"><div className="stat-num">{pending}</div><div className="stat-label">Orders waiting</div></div>
          <div className="stat"><div className="stat-num">{approvedAgg._count}</div><div className="stat-label">Invoices issued</div></div>
          <div className="stat"><div className="stat-num">{formatKwd(approvedAgg._sum.totalFils ?? 0)}</div><div className="stat-label">Total billed</div></div>
          <div className="stat"><div className="stat-num">{itemCount}</div><div className="stat-label">Menu items</div></div>
        </div>

        <div className="row wrap mt-6" style={{ gap: 12 }}>
          <Link href="/super/menu" className="btn btn-primary">Manage menu</Link>
          <Link href="/super/users" className="btn btn-ghost">Manage users</Link>
          <Link href="/admin" className="btn btn-ghost">Order queue</Link>
          <Link href="/super/settings" className="btn btn-ghost">Settings</Link>
        </div>

        <h2 className="mt-6" style={{ marginBottom: 12 }}>Activity log</h2>
        <div className="table-card">
          <table>
            <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Item</th></tr></thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id}>
                  <td className="small muted">{formatDateTime(a.createdAt)}</td>
                  <td>{a.actor.name}</td>
                  <td className="small">{a.action}</td>
                  <td className="small muted">{a.entityName ?? a.entityType}</td>
                </tr>
              ))}
              {audit.length === 0 && <tr><td colSpan={4} className="muted small">No activity yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
