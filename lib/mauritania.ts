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
    'زويرات',
    'أطار',
    'كيدي ماغا',
    'سيليبابي',
    'تيجيكجه',
    'أكجوجت',
    'النعمة',
    'تيشيت',
    'ولاته',
    'شنقيط',
    'مدرد',
    'بوكي',
    'ألاك',
    'بوتلميت',
    'لعيون',
    'أوجفت',
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