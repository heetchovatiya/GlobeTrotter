import React, { useEffect, useMemo, useRef, useState } from 'react';
import { City } from '../../types';
import { MapPin, Search } from 'lucide-react';

interface CitySelectProps {
  cities: City[];
  value: number;
  onChange: (cityId: number) => void;
  label?: string;
  placeholder?: string;
}

export const CitySelect: React.FC<CitySelectProps> = ({
  cities,
  value,
  onChange,
  label = 'Destination City',
  placeholder = 'Search cities...',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const selected = cities.find((c) => c.id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
    );
  }, [cities, query]);

  const displayValue =
    isOpen || query
      ? query
      : selected
        ? `${selected.name}, ${selected.country}`
        : '';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (city: City) => {
    onChange(city.id);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleInputChange = (nextQuery: string) => {
    setQuery(nextQuery);
    setIsOpen(true);
  };

  const handleFocus = () => {
    setIsOpen(true);
    if (selected && !query) {
      setQuery(`${selected.name}, ${selected.country}`);
    }
    requestAnimationFrame(() => inputRef.current?.select());
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && filtered.length > 0) {
      event.preventDefault();
      handleSelect(filtered[0]);
    }
    if (event.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
      inputRef.current?.blur();
    }
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
      )}

      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="city-select-listbox"
          className="block w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />

        {isOpen && (
          <ul
            id="city-select-listbox"
            role="listbox"
            className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          >
            {filtered.length === 0 ? (
              <li className="px-4 py-2.5 text-sm text-slate-500">No cities match your search</li>
            ) : (
              filtered.map((city) => (
                <li key={city.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={city.id === value}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(city)}
                    className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-brand-50 ${
                      city.id === value
                        ? 'bg-brand-50 font-semibold text-brand-800'
                        : 'text-slate-800'
                    }`}
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                    <span>
                      {city.name}, {city.country}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {selected && !isOpen && !query && (
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-brand-500" />
          Selected:{' '}
          <span className="font-semibold text-slate-700">
            {selected.name}, {selected.country}
          </span>
        </p>
      )}
    </div>
  );
};
