'use client';

import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { Wallet, CreditCard, Plus, BarChart2, Settings as SettingsIcon } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically load AddTransactionSheet since it's heavy and only shown on demand
const AddTransactionSheet = dynamic(() => import('./AddTransactionSheet'), {
  ssr: false,
});

export default function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const isAddOpen = searchParams.get('add') === 'true';

  const closeAddSheet = () => {
    // Remove ?add=true from URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete('add');
    const queryString = params.toString();
    router.push(pathname + (queryString ? `?${queryString}` : ''), { scroll: false });
  };

  const handleFabClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set('add', 'true');
    router.push(pathname + `?${params.toString()}`, { scroll: false });
  };

  return (
    <>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] z-40">
        <div className="bg-white rounded-[36px] shadow-[0_8px_32px_rgba(13,157,168,0.18)] border border-border px-4 py-3 flex items-center justify-between relative">
          
          {/* Wallet Tab */}
          <Link
            href="/"
            className={`flex flex-col items-center gap-0.5 flex-1 cursor-pointer transition-colors duration-200 ${
              pathname === '/' ? 'text-teal font-extrabold' : 'text-muted hover:text-dark'
            }`}
          >
            <Wallet size={22} className={pathname === '/' ? 'stroke-[2.5px]' : 'stroke-[2px]'} />
            <span className="text-[10px]">Wallet</span>
          </Link>

          {/* Accounts Tab */}
          <Link
            href="/accounts"
            className={`flex flex-col items-center gap-0.5 flex-1 cursor-pointer transition-colors duration-200 ${
              pathname.startsWith('/accounts') || pathname.startsWith('/account/')
                ? 'text-teal font-extrabold'
                : 'text-muted hover:text-dark'
            }`}
          >
            <CreditCard
              size={22}
              className={
                pathname.startsWith('/accounts') || pathname.startsWith('/account/')
                  ? 'stroke-[2.5px]'
                  : 'stroke-[2px]'
              }
            />
            <span className="text-[10px]">Accounts</span>
          </Link>

          {/* Center FAB Button */}
          <div className="flex-1 flex justify-center -mt-8 relative z-50">
            <button
              onClick={handleFabClick}
              className="w-14 h-14 rounded-full bg-teal flex items-center justify-center text-white shadow-[0_4px_16px_rgba(13,157,168,0.4)] hover:bg-teal-light hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Plus size={26} className="stroke-[3px]" />
            </button>
          </div>

          {/* Plan Tab */}
          <Link
            href="/plan"
            className={`flex flex-col items-center gap-0.5 flex-1 cursor-pointer transition-colors duration-200 ${
              pathname.startsWith('/plan') ? 'text-teal font-extrabold' : 'text-muted hover:text-dark'
            }`}
          >
            <BarChart2
              size={22}
              className={pathname.startsWith('/plan') ? 'stroke-[2.5px]' : 'stroke-[2px]'}
            />
            <span className="text-[10px]">Plan</span>
          </Link>

          {/* Settings Tab */}
          <Link
            href="/settings"
            className={`flex flex-col items-center gap-0.5 flex-1 cursor-pointer transition-colors duration-200 ${
              pathname.startsWith('/settings') ? 'text-teal font-extrabold' : 'text-muted hover:text-dark'
            }`}
          >
            <SettingsIcon
              size={22}
              className={pathname.startsWith('/settings') ? 'stroke-[2.5px]' : 'stroke-[2px]'}
            />
            <span className="text-[10px]">Settings</span>
          </Link>

        </div>
      </div>

      {/* Add Transaction Sheet Modal Overlay */}
      {isAddOpen && <AddTransactionSheet isOpen={isAddOpen} onClose={closeAddSheet} />}
    </>
  );
}
