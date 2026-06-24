import { requireSuperAdmin, getSessionUser } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { TopBar } from '@/components/TopBar';
import { SettingsForm } from '@/components/SettingsForm';

export default async function SettingsPage() {
  await requireSuperAdmin();
  const user = await getSessionUser();
  const settings = await getSettings();

  return (
    <>
      <TopBar user={user} />
      <main className="container-narrow" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <h1 style={{ marginBottom: 16 }}>Settings</h1>
        <SettingsForm
          negativeLimitKwd={(settings.negativeLimitFils / 1000).toFixed(3)}
          allowedEmailDomains={settings.allowedEmailDomains}
          cafeteriaName={settings.cafeteriaName}
        />
      </main>
    </>
  );
}
