import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TopBar } from '@/components/TopBar';
import { ProfileForms } from '@/components/ProfileForms';

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) redirect('/login');

  return (
    <>
      <TopBar user={user} />
      <main className="container-narrow" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <h1 style={{ marginBottom: 16 }}>Profile</h1>
        <ProfileForms
          profile={{
            name: dbUser.name,
            email: dbUser.email,
            phone: dbUser.phone ?? '',
            officeNumber: dbUser.officeNumber ?? '',
            floorNumber: dbUser.floorNumber ?? ''
          }}
        />
      </main>
    </>
  );
}
