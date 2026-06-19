'use client';

import { useState } from 'react';
import { Goal } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { Target, Trash2, Award, Plus, Sparkles } from 'lucide-react';
import Modal from './Modal';

interface GoalCardProps {
  goal: Goal;
  currencySymbol: string;
  onDelete: (goalId: number) => void;
  onUpdateProgress: (goalId: number, currentMinor: number) => Promise<void>;
}

export default function GoalCard({
  goal,
  currencySymbol,
  onDelete,
  onUpdateProgress,
}: GoalCardProps) {
  const [showAddSavings, setShowAddSavings] = useState(false);
  const [savingsAmount, setSavingsAmount] = useState('');
  const [updating, setUpdating] = useState(false);

  const pct = goal.target_amount_minor > 0 ? (goal.current_amount_minor / goal.target_amount_minor) * 100 : 0;
  const isAchieved = goal.current_amount_minor >= goal.target_amount_minor;

  const handleDelete = () => {
    if (window.confirm(`Delete savings goal "${goal.name}"?`)) {
      onDelete(goal.id);
    }
  };

  const handleAddSavingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(savingsAmount);
    if (isNaN(parsed) || parsed <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    setUpdating(true);
    try {
      const addedMinor = Math.round(parsed * 100);
      const newTotalMinor = goal.current_amount_minor + addedMinor;
      await onUpdateProgress(goal.id, newTotalMinor);
      setSavingsAmount('');
      setShowAddSavings(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update savings.');
    } finally {
      setUpdating(false);
    }
  };

  const formattedDeadline = goal.deadline
    ? format(new Date(goal.deadline), 'MMM d, yyyy')
    : null;

  return (
    <div className="bg-white rounded-2xl border border-border p-4 shadow-sm flex flex-col gap-4 relative group hover:border-border-mid transition-all">
      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute top-3 right-3 text-muted hover:text-expense opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full cursor-pointer hover:bg-bg"
      >
        <Trash2 size={12} />
      </button>

      {/* Top Section */}
      <div className="flex items-start justify-between pr-6 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            style={{ backgroundColor: `${goal.color}15`, color: goal.color }}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          >
            <Target size={16} />
          </div>
          <div className="min-w-0">
            <h4 className="text-[13px] font-extrabold text-dark truncate">
              {goal.name}
            </h4>
            {formattedDeadline && (
              <span className="text-[9px] text-muted font-bold block mt-0.5">
                Target: {formattedDeadline}
              </span>
            )}
          </div>
        </div>

        {/* Achieved Badge */}
        {isAchieved ? (
          <span className="flex items-center gap-0.5 text-[8px] font-black uppercase text-income bg-income/10 px-2 py-1 rounded-full border border-income/10">
            <Award size={10} />
            Achieved!
          </span>
        ) : (
          <button
            onClick={() => setShowAddSavings(true)}
            className="flex items-center gap-0.5 bg-teal/10 hover:bg-teal/20 text-teal text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full border border-teal/10 cursor-pointer active:scale-95 transition-all"
          >
            <Plus size={10} className="stroke-[3px]" />
            Add Savings
          </button>
        )}
      </div>

      {/* Amount Display */}
      <div>
        <span className="text-[20px] font-black text-teal">
          {formatCurrency(goal.current_amount_minor, currencySymbol)}
        </span>
        <span className="text-[12px] text-muted font-semibold ml-1.5">
          of {formatCurrency(goal.target_amount_minor, currencySymbol)}
        </span>
      </div>

      {/* Fish-Tank Progress Bar */}
      <div className="flex flex-col gap-1.5">
        <div className="w-full h-5 bg-border rounded-full relative overflow-hidden border border-border">
          {/* Progress fill */}
          <div
            style={{ width: `${Math.min(100, pct)}%` }}
            className="h-full bg-teal/20 rounded-full transition-all duration-300 absolute left-0 top-0"
          />

          {/* Swimming Fish (only visible if goal is not achieved yet) */}
          {pct > 0 && pct < 100 && (
            <div
              style={{ left: `${Math.min(96, Math.max(4, pct))}%` }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-[12px] transition-all duration-300 pointer-events-none select-none"
            >
              🐟
            </div>
          )}

          {/* Sparkles / Trophy if achieved */}
          {isAchieved && (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-teal animate-pulse">
              🎉 GOAL COMPLETED! 🎉
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[9px] font-black text-muted uppercase tracking-wider px-1">
          <span>{pct.toFixed(0)}% saved</span>
          {isAchieved && (
            <span className="text-income flex items-center gap-0.5">
              <Sparkles size={9} />
              Well done!
            </span>
          )}
        </div>
      </div>

      {/* Add Savings Modal */}
      {showAddSavings && (
        <Modal
          isOpen={showAddSavings}
          onClose={() => setShowAddSavings(false)}
          title={`Save towards: ${goal.name}`}
        >
          <form onSubmit={handleAddSavingsSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wide">
                Amount to Add ({currencySymbol})
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={savingsAmount}
                onChange={(e) => {
                  let clean = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = clean.split('.');
                  if (parts.length > 2) clean = parts[0] + '.' + parts.slice(1).join('');
                  if (parts[1] && parts[1].length > 2) clean = parts[0] + '.' + parts[1].substring(0, 2);
                  setSavingsAmount(clean);
                }}
                className="w-full bg-bg border-2 border-border focus:border-teal rounded-2xl px-4 py-3 text-[14px] font-semibold text-dark outline-none transition-colors"
                placeholder="0.00"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full bg-teal text-white py-3.5 rounded-2xl font-extrabold text-[14px] shadow-sm hover:bg-teal-light cursor-pointer disabled:opacity-50 mt-2"
            >
              {updating ? 'SAVING...' : 'ADD TO SAVINGS'}
            </button>
          </form>
        </Modal>
      )}

    </div>
  );
}
