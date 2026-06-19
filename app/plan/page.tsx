import {
  getSettings,
  getAccounts,
  getCategories,
  getParentCategories,
  getBills,
  getBudgets,
  getGoals,
  budgetProgress,
} from '@/lib/queries';
import { redirect } from 'next/navigation';
import PlanClient from '@/components/PlanClient';

export const revalidate = 0;

export default async function PlanPage() {
  const settings = await getSettings();
  if (!settings || !settings.onboarded) {
    redirect('/onboarding');
  }

  const [accounts, bills, budgets, goals, categories, parentCategories] = await Promise.all([
    getAccounts(false),
    getBills(false),
    getBudgets(),
    getGoals(),
    getCategories(),
    getParentCategories('expense'),
  ]);

  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;

  const budgetsWithProgress = await Promise.all(
    budgets.map(async (b) => {
      const prog = await budgetProgress(b.category_id, year, month);
      return {
        ...b,
        spentMinor: prog?.spentMinor || 0,
        remaining: prog?.remaining || b.amount_minor,
        pct: prog?.pct || 0,
      };
    })
  );

  return (
    <div className="px-6 pt-8 pb-10">
      <PlanClient
        bills={bills}
        budgets={budgetsWithProgress}
        goals={goals}
        categories={categories}
        parentCategories={parentCategories}
        accounts={accounts}
        currencySymbol={settings.currency_symbol}
      />
    </div>
  );
}
