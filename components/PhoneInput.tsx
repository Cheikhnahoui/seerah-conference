'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getCountryOptions,
  formatAsYouType,
  type CountryCode,
} from '@/lib/phone';

interface PhoneInputProps {
  /** Raw/local value as displayed in the text field (not E.164). */
  value: string;
  /** Currently selected country (ISO-3166 alpha-2). */
  country: CountryCode;
  /** Fired on every keystroke or country change. */
  onChange: (value: string, country: CountryCode) => void;
  lang?: 'ar' | 'fr';
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsLabel?: string;
}

export function PhoneInput({
  value,
  country,
  onChange,
  lang = 'ar',
  disabled,
  placeholder,
  searchPlaceholder,
  noResultsLabel,
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const countries = useMemo(() => getCountryOptions(lang), [lang]);
  const selected = countries.find((c) => c.code === country) || countries[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return countries;
    const q = query.trim().toLowerCase();
    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dialCode.includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [countries, query]);

  const handleTextChange = (raw: string) => {
    const formatted = formatAsYouType(raw, country);
    onChange(formatted, country);
  };

  const handleCountrySelect = (code: CountryCode) => {
    // Reformat whatever digits are already typed under the new country.
    const digitsOnly = value.replace(/\D/g, '');
    const formatted = formatAsYouType(digitsOnly, code);
    onChange(formatted, code);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="flex gap-2">
      <input
        type="tel"
        inputMode="tel"
        value={value}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="input-islamic flex-1 px-4 py-3 rounded-xl text-base min-w-0"
        dir="ltr"
        style={{ textAlign: 'left', fontFamily: 'monospace', letterSpacing: '0.03em', color: '#1a1a1a' }}
      />

      <div ref={containerRef} className="relative flex-shrink-0">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 px-3 py-3 rounded-xl text-sm font-bold h-full"
          style={{
            background: 'rgba(26, 92, 42, 0.1)',
            border: '1.5px solid rgba(26, 92, 42, 0.4)',
            color: 'var(--color-green)',
            fontFamily: 'monospace',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          <span>{selected?.flag}</span>
          <span dir="ltr">{selected?.dialCode}</span>
          <span style={{ fontSize: '10px' }}>▾</span>
        </button>

        {open && (
          <div
            className="absolute z-50 mt-1 rounded-xl overflow-hidden"
            style={{
              [lang === 'ar' ? 'right' : 'left']: 0,
              width: 'min(85vw, 280px)',
              maxHeight: '280px',
              background: '#fff',
              border: '1px solid rgba(0,0,0,0.1)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            } as React.CSSProperties}
          >
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder || (lang === 'ar' ? 'ابحث عن دولة...' : 'Rechercher un pays...')}
              className="w-full px-3 py-2 text-sm outline-none"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', color: '#1a1a1a' }}
            />
            <div style={{ overflowY: 'auto', maxHeight: '232px' }}>
              {filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCountrySelect(c.code)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-black/5"
                  style={{
                    background: c.code === country ? 'rgba(201,168,76,0.12)' : undefined,
                    color: '#1a1a1a',
                    textAlign: lang === 'ar' ? 'right' : 'left',
                  }}
                >
                  <span>{c.flag}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span dir="ltr" style={{ color: '#888', fontFamily: 'monospace' }}>{c.dialCode}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-3 py-3 text-xs text-center" style={{ color: '#888' }}>
                  {noResultsLabel || (lang === 'ar' ? 'لا توجد نتائج' : 'Aucun résultat')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}