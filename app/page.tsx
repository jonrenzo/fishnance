import {
  getSettings,
  getAccounts,
  getTransactions,
  getCategories,
  last7DaysSpend,
  incomeExpenseForRange,
  getUpcomingBills,
  accountBalance,
} from '@/lib/queries';
import { nextPayday } from '@/lib/payday';
import { formatCurrency, timeOfDay } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import BarChart from '@/components/BarChart';
import PeriodSpendCard from '@/components/PeriodSpendCard';
import BrandLogo from '@/components/BrandLogo';
import TransactionRow from '@/components/TransactionRow';
import { Fish, Plus, Calendar } from 'lucide-react';

export const revalidate = 0; // Disable static caching so it always fetches fresh data on load

export default async function HomePage() {
  const settings = await getSettings();

  // Redirect to onboarding if not onboarded
  if (!settings || !settings.onboarded) {
    redirect('/onboarding');
  }

  // Fetch data concurrently
  const [
    accounts,
    recentTxs,
    categories,
    chartData,
    dayTotals,
    weekTotals,
    monthTotals,
    upcomingBills,
  ] = await Promise.all([
    getAccounts(false),
    getTransactions(5, 0),
    getCategories(),
    last7DaysSpend(),
    incomeExpenseForRange('day'),
    incomeExpenseForRange('week'),
    incomeExpenseForRange('month'),
    getUpcomingBills(14),
  ]);

  // Fetch balances for accounts
  const accountsWithBalances = await Promise.all(
    accounts.map(async (acc) => {
      const bal = await accountBalance(acc.id);
      return { ...acc, balance: bal };
    })
  );

  // Payday calculation
  const nextPay = nextPayday(settings);
  const daysUntilPayday = nextPay ? Math.max(0, differenceInDays(nextPay, new Date())) : null;

  const headerDateStr = format(new Date(), 'EEEE, MMMM d').toUpperCase();
  const greeting = `Good ${timeOfDay()},`;
  const nameLabel = settings.display_name || 'Fishnance';

  const hasData = accounts.length > 0 || recentTxs.length > 0;

  return (
    <div className="flex flex-col gap-6 px-6 pt-8 pb-10">
      
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[9px] font-black tracking-wide text-muted uppercase">
            {headerDateStr}
          </span>
          <h1 className="text-[26px] font-black leading-tight text-dark mt-0.5">
            {greeting}
            <span className="text-teal block">{nameLabel}!</span>
          </h1>
        </div>

        {/* Payday Card */}
        {daysUntilPayday !== null && (
          <div className="bg-white border border-border rounded-2xl p-3 flex flex-col items-center justify-center min-w-[76px] h-[76px] shadow-sm select-none">
            <span className="text-[26px] font-black text-teal leading-none">
              {daysUntilPayday}
            </span>
            <span className="text-[8px] font-bold text-muted text-center uppercase tracking-wide mt-1.5 leading-tight">
              days to<br />payday
            </span>
          </div>
        )}
      </div>

      {!hasData ? (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 gap-4">
          <div className="w-20 h-20 rounded-full bg-teal/10 flex items-center justify-center text-teal">
            <Fish size={40} />
          </div>
          <div>
            <h2 className="text-[18px] font-extrabold text-dark">Welcome to Fishnance!</h2>
            <p className="text-[12px] text-muted font-semibold mt-1 max-w-xs mx-auto">
              {"You haven't added any transactions or accounts yet. Tap the + button in the bottom navigation bar to get started."}
            </p>
          </div>
        </div>
      ) : (
        /* Dashboard Content */
        <>
          {/* Insights Row */}
          <div className="flex gap-4">
            {/* 7-day Bar Chart Card */}
            <div className="bg-white rounded-2xl p-4 border border-border shadow-sm flex flex-col justify-between flex-1 min-h-[148px]">
              <h3 className="text-[12px] font-black text-muted uppercase tracking-wide">
                Last 7 Days
              </h3>
              <div className="mt-4 flex-1 flex flex-col justify-end">
                <BarChart data={chartData} />
              </div>
            </div>

            {/* Spend Period Card */}
            <PeriodSpendCard
              day={dayTotals}
              week={weekTotals}
              month={monthTotals}
              currencySymbol={settings.currency_symbol}
            />
          </div>

          {/* Upcoming Bills Section */}
          {upcomingBills.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-black text-dark uppercase tracking-wide">
                  Upcoming Bills
                </h2>
                <Link href="/plan" className="text-[12px] font-black text-teal hover:text-teal-dark">
                  See all ›
                </Link>
              </div>

              <div className="flex flex-col gap-2">
                {upcomingBills.slice(0, 3).map((bill) => {
                  const daysLeft = differenceInDays(new Date(bill.due_date), new Date());
                  
                  let badgeColorClass = 'bg-muted/10 text-muted';
                  let badgeText = format(new Date(bill.due_date), 'MMM d');
                  
                  if (daysLeft < 0) {
                    badgeColorClass = 'bg-expense/10 text-expense';
                    badgeText = `Overdue ${Math.abs(daysLeft)}d`;
                  } else if (daysLeft === 0) {
                    badgeColorClass = 'bg-warning/15 text-warning';
                    badgeText = 'Due Today';
                  } else if (daysLeft <= 3) {
                    badgeColorClass = 'bg-warning/15 text-warning';
                    badgeText = `Due in ${daysLeft}d`;
                  }

                  return (
                    <div
                      key={bill.id}
                      className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-border shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center text-warning">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <h4 className="text-[13px] font-extrabold text-dark">{bill.name}</h4>
                          <span className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide mt-1 ${badgeColorClass}`}>
                            {badgeText}
                          </span>
                        </div>
                      </div>
                      <span className="text-[13px] font-black text-dark">
                        {formatCurrency(bill.amount_minor, settings.currency_symbol)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Accounts Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-black text-dark uppercase tracking-wide">
                Accounts
              </h2>
              <Link href="/accounts" className="text-[12px] font-black text-teal hover:text-teal-dark">
                See all ›
              </Link>
            </div>

            {/* Horizontal Scroll row */}
            <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar -mx-6 px-6">
              {accountsWithBalances.map((acc) => {
                const balClass = acc.balance >= 0 ? 'text-teal' : 'text-expense';
                return (
                  <Link
                    key={acc.id}
                    href={`/account/${acc.id}`}
                    className="flex flex-col items-center justify-between bg-white border border-border rounded-2xl p-3 min-w-[100px] h-[104px] text-center shadow-sm hover:border-border-mid transition-all cursor-pointer flex-shrink-0"
                  >
                    <BrandLogo logoKey={acc.logo_key} size={32} />
                    <span className="text-[11px] font-extrabold text-dark truncate w-full mt-1">
                      {acc.name}
                    </span>
                    <span className={`text-[11px] font-black mt-0.5 ${balClass}`}>
                      {formatCurrency(acc.balance, settings.currency_symbol)}
                    </span>
                  </Link>
                );
              })}
              
              {/* Add Account chip */}
              <Link
                href="/account/new"
                className="flex flex-col items-center justify-center border-2 border-dashed border-border-mid bg-teal/[0.02] rounded-2xl p-3 min-w-[100px] h-[104px] text-center hover:bg-teal/[0.04] transition-all cursor-pointer flex-shrink-0"
              >
                <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center text-teal">
                  <Plus size={18} className="stroke-[3px]" />
                </div>
                <span className="text-[11px] font-black text-teal mt-2">Add</span>
              </Link>
            </div>
          </div>

          {/* Recent Transactions Section */}
          {recentTxs.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-[15px] font-black text-dark uppercase tracking-wide">
                Recent Transactions
              </h2>
              <div className="flex flex-col gap-2">
                {recentTxs.map((tx) => {
                  const acc = accounts.find((a) => a.id === tx.account_id);
                  const toAcc = tx.to_account_id
                    ? accounts.find((a) => a.id === tx.to_account_id)
                    : null;
                  const cat = categories.find((c) => c.id === tx.category_id);

                  return (
                    <TransactionRow
                      key={tx.id}
                      transaction={tx}
                      account={acc}
                      toAccount={toAcc}
                      category={cat}
                      currencySymbol={settings.currency_symbol}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}
