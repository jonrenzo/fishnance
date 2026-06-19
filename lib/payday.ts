import { addMonths } from 'date-fns';

export function nextPayday(
  s: { pay_cycle?: string | null; pay_days?: string | null } | null,
  from = new Date()
): Date | null {
  if (!s?.pay_cycle) return null;
  
  let days: number[];
  try {
    days = JSON.parse(s.pay_days ?? '[30]');
  } catch {
    days = [30];
  }
  
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  if (s.pay_cycle === 'monthly' || s.pay_cycle === 'semimonthly') {
    const sorted = [...days].sort((a, b) => a - b);
    for (const day of sorted) {
      // Create candidate date
      const candidate = new Date(today.getFullYear(), today.getMonth(), day);
      if (candidate > today) return candidate;
    }
    const nm = addMonths(today, 1);
    return new Date(nm.getFullYear(), nm.getMonth(), sorted[0]);
  }

  if (s.pay_cycle === 'weekly' || s.pay_cycle === 'biweekly') {
    const targetDow = days[0] ?? 5; // default Friday
    const todayDow = today.getDay();
    
    // If it's today and we want it to be next week/bi-weekly, or calculate next occurrence
    const gap = ((targetDow - todayDow + 7) % 7) || (s.pay_cycle === 'biweekly' ? 14 : 7);
    
    const next = new Date(today);
    next.setDate(today.getDate() + gap);
    return next;
  }
  return null;
}
