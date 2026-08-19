/**
 * Automatic bilingual (Arabic / French) conference-date handling.
 *
 * The admin types the date as plain TEXT, once per calendar
 * (Hijri and Gregorian) — e.g. "21 – 23 ربيع الأول 1448هـ". The
 * French version is generated automatically by translating the
 * month name (and the "هـ"/"م" markers) found inside that text, so
 * numbers, dashes, and spacing are preserved exactly as typed.
 */

export const HIJRI_MONTHS: { ar: string; fr: string }[] = [
  { ar: 'محرم', fr: 'Mouharram' },
  { ar: 'صفر', fr: 'Safar' },
  { ar: 'ربيع الأول', fr: 'Rabi al-Awwal' },
  { ar: 'ربيع الآخر', fr: 'Rabi al-Thani' },
  { ar: 'جمادى الأولى', fr: 'Joumada al-Oula' },
  { ar: 'جمادى الآخرة', fr: 'Joumada al-Thania' },
  { ar: 'رجب', fr: 'Rajab' },
  { ar: 'شعبان', fr: 'Chaabane' },
  { ar: 'رمضان', fr: 'Ramadan' },
  { ar: 'شوال', fr: 'Chawwal' },
  { ar: 'ذو القعدة', fr: "Dhou al-Qi'da" },
  { ar: 'ذو الحجة', fr: 'Dhou al-Hijja' },
];

export const GREGORIAN_MONTHS: { ar: string; fr: string }[] = [
  { ar: 'يناير', fr: 'janvier' },
  { ar: 'فبراير', fr: 'février' },
  { ar: 'مارس', fr: 'mars' },
  { ar: 'أبريل', fr: 'avril' },
  { ar: 'مايو', fr: 'mai' },
  { ar: 'يونيو', fr: 'juin' },
  { ar: 'يوليو', fr: 'juillet' },
  { ar: 'أغسطس', fr: 'août' },
  { ar: 'سبتمبر', fr: 'septembre' },
  { ar: 'أكتوبر', fr: 'octobre' },
  { ar: 'نوفمبر', fr: 'novembre' },
  { ar: 'ديسمبر', fr: 'décembre' },
];

/**
 * Translates any free-text Arabic date string into French by:
 *  - replacing the Hijri/Gregorian month name (if found) with its
 *    French equivalent,
 *  - replacing the "هـ" (Hijri year marker) with "H",
 *  - dropping the trailing "م" (Gregorian year marker) since French
 *    years don't take one.
 * Numbers, dashes ("–"/"-") and spacing are left exactly as typed.
 */
export function translateDateText(arabicText: string): string {
  if (!arabicText) return '';

  let result = arabicText;

  const allMonths = [...HIJRI_MONTHS, ...GREGORIAN_MONTHS].sort(
    (a, b) => b.ar.length - a.ar.length
  );

  for (const m of allMonths) {
    result = result.split(m.ar).join(m.fr);
  }

  result = result.replace(/هـ/g, 'H');
  // Drop a standalone Gregorian "م" marker right after a year, e.g. "2026م" -> "2026"
  result = result.replace(/(\d)\s*م(?![\p{L}])/gu, '$1');

  return result.trim();
}

/** Returns true if the text still contains Arabic letters after translation. */
export function hasUntranslatedArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}