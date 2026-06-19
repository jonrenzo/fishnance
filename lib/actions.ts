'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from './supabase';
import {
  createAccount,
  updateAccount,
  archiveAccount,
  unarchiveAccount,
  deleteAccountHard,
  insertTransaction,
  createBill,
  markBillPaid,
  deleteBill,
  updateSettings,
} from './queries';
import { Account, Transaction, Budget, Goal, Settings, Bill } from '@/types';

// Account Actions
export async function actionCreateAccount(data: {
  name: string;
  type: 'cash' | 'bank' | 'ewallet' | 'credit' | 'savings';
  is_liability: boolean;
  logo_key: string | null;
  color: string;
  opening_balance_minor: number;
}) {
  const result = await createAccount(data);
  revalidatePath('/accounts');
  revalidatePath('/');
  return result;
}

export async function actionUpdateAccount(id: number, partial: Partial<Account>) {
  const result = await updateAccount(id, partial);
  revalidatePath('/accounts');
  revalidatePath(`/account/${id}`);
  revalidatePath('/');
  return result;
}

export async function actionArchiveAccount(id: number) {
  const result = await archiveAccount(id);
  revalidatePath('/accounts');
  revalidatePath(`/account/${id}`);
  revalidatePath('/');
  return result;
}

export async function actionUnarchiveAccount(id: number) {
  const result = await unarchiveAccount(id);
  revalidatePath('/accounts');
  revalidatePath(`/account/${id}`);
  revalidatePath('/');
  return result;
}

export async function actionDeleteAccount(id: number) {
  const result = await deleteAccountHard(id);
  revalidatePath('/accounts');
  revalidatePath('/');
  return result;
}

// Transaction Actions
export async function actionAddTransaction(data: {
  type: 'income' | 'expense' | 'transfer';
  account_id: number;
  to_account_id?: number | null;
  amount_minor: number;
  category_id?: number | null;
  note?: string | null;
  date: number;
}) {
  const result = await insertTransaction(data);
  revalidatePath('/');
  revalidatePath('/accounts');
  revalidatePath(`/account/${data.account_id}`);
  if (data.to_account_id) {
    revalidatePath(`/account/${data.to_account_id}`);
  }
  revalidatePath('/plan'); // Revalidate budgets in case
  return result;
}

// Bill Actions
export async function actionCreateBill(data: {
  name: string;
  amount_minor: number;
  due_date: number;
  recurrence: 'none' | 'weekly' | 'monthly';
  account_id?: number | null;
  category_id?: number | null;
  logo_key?: string | null;
}) {
  const result = await createBill(data);
  revalidatePath('/plan');
  revalidatePath('/');
  return result;
}

export async function actionMarkBillPaid(billId: number, fromAccountId: number) {
  const result = await markBillPaid(billId, fromAccountId);
  revalidatePath('/plan');
  revalidatePath('/accounts');
  revalidatePath(`/account/${fromAccountId}`);
  revalidatePath('/');
  return result;
}

export async function actionDeleteBill(id: number) {
  const result = await deleteBill(id);
  revalidatePath('/plan');
  revalidatePath('/');
  return result;
}

// Budget Actions
export async function actionCreateBudget(categoryId: number, amountMinor: number, year: number, month: number) {
  const startMonthStr = `${year}-${String(month).padStart(2, '0')}`;
  
  const { data: existing } = await supabase
    .from('budgets')
    .select('id')
    .eq('category_id', categoryId)
    .eq('start_month', startMonthStr)
    .maybeSingle();

  if (existing) {
    await supabase.from('budgets').update({ amount_minor: amountMinor }).eq('id', existing.id);
  } else {
    await supabase.from('budgets').insert({
      category_id: categoryId,
      amount_minor: amountMinor,
      period: 'monthly',
      start_month: startMonthStr,
    });
  }

  revalidatePath('/plan');
  revalidatePath('/');
}

export async function actionDeleteBudget(id: number) {
  await supabase.from('budgets').delete().eq('id', id);
  revalidatePath('/plan');
  revalidatePath('/');
}

// Savings Goal Actions
export async function actionCreateGoal(params: {
  name: string;
  target_amount_minor: number;
  current_amount_minor: number;
  deadline: number | null;
  color: string;
  icon: string;
}) {
  const { data, error } = await supabase
    .from('goals')
    .insert({
      name: params.name,
      target_amount_minor: params.target_amount_minor,
      current_amount_minor: params.current_amount_minor,
      icon: params.icon,
      color: params.color,
      deadline: params.deadline,
      created_at: Date.now(),
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/plan');
  revalidatePath('/');
  return data;
}

export async function actionUpdateGoalProgress(id: number, currentMinor: number) {
  await supabase.from('goals').update({ current_amount_minor: currentMinor }).eq('id', id);
  revalidatePath('/plan');
  revalidatePath('/');
}

export async function actionDeleteGoal(id: number) {
  await supabase.from('goals').delete().eq('id', id);
  revalidatePath('/plan');
  revalidatePath('/');
}

// Settings Actions
export async function actionUpdateSettings(data: Partial<Settings>) {
  const result = await updateSettings(data);
  revalidatePath('/');
  revalidatePath('/settings');
  revalidatePath('/plan');
  return result;
}

// Backup Import Actions
export async function actionImportBackup(data: {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  settings: Settings | null;
  bills: Bill[];
}) {
  // Clear tables first (using cascades and constraints)
  await supabase.from('transactions').delete().neq('id', 0);
  await supabase.from('accounts').delete().neq('id', 0);
  await supabase.from('budgets').delete().neq('id', 0);
  await supabase.from('goals').delete().neq('id', 0);
  await supabase.from('bills').delete().neq('id', 0);

  // Re-populate tables
  if (data.accounts && data.accounts.length > 0) {
    const { error } = await supabase.from('accounts').insert(data.accounts);
    if (error) throw error;
  }
  
  if (data.transactions && data.transactions.length > 0) {
    const { error } = await supabase.from('transactions').insert(data.transactions);
    if (error) throw error;
  }
  
  if (data.budgets && data.budgets.length > 0) {
    const { error } = await supabase.from('budgets').insert(data.budgets);
    if (error) throw error;
  }
  
  if (data.goals && data.goals.length > 0) {
    const { error } = await supabase.from('goals').insert(data.goals);
    if (error) throw error;
  }
  
  if (data.bills && data.bills.length > 0) {
    const { error } = await supabase.from('bills').insert(data.bills);
    if (error) throw error;
  }

  if (data.settings) {
    const { error } = await supabase.from('settings').update(data.settings).eq('id', 1);
    if (error) throw error;
  }

  revalidatePath('/');
  revalidatePath('/accounts');
  revalidatePath('/plan');
  revalidatePath('/settings');
  return { success: true };
}
