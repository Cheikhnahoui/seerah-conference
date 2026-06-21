// Mauritania configuration
export const MAURITANIA_CONFIG = {
  countryCode: '+222',
  countryName: 'موريتانيا',
  countryNameFr: 'Mauritanie',
  countryFlag: '🇲🇷',
  defaultCity: '',
  cities: [
    'نواكشوط',
    'نواذيبو',
    'روصو',
    'كيفه',
    'كيهيدي',
    'النعمة',
    'لعيون',
    'آطار',
    'أكجوجت',
    'تجكجة',
    'ازويرات',
    'سيلبابي',
    'بوكى',
    'ألاك',
    'مقطع لحجار',
    'شنقيط',
    'وادان',
    'تيشيت',
    'ولاتة',
    'باسكنو',
    'عدل بكرو',
    'تمبدغة',
    'كوبني',
    'الطينطان',
    'أمبود',
    'مغامة',
    'بابابي',
    'بتلميت',
    'واد الناقة',
    'أركيز',
    'برينة',
  ],
  phonePattern: /^(\+222|00222|222)?[234][0-9]{7}$/,
  phoneLength: 8, // local digits without country code
  phonePlaceholder: '+222 XX XX XX XX',
  phoneExample: '49717504',
};

export function formatMauritanianPhone(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Remove leading country code variants
  let local = digits;
  if (digits.startsWith('222')) local = digits.slice(3);
  else if (digits.startsWith('00222')) local = digits.slice(5);
  
  // Return with country code
  return `+222${local}`;
}

export function validateMauritanianPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  let local = digits;
  if (digits.startsWith('222')) local = digits.slice(3);
  else if (digits.startsWith('00222')) local = digits.slice(5);
  // Mauritanian numbers: 8 digits starting with 2, 3, or 4
  return local.length === 8 && /^[234]/.test(local);
}