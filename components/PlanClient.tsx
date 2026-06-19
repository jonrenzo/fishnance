'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bill, Budget, Goal, Category, Account } from '@/types';
import {
  actionCreateBill,
  actionDeleteBill,
  actionMarkBillPaid,
  actionCreateBudget,
  actionDeleteBudget,
  actionCreateGoal,
  actionDeleteGoal,
  actionUpdateGoalProgress,
} from '@/lib/actions';
import { formatCurrency } from '@/lib/utils';
import BillCard from './BillCard';
import BudgetCard from './BudgetCard';
import GoalCard from './GoalCard';
import Modal from './Modal';
import CategoryChip from './CategoryChip';
import BrandLogo from './BrandLogo';
import { Plus, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface PlanClientProps {
  bills: Bill[];
  budgets: (Budget & { spentMinor: number; remaining: number; pct: number })[];
  goals: Goal[];
  categories: Category[];
  parentCategories: Category[];
  accounts: Account[];
  currencySymbol: string;
}

export default function PlanClient({
  bills,
  budgets,
  goals,
  categories,
  parentCategories,
  accounts,
  currencySymbol,
}: PlanClientProps) {
  const router = useRouter();

  // Modals visibility states
  const [showBillModal, setShowBillModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showPayBillModal, setShowPayBillModal] = useState(false);

  // Active item for Pay Bill modal
  const [activeBill, setActiveBill] = useState<Bill | null>(null);

  // Form states - Bill
  const [billName, setBillName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billDueDate, setBillDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [billRecurrence, setBillRecurrence] = useState<'none' | 'weekly' | 'monthly'>('none');
  const [billCategoryId, setBillCategoryId] = useState<number | null>(null);

  // Form states - Budget
  const [budgetCategoryId, setBudgetCategoryId] = useState<number | null>(null);
  const [budgetLimit, setBudgetLimit] = useState('');

  // Form states - Goal
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('0.00');
  const [goalDeadline, setGoalDeadline] = useState('');

  const [loading, setLoading] = useState(false);

  // Handlers - Bill
  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billName.trim()) return alert('Please enter a bill name.');
    const parsed = parseFloat(billAmount);
    if (isNaN(parsed) || parsed <= 0) return alert('Please enter a valid amount.');

    setLoading(true);
    try {
      await actionCreateBill({
        name: billName.trim(),
        amount_minor: Math.round(parsed * 100),
        due_date: new Date(billDueDate).getTime(),
        recurrence: billRecurrence,
        category_id: billCategoryId,
      });
      // Reset form
      setBillName('');
      setBillAmount('');
      setBillDueDate(format(new Date(), 'yyyy-MM-dd'));
      setBillRecurrence('none');
      setBillCategoryId(null);
      setShowBillModal(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to create bill.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBill = async (billId: number) => {
    try {
      await actionDeleteBill(billId);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to delete bill.');
    }
  };

  const handlePayBillClick = (bill: Bill) => {
    setActiveBill(bill);
    setShowPayBillModal(true);
  };

  const handleConfirmPayBill = async (accountId: number) => {
    if (!activeBill) return;
    setLoading(true);
    try {
      await actionMarkBillPaid(activeBill.id, accountId);
      setShowPayBillModal(false);
      setActiveBill(null);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to record payment.');
    } finally {
      setLoading(false);
    }
  };

  // Handlers - Budget
  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetCategoryId) return alert('Please select a category.');
    const parsed = parseFloat(budgetLimit);
    if (isNaN(parsed) || parsed <= 0) return alert('Please enter a valid limit.');

    setLoading(true);
    try {
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      await actionCreateBudget(budgetCategoryId, Math.round(parsed * 100), year, month);
      
      setBudgetCategoryId(null);
      setBudgetLimit('');
      setShowBudgetModal(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to save budget.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = async (budgetId: number) => {
    try {
      await actionDeleteBudget(budgetId);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to delete budget.');
    }
  };

  // Handlers - Goal
  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim()) return alert('Please enter a goal name.');
    const targetParsed = parseFloat(goalTarget);
    if (isNaN(targetParsed) || targetParsed <= 0) return alert('Please enter a valid target amount.');
    const currentParsed = parseFloat(goalCurrent || '0');

    setLoading(true);
    try {
      await actionCreateGoal({
        name: goalName.trim(),
        target_amount_minor: Math.round(targetParsed * 100),
        current_amount_minor: Math.round(currentParsed * 100),
        deadline: goalDeadline ? new Date(goalDeadline).getTime() : null,
        color: '#F97B5A',
        icon: 'target',
      });

      setGoalName('');
      setGoalTarget('');
      setGoalCurrent('0.00');
      setGoalDeadline('');
      setShowGoalModal(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to create savings goal.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId: number) => {
    try {
      await actionDeleteGoal(goalId);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to delete goal.');
    }
  };

  const handleUpdateGoalProgress = async (goalId: number, newTotalMinor: number) => {
    await actionUpdateGoalProgress(goalId, newTotalMinor);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Page Title */}
      <div>
        <h1 className="text-[28px] font-black tracking-tight text-dark leading-none">
          Plan
        </h1>
        <p className="text-[13px] text-muted font-semibold mt-1">
          Bills, budgets, and savings goals
        </p>
      </div>

      {/* --- SECTION 1: BILLS --- */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-border pb-1">
          <div>
            <h2 className="text-[15px] font-black text-dark uppercase tracking-wide">
              Bills
            </h2>
            <span className="text-[9px] text-muted font-bold block mt-0.5 uppercase tracking-wider">
              Things you need to pay
            </span>
          </div>
          <button
            onClick={() => setShowBillModal(true)}
            className="flex items-center gap-1 text-[11px] font-extrabold text-[#F97B5A] bg-[#F97B5A]/10 border border-[#F97B5A]/10 px-2.5 py-1 rounded-full cursor-pointer active:scale-95 transition-all"
          >
            <Plus size={12} className="stroke-[3.5px]" />
            <span>Add Bill</span>
          </button>
        </div>

        {bills.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-border text-center text-muted text-[12px] font-semibold shadow-sm">
            No active bills. Add one to track upcoming expenses.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {bills.map((bill) => {
              const cat = categories.find((c) => c.id === bill.category_id);
              return (
                <BillCard
                  key={bill.id}
                  bill={bill}
                  category={cat}
                  currencySymbol={currencySymbol}
                  onPay={handlePayBillClick}
                  onDelete={handleDeleteBill}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* --- SECTION 2: BUDGETS --- */}
      <div className="flex flex-col gap-3 mt-1">
        <div className="flex items-center justify-between border-b border-border pb-1">
          <div>
            <h2 className="text-[15px] font-black text-dark uppercase tracking-wide">
              Monthly Budgets
            </h2>
            <span className="text-[9px] text-muted font-bold block mt-0.5 uppercase tracking-wider">
              Spend limits for {format(new Date(), 'MMMM yyyy')}
            </span>
          </div>
          <button
            onClick={() => setShowBudgetModal(true)}
            className="flex items-center gap-1 text-[11px] font-extrabold text-teal bg-teal/10 border border-teal/10 px-2.5 py-1 rounded-full cursor-pointer active:scale-95 transition-all"
          >
            <Plus size={12} className="stroke-[3.5px]" />
            <span>Add Limit</span>
          </button>
        </div>

        {budgets.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-border text-center text-muted text-[12px] font-semibold shadow-sm">
            No spend budgets set for this month.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {budgets.map((b) => {
              const cat = categories.find((c) => c.id === b.category_id);
              if (!cat) return null;
              return (
                <BudgetCard
                  key={b.id}
                  budget={b}
                  spentMinor={b.spentMinor}
                  remaining={b.remaining}
                  pct={b.pct}
                  category={cat}
                  currencySymbol={currencySymbol}
                  onDelete={handleDeleteBudget}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* --- SECTION 3: SAVINGS GOALS --- */}
      <div className="flex flex-col gap-3 mt-1">
        <div className="flex items-center justify-between border-b border-border pb-1">
          <div>
            <h2 className="text-[15px] font-black text-dark uppercase tracking-wide">
              Savings Goals
            </h2>
            <span className="text-[9px] text-muted font-bold block mt-0.5 uppercase tracking-wider">
              Track your savings achievements
            </span>
          </div>
          <button
            onClick={() => setShowGoalModal(true)}
            className="flex items-center gap-1 text-[11px] font-extrabold text-[#F97B5A] bg-[#F97B5A]/10 border border-[#F97B5A]/10 px-2.5 py-1 rounded-full cursor-pointer active:scale-95 transition-all"
          >
            <Plus size={12} className="stroke-[3.5px]" />
            <span>Add Goal</span>
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-border text-center text-muted text-[12px] font-semibold shadow-sm">
            No savings goals set yet.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                currencySymbol={currencySymbol}
                onDelete={handleDeleteGoal}
                onUpdateProgress={handleUpdateGoalProgress}
              />
            ))}
          </div>
        )}
      </div>

      {/* --- MODAL 1: ADD BILL --- */}
      {showBillModal && (
        <Modal
          isOpen={showBillModal}
          onClose={() => setShowBillModal(false)}
          title="Create Bill Reminder"
        >
          <form onSubmit={handleCreateBill} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wide">
                Bill Name
              </label>
              <input
                type="text"
                value={billName}
                onChange={(e) => setBillName(e.target.value)}
                className="w-full bg-bg border-2 border-border focus:border-teal rounded-2xl px-4 py-3 text-[14px] font-semibold text-dark outline-none transition-colors"
                placeholder="Rent, Electric, Spotify..."
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wide">
                Amount ({currencySymbol})
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={billAmount}
                onChange={(e) => {
                  let clean = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = clean.split('.');
                  if (parts.length > 2) clean = parts[0] + '.' + parts.slice(1).join('');
                  if (parts[1] && parts[1].length > 2) clean = parts[0] + '.' + parts[1].substring(0, 2);
                  setBillAmount(clean);
                }}
                className="w-full bg-bg border-2 border-border focus:border-teal rounded-2xl px-4 py-3 text-[14px] font-semibold text-dark outline-none transition-colors"
                placeholder="0.00"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wide">
                Due Date
              </label>
              <input
                type="date"
                value={billDueDate}
                onChange={(e) => setBillDueDate(e.target.value)}
                className="w-full bg-bg border-2 border-border focus:border-teal rounded-2xl px-4 py-3 text-[14px] font-semibold text-dark outline-none transition-colors"
                required
              />
            </div>

            {/* Recurrence Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wide">
                Recurrence
              </label>
              <div className="flex gap-2">
                {(['none', 'weekly', 'monthly'] as const).map((rec) => (
                  <button
                    key={rec}
                    type="button"
                    onClick={() => setBillRecurrence(rec)}
                    className={`flex-1 py-2.5 rounded-full border-2 text-[11px] font-extrabold transition-all cursor-pointer ${
                      billRecurrence === rec
                        ? 'border-teal bg-teal/5 text-teal shadow-sm'
                        : 'border-border bg-bg text-muted hover:border-border-mid'
                    }`}
                  >
                    {rec === 'none' ? 'One-off' : rec.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Category select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wide">
                Category (Optional)
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {parentCategories.map((cat) => (
                  <CategoryChip
                    key={cat.id}
                    category={cat}
                    isActive={billCategoryId === cat.id}
                    onClick={() =>
                      setBillCategoryId(billCategoryId === cat.id ? null : cat.id)
                    }
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal text-white py-3.5 rounded-2xl font-extrabold text-[14px] shadow-sm hover:bg-teal-light cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? 'SAVING...' : 'CREATE BILL REMINDER'}
            </button>
          </form>
        </Modal>
      )}

      {/* --- MODAL 2: ADD BUDGET --- */}
      {showBudgetModal && (
        <Modal
          isOpen={showBudgetModal}
          onClose={() => setShowBudgetModal(false)}
          title="Create Spend Limit"
        >
          <form onSubmit={handleCreateBudget} className="flex flex-col gap-4">
            {/* Category Select Chips */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wide">
                Select Expense Category
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-5 px-5">
                {parentCategories.map((cat) => (
                  <CategoryChip
                    key={cat.id}
                    category={cat}
                    isActive={budgetCategoryId === cat.id}
                    onClick={() => setBudgetCategoryId(cat.id)}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wide">
                Monthly Limit ({currencySymbol})
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={budgetLimit}
                onChange={(e) => {
                  let clean = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = clean.split('.');
                  if (parts.length > 2) clean = parts[0] + '.' + parts.slice(1).join('');
                  if (parts[1] && parts[1].length > 2) clean = parts[0] + '.' + parts[1].substring(0, 2);
                  setBudgetLimit(clean);
                }}
                className="w-full bg-bg border-2 border-border focus:border-teal rounded-2xl px-4 py-3 text-[14px] font-semibold text-dark outline-none transition-colors"
                placeholder="0.00"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal text-white py-3.5 rounded-2xl font-extrabold text-[14px] shadow-sm hover:bg-teal-light cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? 'SAVING...' : 'SAVE BUDGET LIMIT'}
            </button>
          </form>
        </Modal>
      )}

      {/* --- MODAL 3: ADD GOAL --- */}
      {showGoalModal && (
        <Modal
          isOpen={showGoalModal}
          onClose={() => setShowGoalModal(false)}
          title="Create Savings Goal"
        >
          <form onSubmit={handleCreateGoal} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wide">
                Goal Name
              </label>
              <input
                type="text"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                className="w-full bg-bg border-2 border-border focus:border-teal rounded-2xl px-4 py-3 text-[14px] font-semibold text-dark outline-none transition-colors"
                placeholder="New Phone, Travel, Emergency..."
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wide">
                Target Amount ({currencySymbol})
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={goalTarget}
                onChange={(e) => {
                  let clean = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = clean.split('.');
                  if (parts.length > 2) clean = parts[0] + '.' + parts.slice(1).join('');
                  if (parts[1] && parts[1].length > 2) clean = parts[0] + '.' + parts[1].substring(0, 2);
                  setGoalTarget(clean);
                }}
                className="w-full bg-bg border-2 border-border focus:border-teal rounded-2xl px-4 py-3 text-[14px] font-semibold text-dark outline-none transition-colors"
                placeholder="0.00"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wide">
                Initial Saved Amount ({currencySymbol})
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={goalCurrent}
                onChange={(e) => {
                  let clean = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = clean.split('.');
                  if (parts.length > 2) clean = parts[0] + '.' + parts.slice(1).join('');
                  if (parts[1] && parts[1].length > 2) clean = parts[0] + '.' + parts[1].substring(0, 2);
                  setGoalCurrent(clean);
                }}
                className="w-full bg-bg border-2 border-border focus:border-teal rounded-2xl px-4 py-3 text-[14px] font-semibold text-dark outline-none transition-colors"
                placeholder="0.00"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wide">
                Target Date (Optional)
              </label>
              <input
                type="date"
                value={goalDeadline}
                onChange={(e) => setGoalDeadline(e.target.value)}
                className="w-full bg-bg border-2 border-border focus:border-teal rounded-2xl px-4 py-3 text-[14px] font-semibold text-dark outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal text-white py-3.5 rounded-2xl font-extrabold text-[14px] shadow-sm hover:bg-teal-light cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? 'SAVING...' : 'SAVE SAVINGS GOAL'}
            </button>
          </form>
        </Modal>
      )}

      {/* --- MODAL 4: PAY BILL SELECTOR --- */}
      {showPayBillModal && activeBill && (
        <Modal
          isOpen={showPayBillModal}
          onClose={() => {
            setShowPayBillModal(false);
            setActiveBill(null);
          }}
          title={`Pay Bill: ${activeBill.name}`}
        >
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[12px] text-muted font-semibold">
                Amount to pay is <span className="font-extrabold text-dark">{formatCurrency(activeBill.amount_minor, currencySymbol)}</span>. Select a wallet to pay from:
              </p>
            </div>

            <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-1">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => handleConfirmPayBill(acc.id)}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border-2 border-border hover:border-teal/30 bg-white transition-all cursor-pointer text-left disabled:opacity-50 active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <BrandLogo logoKey={acc.logo_key} size={28} />
                    <span className="font-extrabold text-[14px] text-dark truncate">
                      {acc.name}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-muted" />
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
