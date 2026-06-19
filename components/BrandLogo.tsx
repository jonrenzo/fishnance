'use client';

import { useState } from 'react';
import { getBankLogo } from '@/lib/bankLogos';
import MonogramBadge from './MonogramBadge';

interface BrandLogoProps {
  logoKey: string | null;
  size?: number;
}

export default function BrandLogo({ logoKey, size = 40 }: BrandLogoProps) {
  const [prevLogoKey, setPrevLogoKey] = useState<string | null>(logoKey);
  const [srcIndex, setSrcIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  if (logoKey !== prevLogoKey) {
    setPrevLogoKey(logoKey);
    setSrcIndex(0);
    setFailed(false);
  }

  const bank = logoKey ? getBankLogo(logoKey) : undefined;
  const domain = bank?.domain;

  // If there's no logoKey or no domain, or it has failed the waterfall completely
  if (!logoKey || !bank) {
    return <MonogramBadge initials="?" color="#8AACAE" bgColor="#E8F4F5" size={size} />;
  }

  if (logoKey === 'cash') {
    return <MonogramBadge initials="₱" color="#22C55E" bgColor="#DCFCE7" size={size} />;
  }

  if (!domain || failed) {
    return (
      <MonogramBadge
        initials={bank.initials}
        color={bank.color}
        bgColor={bank.bgColor}
        size={size}
      />
    );
  }

  // Waterfall URLs
  const urls = [
    `https://icon.horse/icon/${domain}`,
    `https://www.${domain}/favicon.ico`,
    `https://${domain}/favicon.ico`,
  ];

  const handleImageError = () => {
    if (srcIndex < urls.length - 1) {
      setSrcIndex(srcIndex + 1);
    } else {
      setFailed(true);
    }
  };

  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-white border border-black/[0.04]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={urls[srcIndex]}
        alt={bank.name}
        onError={handleImageError}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
