'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { actionUpdateSettings } from '@/lib/actions';
import { supabase } from '@/lib/supabase-browser';
import { getBankLogo, BANK_LOGOS } from '@/lib/bankLogos';
import { Fish, Check, User, CreditCard, Sparkles, Upload } from 'lucide-react';

const CURRENCIES = [
  { code: 'PHP', symbol: '₱', label: 'Philippine Peso (₱)' },
  { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', label: 'Euro (€)' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen (¥)' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar (S$)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
];

const STARTER_ACCOUNTS = ['Cash', 'GCash', 'Maya', 'BPI', 'BDO', 'UnionBank', 'Metrobank'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  
  const [payCycle, setPayCycle] = useState<'monthly' | 'semimonthly' | 'weekly' | 'biweekly'>('monthly');
  const [payDay1, setPayDay1] = useState('30');
  const [payDay2, setPayDay2] = useState('15');
  const [payDayOfWeek, setPayDayOfWeek] = useState('5'); // Friday by default
  
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(['Cash', 'GCash']);

  const [saving, setSaving] = useState(false);

  // Handle avatar upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUri(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleNext = () => {
    if (step === 1 && !displayName.trim()) {
      alert('Please enter your name.');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      // Calculate pay_days JSON array based on selected cycle
      let payDaysArr: number[] = [30];
      if (payCycle === 'monthly') {
        payDaysArr = [parseInt(payDay1) || 30];
      } else if (payCycle === 'semimonthly') {
        payDaysArr = [parseInt(payDay1) || 15, parseInt(payDay2) || 30].sort((a, b) => a - b);
      } else if (payCycle === 'weekly' || payCycle === 'biweekly') {
        payDaysArr = [parseInt(payDayOfWeek) || 5];
      }

      // Seed starter accounts using direct DB insert
      // Since it's client component, let's create a server action for seeding to avoid mixed imports,
      // or run it directly via supabase client. Let's run it directly via supabase client since we have full access!
      for (const name of selectedAccounts) {
        const logoKey = name.toLowerCase() === 'cash' ? 'cash' : name.toLowerCase();
        const brand = BANK_LOGOS.find((b) => b.key === logoKey);
        const type = logoKey === 'cash' ? 'cash' : (logoKey === 'gcash' || logoKey === 'maya') ? 'ewallet' : 'bank';
        const color = brand?.color || '#0D9DA8';

        await supabase.from('accounts').insert({
          name,
          type,
          is_liability: false,
          logo_key: logoKey,
          color,
          created_at: Date.now(),
          archived: false,
        });
      }

      // Update settings table
      await actionUpdateSettings({
        display_name: displayName.trim(),
        avatar_uri: avatarUri,
        pay_cycle: payCycle,
        pay_days: JSON.stringify(payDaysArr),
        currency_code: selectedCurrency.code,
        currency_symbol: selectedCurrency.symbol,
        onboarded: true,
      });

      // Navigate to home
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('An error occurred during setup. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleAccount = (accName: string) => {
    if (selectedAccounts.includes(accName)) {
      setSelectedAccounts(selectedAccounts.filter((a) => a !== accName));
    } else {
      setSelectedAccounts([...selectedAccounts, accName]);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-env(safe-area-inset-top,0px))] bg-bg flex flex-col justify-between px-6 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
      {/* Header */}
      <div className="flex justify-between items-center h-12">
        {step > 0 && step < 5 ? (
          <button
            onClick={handleBack}
            className="text-xs font-bold text-muted uppercase tracking-wide hover:text-dark cursor-pointer"
          >
            ← Back
          </button>
        ) : (
          <div />
        )}
        {step > 0 && step < 5 && (
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step ? 'w-5 bg-teal' : 'w-1.5 bg-border-mid'
                }`}
              />
            ))}
          </div>
        )}
        <div />
      </div>

      {/* Step Contents */}
      <div className="flex-1 flex flex-col justify-center my-6">
        
        {/* Step 0: Welcome Screen */}
        {step === 0 && (
          <div className="flex flex-col items-center text-center gap-6">
            <div className="w-20 h-20 rounded-full bg-teal flex items-center justify-center shadow-lg shadow-teal/20 animate-bounce">
              <Fish size={40} className="text-white" />
            </div>
            <div>
              <h1 className="text-[28px] font-black tracking-tight text-dark">
                Welcome to <span className="text-teal text-fill-gradient">Fishnance</span>
              </h1>
              <p className="text-muted text-[13px] font-semibold mt-2 max-w-xs mx-auto">
                Your personal finance tracker for the Philippines. Calm budgeting, clear goals.
              </p>
            </div>
            <div className="w-full flex flex-col gap-3 border border-border bg-white p-5 rounded-3xl shadow-sm max-w-xs mt-2">
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center text-teal">
                  <Sparkles size={16} />
                </div>
                <div>
                  <span className="text-[12px] font-black text-dark block">Smart Budgeting</span>
                  <span className="text-[10px] text-muted font-bold block">Track paydays and cash flow</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center text-teal">
                  <CreditCard size={16} />
                </div>
                <div>
                  <span className="text-[12px] font-black text-dark block">All Wallets in One Place</span>
                  <span className="text-[10px] text-muted font-bold block">GCash, Maya, Banks & Cash</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleNext}
              className="w-full max-w-xs mt-6 bg-teal text-white py-4 rounded-2xl font-extrabold text-[15px] shadow-md hover:bg-teal-light active:scale-98 transition-all cursor-pointer"
            >
              GET STARTED
            </button>
          </div>
        )}

        {/* Step 1: Profile Details */}
        {step === 1 && (
          <div className="flex flex-col gap-6 max-w-xs mx-auto w-full">
            <div className="text-center">
              <h2 className="text-[22px] font-black text-dark">Tell us about yourself</h2>
              <p className="text-[12px] text-muted font-semibold mt-1">
                Your name and profile photo will customize your dashboard.
              </p>
            </div>

            {/* Avatar Upload */}
            <div className="flex flex-col items-center justify-center gap-2">
              <label className="relative cursor-pointer group">
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                {avatarUri ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUri}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover border-4 border-teal shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-border-mid flex flex-col items-center justify-center text-muted group-hover:text-dark transition-colors border-4 border-white shadow-sm">
                    <User size={32} />
                    <Upload size={14} className="absolute bottom-1 right-1 bg-teal text-white p-0.5 rounded-full" />
                  </div>
                )}
              </label>
              <span className="text-[10px] font-bold text-muted uppercase">Upload Photo</span>
            </div>

            {/* Name Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wide">
                Your first name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-white border-2 border-border focus:border-teal rounded-2xl px-4 py-3 text-[14px] font-semibold text-dark outline-none transition-colors shadow-sm"
                placeholder="Juan"
              />
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-teal text-white py-4 rounded-2xl font-extrabold text-[15px] shadow-md hover:bg-teal-light active:scale-98 transition-all cursor-pointer mt-2"
            >
              CONTINUE
            </button>
          </div>
        )}

        {/* Step 2: Payday Setup */}
        {step === 2 && (
          <div className="flex flex-col gap-6 max-w-xs mx-auto w-full">
            <div className="text-center">
              <h2 className="text-[22px] font-black text-dark">When do you get paid?</h2>
              <p className="text-[12px] text-muted font-semibold mt-1">
                {"We'll calculate countdowns to your payday on your dashboard."}
              </p>
            </div>

            {/* Pay Cycle Chips */}
            <div className="grid grid-cols-2 gap-2">
              {(['monthly', 'semimonthly', 'weekly', 'biweekly'] as const).map((cycle) => (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => setPayCycle(cycle)}
                  className={`py-3 px-2 rounded-2xl border-2 text-[12px] font-extrabold transition-all cursor-pointer ${
                    payCycle === cycle
                      ? 'border-teal bg-teal/5 text-teal shadow-sm'
                      : 'border-border bg-white text-muted hover:border-border-mid'
                  }`}
                >
                  {cycle === 'semimonthly' ? 'Semi-monthly' : cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                </button>
              ))}
            </div>

            {/* Conditional Inputs Based on Pay Cycle */}
            <div className="flex flex-col gap-4 border-t border-border pt-4 mt-2">
              {payCycle === 'monthly' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wide">
                    Day of month
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={payDay1}
                    onChange={(e) => setPayDay1(e.target.value)}
                    className="w-full bg-white border-2 border-border focus:border-teal rounded-2xl px-4 py-3 text-[14px] font-semibold text-dark outline-none transition-colors shadow-sm"
                    placeholder="30"
                  />
                </div>
              )}

              {payCycle === 'semimonthly' && (
                <div className="flex gap-3">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wide">
                      First Pay Day
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={payDay1}
                      onChange={(e) => setPayDay1(e.target.value)}
                      className="w-full bg-white border-2 border-border focus:border-teal rounded-2xl px-4 py-3 text-[14px] font-semibold text-dark outline-none transition-colors shadow-sm"
                      placeholder="15"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wide">
                      Second Pay Day
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={payDay2}
                      onChange={(e) => setPayDay2(e.target.value)}
                      className="w-full bg-white border-2 border-border focus:border-teal rounded-2xl px-4 py-3 text-[14px] font-semibold text-dark outline-none transition-colors shadow-sm"
                      placeholder="30"
                    />
                  </div>
                </div>
              )}

              {(payCycle === 'weekly' || payCycle === 'biweekly') && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wide">
                    Day of the week
                  </label>
                  <select
                    value={payDayOfWeek}
                    onChange={(e) => setPayDayOfWeek(e.target.value)}
                    className="w-full bg-white border-2 border-border focus:border-teal rounded-2xl px-4 py-3 text-[14px] font-bold text-dark outline-none transition-colors shadow-sm"
                  >
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                    <option value="0">Sunday</option>
                  </select>
                </div>
              )}
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-teal text-white py-4 rounded-2xl font-extrabold text-[15px] shadow-md hover:bg-teal-light active:scale-98 transition-all cursor-pointer mt-2"
            >
              CONTINUE
            </button>
          </div>
        )}

        {/* Step 3: Currency Selector */}
        {step === 3 && (
          <div className="flex flex-col gap-6 max-w-xs mx-auto w-full">
            <div className="text-center">
              <h2 className="text-[22px] font-black text-dark">What currency do you use?</h2>
              <p className="text-[12px] text-muted font-semibold mt-1">
                All account balances and transactions will use this currency.
              </p>
            </div>

            {/* Currencies List */}
            <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1 no-scrollbar">
              {CURRENCIES.map((curr) => {
                const isSelected = selectedCurrency.code === curr.code;
                return (
                  <button
                    key={curr.code}
                    onClick={() => setSelectedCurrency(curr)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-teal bg-teal/5 text-teal font-extrabold'
                        : 'border-border bg-white text-muted hover:border-border-mid'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-border-mid/30 flex items-center justify-center font-bold text-[12px] text-dark">
                        {curr.symbol}
                      </span>
                      <span className="text-[13px] text-dark font-extrabold">{curr.label}</span>
                    </div>
                    {isSelected && <Check size={16} className="text-teal" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-teal text-white py-4 rounded-2xl font-extrabold text-[15px] shadow-md hover:bg-teal-light active:scale-98 transition-all cursor-pointer mt-2"
            >
              CONTINUE
            </button>
          </div>
        )}

        {/* Step 4: Starter Accounts */}
        {step === 4 && (
          <div className="flex flex-col gap-6 max-w-xs mx-auto w-full">
            <div className="text-center">
              <h2 className="text-[22px] font-black text-dark">Which accounts do you have?</h2>
              <p className="text-[12px] text-muted font-semibold mt-1">
                {"We'll seed these wallets with ₱0.00 balances. You can add more later."}
              </p>
            </div>

            {/* Starter Accounts Multi-select Grid */}
            <div className="grid grid-cols-2 gap-2">
              {STARTER_ACCOUNTS.map((accName) => {
                const isSelected = selectedAccounts.includes(accName);
                const logoKey = accName.toLowerCase();
                const bank = getBankLogo(logoKey);

                return (
                  <button
                    key={accName}
                    onClick={() => toggleAccount(accName)}
                    className={`flex items-center gap-2 p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-teal bg-teal/5 text-teal font-extrabold shadow-sm'
                        : 'border-border bg-white text-muted hover:border-border-mid'
                    }`}
                  >
                    <div
                      style={{
                        backgroundColor: bank?.bgColor || '#E8F4F5',
                        color: bank?.color || '#0D9DA8',
                      }}
                      className="w-6 h-6 rounded-full flex items-center justify-center font-black text-[9px] flex-shrink-0"
                    >
                      {bank?.initials || accName.charAt(0)}
                    </div>
                    <span className="text-[12px] text-dark font-extrabold truncate">{accName}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-teal text-white py-4 rounded-2xl font-extrabold text-[15px] shadow-md hover:bg-teal-light active:scale-98 transition-all cursor-pointer mt-2"
            >
              CONTINUE
            </button>
          </div>
        )}

        {/* Step 5: Completion */}
        {step === 5 && (
          <div className="flex flex-col items-center text-center gap-6 max-w-xs mx-auto w-full">
            <div className="w-20 h-20 rounded-full bg-income/10 border-4 border-income flex items-center justify-center text-income shadow-lg animate-pulse">
              <Check size={40} className="stroke-[3px]" />
            </div>
            <div>
              <h2 className="text-[26px] font-black text-dark">{"You're all set!"}</h2>
              <p className="text-muted text-[13px] font-semibold mt-2">
                {"Your Fishnance wallets are ready. Let's start tracking your cash flow and managing your budget."}
              </p>
            </div>
            <button
              onClick={handleFinish}
              disabled={saving}
              className="w-full bg-teal text-white py-4 rounded-2xl font-extrabold text-[15px] shadow-md hover:bg-teal-light active:scale-98 transition-all cursor-pointer disabled:opacity-50 mt-4"
            >
              {saving ? 'SETTING UP...' : 'START FISHNANCE'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
