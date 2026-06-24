import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSuperAdmin, getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TopBar } from '@/components/TopBar';
import { MenuItemForm } from '@/components/MenuItemForm';

export default async function MenuItemEditorPage({
  searchParams
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  await requireSuperAdmin();
  const user = await getSessionUser();
  const { id } = await searchParams;

  const [categories, item] = await Promise.all([
    prisma.menuCategory.findMany({ orderBy: { displayOrder: 'asc' } }),
    id ? prisma.menuItem.findUnique({ where: { id } }) : Promise.resolve(null)
  ]);

  if (id && !item) notFound();

  return (
    <>
      <TopBar user={user} />
      <main className="container-narrow" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <Link href="/super/menu" className="small muted">← Menu</Link>
        <h1 className="mt-2" style={{ marginBottom: 16 }}>{item ? 'Edit item' : 'New item'}</h1>
        {categories.length === 0 ? (
          <div className="card"><p className="muted">Create a category first.</p></div>
        ) : (
          <MenuItemForm
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            item={
              item
                ? {
                    id: item.id,
                    name: item.name,
                    description: item.description ?? '',
                    priceKwd: (item.priceFils / 1000).toFixed(3),
                    categoryId: item.categoryId,
                    imageUrl: item.imageUrl,
                    isAvailable: item.isAvailable,
                    displayOrder: item.displayOrder
                  }
                : null
            }
          />
        )}
      </main>
    </>
  );
}
