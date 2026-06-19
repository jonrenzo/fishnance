'use client';

import { Bill, Category } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { Calendar, Trash2, Repeat } from 'lucide-react';

interface BillCardProps {
  bill: Bill;
  category?: Category | null;
  currencySymbol: string;
  onPay: (bill: Bill) => void;
  onDelete: (billId: number) => void;
}

export default function BillCard({
  bill,
  category,
  currencySymbol,
  onPay,
  onDelete,
}: BillCardProps) {
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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete bill "${bill.name}"?`)) {
      onDelete(bill.id);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-4 shadow-sm flex items-center justify-between relative group hover:border-border-mid transition-all">
      {/* Delete button top right */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 text-muted hover:text-expense opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full cursor-pointer hover:bg-bg"
      >
        <Trash2 size={12} />
      </button>

      <div className="flex items-center gap-3 min-w-0 pr-6">
        <div
          style={{
            backgroundColor: category?.color ? `${category.color}15` : '#F0FDF4',
            color: category?.color || '#22C55E',
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        >
          <Calendar size={18} />
        </div>
        
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-[13px] font-extrabold text-dark truncate">
              {bill.name}
            </h4>
            
            {bill.recurrence !== 'none' && (
              <span className="flex items-center gap-0.5 text-[8px] font-black uppercase text-teal bg-teal/10 px-1 py-0.5 rounded">
                <Repeat size={8} />
                {bill.recurrence}
              </span>
            )}
          </div>
          
          <div className="mt-1 flex items-center gap-2">
            <span className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide ${badgeColorClass}`}>
              {badgeText}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[13px] font-black text-dark text-right">
          {formatCurrency(bill.amount_minor, currencySymbol)}
        </span>
        <button
          onClick={() => onPay(bill)}
          className="bg-teal hover:bg-teal-light text-white text-[11px] font-extrabold px-3 py-2 rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          PAY
        </button>
      </div>
    </div>
  );
}
