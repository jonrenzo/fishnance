import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip redirect for onboarding, static files, API routes, or assets
  if (
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const { data } = await supabase
      .from('settings')
      .select('onboarded')
      .eq('id', 1)
      .maybeSingle();

    if (data && !data.onboarded) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  } catch (err) {
    console.error('Proxy settings fetch error:', err);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json)$).*)'],
};
