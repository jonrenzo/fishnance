'use client';

interface MonogramBadgeProps {
  initials: string;
  color: string;
  bgColor: string;
  size?: number;
}

export default function MonogramBadge({
  initials,
  color,
  bgColor,
  size = 40,
}: MonogramBadgeProps) {
  const fontSize = size * 0.32;
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: bgColor,
        color: color,
        fontSize: `${fontSize}px`,
      }}
      className="rounded-full flex items-center justify-center font-black select-none border border-black/[0.04]"
    >
      <span>{initials}</span>
    </div>
  );
}
