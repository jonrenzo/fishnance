'use client';

interface SegmentedToggleProps<T extends string> {
  options: readonly T[] | T[];
  value: T;
  onChange: (value: T) => void;
  formatLabel?: (option: T) => string;
}

export default function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  formatLabel = (opt) => opt.charAt(0).toUpperCase() + opt.slice(1),
}: SegmentedToggleProps<T>) {
  return (
    <div className="flex bg-bg border border-border p-1 rounded-full w-full">
      {options.map((option) => {
        const isActive = option === value;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`flex-1 text-center py-2 text-[12px] font-extrabold rounded-full transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-teal text-white shadow-sm'
                : 'text-muted hover:text-dark'
            }`}
          >
            {formatLabel(option)}
          </button>
        );
      })}
    </div>
  );
}
