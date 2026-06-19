import Fuse from 'fuse.js';

export type BankLogo = {
  key: string;
  name: string;
  aliases: string[];
  color: string;
  bgColor: string;
  initials: string;
  type: 'cash' | 'bank' | 'ewallet' | 'credit' | 'savings';
  domain?: string;
};

export const BANK_LOGOS: BankLogo[] = [
  { key: 'cash', name: 'Cash', aliases: ['cash', 'wallet', 'pera', 'money', 'kwarta'], color: '#22C55E', bgColor: '#DCFCE7', initials: '₱', type: 'cash' },
  { key: 'bpi', name: 'BPI', aliases: ['bpi', 'bank of the philippine islands', 'bankofphilippineislands'], color: '#DC2626', bgColor: '#FEE2E2', initials: 'BPI', type: 'bank', domain: 'bpi.com.ph' },
  { key: 'bdo', name: 'BDO', aliases: ['bdo', 'banco de oro', 'bancodeoro'], color: '#1D4ED8', bgColor: '#DBEAFE', initials: 'BDO', type: 'bank', domain: 'bdo.com.ph' },
  { key: 'metrobank', name: 'Metrobank', aliases: ['metrobank', 'metro bank', 'metropolitan bank'], color: '#1E40AF', bgColor: '#DBEAFE', initials: 'MB', type: 'bank', domain: 'metrobank.com.ph' },
  { key: 'unionbank', name: 'UnionBank', aliases: ['unionbank', 'union bank', 'ub'], color: '#7C3AED', bgColor: '#EDE9FE', initials: 'UB', type: 'bank', domain: 'unionbankph.com' },
  { key: 'pnb', name: 'PNB', aliases: ['pnb', 'philippine national bank', 'national bank'], color: '#B45309', bgColor: '#FEF3C7', initials: 'PNB', type: 'bank', domain: 'pnb.com.ph' },
  { key: 'landbank', name: 'Landbank', aliases: ['landbank', 'land bank', 'lbp'], color: '#166534', bgColor: '#DCFCE7', initials: 'LB', type: 'bank', domain: 'landbank.com' },
  { key: 'securitybank', name: 'Security Bank', aliases: ['security bank', 'securitybank', 'sb', 'secu'], color: '#9A3412', bgColor: '#FFEDD5', initials: 'SB', type: 'bank', domain: 'securitybank.com' },
  { key: 'rcbc', name: 'RCBC', aliases: ['rcbc', 'rizal commercial banking', 'rcbc savings'], color: '#15803D', bgColor: '#DCFCE7', initials: 'RCBC', type: 'bank', domain: 'rcbc.com' },
  { key: 'chinabank', name: 'China Bank', aliases: ['chinabank', 'china bank', 'cbc'], color: '#991B1B', bgColor: '#FEE2E2', initials: 'CBC', type: 'bank', domain: 'chinabank.ph' },
  { key: 'psbank', name: 'PSBank', aliases: ['psbank', 'ps bank', 'philippine savings bank'], color: '#1D4ED8', bgColor: '#DBEAFE', initials: 'PSB', type: 'bank', domain: 'psbank.com.ph' },
  { key: 'gcash', name: 'GCash', aliases: ['gcash', 'g-cash', 'g cash', 'gc'], color: '#1D4ED8', bgColor: '#DBEAFE', initials: 'G', type: 'ewallet', domain: 'gcash.com' },
  { key: 'maya', name: 'Maya', aliases: ['maya', 'paymaya', 'pay maya', 'maya ph'], color: '#059669', bgColor: '#DCFCE7', initials: 'M', type: 'ewallet', domain: 'maya.ph' },
  { key: 'gotyme', name: 'GoTyme', aliases: ['gotyme', 'go tyme', 'tyme'], color: '#7C3AED', bgColor: '#EDE9FE', initials: 'GT', type: 'ewallet' },
  { key: 'seabank', name: 'SeaBank', aliases: ['seabank', 'sea bank', 'sea money'], color: '#0E7490', bgColor: '#CFFAFE', initials: 'SB', type: 'bank', domain: 'seabank.ph' },
  { key: 'tonik', name: 'Tonik', aliases: ['tonik', 'tonik bank'], color: '#7C3AED', bgColor: '#EDE9FE', initials: 'T', type: 'bank', domain: 'tonikbank.com' },
  { key: 'cimb', name: 'CIMB', aliases: ['cimb', 'cimb bank'], color: '#DC2626', bgColor: '#FEE2E2', initials: 'CIMB', type: 'bank', domain: 'cimbbank.com.ph' },
  { key: 'coins', name: 'Coins.ph', aliases: ['coins', 'coins.ph', 'coinsph'], color: '#F59E0B', bgColor: '#FEF3C7', initials: 'C', type: 'ewallet', domain: 'coins.ph' },
  { key: 'paypal', name: 'PayPal', aliases: ['paypal', 'pay pal', 'pp'], color: '#1D4ED8', bgColor: '#DBEAFE', initials: 'PP', type: 'ewallet', domain: 'paypal.com' },
  { key: 'creditcard', name: 'Credit Card', aliases: ['credit card', 'creditcard', 'cc', 'visa', 'mastercard', 'amex', 'credit'], color: '#DC2626', bgColor: '#FEE2E2', initials: 'CC', type: 'credit' },
  { key: 'savings', name: 'Savings', aliases: ['savings', 'savings account', 'ipon'], color: '#0D9DA8', bgColor: '#CFFAFE', initials: 'S', type: 'savings' },
];

const fuse = new Fuse(
  BANK_LOGOS.flatMap(b => b.aliases.map(alias => ({ alias, key: b.key }))),
  { keys: ['alias'], threshold: 0.3, includeScore: true }
);

export function matchLogoKey(name: string): string | undefined {
  const normalized = name.toLowerCase().trim();
  const results = fuse.search(normalized);
  if (!results.length) return undefined;
  const best = results[0];
  if (best.score !== undefined && best.score > 0.4) return undefined;
  return best.item.key;
}

export function getBankLogo(key: string): BankLogo | undefined {
  return BANK_LOGOS.find(b => b.key === key);
}
