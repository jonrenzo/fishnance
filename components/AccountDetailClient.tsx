'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Account, Transaction, Category } from '@/types';
import { actionDeleteAccount, actionArchiveAccount, actionUnarchiveAccount } from '@/lib/actions';
import { formatCurrency } from '@/lib/utils';
import BrandLogo from './BrandLogo';
import TransactionRow from './TransactionRow';
import Modal from './Modal';
import { ArrowLeft, Pencil, Trash2, Archive, AlertTriangle, RefreshCw } from 'lucide-react';

interface AccountDetailClientProps {
  account: Account;
  balance: number;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  currencySymbol: string;
  txCount: number;
}

export default function AccountDetailClient({
  account,
  balance,
  transactions,
  categories,
  accounts,
  currencySymbol,
  txCount,
}: AccountDetailClientProps) {
  const router = useRouter();
  
  // Modals / Dialog states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleBack = () => {
    router.push('/accounts');
  };

  const handleEdit = () => {
    router.push(`/account/${account.id}/edit`);
  };

  const handleDeleteClick = async () => {
    if (txCount === 0) {
      const confirmDelete = window.confirm(`Delete empty account "${account.name}"?`);
      if (confirmDelete) {
        setDeleting(true);
        try {
          await actionDeleteAccount(account.id);
          router.push('/accounts');
          router.refresh();
        } catch (err) {
          console.error(err);
          alert('Failed to delete account.');
        } finally {
          setDeleting(false);
        }
      }
    } else {
      setShowDeleteModal(true);
    }
  };

  const handleArchive = async () => {
    setDeleting(true);
    try {
      await actionArchiveAccount(account.id);
      setShowDeleteModal(false);
      router.push('/accounts');
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to archive account.');
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await actionUnarchiveAccount(account.id);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to restore account.');
    } finally {
      setRestoring(false);
    }
  };

  const handleHardDelete = async () => {
    const doubleConfirm = window.confirm(
      `WARNING: This will permanently delete "${account.name}" and all ${txCount} transactions. This cannot be undone. Proceed?`
    );
    if (doubleConfirm) {
      setDeleting(true);
      try {
        await actionDeleteAccount(account.id);
        setShowDeleteModal(false);
        router.push('/accounts');
        router.refresh();
      } catch (err) {
        console.error(err);
        alert('Failed to delete account.');
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <div className="flex flex-col gap-5">
      
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 rounded-full bg-white border border-border text-muted hover:text-dark hover:bg-border transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="font-extrabold text-[15px] text-dark uppercase tracking-wider truncate max-w-[180px]">
            {account.name}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleEdit}
            className="p-2.5 rounded-full bg-white border border-border text-muted hover:text-teal hover:border-teal/30 transition-colors cursor-pointer"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={handleDeleteClick}
            className="p-2.5 rounded-full bg-white border border-border text-muted hover:text-expense hover:border-expense/35 transition-colors cursor-pointer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Archived Banner */}
      {account.archived && (
        <div className="bg-muted/10 border border-border p-3.5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted">
            <Archive size={16} />
            <span className="text-[12px] font-bold">This account is archived.</span>
          </div>
          <button
            onClick={handleRestore}
            disabled={restoring}
            className="flex items-center gap-1 text-[11px] font-extrabold text-teal hover:text-teal-dark cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={11} className={restoring ? 'animate-spin' : ''} />
            <span>Restore</span>
          </button>
        </div>
      )}

      {/* Hero Card */}
      <div
        style={{ backgroundColor: account.color }}
        className="rounded-3xl p-6 text-white shadow-sm flex flex-col gap-6 relative"
      >
        <div className="flex items-center justify-between">
          <div className="bg-white/95 rounded-full p-1">
            <BrandLogo logoKey={account.logo_key} size={44} />
          </div>
          {account.is_liability && (
            <span className="bg-black/25 text-white/90 border border-white/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
              Liability
            </span>
          )}
        </div>

        <div>
          <span className="text-[9px] font-black text-white/60 uppercase tracking-widest block">
            {account.is_liability ? 'Amount Owed' : 'Balance'}
          </span>
          <h2 className="text-[32px] font-black text-white mt-1 leading-tight tracking-tight truncate">
            {formatCurrency(balance, currencySymbol)}
          </h2>
        </div>
      </div>

      {/* Transactions list */}
      <div className="flex flex-col gap-3 mt-1">
        <h3 className="text-[15px] font-black text-dark uppercase tracking-wide px-1">
          Transactions
        </h3>

        {transactions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-border text-center text-muted text-[12px] font-semibold">
            No transactions found for this account.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map((tx) => {
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
                  currencySymbol={currencySymbol}
                  currentAccountId={account.id}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Smart Delete Dialog Bottom Sheet */}
      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Account"
        >
          <div className="flex flex-col gap-5 text-center">
            <div className="w-12 h-12 rounded-full bg-expense/10 flex items-center justify-center text-expense mx-auto">
              <AlertTriangle size={24} />
            </div>
            
            <div>
              <p className="text-[14px] font-bold text-dark">
                {`"${account.name}" has ${txCount} transactions recorded.`}
              </p>
              <p className="text-[12px] text-muted font-semibold mt-1">
                Archiving keeps your transaction history while hiding this account from the wallets list.
              </p>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              {/* Option 1: Archive (Reversible) */}
              <button
                onClick={handleArchive}
                disabled={deleting}
                className="w-full bg-teal text-white py-3.5 rounded-2xl font-extrabold text-[14px] shadow-sm hover:bg-teal-light cursor-pointer disabled:opacity-50"
              >
                ARCHIVE ACCOUNT (RECOMMENDED)
              </button>

              {/* Option 2: Hard Delete (Irreversible) */}
              <button
                onClick={handleHardDelete}
                disabled={deleting}
                className="w-full bg-expense/10 text-expense border border-expense/20 hover:bg-expense/15 py-3.5 rounded-2xl font-extrabold text-[14px] cursor-pointer disabled:opacity-50"
              >
                DELETE PERMANENTLY ({txCount} TRANSACTIONS)
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
