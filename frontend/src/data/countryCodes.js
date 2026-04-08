// Country codes with flags for phone number selection
export const COUNTRY_CODES = [
  { code: '+1', country: 'United States', flag: '🇺🇸', iso: 'US' },
  { code: '+1', country: 'Canada', flag: '🇨🇦', iso: 'CA' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧', iso: 'GB' },
  { code: '+61', country: 'Australia', flag: '🇦🇺', iso: 'AU' },
  { code: '+91', country: 'India', flag: '🇮🇳', iso: 'IN' },
  { code: '+86', country: 'China', flag: '🇨🇳', iso: 'CN' },
  { code: '+81', country: 'Japan', flag: '🇯🇵', iso: 'JP' },
  { code: '+49', country: 'Germany', flag: '🇩🇪', iso: 'DE' },
  { code: '+33', country: 'France', flag: '🇫🇷', iso: 'FR' },
  { code: '+39', country: 'Italy', flag: '🇮🇹', iso: 'IT' },
  { code: '+34', country: 'Spain', flag: '🇪🇸', iso: 'ES' },
  { code: '+7', country: 'Russia', flag: '🇷🇺', iso: 'RU' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷', iso: 'BR' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽', iso: 'MX' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦', iso: 'ZA' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬', iso: 'NG' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪', iso: 'KE' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬', iso: 'EG' },
  { code: '+971', country: 'UAE', flag: '🇦🇪', iso: 'AE' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦', iso: 'SA' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', iso: 'SG' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾', iso: 'MY' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩', iso: 'ID' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭', iso: 'PH' },
  { code: '+66', country: 'Thailand', flag: '🇹🇭', iso: 'TH' },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳', iso: 'VN' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷', iso: 'KR' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿', iso: 'NZ' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱', iso: 'NL' },
  { code: '+32', country: 'Belgium', flag: '🇧🇪', iso: 'BE' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭', iso: 'CH' },
  { code: '+43', country: 'Austria', flag: '🇦🇹', iso: 'AT' },
  { code: '+45', country: 'Denmark', flag: '🇩🇰', iso: 'DK' },
  { code: '+46', country: 'Sweden', flag: '🇸🇪', iso: 'SE' },
  { code: '+47', country: 'Norway', flag: '🇳🇴', iso: 'NO' },
  { code: '+358', country: 'Finland', flag: '🇫🇮', iso: 'FI' },
  { code: '+48', country: 'Poland', flag: '🇵🇱', iso: 'PL' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹', iso: 'PT' },
  { code: '+30', country: 'Greece', flag: '🇬🇷', iso: 'GR' },
  { code: '+90', country: 'Turkey', flag: '🇹🇷', iso: 'TR' },
  { code: '+972', country: 'Israel', flag: '🇮🇱', iso: 'IL' },
  { code: '+353', country: 'Ireland', flag: '🇮🇪', iso: 'IE' },
  { code: '+420', country: 'Czech Republic', flag: '🇨🇿', iso: 'CZ' },
  { code: '+36', country: 'Hungary', flag: '🇭🇺', iso: 'HU' },
  { code: '+40', country: 'Romania', flag: '🇷🇴', iso: 'RO' },
  { code: '+380', country: 'Ukraine', flag: '🇺🇦', iso: 'UA' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷', iso: 'AR' },
  { code: '+56', country: 'Chile', flag: '🇨🇱', iso: 'CL' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴', iso: 'CO' },
  { code: '+51', country: 'Peru', flag: '🇵🇪', iso: 'PE' },
  { code: '+58', country: 'Venezuela', flag: '🇻🇪', iso: 'VE' },
];

// Helper function to get country by code
export const getCountryByCode = (code) => {
  return COUNTRY_CODES.find(c => c.code === code) || COUNTRY_CODES[0];
};

// Helper function to format phone number
export const formatPhoneNumber = (countryCode, phoneNumber) => {
  return `${countryCode} ${phoneNumber}`;
};
