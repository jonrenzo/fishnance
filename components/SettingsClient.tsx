'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Account } from '@/types';
import { actionUpdateSettings, actionImportBackup, actionDeleteAccount, actionUnarchiveAccount } from '@/lib/actions';
import { supabase } from '@/lib/supabase-browser';
import { format } from 'date-fns';
import Modal from './Modal';
import BrandLogo from './BrandLogo';
import {
  User,
  CircleDollarSign,
  Download,
  Upload,
  Archive,
  ChevronRight,
  Fish,
  Image as ImageIcon,
  Check,
  Table,
} from 'lucide-react';

const CURRENCIES = [
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

interface SettingsClientProps {
  settings: Settings;
  archivedAccounts: Account[];
}

export default function SettingsClient({
  settings,
  archivedAccounts,
}: SettingsClientProps) {
  const router = useRouter();

  // Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  // Form states - Profile
  const [displayName, setDisplayName] = useState(settings.display_name || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(settings.avatar_uri || null);

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await actionUpdateSettings({
        display_name: displayName.trim() || null,
        avatar_uri: avatarUri,
      });
      setShowProfileModal(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectCurrency = async (curr: typeof CURRENCIES[0]) => {
    setSaving(true);
    try {
      await actionUpdateSettings({
        currency_code: curr.code,
        currency_symbol: curr.symbol,
      });
      setShowCurrencyModal(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to update currency.');
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreAccount = async (accountId: number) => {
    try {
      await actionUnarchiveAccount(accountId);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to restore account.');
    }
  };

  const handleDeleteAccount = async (account: Account) => {
    const doubleConfirm = window.confirm(
      `Are you sure you want to permanently delete "${account.name}" and all its transactions? This action is IRREVERSIBLE.`
    );
    if (doubleConfirm) {
      try {
        await actionDeleteAccount(account.id);
        router.refresh();
      } catch (err) {
        console.error(err);
        alert('Failed to delete account.');
      }
    }
  };

  // --- DATA EXPORT ---
  const handleExportJSON = async () => {
    try {
      const tables = ['accounts', 'transactions', 'budgets', 'goals', 'settings', 'bills'];
      const backupData: Record<string, unknown> = {};

      for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*');
        if (error) throw error;
        backupData[table] = data;
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fishnance_backup_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to export JSON backup.');
    }
  };

  const handleExportCSV = async () => {
    try {
      const { data: txs, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      
      const { data: accs, error: accError } = await supabase.from('accounts').select('id, name');
      const { data: cats, error: catError } = await supabase.from('categories').select('id, name');

      if (txError || accError || catError) throw new Error('Data fetch failed');

      const accMap = new Map(accs.map((a) => [a.id, a.name]));
      const catMap = new Map(cats.map((c) => [c.id, c.name]));

      // Build CSV headers
      let csvContent = 'ID,Date,Type,Amount (PHP),Note,Account,To Account,Category\n';

      for (const tx of txs || []) {
        const dateStr = format(new Date(tx.date), 'yyyy-MM-dd HH:mm:ss');
        const amountMajor = (tx.amount_minor / 100).toFixed(2);
        const accountName = accMap.get(tx.account_id) || '';
        const toAccountName = tx.to_account_id ? accMap.get(tx.to_account_id) || '' : '';
        const categoryName = tx.category_id ? catMap.get(tx.category_id) || '' : '';
        const noteEscaped = (tx.note || '').replace(/"/g, '""');

        csvContent += `${tx.id},"${dateStr}",${tx.type},${amountMajor},"${noteEscaped}","${accountName}","${toAccountName}","${categoryName}"\n`;
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fishnance_transactions_${format(new Date(), 'yyyyMMdd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to export CSV.');
    }
  };

  // --- DATA IMPORT ---
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmImport = window.confirm(
      'WARNING: Importing backup data will overwrite all existing accounts, transactions, budgets, goals, and bills in your database. This cannot be undone. Do you want to proceed?'
    );
    if (!confirmImport) {
      e.target.value = ''; // Reset input
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.accounts || !parsed.transactions || !parsed.settings) {
          throw new Error('Invalid backup file format.');
        }

        setSaving(true);
        await actionImportBackup({
          accounts: parsed.accounts || [],
          transactions: parsed.transactions || [],
          budgets: parsed.budgets || [],
          goals: parsed.goals || [],
          settings: parsed.settings?.[0] || parsed.settings || null,
          bills: parsed.bills || [],
        });
        alert('Data backup imported successfully!');
        router.refresh();
      } catch (err) {
        console.error(err);
        const errMsg = err instanceof Error ? err.message : 'Invalid format';
        alert(`Failed to import data: ${errMsg}`);
      } finally {
        setSaving(false);
        e.target.value = ''; // Reset input
      }
    };
    reader.readAsText(file);
  };

  const activeCurrency = CURRENCIES.find((c) => c.code === settings.currency_code) || CURRENCIES[0];

  return (
    <div className="flex flex-col gap-6">
      
      {/* Page Title */}
      <div>
        <h1 className="text-[28px] font-black tracking-tight text-dark leading-none">
          Settings
        </h1>
        <p className="text-[13px] text-muted font-semibold mt-1">
          App configuration and backup manager
        </p>
      </div>

      {/* --- PROFILE SECTION --- */}
      <div className="flex flex-col gap-2">
        <span className="text-[9px] font-black text-muted uppercase tracking-wider px-1">
          Profile
        </span>
        <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
          <button
            onClick={() => setShowProfileModal(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-bg/50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              {settings.avatar_uri ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.avatar_uri}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-border-mid/30 flex items-center justify-center text-muted border border-border">
                  <User size={18} />
                </div>
              )}
              <div>
                <h4 className="text-[13px] font-extrabold text-dark leading-none">
                  {settings.display_name || 'Set your name'}
                </h4>
                <span className="text-[9.5px] text-muted font-bold block mt-1 uppercase tracking-wide">
                  Tap to edit profile
                </span>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted" />
          </button>
        </div>
      </div>

      {/* --- PREFERENCES SECTION --- */}
      <div className="flex flex-col gap-2">
        <span className="text-[9px] font-black text-muted uppercase tracking-wider px-1">
          Preferences
        </span>
        <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
          <button
            onClick={() => setShowCurrencyModal(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-bg/50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center text-teal">
                <CircleDollarSign size={18} />
              </div>
              <div>
                <h4 className="text-[13px] font-extrabold text-dark leading-none">Currency</h4>
                <span className="text-[9.5px] text-muted font-bold block mt-1 uppercase tracking-wide">
                  {activeCurrency.name} ({activeCurrency.symbol})
                </span>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted" />
          </button>
        </div>
      </div>

      {/* --- DATA MANAGEMENT --- */}
      <div className="flex flex-col gap-2">
        <span className="text-[9px] font-black text-muted uppercase tracking-wider px-1">
          Data Backup
        </span>
        <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden flex flex-col divide-y divide-border">
          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            className="w-full flex items-center gap-3 p-4 hover:bg-bg/50 transition-colors text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
              <Download size={18} />
            </div>
            <div>
              <h4 className="text-[13px] font-extrabold text-dark leading-none">Export JSON Backup</h4>
              <span className="text-[9.5px] text-muted font-bold block mt-1 uppercase tracking-wide">
                Download all data as a single JSON file
              </span>
            </div>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="w-full flex items-center gap-3 p-4 hover:bg-bg/50 transition-colors text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 flex-shrink-0">
              <Table size={18} />
            </div>
            <div>
              <h4 className="text-[13px] font-extrabold text-dark leading-none">Export Transactions CSV</h4>
              <span className="text-[9.5px] text-muted font-bold block mt-1 uppercase tracking-wide">
                Download transactions ledger in Excel format
              </span>
            </div>
          </button>

          {/* Import JSON */}
          <label className="w-full flex items-center gap-3 p-4 hover:bg-bg/50 transition-colors text-left cursor-pointer">
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 flex-shrink-0">
              <Upload size={18} />
            </div>
            <div>
              <h4 className="text-[13px] font-extrabold text-dark leading-none">Import JSON Backup</h4>
              <span className="text-[9.5px] text-muted font-bold block mt-1 uppercase tracking-wide">
                Restore and overwrite database from a JSON backup
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* --- ACCOUNTS ARCHIVE SECTION --- */}
      <div className="flex flex-col gap-2">
        <span className="text-[9px] font-black text-muted uppercase tracking-wider px-1">
          Accounts Manager
        </span>
        <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
          <button
            onClick={() => setShowArchiveModal(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-bg/50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted/15 flex items-center justify-center text-muted">
                <Archive size={18} />
              </div>
              <div>
                <h4 className="text-[13px] font-extrabold text-dark leading-none">Archived Accounts</h4>
                <span className="text-[9.5px] text-muted font-bold block mt-1 uppercase tracking-wide">
                  {archivedAccounts.length} archived wallets
                </span>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted" />
          </button>
        </div>
      </div>

      {/* --- ABOUT SECTION --- */}
      <div className="bg-white rounded-3xl p-6 border border-border shadow-sm flex flex-col items-center justify-center text-center mt-2 gap-4">
        <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center text-teal">
          <Fish size={24} />
        </div>
        <div>
          <h3 className="text-[16px] font-black text-teal">Fishnance</h3>
          <span className="text-[10px] text-muted font-bold block mt-0.5">
            v1.0 · Personal Finance Tracker
          </span>
          <span className="text-[10px] text-muted font-bold block mt-0.5 leading-relaxed max-w-[200px]">
            Single-user local utility port. All data stored securely in hosted Supabase.
          </span>
        </div>
      </div>

      {/* --- MODAL 1: EDIT PROFILE --- */}
      {showProfileModal && (
        <Modal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          title="Edit Profile"
        >
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
            {/* Avatar upload */}
            <div className="flex flex-col items-center justify-center gap-2">
              <label className="relative cursor-pointer group">
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                {avatarUri ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUri}
                    alt={displayName}
                    className="w-20 h-20 rounded-full object-cover border-2 border-teal shadow"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-border-mid/30 flex flex-col items-center justify-center text-muted border border-border">
                    <User size={24} />
                    <ImageIcon size={12} className="absolute bottom-0.5 right-0.5 bg-teal text-white p-0.5 rounded-full" />
                  </div>
                )}
              </label>
              <span className="text-[9px] font-bold text-muted uppercase">Upload Photo</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wide">
                Your name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-bg border-2 border-border focus:border-teal rounded-2xl px-4 py-3 text-[14px] font-semibold text-dark outline-none transition-colors"
                placeholder="Name"
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-teal text-white py-3.5 rounded-2xl font-extrabold text-[14px] shadow-sm hover:bg-teal-light cursor-pointer disabled:opacity-50 mt-2"
            >
              {saving ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
          </form>
        </Modal>
      )}

      {/* --- MODAL 2: CURRENCY SELECTOR --- */}
      {showCurrencyModal && (
        <Modal
          isOpen={showCurrencyModal}
          onClose={() => setShowCurrencyModal(false)}
          title="Select Currency"
        >
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
            {CURRENCIES.map((curr) => {
              const isSelected = settings.currency_code === curr.code;
              return (
                <button
                  key={curr.code}
                  onClick={() => handleSelectCurrency(curr)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-teal bg-teal/5 text-teal font-extrabold'
                      : 'border-border bg-white text-muted hover:border-border-mid'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-border-mid/30 flex items-center justify-center font-bold text-[12px] text-dark">
                      {curr.symbol}
                    </span>
                    <span className="text-[13px] text-dark font-extrabold">{curr.name} ({curr.code})</span>
                  </div>
                  {isSelected && <Check size={16} className="text-teal" />}
                </button>
              );
            })}
          </div>
        </Modal>
      )}

      {/* --- MODAL 3: ARCHIVED ACCOUNTS --- */}
      {showArchiveModal && (
        <Modal
          isOpen={showArchiveModal}
          onClose={() => setShowArchiveModal(false)}
          title="Archived Accounts"
        >
          {archivedAccounts.length === 0 ? (
            <div className="text-center py-6 text-[12px] font-semibold text-muted">
              No archived accounts found.
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto pr-1 no-scrollbar">
              {archivedAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between p-3 bg-bg rounded-2xl border border-border"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <BrandLogo logoKey={acc.logo_key} size={24} />
                    <span className="text-[12px] font-extrabold text-dark truncate">
                      {acc.name}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleRestoreAccount(acc.id)}
                      className="text-[10px] font-extrabold text-teal bg-teal/10 hover:bg-teal/20 px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      RESTORE
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(acc)}
                      className="text-[10px] font-extrabold text-expense bg-expense/10 hover:bg-expense/20 px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

    </div>
  );
}
