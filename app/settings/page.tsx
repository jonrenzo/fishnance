import { getSettings, getAccounts } from '@/lib/queries';
import { redirect } from 'next/navigation';
import SettingsClient from '@/components/SettingsClient';

export const revalidate = 0;

export default async function SettingsPage() {
  const settings = await getSettings();
  if (!settings || !settings.onboarded) {
    redirect('/onboarding');
  }

  const accounts = await getAccounts(true);
  const archivedAccounts = accounts.filter((a) => a.archived);

  return (
    <div className="px-6 pt-8 pb-10">
      <SettingsClient settings={settings} archivedAccounts={archivedAccounts} />
    </div>
  );
}
