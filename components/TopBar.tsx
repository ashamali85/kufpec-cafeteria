import Link from 'next/link';
import { UserRole } from '@prisma/client';
import type { SessionUser } from '@/lib/auth';
import { logoutAction } from '@/lib/actions';
import { formatKwd } from '@/lib/money';

export function TopBar({ user }: { user: SessionUser | null }) {
  return (
    <header className="topbar print-hide">
      <div className="container">
        <Link href={user ? '/menu' : '/'} className="brand-mark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kufpec-logo.png" alt="KUFPEC" className="brand-logo-img" />
          <span className="brand-divider" />
          <span className="brand-sub">Cafeteria</span>
        </Link>
        <nav className="nav">
          {!user && (
            <>
              <Link href="/login">Sign in</Link>
              <Link href="/signup" className="btn btn-accent btn-sm">Create account</Link>
            </>
          )}

          {user?.role === UserRole.EMPLOYEE && (
            <>
              <Link href="/menu">Menu</Link>
              <Link href="/orders">My orders</Link>
              <Link href="/wallet">Wallet</Link>
              <Link href="/profile">Profile</Link>
              <span className="pill-balance">{formatKwd(user.balanceFils)}</span>
              <LogoutButton />
            </>
          )}

          {user?.role === UserRole.CAFETERIA_ADMIN && (
            <>
              <Link href="/admin">Orders</Link>
              <Link href="/admin/topup">Top-up</Link>
              <Link href="/admin/menu">Menu</Link>
              <LogoutButton />
            </>
          )}

          {user?.role === UserRole.SUPER_ADMIN && (
            <>
              <Link href="/super">Dashboard</Link>
              <Link href="/super/menu">Menu</Link>
              <Link href="/super/users">Users</Link>
              <Link href="/admin">Orders</Link>
              <Link href="/admin/topup">Top-up</Link>
              <Link href="/super/settings">Settings</Link>
              <LogoutButton />
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button type="submit">Sign out</button>
    </form>
  );
}
