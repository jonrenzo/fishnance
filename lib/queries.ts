import { supabase } from './supabase';
import { addMonths } from 'date-fns';
import { Account, Category, Transaction, Budget, Goal, Settings, Bill } from '@/types';

// Accounts
export async function getAccounts(includeArchived = false): Promise<Account[]> {
  let query = supabase.from('accounts').select('*');
  if (!includeArchived) {
    query = query.eq('archived', false);
  }
  const { data, error } = await query.order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getAccount(id: number): Promise<Account | null> {
  const { data, error } = await supabase.from('accounts').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function createAccount(params: {
  name: string;
  type: 'cash' | 'bank' | 'ewallet' | 'credit' | 'savings';
  is_liability: boolean;
  logo_key: string | null;
  color: string;
  opening_balance_minor: number;
}): Promise<Account> {
  const { data, error } = await supabase
    .from('accounts')
    .insert({
      name: params.name,
      type: params.type,
      is_liability: params.is_liability,
      logo_key: params.logo_key,
      color: params.color,
      created_at: Date.now(),
      archived: false,
    })
    .select()
    .single();

  if (error) throw error;

  // Insert opening balance transaction if non-zero
  if (params.opening_balance_minor !== 0) {
    const { error: txError } = await supabase.from('transactions').insert({
      type: params.is_liability ? 'expense' : 'income',
      account_id: data.id,
      amount_minor: Math.abs(params.opening_balance_minor),
      note: 'Opening Balance',
      date: Date.now(),
      created_at: Date.now(),
    });
    if (txError) throw txError;
  }

  return data;
}

export async function updateAccount(id: number, partial: Partial<Account>): Promise<Account> {
  const { data, error } = await supabase.from('accounts').update(partial).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function accountTransactionCount(id: number): Promise<number> {
  const { count, error } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .or(`account_id.eq.${id},to_account_id.eq.${id}`);
  if (error) throw error;
  return count || 0;
}

export async function archiveAccount(id: number): Promise<Account> {
  const { data, error } = await supabase.from('accounts').update({ archived: true }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function unarchiveAccount(id: number): Promise<Account> {
  const { data, error } = await supabase.from('accounts').update({ archived: false }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteAccountHard(id: number): Promise<boolean> {
  const { error } = await supabase.from('accounts').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function accountBalance(accountId: number): Promise<number> {
  const { data: acc } = await supabase.from('accounts').select('is_liability').eq('id', accountId).single();
  if (!acc) return 0;

  const { data: txs, error } = await supabase
    .from('transactions')
    .select('type, amount_minor, account_id, to_account_id')
    .or(`account_id.eq.${accountId},to_account_id.eq.${accountId}`);

  if (error || !txs) return 0;

  let credits = 0; // inflows
  let debits = 0; // outflows
  for (const tx of txs) {
    if (tx.type === 'income' && tx.account_id === accountId) {
      credits += tx.amount_minor;
    } else if (tx.type === 'expense' && tx.account_id === accountId) {
      debits += tx.amount_minor;
    } else if (tx.type === 'transfer') {
      if (tx.to_account_id === accountId) {
        credits += tx.amount_minor;
      }
      if (tx.account_id === accountId) {
        debits += tx.amount_minor;
      }
    }
  }

  if (acc.is_liability) {
    return debits - credits; // positive means you owe money
  } else {
    return credits - debits; // positive means you have money
  }
}

export async function netWorth(): Promise<number> {
  const { data: accs } = await supabase.from('accounts').select('id, is_liability').eq('archived', false);
  if (!accs) return 0;

  let total = 0;
  for (const acc of accs) {
    const bal = await accountBalance(acc.id);
    if (acc.is_liability) {
      total -= bal;
    } else {
      total += bal;
    }
  }
  return total;
}

// Transactions
export async function getTransactions(limit = 50, offset = 0): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data || [];
}

export async function getAccountTransactions(accountId: number, limit = 50): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .or(`account_id.eq.${accountId},to_account_id.eq.${accountId}`)
    .order('date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function insertTransaction(params: {
  type: 'income' | 'expense' | 'transfer';
  account_id: number;
  to_account_id?: number | null;
  amount_minor: number;
  category_id?: number | null;
  note?: string | null;
  date: number;
}): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      type: params.type,
      account_id: params.account_id,
      to_account_id: params.to_account_id || null,
      amount_minor: params.amount_minor,
      category_id: params.category_id || null,
      note: params.note || null,
      date: params.date,
      created_at: Date.now(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Monthly Insights
export async function incomeVsExpense(year: number, month: number) {
  const start = new Date(year, month - 1, 1).getTime();
  const end = new Date(year, month, 1).getTime() - 1;

  const { data, error } = await supabase
    .from('transactions')
    .select('type, amount_minor')
    .gte('date', start)
    .lte('date', end)
    .in('type', ['income', 'expense']);

  if (error || !data) return { income: 0, expense: 0, net: 0 };

  let income = 0;
  let expense = 0;
  for (const tx of data) {
    if (tx.type === 'income') {
      income += tx.amount_minor;
    } else if (tx.type === 'expense') {
      expense += tx.amount_minor;
    }
  }
  return { income, expense, net: income - expense };
}

export async function monthlySpendByCategory(year: number, month: number) {
  const start = new Date(year, month - 1, 1).getTime();
  const end = new Date(year, month, 1).getTime() - 1;

  const { data, error } = await supabase
    .from('transactions')
    .select('category_id, amount_minor')
    .gte('date', start)
    .lte('date', end)
    .eq('type', 'expense');

  if (error || !data) return [];

  const groups: Record<number, number> = {};
  for (const tx of data) {
    if (tx.category_id) {
      groups[tx.category_id] = (groups[tx.category_id] || 0) + tx.amount_minor;
    }
  }
  return Object.entries(groups).map(([catId, total]) => ({
    category_id: Number(catId),
    total,
  }));
}

export async function last7DaysSpend() {
  const result = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();

    const { data } = await supabase
      .from('transactions')
      .select('amount_minor')
      .eq('type', 'expense')
      .gte('date', start)
      .lte('date', end);

    const total = (data || []).reduce((acc, tx) => acc + tx.amount_minor, 0);
    result.push({
      date: d.getTime(),
      expense: total,
    });
  }
  return result;
}

export async function incomeExpenseForRange(period: 'day' | 'week' | 'month') {
  const today = new Date();
  let start = 0;
  if (period === 'day') {
    start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0).getTime();
  } else if (period === 'week') {
    const dayOfWeek = today.getDay();
    start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - dayOfWeek, 0, 0, 0, 0).getTime();
  } else if (period === 'month') {
    start = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0).getTime();
  }

  const { data } = await supabase
    .from('transactions')
    .select('type, amount_minor')
    .gte('date', start)
    .in('type', ['income', 'expense']);

  let income = 0;
  let expense = 0;
  for (const tx of (data || [])) {
    if (tx.type === 'income') {
      income += tx.amount_minor;
    } else if (tx.type === 'expense') {
      expense += tx.amount_minor;
    }
  }
  return { income, expense };
}

// Categories
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getParentCategories(kind?: 'income' | 'expense'): Promise<Category[]> {
  let q = supabase.from('categories').select('*').is('parent_id', null);
  if (kind) {
    q = q.eq('kind', kind);
  }
  const { data, error } = await q.order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getSubcategories(parentId: number): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('parent_id', parentId)
    .order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}

// Budgets + Goals
export async function getBudgets(): Promise<Budget[]> {
  const { data, error } = await supabase.from('budgets').select('*');
  if (error) throw error;
  return data || [];
}

export async function budgetProgress(categoryId: number, year: number, month: number) {
  const startMonthStr = `${year}-${String(month).padStart(2, '0')}`;
  const { data: budget } = await supabase
    .from('budgets')
    .select('*')
    .eq('category_id', categoryId)
    .eq('start_month', startMonthStr)
    .maybeSingle();

  if (!budget) return null;

  const { data: subcats } = await supabase.from('categories').select('id').eq('parent_id', categoryId);
  const catIds = [categoryId, ...(subcats || []).map(s => s.id)];

  const start = new Date(year, month - 1, 1).getTime();
  const end = new Date(year, month, 1).getTime() - 1;

  const { data: txs } = await supabase
    .from('transactions')
    .select('amount_minor')
    .in('category_id', catIds)
    .eq('type', 'expense')
    .gte('date', start)
    .lte('date', end);

  const spentMinor = (txs || []).reduce((acc, tx) => acc + tx.amount_minor, 0);
  const remaining = budget.amount_minor - spentMinor;
  const pct = budget.amount_minor > 0 ? (spentMinor / budget.amount_minor) * 100 : 0;

  return {
    budget,
    spentMinor,
    remaining,
    pct,
  };
}

export async function getGoals(): Promise<Goal[]> {
  const { data, error } = await supabase.from('goals').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

// Settings
export async function getSettings(): Promise<Settings | null> {
  const { data, error } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function updateSettings(partial: Partial<Settings>): Promise<Settings> {
  const { data, error } = await supabase.from('settings').update(partial).eq('id', 1).select().single();
  if (error) throw error;
  return data;
}

// Bills
export async function getBills(includeArchived = false): Promise<Bill[]> {
  let q = supabase.from('bills').select('*');
  if (!includeArchived) {
    q = q.eq('archived', false);
  }
  const { data, error } = await q.order('due_date', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getUpcomingBills(withinDays = 14): Promise<Bill[]> {
  const limitTime = Date.now() + withinDays * 86400000;
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('archived', false)
    .lte('due_date', limitTime)
    .order('due_date', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createBill(params: {
  name: string;
  amount_minor: number;
  due_date: number;
  recurrence: 'none' | 'weekly' | 'monthly';
  account_id?: number | null;
  category_id?: number | null;
  logo_key?: string | null;
}): Promise<Bill> {
  const { data, error } = await supabase
    .from('bills')
    .insert({
      name: params.name,
      amount_minor: params.amount_minor,
      due_date: params.due_date,
      recurrence: params.recurrence,
      account_id: params.account_id || null,
      category_id: params.category_id || null,
      logo_key: params.logo_key || null,
      archived: false,
      created_at: Date.now(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBill(id: number, partial: Partial<Bill>): Promise<Bill> {
  const { data, error } = await supabase.from('bills').update(partial).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteBill(id: number): Promise<boolean> {
  const { error } = await supabase.from('bills').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function markBillPaid(billId: number, fromAccountId: number): Promise<Bill> {
  const { data: bill, error: fetchError } = await supabase
    .from('bills')
    .select('*')
    .eq('id', billId)
    .single();

  if (fetchError || !bill) throw new Error('Bill not found');

  // Insert expense transaction
  const { error: txError } = await supabase.from('transactions').insert({
    type: 'expense',
    account_id: fromAccountId,
    amount_minor: bill.amount_minor,
    category_id: bill.category_id,
    note: bill.name,
    date: Date.now(),
    created_at: Date.now(),
  });
  if (txError) throw txError;

  // Recurrence logic
  const updates: Partial<Bill> = {
    last_paid_date: Date.now(),
  };

  if (bill.recurrence === 'monthly') {
    updates.due_date = addMonths(new Date(bill.due_date), 1).getTime();
  } else if (bill.recurrence === 'weekly') {
    updates.due_date = bill.due_date + 7 * 86400000;
  } else {
    updates.archived = true;
  }

  const { data, error: updateError } = await supabase
    .from('bills')
    .update(updates)
    .eq('id', billId)
    .select()
    .single();

  if (updateError) throw updateError;
  return data;
}

// Seed helper for starter accounts in onboarding
export async function seedStarterAccounts(names: string[]): Promise<void> {
  const { BANK_LOGOS, matchLogoKey } = await import('./bankLogos');
  for (const name of names) {
    const logoKey = matchLogoKey(name) || null;
    const brand = logoKey ? BANK_LOGOS.find(b => b.key === logoKey) : null;
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
}
