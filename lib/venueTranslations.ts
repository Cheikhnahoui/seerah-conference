/**
 * Automatic Arabic -> French translation for the conference location.
 *
 * The admin only ever types ONE location, in Arabic. This dictionary
 * replaces every known Arabic phrase with its French equivalent, so
 * the French page always matches the Arabic page automatically.
 *
 * To support a new place name, just add an [arabic, french] pair
 * below — no code changes needed anywhere else.
 */

export const VENUE_DICTIONARY: [string, string][] = [
  ['المركز الدولي للمؤتمرات', 'Centre International des Conférences'],
  ['المختار ولد داداه', 'El Mokhtar Ould Daddah'],
  ['نواكشوط', 'Nouakchott'],
  ['موريتانيا', 'Mauritanie'],
  ['ساحة الولاية', 'Place de la Wilaya'],
  ['كرفور المعرض', 'Carrefour de l\'Exposition'],
];

/**
 * Translates a full Arabic location string into French by replacing
 * every known phrase. Anything not found in the dictionary is left
 * as-is (e.g. punctuation, parentheses, unknown place names), so the
 * output degrades gracefully instead of breaking.
 */
export function translateLocation(arabicText: string): string {
  if (!arabicText) return '';

  let result = arabicText;

  // Replace longer phrases first so partial matches don't interfere.
  const sorted = [...VENUE_DICTIONARY].sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [ar, fr] of sorted) {
    result = result.split(ar).join(fr);
  }

  return result;
}

/**
 * Returns true if the text still contains untranslated Arabic
 * characters after running it through the dictionary — useful for
 * showing the admin a warning so they know to add a new entry.
 */
export function hasUntranslatedArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}