'use client';

import { createElement } from 'react';
import { Budget, Category } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Trash2, AlertCircle } from 'lucide-react';
import { getCategoryIcon } from '@/lib/categoryIcons';

interface BudgetCardProps {
  budget: Budget;
  spentMinor: number;
  remaining: number;
  pct: number;
  category: Category;
  currencySymbol: string;
  onDelete: (budgetId: number) => void;
}

export default function BudgetCard({
  budget,
  spentMinor,
  remaining,
  pct,
  category,
  currencySymbol,
  onDelete,
}: BudgetCardProps) {
  // Determine progress bar color
  let barColorClass = 'bg-income'; // Green
  if (pct >= 100) {
    barColorClass = 'bg-expense'; // Red
  } else if (pct >= 80) {
    barColorClass = 'bg-warning'; // Yellow
  }

  const isOverBudget = pct >= 100;

  const handleDelete = () => {
    if (window.confirm(`Delete monthly budget for "${category.name}"?`)) {
      onDelete(budget.id);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-4 shadow-sm flex flex-col gap-3 relative group hover:border-border-mid transition-all">
      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute top-3 right-3 text-muted hover:text-expense opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full cursor-pointer hover:bg-bg"
      >
        <Trash2 size={12} />
      </button>

      {/* Header Info */}
      <div className="flex items-center justify-between min-w-0 pr-6">
        <div className="flex items-center gap-2 min-w-0">
          <div
            style={{ backgroundColor: `${category.color}15`, color: category.color }}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          >
            {createElement(getCategoryIcon(category.icon), { size: 15 })}
          </div>
          <span className="text-[13px] font-black text-dark truncate">
            {category.name}
          </span>
        </div>
        
        <div className="text-[11px] font-extrabold text-right">
          <span className="text-dark">
            {formatCurrency(spentMinor, currencySymbol)}
          </span>
          <span className="text-muted mx-0.5">/</span>
          <span className="text-muted">
            {formatCurrency(budget.amount_minor, currencySymbol)}
          </span>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="flex flex-col gap-1.5">
        <div className="w-full h-2 bg-bg rounded-full overflow-hidden border border-border">
          <div
            style={{ width: `${Math.min(100, pct)}%` }}
            className={`h-full rounded-full transition-all duration-300 ${barColorClass}`}
          />
        </div>
        
        {/* Helper Footer text */}
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider">
          {isOverBudget ? (
            <span className="text-expense flex items-center gap-0.5 font-black">
              <AlertCircle size={9} />
              Over Budget by {formatCurrency(Math.abs(remaining), currencySymbol)}
            </span>
          ) : (
            <span className="text-muted">
              {formatCurrency(remaining, currencySymbol)} remaining
            </span>
          )}
          
          <span className="text-muted text-right">
            {pct.toFixed(0)}% spent
          </span>
        </div>
      </div>

    </div>
  );
}
