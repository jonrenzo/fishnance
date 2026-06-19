'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Account } from '@/types';
import { BANK_LOGOS, getBankLogo, matchLogoKey } from '@/lib/bankLogos';
import BrandLogo from './BrandLogo';
import { ArrowLeft, Check } from 'lucide-react';

const COLORS = [
  '#0D9DA8', // Teal
  '#1D4ED8', // Royal Blue
  '#7C3AED', // Violet
  '#DC2626', // Red
  '#16A34A', // Green
  '#D97706', // Amber
  '#DB2777', // Pink
  '#0891B2', // Cyan
];

const TYPES = [
  { id: 'cash', label: 'Cash' },
  { id: 'bank', label: 'Bank' },
  { id: 'ewallet', label: 'E-Wallet' },
  { id: 'credit', label: 'Credit Card' },
  { id: 'savings', label: 'Savings' },
] as const;

interface AccountFormProps {
  initialData?: Account | null;
  onSubmit: (data: {
    name: string;
    type: 'cash' | 'bank' | 'ewallet' | 'credit' | 'savings';
    is_liability: boolean;
    logo_key: string | null;
    color: string;
    opening_balance_minor: number;
  }) => Promise<unknown>;
  title: string;
}

export default function AccountForm({ initialData, onSubmit, title }: AccountFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<'cash' | 'bank' | 'ewallet' | 'credit' | 'savings'>(
    initialData?.type || 'cash'
  );
  const [logoKey, setLogoKey] = useState<string | null>(initialData?.logo_key || 'cash');
  const [color, setColor] = useState(initialData?.color || COLORS[0]);
  const [isLiability, setIsLiability] = useState(initialData?.is_liability || false);
  const [openingBalance, setOpeningBalance] = useState('0.00');
  
  const [submitting, setSubmitting] = useState(false);

  // Auto-detect logo and color when name changes (only for new accounts, or if name is typed)
  const handleNameChange = (val: string) => {
    setName(val);
    
    // Auto-match bank logo
    const matched = matchLogoKey(val);
    if (matched) {
      const brand = getBankLogo(matched);
      if (brand) {
        setLogoKey(matched);
        setColor(brand.color);
        setType(brand.type);
        if (brand.type === 'credit') {
          setIsLiability(true);
        }
      }
    } else {
      // Default fallback
      if (val.trim() === '') {
        setLogoKey('cash');
        setColor(COLORS[0]);
        setType('cash');
        setIsLiability(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter an account name.');
      return;
    }

    setSubmitting(true);
    try {
      const balanceMinor = Math.round(parseFloat(openingBalance || '0') * 100);
      await onSubmit({
        name: name.trim(),
        type,
        is_liability: isLiability,
        logo_key: logoKey,
        color,
        opening_balance_minor: balanceMinor,
      });
      router.push('/accounts');
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to save account.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPreviewTypeLabel = () => {
    const found = TYPES.find((t) => t.id === type);
    return found ? found.label : 'Cash';
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      
      {/* Header with Back button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 rounded-full bg-white border border-border text-muted hover:text-dark hover:bg-border transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-[20px] font-black text-dark">{title}</h1>
      </div>

      {/* Preview Card Row */}
      <div
        style={{ backgroundColor: color }}
        className="rounded-2xl p-5 flex items-center gap-4 text-white shadow-sm transition-colors duration-300"
      >
        <div className="bg-white/95 rounded-full p-0.5 flex-shrink-0">
          <BrandLogo logoKey={logoKey} size={36} />
        </div>
        <div className="min-w-0">
          <h4 className="text-[15px] font-black leading-tight truncate">
            {name || 'Account Name'}
          </h4>
          <span className="text-[10px] text-white/75 font-bold uppercase tracking-wider mt-0.5 block">
            {getPreviewTypeLabel()} {isLiability ? '· Liability' : ''}
          </span>
        </div>
      </div>

      {/* Input Form Fields Card */}
      <div className="bg-white rounded-3xl p-5 border border-border shadow-sm flex flex-col gap-5">
        
        {/* Name Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-muted uppercase tracking-wide">
            Account Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full bg-bg border-2 border-border focus:border-teal rounded-2xl px-4 py-3 text-[14px] font-semibold text-dark outline-none transition-colors"
            placeholder="e.g. BPI Payroll, GCash"
          />
        </div>

        {/* Type selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-muted uppercase tracking-wide">
            Account Type
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-5 px-5">
            {TYPES.map((t) => {
              const isSelected = type === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setType(t.id);
                    if (t.id === 'credit') {
                      setIsLiability(true);
                    } else if (t.id === 'cash' && logoKey === null) {
                      setLogoKey('cash');
                    }
                  }}
                  className={`px-4 py-2.5 rounded-full border-2 text-[12px] font-extrabold transition-all cursor-pointer flex-shrink-0 ${
                    isSelected
                      ? 'border-teal bg-teal/5 text-teal shadow-sm'
                      : 'border-border bg-bg text-muted hover:border-border-mid'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bank Logo Picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-muted uppercase tracking-wide">
            Matching Logo
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-5 px-5">
            {BANK_LOGOS.map((brand) => {
              const isSelected = logoKey === brand.key;
              return (
                <button
                  key={brand.key}
                  type="button"
                  onClick={() => {
                    setLogoKey(brand.key);
                    setColor(brand.color);
                    setType(brand.type);
                    if (brand.type === 'credit') {
                      setIsLiability(true);
                    }
                  }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-2xl border-2 transition-all cursor-pointer flex-shrink-0 w-16 ${
                    isSelected ? 'border-teal bg-teal/5' : 'border-border bg-bg'
                  }`}
                >
                  <div
                    style={{ backgroundColor: brand.bgColor, color: brand.color }}
                    className="w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] select-none"
                  >
                    {brand.initials}
                  </div>
                  <span className="text-[8px] font-bold text-dark truncate w-full text-center">
                    {brand.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Color picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-muted uppercase tracking-wide">
            Card Theme Color
          </label>
          <div className="flex gap-3 py-1 flex-wrap">
            {COLORS.map((c) => {
              const isSelected = color === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-8 h-8 rounded-full cursor-pointer transition-all flex items-center justify-center hover:scale-105 ${
                    isSelected ? 'ring-2 ring-offset-2 ring-dark scale-105' : 'ring-1 ring-black/5'
                  }`}
                >
                  {isSelected && <Check size={14} className="text-white" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Liability Toggle */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div>
            <h4 className="text-[13px] font-extrabold text-dark">This is a liability</h4>
            <span className="text-[10px] text-muted font-bold block mt-0.5">
              Credit cards, loans, or money owed
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsLiability(!isLiability)}
            className={`w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none relative border border-black/5 cursor-pointer ${
              isLiability ? 'bg-teal' : 'bg-border-mid'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadowabsolute top-0.5 transition-transform duration-200 absolute ${
                isLiability ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Opening Balance (New account only) */}
        {!initialData && (
          <div className="flex flex-col gap-1.5 border-t border-border pt-4">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wide">
              Opening Balance
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={openingBalance}
              onChange={(e) => {
                let clean = e.target.value.replace(/[^0-9.]/g, '');
                const parts = clean.split('.');
                if (parts.length > 2) clean = parts[0] + '.' + parts.slice(1).join('');
                if (parts[1] && parts[1].length > 2) clean = parts[0] + '.' + parts[1].substring(0, 2);
                setOpeningBalance(clean);
              }}
              onBlur={() => {
                const num = parseFloat(openingBalance || '0');
                setOpeningBalance(num.toFixed(2));
              }}
              className="w-full bg-bg border-2 border-border focus:border-teal rounded-2xl px-4 py-3 text-[14px] font-semibold text-dark outline-none transition-colors"
              placeholder="0.00"
            />
          </div>
        )}

      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-teal text-white py-4 rounded-2xl font-extrabold text-[15px] shadow-md hover:bg-teal-light active:scale-98 transition-all cursor-pointer disabled:opacity-50"
      >
        {submitting ? 'SAVING...' : 'SAVE ACCOUNT'}
      </button>

    </form>
  );
}
