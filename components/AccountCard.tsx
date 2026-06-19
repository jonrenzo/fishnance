'use client';

import Link from 'next/link';
import BrandLogo from './BrandLogo';
import { Account } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface AccountCardProps {
  account: Account & { balance: number };
  currencySymbol: string;
  showBalances: boolean;
}

export default function AccountCard({
  account,
  currencySymbol,
  showBalances,
}: AccountCardProps) {
  const isLiability = account.is_liability;
  const balanceVal = account.balance;

  const typeLabels: Record<string, string> = {
    cash: 'Cash',
    bank: 'Bank',
    ewallet: 'E-Wallet',
    credit: 'Credit Card',
    savings: 'Savings',
  };

  return (
    <Link
      href={`/account/${account.id}`}
      style={{ backgroundColor: account.color }}
      className="rounded-2xl p-4 flex flex-col justify-between h-[104px] text-white shadow-sm hover:scale-[1.02] active:scale-98 transition-all duration-200 cursor-pointer"
    >
      {/* Top Row */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="bg-white/95 rounded-full p-0.5 flex-shrink-0">
          <BrandLogo logoKey={account.logo_key} size={28} />
        </div>
        <div className="min-w-0 flex flex-col">
          <span className="text-[13px] font-black leading-tight truncate">
            {account.name}
          </span>
          <span className="text-[9px] text-white/70 font-bold uppercase tracking-wider leading-none mt-0.5">
            {typeLabels[account.type] || 'Wallet'}
          </span>
        </div>
      </div>

      {/* Bottom Balance */}
      <div className="flex flex-col">
        <span className="text-[8px] text-white/60 font-black uppercase tracking-widest leading-none">
          {isLiability ? 'Amount Owed' : 'Balance'}
        </span>
        <span className="text-[17px] font-black leading-tight mt-1 truncate">
          {showBalances
            ? formatCurrency(balanceVal, currencySymbol)
            : '••••••'}
        </span>
      </div>
    </Link>
  );
}
