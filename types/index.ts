export type Account = {
  id: number;
  name: string;
  type: 'cash' | 'bank' | 'ewallet' | 'credit' | 'savings';
  is_liability: boolean;
  logo_key: string | null;
  custom_image_uri: string | null;
  color: string;
  archived: boolean;
  created_at: number;
};

export type Category = {
  id: number;
  name: string;
  parent_id: number | null;
  kind: 'income' | 'expense';
  icon: string;
  color: string;
};

export type Transaction = {
  id: number;
  type: 'income' | 'expense' | 'transfer';
  account_id: number;
  to_account_id: number | null;
  amount_minor: number;
  category_id: number | null;
  note: string | null;
  date: number;
  created_at: number;
};

export type Budget = {
  id: number;
  category_id: number;
  amount_minor: number;
  period: 'monthly';
  start_month: string;
};

export type Goal = {
  id: number;
  name: string;
  target_amount_minor: number;
  current_amount_minor: number;
  icon: string;
  color: string;
  deadline: number | null;
  created_at: number;
};

export type Settings = {
  id: number;
  currency_code: string;
  currency_symbol: string;
  locale: string;
  onboarded: boolean;
  display_name: string | null;
  avatar_uri: string | null;
  pay_cycle: string;
  pay_days: string;
};

export type Bill = {
  id: number;
  name: string;
  amount_minor: number;
  account_id: number | null;
  category_id: number | null;
  logo_key: string | null;
  due_date: number;
  recurrence: 'none' | 'weekly' | 'monthly';
  last_paid_date: number | null;
  archived: boolean;
  created_at: number;
};
