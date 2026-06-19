'use client';

import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import BottomNav from './BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname === '/onboarding';

  return (
    <>
      <main className={isOnboarding ? '' : 'pb-[calc(7.25rem+env(safe-area-inset-bottom))]'}>
        {children}
      </main>
      {!isOnboarding && (
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      )}
    </>
  );
}
