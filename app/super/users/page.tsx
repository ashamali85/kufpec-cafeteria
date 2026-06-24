import { UserRole } from '@prisma/client';
import { requireSuperAdmin, getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TopBar } from '@/components/TopBar';
import { SubmitButton } from '@/components/SubmitButton';
import { toggleUserActiveAction } from '@/lib/actions';
import { CreateStaffForm } from '@/components/CreateStaffForm';
import { AdjustBalanceForm } from '@/components/AdjustBalanceForm';
import { formatKwd } from '@/lib/money';

const ROLE_LABEL: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super admin',
  CAFETERIA_ADMIN: 'Cafeteria admin',
  EMPLOYEE: 'Employee'
};

export default async function SuperUsersPage() {
  const me = await requireSuperAdmin();
  const user = await getSessionUser();

  const [staff, employees] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: [UserRole.SUPER_ADMIN, UserRole.CAFETERIA_ADMIN] } },
      orderBy: { name: 'asc' }
    }),
    prisma.user.findMany({ where: { role: UserRole.EMPLOYEE }, orderBy: { name: 'asc' } })
  ]);

  return (
    <>
      <TopBar user={user} />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <h1 style={{ marginBottom: 16 }}>Users</h1>

        <CreateStaffForm />

        <h2 className="mt-6" style={{ marginBottom: 12 }}>Staff</h2>
        <div className="table-card">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td className="small muted">{s.email}</td>
                  <td>{ROLE_LABEL[s.role]}</td>
                  <td>{s.isActive ? <span className="badge badge-approved">Active</span> : <span className="badge badge-cancelled">Disabled</span>}</td>
                  <td>
                    {s.id !== me.id && (
                      <form action={toggleUserActiveAction}>
                        <input type="hidden" name="id" value={s.id} />
                        <SubmitButton className="btn btn-ghost btn-sm">{s.isActive ? 'Disable' : 'Enable'}</SubmitButton>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-6" style={{ marginBottom: 12 }}>Employees</h2>
        <div className="table-card">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Office</th><th>Balance</th><th>Status</th><th>Adjust</th><th></th></tr></thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id}>
                  <td>{e.name}</td>
                  <td className="small muted">{e.email}</td>
                  <td className="small">{e.officeNumber ?? '—'}{e.floorNumber ? ` / fl ${e.floorNumber}` : ''}</td>
                  <td style={{ color: e.balanceFils < 0 ? 'var(--danger)' : 'inherit' }}>{formatKwd(e.balanceFils)}</td>
                  <td>{e.isActive ? <span className="badge badge-approved">Active</span> : <span className="badge badge-cancelled">Disabled</span>}</td>
                  <td><AdjustBalanceForm employeeId={e.id} employeeName={e.name} /></td>
                  <td>
                    <form action={toggleUserActiveAction}>
                      <input type="hidden" name="id" value={e.id} />
                      <SubmitButton className="btn btn-ghost btn-sm">{e.isActive ? 'Disable' : 'Enable'}</SubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && <tr><td colSpan={7} className="muted small">No employees yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
