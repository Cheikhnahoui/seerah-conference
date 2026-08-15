/**
 * Automatic bilingual (Arabic / French) conference-date formatting.
 *
 * The admin enters the date as STRUCTURED NUMBERS (day range, month,
 * year — Hijri and Gregorian). Both the Arabic and the French display
 * strings are generated from those numbers, so they can never
 * disagree with each other again.
 */

export interface ConfDateParts {
  hijri_day_start: number;
  hijri_day_end: number;
  hijri_month: number; // 1-12
  hijri_year: number;

  greg_day_start: number;
  greg_day_end: number;
  greg_month: number; // 1-12
  greg_year: number;
}

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
  { ar: 'ذو القعدة', fr: 'Dhou al-Qi\'da' },
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

export function formatConfDate(
  parts: Partial<ConfDateParts> | undefined | null,
  lang: 'ar' | 'fr'
): string {
  if (
    !parts ||
    !parts.hijri_month ||
    !parts.greg_month ||
    !parts.hijri_day_start ||
    !parts.greg_day_start
  ) {
    return '';
  }

  const hijriMonth = HIJRI_MONTHS[parts.hijri_month - 1];
  const gregMonth = GREGORIAN_MONTHS[parts.greg_month - 1];

  if (!hijriMonth || !gregMonth) return '';

  if (lang === 'ar') {
    return (
      `${parts.hijri_day_start} – ${parts.hijri_day_end} ${hijriMonth.ar} ${parts.hijri_year}هـ` +
      ` الموافق ${parts.greg_day_start} – ${parts.greg_day_end} ${gregMonth.ar} ${parts.greg_year}م`
    );
  }

  return (
    `${parts.hijri_day_start}-${parts.hijri_day_end} ${hijriMonth.fr} ${parts.hijri_year}H` +
    ` (${parts.greg_day_start}-${parts.greg_day_end} ${gregMonth.fr} ${parts.greg_year})`
  );
}