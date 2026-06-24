import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TopBar } from '@/components/TopBar';
import { MenuBrowser } from '@/components/MenuBrowser';

export default async function MenuPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role === UserRole.CAFETERIA_ADMIN) redirect('/admin');
  if (user.role === UserRole.SUPER_ADMIN) redirect('/super');

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  const categories = await prisma.menuCategory.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
    include: { items: { where: {}, orderBy: { displayOrder: 'asc' } } }
  });

  const items = categories.flatMap((cat) =>
    cat.items.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      priceFils: i.priceFils,
      imageUrl: i.imageUrl,
      isAvailable: i.isAvailable,
      categoryName: cat.name
    }))
  );

  return (
    <>
      <TopBar user={user} />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <div className="section-title">
          <div>
            <h1>Today’s menu</h1>
            <p className="muted">Add what you’d like, then send it to your office.</p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="card empty">
            <div className="empty-icon">🍽️</div>
            <p>The menu is being set up. Check back shortly.</p>
          </div>
        ) : (
          <MenuBrowser
            items={items}
            categories={categories.map((c) => c.name)}
            defaultOffice={dbUser?.officeNumber ?? ''}
            defaultFloor={dbUser?.floorNumber ?? ''}
          />
        )}
      </main>
    </>
  );
}
