import {
  parsePhoneNumberFromString,
  AsYouType,
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  type CountryCode,
} from 'libphonenumber-js';
import examples from 'libphonenumber-js/examples.mobile.json';

export type { CountryCode };

export interface CountryOption {
  code: CountryCode;
  name: string;
  dialCode: string; // e.g. "+222"
  flag: string;
}

export const DEFAULT_COUNTRY: CountryCode = 'MR';

/** Converts an ISO-3166 alpha-2 code (e.g. "MR") into its flag emoji. */
function isoToFlagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

const countryCache: Partial<Record<string, CountryOption[]>> = {};

/**
 * Returns every country/territory supported by libphonenumber-js, with
 * a localized name (via Intl.DisplayNames — no hand-maintained list),
 * its dialing code, and its flag emoji. Mauritania is pinned first so
 * it stays the natural default choice in the UI.
 */
export function getCountryOptions(lang: 'ar' | 'fr' = 'ar'): CountryOption[] {
  const cacheKey = lang;
  if (countryCache[cacheKey]) return countryCache[cacheKey]!;

  let displayNames: Intl.DisplayNames | null = null;
  try {
    displayNames = new Intl.DisplayNames([lang === 'ar' ? 'ar' : 'fr'], { type: 'region' });
  } catch {
    displayNames = null;
  }

  const options: CountryOption[] = getCountries().map((iso2) => {
    let name: string = iso2;
    try {
      name = displayNames?.of(iso2) || iso2;
    } catch {
      name = iso2;
    }
    return {
      code: iso2,
      name,
      dialCode: `+${getCountryCallingCode(iso2)}`,
      flag: isoToFlagEmoji(iso2),
    };
  });

  options.sort((a, b) => a.name.localeCompare(lang === 'ar' ? 'ar' : 'fr'));

  // Pin Mauritania to the top since it's the default/most common choice here.
  const mrIndex = options.findIndex((c) => c.code === DEFAULT_COUNTRY);
  if (mrIndex > 0) {
    const [mr] = options.splice(mrIndex, 1);
    options.unshift(mr);
  }

  countryCache[cacheKey] = options;
  return options;
}

/** Formats the number progressively as the user types (spacing, grouping). */
export function formatAsYouType(rawValue: string, country: CountryCode): string {
  try {
    const formatter = new AsYouType(country);
    return formatter.input(rawValue);
  } catch {
    return rawValue;
  }
}

const exampleCache: Partial<Record<CountryCode, string>> = {};

/**
 * Returns a real, country-specific example number in national format
 * (e.g. Mauritania -> "22 12 34 56", France -> "06 12 34 56 78",
 * US -> "(201) 555-0123"), sourced from libphonenumber-js's official
 * per-country metadata — never a hardcoded, one-size-fits-all example.
 */
export function getPhoneExample(country: CountryCode): string {
  if (exampleCache[country] !== undefined) return exampleCache[country]!;
  try {
    const example = getExampleNumber(country, examples as any);
    const formatted = example ? example.formatNational() : '';
    exampleCache[country] = formatted;
    return formatted;
  } catch {
    exampleCache[country] = '';
    return '';
  }
}

/** Returns the strict E.164 form (e.g. "+22222123456") or null if invalid. */
export function toE164(rawValue: string, country: CountryCode): string | null {
  try {
    const parsed = parsePhoneNumberFromString(rawValue, country);
    return parsed && parsed.isValid() ? parsed.number : null;
  } catch {
    return null;
  }
}

export function isValidPhoneForCountry(rawValue: string, country: CountryCode): boolean {
  try {
    const parsed = parsePhoneNumberFromString(rawValue, country);
    return !!parsed && parsed.isValid();
  } catch {
    return false;
  }
}

/**
 * Best-effort normalization of ANY phone input — E.164, legacy
 * digits-only, or with spaces/dashes/parentheses — into E.164 for
 * searching. Also returns the "legacy" digits-only form (no leading
 * "+") so old Mauritanian records saved before this update still match.
 */
export function normalizeSearchPhone(
  rawValue: string,
  fallbackCountry: CountryCode = DEFAULT_COUNTRY
): { e164: string | null; legacyDigits: string } {
  const trimmed = rawValue.trim();
  let e164: string | null = null;

  try {
    const parsed = trimmed.startsWith('+')
      ? parsePhoneNumberFromString(trimmed)
      : parsePhoneNumberFromString(trimmed, fallbackCountry);
    e164 = parsed && parsed.isValid() ? parsed.number : null;
  } catch {
    e164 = null;
  }

  const legacyDigits = trimmed.replace(/\D/g, '');
  return { e164, legacyDigits };
}

/**
 * Splits a stored phone number (E.164, or legacy digits-only) back
 * into { country, national } so an edit form can prefill the country
 * selector and the local-format field correctly.
 */
export function splitPhoneForEditing(
  storedPhone: string,
  fallbackCountry: CountryCode = DEFAULT_COUNTRY
): { country: CountryCode; national: string } {
  const value = storedPhone.trim().startsWith('+') ? storedPhone.trim() : `+${storedPhone.trim()}`;

  try {
    const parsed = parsePhoneNumberFromString(value);
    if (parsed && parsed.isValid()) {
      return {
        country: (parsed.country as CountryCode) || fallbackCountry,
        national: parsed.formatNational(),
      };
    }
  } catch {
    // fall through to default
  }

  return { country: fallbackCountry, national: storedPhone };
}

/** Human-friendly international display, e.g. "+222 22 21 23 456". */
export function formatForDisplay(storedPhone: string): string {
  if (isPlaceholderPhone(storedPhone)) return '';

  const value = storedPhone.trim().startsWith('+') ? storedPhone.trim() : `+${storedPhone.trim()}`;
  try {
    const parsed = parsePhoneNumberFromString(value);
    if (parsed && parsed.isValid()) return parsed.formatInternational();
  } catch {
    // ignore
  }
  return storedPhone;
}

/**
 * For attendees whose phone number is unknown (e.g. bulk-imported
 * guests), we still need a unique, non-null value to satisfy the
 * database and the duplicate-check logic — this is never shown to
 * anyone and never treated as a real, contactable phone number.
 */
export function generatePlaceholderPhone(): string {
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `NOPHONE-${random}-${Date.now().toString(36).toUpperCase()}`;
}

export function isPlaceholderPhone(phone: string | null | undefined): boolean {
  return !!phone && phone.startsWith('NOPHONE-');
}