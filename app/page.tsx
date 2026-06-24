import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { TopBar } from '@/components/TopBar';
import { prisma } from '@/lib/db';
import { formatKwd } from '@/lib/money';

export default async function HomePage() {
  const user = await getSessionUser();
  const items = await prisma.menuItem.findMany({
    where: { isAvailable: true },
    orderBy: { displayOrder: 'asc' },
    take: 6,
    include: { category: true }
  });

  return (
    <>
      <TopBar user={user} />
      <main className="container" style={{ paddingBottom: 48, paddingTop: 24 }}>
        <section className="hero">
          <div className="accent-rule" />
          <h1>Good food, delivered to your desk.</h1>
          <p>
            Browse today’s cafeteria menu, order straight to your office and floor, and pay from
            your cafeteria credit. No cash, no queue.
          </p>
          <div className="row mt-6">
            {user ? (
              <Link href="/menu" className="btn btn-accent">Browse the menu</Link>
            ) : (
              <>
                <Link href="/signup" className="btn btn-accent">Create your account</Link>
                <Link href="/login" className="btn btn-ghost">Sign in</Link>
              </>
            )}
          </div>
        </section>

        {items.length > 0 && (
          <section className="mt-6">
            <div className="section-title">
              <h2>On the menu today</h2>
              <Link href={user ? '/menu' : '/login'}>See everything →</Link>
            </div>
            <div className="menu-grid">
              {items.map((item) => (
                <article key={item.id} className="menu-item">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.name} className="menu-item-photo" />
                  ) : (
                    <div className="menu-item-photo-fallback">{item.name.charAt(0)}</div>
                  )}
                  <div className="menu-item-body">
                    <strong>{item.name}</strong>
                    <span className="small muted">{item.category.name}</span>
                    <span className="menu-item-price">{formatKwd(item.priceFils)}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
