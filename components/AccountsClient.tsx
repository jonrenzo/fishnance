'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Account } from '@/types';
import AccountCard from './AccountCard';
import { formatCurrency } from '@/lib/utils';
import { Eye, EyeOff, Plus } from 'lucide-react';

interface AccountsClientProps {
  accounts: (Account & { balance: number })[];
  netWorthValue: number;
  currencySymbol: string;
}

type FilterType = 'all' | 'assets' | 'liabilities';

export default function AccountsClient({
  accounts,
  netWorthValue,
  currencySymbol,
}: AccountsClientProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [showBalances, setShowBalances] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Load showBalances preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('fishnance_show_balances');
    const timer = setTimeout(() => {
      if (stored !== null) {
        setShowBalances(stored === 'true');
      }
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleShowBalances = () => {
    const nextVal = !showBalances;
    setShowBalances(nextVal);
    localStorage.setItem('fishnance_show_balances', String(nextVal));
  };

  // Group accounts by type
  const activeAccounts = accounts.filter((a) => !a.archived);

  // Calculate totals
  const assetAccounts = activeAccounts.filter((a) => !a.is_liability);
  const liabilityAccounts = activeAccounts.filter((a) => a.is_liability);

  const totalAssets = assetAccounts.reduce((acc, a) => acc + a.balance, 0);
  const totalLiabilities = liabilityAccounts.reduce((acc, a) => acc + a.balance, 0);

  // Apply filters to list
  const filteredAccounts = activeAccounts.filter((a) => {
    if (filter === 'assets') return !a.is_liability;
    if (filter === 'liabilities') return a.is_liability;
    return true;
  });

  // Grouping configuration
  const groupsConfig = [
    { type: 'cash', label: 'Cash & Wallets', accounts: filteredAccounts.filter((a) => a.type === 'cash') },
    { type: 'bank', label: 'Banks', accounts: filteredAccounts.filter((a) => a.type === 'bank') },
    { type: 'ewallet', label: 'E-Wallets', accounts: filteredAccounts.filter((a) => a.type === 'ewallet') },
    { type: 'savings', label: 'Savings & Deposits', accounts: filteredAccounts.filter((a) => a.type === 'savings') },
    { type: 'credit', label: 'Credit Cards & Liabilities', accounts: filteredAccounts.filter((a) => a.type === 'credit') },
  ];

  if (!mounted) {
    // SSR loading skeleton placeholder to prevent layout shifts
    return (
      <div className="flex flex-col gap-6">
        <div className="bg-white rounded-3xl p-6 border border-border shadow-md animate-pulse h-48" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-black tracking-tight text-dark leading-none">
            Accounts
          </h1>
          <p className="text-[13px] text-muted font-semibold mt-1">
            Manage your wallets and balances
          </p>
        </div>
        <Link
          href="/account/new"
          className="flex items-center gap-1.5 bg-teal text-white px-4 py-2.5 rounded-full text-[13px] font-extrabold shadow-md hover:bg-teal-light cursor-pointer active:scale-95 transition-all"
        >
          <Plus size={16} className="stroke-[3.5px]" />
          <span>Add</span>
        </Link>
      </div>

      {/* Net Worth Hero Card */}
      <div className="bg-white rounded-3xl p-5 border border-border shadow-sm flex flex-col gap-5 relative">
        {/* Toggle Balance Visibility Eye Icon */}
        <button
          onClick={toggleShowBalances}
          className="absolute top-5 right-5 text-muted hover:text-dark p-1 rounded-full bg-bg border border-border cursor-pointer transition-colors"
        >
          {showBalances ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>

        <div>
          <span className="text-[9px] font-black text-muted uppercase tracking-widest block">
            Net Worth
          </span>
          <h2 className="text-[30px] font-black text-dark mt-1 leading-tight tracking-tight truncate max-w-[280px]">
            {showBalances ? formatCurrency(netWorthValue, currencySymbol) : '••••••'}
          </h2>
          <span className="text-[11px] text-muted font-semibold mt-1 block">
            Assets minus liabilities
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-bg border border-border p-1 rounded-full w-full">
          {([
            { id: 'all', label: 'All' },
            { id: 'assets', label: 'Assets' },
            { id: 'liabilities', label: 'Liabilities' },
          ] as const).map((tab) => {
            const isActive = tab.id === filter;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`flex-1 text-center py-2 text-[11px] font-extrabold rounded-full transition-all duration-200 cursor-pointer ${
                  isActive ? 'bg-teal text-white shadow-sm' : 'text-muted hover:text-dark'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Assets & Liabilities Totals footer */}
        <div className="flex items-center justify-between border-t border-border pt-4 mt-1">
          <div className="flex-1 text-center">
            <span className="text-[8px] font-black text-muted uppercase tracking-wider block">
              Assets
            </span>
            <span className="text-[15px] font-extrabold text-dark block mt-0.5">
              {showBalances ? formatCurrency(totalAssets, currencySymbol) : '••••'}
            </span>
          </div>

          <div className="w-px h-8 bg-border-mid" />

          <div className="flex-1 text-center">
            <span className="text-[8px] font-black text-muted uppercase tracking-wider block">
              Liabilities
            </span>
            <span className="text-[15px] font-extrabold text-expense block mt-0.5">
              {showBalances ? formatCurrency(totalLiabilities, currencySymbol) : '••••'}
            </span>
          </div>
        </div>

      </div>

      {/* Account Type Groups */}
      <div className="flex flex-col gap-5 mt-2">
        {groupsConfig.map((group) => {
          if (group.accounts.length === 0) return null;

          const groupTotal = group.accounts.reduce((sum, a) => sum + a.balance, 0);
          const isGroupLiability = group.type === 'credit';
          const subtotalClass = isGroupLiability ? 'text-expense' : 'text-teal';

          return (
            <div key={group.type} className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-border pb-1 px-1">
                <h3 className="text-[13px] font-black text-dark uppercase tracking-wider">
                  {group.label}
                </h3>
                <span className={`text-[12px] font-black ${subtotalClass}`}>
                  {showBalances ? formatCurrency(groupTotal, currencySymbol) : '••••'}
                </span>
              </div>

              {/* 2-Column Grid */}
              <div className="grid grid-cols-2 gap-3">
                {group.accounts.map((acc) => (
                  <AccountCard
                    key={acc.id}
                    account={acc}
                    currencySymbol={currencySymbol}
                    showBalances={showBalances}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
