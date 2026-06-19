import { getSettings, getAccounts, netWorth, accountBalance } from '@/lib/queries';
import { redirect } from 'next/navigation';
import AccountsClient from '@/components/AccountsClient';

export const revalidate = 0;

export default async function AccountsPage() {
  const settings = await getSettings();
  if (!settings || !settings.onboarded) {
    redirect('/onboarding');
  }

  const [accounts, netWorthVal] = await Promise.all([
    getAccounts(true), // Get both archived and active
    netWorth(),
  ]);

  const accountsWithBalances = await Promise.all(
    accounts.map(async (acc) => {
      const bal = await accountBalance(acc.id);
      return { ...acc, balance: bal };
    })
  );

  return (
    <div className="px-6 pt-8 pb-10">
      <AccountsClient
        accounts={accountsWithBalances}
        netWorthValue={netWorthVal}
        currencySymbol={settings.currency_symbol}
      />
    </div>
  );
}
