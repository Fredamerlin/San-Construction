interface FilterTabsProps<T extends string> {
  /** Accessible name for the group, e.g. "Filter projects". */
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Background of inactive tabs, to sit on dark or card sections. */
  tone?: 'ink' | 'card';
  className?: string;
}

/** Row of toggle buttons (reference gallery filters). The active one is gold and aria-pressed. */
export function FilterTabs<T extends string>({ label, options, value, onChange, tone = 'ink', className = '' }: FilterTabsProps<T>) {
  return (
    <div role="group" aria-label={label} className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`min-h-11 rounded-xl px-4 py-2 text-xs font-semibold uppercase transition-colors ${
              active
                ? 'bg-gold text-black'
                : `${tone === 'ink' ? 'bg-ink' : 'bg-card'} border border-white/10 text-gray-300 hover:border-gold hover:text-white`
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
