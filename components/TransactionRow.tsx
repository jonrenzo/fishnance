'use client';

import { createElement } from 'react';
import { Transaction, Account, Category } from '@/types';
import { getCategoryIcon } from '@/lib/categoryIcons';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface TransactionRowProps {
  transaction: Transaction;
  account?: Account | null;
  toAccount?: Account | null;
  category?: Category | null;
  currencySymbol?: string;
  currentAccountId?: number; // Optional context: if we are inside a specific account details page
}

export default function TransactionRow({
  transaction,
  account,
  toAccount,
  category,
  currencySymbol = '₱',
  currentAccountId,
}: TransactionRowProps) {
  const isTransfer = transaction.type === 'transfer';
  const isExpense = transaction.type === 'expense';
  const isIncome = transaction.type === 'income';

  // Determine if outflow relative to current context or transaction source
  // If we are looking at a specific account's detail, and it is a transfer to this account, it is an INFLOW.
  // Otherwise, transfers OUT of this account are OUTFLOWS.
  let isOutflow = isExpense;
  if (isTransfer) {
    if (currentAccountId) {
      isOutflow = transaction.account_id === currentAccountId;
    } else {
      isOutflow = true; // default on Home page: transfers are shown relative to the source account
    }
  }

  // Display Name
  let displayName = transaction.note || '';
  if (!displayName) {
    if (isTransfer) {
      displayName = toAccount
        ? `To ${toAccount.name}`
        : account
        ? `From ${account.name}`
        : 'Transfer';
    } else if (category) {
      displayName = category.name;
    } else {
      displayName = transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1);
    }
  }

  // Display Amount Formatting
  let amountStr = '';
  let amountColorClass = '';
  if (isIncome) {
    amountStr = `+${formatCurrency(transaction.amount_minor, currencySymbol)}`;
    amountColorClass = 'text-income';
  } else if (isExpense) {
    amountStr = `-${formatCurrency(transaction.amount_minor, currencySymbol)}`;
    amountColorClass = 'text-expense';
  } else {
    // Transfer: format prefix depending on whether it's inflow or outflow
    if (isOutflow) {
      amountStr = `-${formatCurrency(transaction.amount_minor, currencySymbol)}`;
      amountColorClass = 'text-dark';
    } else {
      amountStr = `+${formatCurrency(transaction.amount_minor, currencySymbol)}`;
      amountColorClass = 'text-income';
    }
  }

  // Render Left Icon
  const renderIcon = () => {
    if (isTransfer) {
      return (
        <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center text-teal">
          <ArrowLeftRight size={18} />
        </div>
      );
    }
    
    if (category) {
      return (
        <div
          style={{ backgroundColor: `${category.color}18`, color: category.color }}
          className="w-10 h-10 rounded-full flex items-center justify-center"
        >
          {createElement(getCategoryIcon(category.icon), { size: 18 })}
        </div>
      );
    }

    return (
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isIncome ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'
        }`}
      >
        {isIncome ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
      </div>
    );
  };

  return (
    <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-border hover:border-border-mid transition-all shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        {renderIcon()}
        <div className="min-w-0">
          <h4 className="text-[13px] font-extrabold text-dark truncate">
            {displayName}
          </h4>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted font-bold">
            {/* Category/Type Pill */}
            {isTransfer ? (
              <span className="bg-teal/10 text-teal px-1.5 py-0.5 rounded-full text-[9px] uppercase tracking-wide">
                Transfer
              </span>
            ) : category ? (
              <span
                style={{ backgroundColor: `${category.color}15`, color: category.color }}
                className="px-1.5 py-0.5 rounded-full text-[9px] uppercase tracking-wide"
              >
                {category.name}
              </span>
            ) : null}
            
            {/* Account & Date */}
            <span className="truncate max-w-[80px]">
              {account?.name}
              {isTransfer && toAccount && ` → ${toAccount.name}`}
            </span>
            <span>•</span>
            <span>{format(new Date(transaction.date), 'MMM d')}</span>
          </div>
        </div>
      </div>

      <div className={`text-[14px] font-black text-right ${amountColorClass}`}>
        {amountStr}
      </div>
    </div>
  );
}
