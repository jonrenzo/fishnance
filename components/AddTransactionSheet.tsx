'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { actionAddTransaction } from '@/lib/actions';
import { Account, Category } from '@/types';
import Modal from './Modal';
import BrandLogo from './BrandLogo';
import CategoryChip from './CategoryChip';
import { Calendar, FileText, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface AddTransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddTransactionSheet({ isOpen, onClose }: AddTransactionSheetProps) {
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [amount, setAmount] = useState<string>('0.00');
  
  // Selection states
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedToAccountId, setSelectedToAccountId] = useState<number | null>(null);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  
  // UI states
  const [showAccountPicker, setShowAccountPicker] = useState<boolean>(false);
  const [pickingFor, setPickingFor] = useState<'from' | 'to'>('from');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Fetch accounts and categories
  useEffect(() => {
    async function loadData() {
      // Load accounts
      const { data: accs } = await supabase
        .from('accounts')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: true });
      
      if (accs && accs.length > 0) {
        setAccounts(accs);
        setSelectedAccountId(accs[0].id);
        if (accs.length > 1) {
          setSelectedToAccountId(accs[1].id);
        }
      }

      // Load categories
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      
      if (cats) {
        setCategories(cats);
      }
    }
    loadData();
  }, []);

  // Filter parent categories based on transaction type
  const parentCategories = categories.filter(
    (c) => c.parent_id === null && c.kind === (type === 'transfer' ? 'expense' : type)
  );

  // Filter subcategories of the selected parent category
  const subcategories = selectedParentCategoryId
    ? categories.filter((c) => c.parent_id === selectedParentCategoryId)
    : [];

  const handleTypeChange = (newType: 'expense' | 'income' | 'transfer') => {
    setType(newType);
    setSelectedParentCategoryId(null);
    setSelectedCategoryId(null);
  };

  const handleAmountChange = (val: string) => {
    // Keep only digits and a single dot
    let clean = val.replace(/[^0-9.]/g, '');
    
    // Ensure only one dot
    const parts = clean.split('.');
    if (parts.length > 2) {
      clean = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      clean = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    setAmount(clean);
  };

  const handleAmountBlur = () => {
    const num = parseFloat(amount || '0');
    setAmount(num.toFixed(2));
  };

  const handleSave = async () => {
    const minorAmount = Math.round(parseFloat(amount || '0') * 100);
    if (minorAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (!selectedAccountId) {
      alert('Please select an account.');
      return;
    }
    if (type === 'transfer' && selectedAccountId === selectedToAccountId) {
      alert('Source and destination accounts must be different.');
      return;
    }

    setSubmitting(true);
    try {
      await actionAddTransaction({
        type,
        account_id: selectedAccountId,
        to_account_id: type === 'transfer' ? selectedToAccountId : null,
        amount_minor: minorAmount,
        category_id: type === 'transfer' ? null : selectedCategoryId || selectedParentCategoryId,
        note: note.trim() || null,
        date: new Date(date).getTime(),
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentAccount = accounts.find((a) => a.id === selectedAccountId);
  const currentToAccount = accounts.find((a) => a.id === selectedToAccountId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Transaction">
      <div className="flex flex-col gap-5">
        
        {/* Transaction Type Selector */}
        <div className="flex bg-bg border border-border p-1 rounded-full w-full">
          {(['expense', 'income', 'transfer'] as const).map((t) => {
            const isActive = t === type;
            let activeClass = '';
            if (isActive) {
              if (t === 'expense') activeClass = 'bg-expense text-white';
              if (t === 'income') activeClass = 'bg-income text-white';
              if (t === 'transfer') activeClass = 'bg-teal text-white';
            }
            return (
              <button
                key={t}
                onClick={() => handleTypeChange(t)}
                className={`flex-1 text-center py-2 text-[12px] font-extrabold rounded-full transition-all duration-200 cursor-pointer ${
                  isActive ? `${activeClass} shadow-sm` : 'text-muted hover:text-dark'
                }`}
              >
                {t.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* Amount Input */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="flex items-center text-dark font-black text-4xl">
            <span className="mr-1">₱</span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              onBlur={handleAmountBlur}
              className="w-48 text-center bg-transparent border-none outline-none font-black text-4xl p-0 focus:ring-0"
              placeholder="0.00"
              autoFocus
            />
          </div>
          <span className="text-[10px] font-bold text-muted mt-1 uppercase tracking-wide">
            Amount
          </span>
        </div>

        {/* Accounts Picker Buttons */}
        <div className="flex gap-3">
          {/* Account Selector */}
          <div className="flex-1">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wide block mb-1">
              {type === 'transfer' ? 'From Account' : 'Account'}
            </label>
            <button
              onClick={() => {
                setPickingFor('from');
                setShowAccountPicker(true);
              }}
              className="w-full flex items-center justify-between bg-bg border border-border px-4 py-3 rounded-2xl text-[14px] font-bold text-dark active:scale-98 transition-transform cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <BrandLogo logoKey={currentAccount?.logo_key || null} size={24} />
                <span className="truncate max-w-[100px]">
                  {currentAccount?.name || 'Select'}
                </span>
              </div>
              <ChevronRight size={16} className="text-muted" />
            </button>
          </div>

          {/* To Account Selector (Transfer only) */}
          {type === 'transfer' && (
            <div className="flex-1">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wide block mb-1">
                To Account
              </label>
              <button
                onClick={() => {
                  setPickingFor('to');
                  setShowAccountPicker(true);
                }}
                className="w-full flex items-center justify-between bg-bg border border-border px-4 py-3 rounded-2xl text-[14px] font-bold text-dark active:scale-98 transition-transform cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <BrandLogo logoKey={currentToAccount?.logo_key || null} size={24} />
                  <span className="truncate max-w-[100px]">
                    {currentToAccount?.name || 'Select'}
                  </span>
                </div>
                <ChevronRight size={16} className="text-muted" />
              </button>
            </div>
          )}
        </div>

        {/* Category Picker (Income & Expense only) */}
        {type !== 'transfer' && (
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted uppercase tracking-wide block mb-1">
                Category
              </label>
              
              {/* Parent Categories Horizontal Scroll */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {parentCategories.map((cat) => (
                  <CategoryChip
                    key={cat.id}
                    category={cat}
                    isActive={selectedParentCategoryId === cat.id}
                    onClick={() => {
                      setSelectedParentCategoryId(cat.id);
                      setSelectedCategoryId(null); // Reset subcategory selection
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Subcategories Horizontal Scroll (if parent selected) */}
            {selectedParentCategoryId && subcategories.length > 0 && (
              <div className="flex flex-col gap-1 border-t border-border pt-2">
                <span className="text-[9px] font-bold text-muted uppercase tracking-wide">
                  Subcategory
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {subcategories.map((subcat) => (
                    <CategoryChip
                      key={subcat.id}
                      category={subcat}
                      isActive={selectedCategoryId === subcat.id}
                      onClick={() => setSelectedCategoryId(subcat.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Note Input */}
        <div>
          <label className="text-[10px] font-bold text-muted uppercase tracking-wide block mb-1">
            Note
          </label>
          <div className="relative flex items-center">
            <FileText size={18} className="absolute left-4 text-muted" />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-bg border-2 border-border focus:border-teal rounded-2xl pl-11 pr-4 py-3 text-[14px] font-semibold text-dark outline-none transition-colors"
              placeholder="Add a note..."
            />
          </div>
        </div>

        {/* Date Input */}
        <div>
          <label className="text-[10px] font-bold text-muted uppercase tracking-wide block mb-1">
            Date
          </label>
          <div className="relative flex items-center">
            <Calendar size={18} className="absolute left-4 text-muted" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-bg border-2 border-border focus:border-teal rounded-2xl pl-11 pr-4 py-3 text-[14px] font-semibold text-dark outline-none transition-colors"
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={submitting}
          className={`w-full py-4 rounded-2xl text-white font-extrabold text-[15px] shadow-md transition-all duration-200 cursor-pointer active:scale-98 ${
            type === 'expense' ? 'bg-expense' : type === 'income' ? 'bg-income' : 'bg-teal'
          } disabled:opacity-50`}
        >
          {submitting ? 'LOGGING...' : 'LOG TRANSACTION'}
        </button>

      </div>

      {/* Embedded Account Selector Modal */}
      {showAccountPicker && (
        <Modal
          isOpen={showAccountPicker}
          onClose={() => setShowAccountPicker(false)}
          title="Select Account"
        >
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
            {accounts.map((acc) => {
              const isSelected =
                pickingFor === 'from'
                  ? selectedAccountId === acc.id
                  : selectedToAccountId === acc.id;

              return (
                <button
                  key={acc.id}
                  onClick={() => {
                    if (pickingFor === 'from') {
                      setSelectedAccountId(acc.id);
                    } else {
                      setSelectedToAccountId(acc.id);
                    }
                    setShowAccountPicker(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${
                    isSelected ? 'border-teal bg-teal/5' : 'border-border hover:border-border-mid bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BrandLogo logoKey={acc.logo_key} size={28} />
                    <span className="font-extrabold text-[14px] text-dark">{acc.name}</span>
                  </div>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-teal flex items-center justify-center text-white text-[10px] font-bold">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Modal>
      )}
    </Modal>
  );
}
