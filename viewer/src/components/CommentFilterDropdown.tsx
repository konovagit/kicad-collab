import { useState, useEffect, useRef, useCallback } from 'react';

interface CommentFilterDropdownProps {
  currentFilter: 'all' | 'open' | 'resolved';
  onFilterChange: (filter: 'all' | 'open' | 'resolved') => void;
  counts: { total: number; open: number; resolved: number };
}

/**
 * Dropdown for filtering comments by status.
 * Shows All, Open, and Resolved options with counts.
 *
 * Story 3.4: Comment Status & Filtering
 */
export function CommentFilterDropdown({
  currentFilter,
  onFilterChange,
  counts,
}: CommentFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options: Array<{ value: 'all' | 'open' | 'resolved'; label: string; count: number }> = [
    { value: 'all', label: 'All', count: counts.total },
    { value: 'open', label: 'Open', count: counts.open },
    { value: 'resolved', label: 'Resolved', count: counts.resolved },
  ];

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = useCallback(
    (filter: 'all' | 'open' | 'resolved') => {
      onFilterChange(filter);
      setIsOpen(false);
    },
    [onFilterChange]
  );

  const currentLabel = options.find((o) => o.value === currentFilter)?.label || 'All';

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Filter comments: ${currentLabel}`}
      >
        {currentLabel}
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-lg z-10"
          role="listbox"
        >
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`w-full px-3 py-2 text-sm text-left flex justify-between items-center hover:bg-gray-50 ${
                currentFilter === option.value ? 'bg-blue-50 text-blue-700' : ''
              }`}
              role="option"
              aria-selected={currentFilter === option.value}
            >
              <span>{option.label}</span>
              <span className="text-xs text-gray-400">{option.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
