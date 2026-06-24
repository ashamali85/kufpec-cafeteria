import Link from 'next/link';
import { requireSuperAdmin, getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TopBar } from '@/components/TopBar';
import { SubmitButton } from '@/components/SubmitButton';
import { deleteMenuItemAction, deleteCategoryAction } from '@/lib/actions';
import { formatKwd } from '@/lib/money';
import { CategoryEditor } from '@/components/CategoryEditor';
import { CategoryRename } from '@/components/CategoryRename';

export default async function SuperMenuPage() {
  await requireSuperAdmin();
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
          <h1>Menu</h1>
          <Link href="/super/menu/item" className="btn btn-accent btn-sm">Add item</Link>
        </div>

        <CategoryEditor />

        {categories.map((cat) => (
          <section key={cat.id} className="mt-6">
            <div className="row-between" style={{ marginBottom: 8 }}>
              <h2>{cat.name} {!cat.isActive && <span className="badge badge-cancelled">Hidden</span>}</h2>
              <div className="row">
                <CategoryRename id={cat.id} name={cat.name} isActive={cat.isActive} displayOrder={cat.displayOrder} />
                {cat.items.length === 0 && (
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="id" value={cat.id} />
                    <SubmitButton className="btn btn-danger btn-sm">Delete</SubmitButton>
                  </form>
                )}
              </div>
            </div>
            <div className="table-card">
              <table>
                <thead><tr><th>Item</th><th>Price</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {cat.items.map((it) => (
                    <tr key={it.id}>
                      <td>
                        <div className="row" style={{ gap: 10 }}>
                          {it.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={it.imageUrl} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                          ) : (
                            <div className="menu-item-photo-fallback" style={{ width: 40, height: 40, borderRadius: 6, fontSize: '1rem' }}>{it.name.charAt(0)}</div>
                          )}
                          <span>{it.name}</span>
                        </div>
                      </td>
                      <td>{formatKwd(it.priceFils)}</td>
                      <td>{it.isAvailable ? <span className="badge badge-approved">Available</span> : <span className="badge badge-cancelled">Sold out</span>}</td>
                      <td>
                        <div className="row">
                          <Link href={`/super/menu/item?id=${it.id}`} className="small">Edit</Link>
                          <form action={deleteMenuItemAction}>
                            <input type="hidden" name="id" value={it.id} />
                            <SubmitButton className="btn btn-danger btn-sm">Delete</SubmitButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {cat.items.length === 0 && <tr><td colSpan={4} className="muted small">No items in this category yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        {categories.length === 0 && (
          <div className="card empty mt-4"><p>Create a category above, then add items.</p></div>
        )}
      </main>
    </>
  );
}
