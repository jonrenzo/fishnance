import { getSettings, getAccount } from '@/lib/queries';
import { redirect } from 'next/navigation';
import { actionUpdateAccount } from '@/lib/actions';
import AccountForm from '@/components/AccountForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function EditAccountPage({ params }: PageProps) {
  const { id } = await params;
  const accountId = parseInt(id);

  if (isNaN(accountId)) {
    redirect('/accounts');
  }

  const settings = await getSettings();
  if (!settings || !settings.onboarded) {
    redirect('/onboarding');
  }

  const account = await getAccount(accountId);
  if (!account) {
    redirect('/accounts');
  }

  // Handle edit submit action
  async function handleSubmit(data: {
    name: string;
    type: 'cash' | 'bank' | 'ewallet' | 'credit' | 'savings';
    is_liability: boolean;
    logo_key: string | null;
    color: string;
  }) {
    'use server';
    await actionUpdateAccount(accountId, data);
  }

  return (
    <div className="px-6 pt-8 pb-10">
      <AccountForm initialData={account} onSubmit={handleSubmit} title="Edit Account" />
    </div>
  );
}
