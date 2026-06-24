import { requireCafeteriaAdmin, getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TopBar } from '@/components/TopBar';
import { SubmitButton } from '@/components/SubmitButton';
import { toggleItemAvailabilityAction } from '@/lib/actions';
import { formatKwd } from '@/lib/money';

export default async function AdminMenuPage() {
  await requireCafeteriaAdmin();
  const user = await getSessionUser();

  const categories = await prisma.menuCategory.findMany({
    orderBy: { displayOrder: 'asc' },
    include: { items: { orderBy: { displayOrder: 'asc' } } }
  });

  return (
    <>
      <TopBar user={user} />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <div className="section-title">
          <div>
            <h1>Menu availability</h1>
            <p className="muted">Mark items sold out when you run out. Prices and photos are managed by the super admin.</p>
          </div>
        </div>

        {categories.map((cat) => (
          <section key={cat.id} className="mt-4">
            <h2 style={{ marginBottom: 8 }}>{cat.name}</h2>
            <div className="table-card">
              <table>
                <thead><tr><th>Item</th><th>Price</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {cat.items.map((it) => (
                    <tr key={it.id}>
                      <td>{it.name}</td>
                      <td>{formatKwd(it.priceFils)}</td>
                      <td>
                        {it.isAvailable
                          ? <span className="badge badge-approved">Available</span>
                          : <span className="badge badge-cancelled">Sold out</span>}
                      </td>
                      <td>
                        <form action={toggleItemAvailabilityAction}>
                          <input type="hidden" name="id" value={it.id} />
                          <SubmitButton className="btn btn-ghost btn-sm">
                            {it.isAvailable ? 'Mark sold out' : 'Mark available'}
                          </SubmitButton>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {cat.items.length === 0 && <tr><td colSpan={4} className="muted small">No items.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
