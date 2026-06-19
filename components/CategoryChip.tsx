'use client';

import { createElement } from 'react';
import { getCategoryIcon } from '@/lib/categoryIcons';
import { Category } from '@/types';

interface CategoryChipProps {
  category: Category;
  isActive: boolean;
  onClick: () => void;
}

export default function CategoryChip({ category, isActive, onClick }: CategoryChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-4 py-2 border-2 text-[13px] font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
        isActive
          ? 'bg-teal border-teal text-white shadow-sm'
          : 'bg-white border-border text-dark hover:border-border-mid'
      }`}
    >
      {createElement(getCategoryIcon(category.icon), {
        size: 14,
        style: { color: isActive ? '#FFFFFF' : category.color },
        className: 'flex-shrink-0',
      })}
      <span>{category.name}</span>
    </button>
  );
}
