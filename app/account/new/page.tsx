import { getSettings } from '@/lib/queries';
import { redirect } from 'next/navigation';
import { actionCreateAccount } from '@/lib/actions';
import AccountForm from '@/components/AccountForm';

export default async function NewAccountPage() {
  const settings = await getSettings();
  if (!settings || !settings.onboarded) {
    redirect('/onboarding');
  }

  // Handle submit action
  async function handleSubmit(data: {
    name: string;
    type: 'cash' | 'bank' | 'ewallet' | 'credit' | 'savings';
    is_liability: boolean;
    logo_key: string | null;
    color: string;
    opening_balance_minor: number;
  }) {
    'use server';
    await actionCreateAccount(data);
  }

  return (
    <div className="px-6 pt-8 pb-10">
      <AccountForm onSubmit={handleSubmit} title="Add Account" />
    </div>
  );
}
