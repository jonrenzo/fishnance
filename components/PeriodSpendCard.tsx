'use client';

import { useState } from 'react';
import SegmentedToggle from './SegmentedToggle';
import { formatCurrency } from '@/lib/utils';

interface PeriodTotals {
  income: number;
  expense: number;
}

interface PeriodSpendCardProps {
  day: PeriodTotals;
  week: PeriodTotals;
  month: PeriodTotals;
  currencySymbol: string;
}

type PeriodType = 'day' | 'week' | 'month';

export default function PeriodSpendCard({
  day,
  week,
  month,
  currencySymbol,
}: PeriodSpendCardProps) {
  const [period, setPeriod] = useState<PeriodType>('month');

  const currentTotals = {
    day,
    week,
    month,
  }[period];

  const getPeriodLabel = () => {
    if (period === 'day') return 'Today';
    if (period === 'week') return 'This Week';
    return 'This Month';
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-border shadow-sm flex flex-col justify-between flex-1 min-h-[148px]">
      <div>
        <h3 className="text-[12px] font-black text-muted uppercase tracking-wide">
          {getPeriodLabel()}
        </h3>
        <div className="flex flex-col gap-1 mt-1">
          <div className="text-[14px] font-black text-income flex items-center">
            <span className="mr-1">↗</span>
            <span>{formatCurrency(currentTotals.income, currencySymbol)}</span>
          </div>
          <div className="text-[14px] font-black text-expense flex items-center">
            <span className="mr-1">↘</span>
            <span>{formatCurrency(currentTotals.expense, currencySymbol)}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-3">
        <SegmentedToggle
          options={['day', 'week', 'month'] as const}
          value={period}
          onChange={(val) => setPeriod(val)}
          formatLabel={(opt) => opt === 'day' ? 'D' : opt === 'week' ? 'W' : 'M'}
        />
      </div>
    </div>
  );
}
