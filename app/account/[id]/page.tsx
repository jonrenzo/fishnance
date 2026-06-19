import {
  getSettings,
  getAccount,
  getAccountTransactions,
  getCategories,
  getAccounts,
  accountBalance,
  accountTransactionCount,
} from '@/lib/queries';
import { redirect } from 'next/navigation';
import AccountDetailClient from '@/components/AccountDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function AccountDetailPage({ params }: PageProps) {
  const { id } = await params;
  const accountId = parseInt(id);

  if (isNaN(accountId)) {
    redirect('/accounts');
  }

  const settings = await getSettings();
  if (!settings || !settings.onboarded) {
    redirect('/onboarding');
  }

  const [account, balance, txs, categories, allAccounts, txCount] = await Promise.all([
    getAccount(accountId),
    accountBalance(accountId),
    getAccountTransactions(accountId, 50),
    getCategories(),
    getAccounts(true),
    accountTransactionCount(accountId),
  ]);

  if (!account) {
    redirect('/accounts');
  }

  return (
    <div className="px-6 pt-8 pb-10">
      <AccountDetailClient
        account={account}
        balance={balance}
        transactions={txs}
        categories={categories}
        accounts={allAccounts}
        currencySymbol={settings.currency_symbol}
        txCount={txCount}
      />
    </div>
  );
}
