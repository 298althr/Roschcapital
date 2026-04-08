/**
 * Validate SWIFT/BIC code format
 * Format: 8 or 11 characters
 * - 4 letters: Institution code
 * - 2 letters: Country code
 * - 2 letters/digits: Location code
 * - 3 letters/digits (optional): Branch code
 */
export const validateSWIFT = (swift) => {
  if (!swift) return { valid: false, error: 'SWIFT code is required' };
  
  const swiftUpper = swift.toUpperCase().trim();
  
  // SWIFT must be 8 or 11 characters
  if (swiftUpper.length !== 8 && swiftUpper.length !== 11) {
    return { valid: false, error: 'SWIFT code must be 8 or 11 characters' };
  }
  
  // Format: AAAABBCCXXX
  // AAAA: Institution code (4 letters)
  // BB: Country code (2 letters)
  // CC: Location code (2 letters or digits)
  // XXX: Branch code (3 letters or digits, optional)
  
  const institutionCode = swiftUpper.substring(0, 4);
  const countryCode = swiftUpper.substring(4, 6);
  const locationCode = swiftUpper.substring(6, 8);
  const branchCode = swiftUpper.length === 11 ? swiftUpper.substring(8, 11) : null;
  
  // Institution code must be 4 letters
  if (!/^[A-Z]{4}$/.test(institutionCode)) {
    return { valid: false, error: 'Invalid institution code (must be 4 letters)' };
  }
  
  // Country code must be 2 letters (ISO 3166-1 alpha-2)
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return { valid: false, error: 'Invalid country code (must be 2 letters)' };
  }
  
  // Location code must be 2 alphanumeric characters
  if (!/^[A-Z0-9]{2}$/.test(locationCode)) {
    return { valid: false, error: 'Invalid location code (must be 2 alphanumeric characters)' };
  }
  
  // Branch code (if present) must be 3 alphanumeric characters
  if (branchCode && !/^[A-Z0-9]{3}$/.test(branchCode)) {
    return { valid: false, error: 'Invalid branch code (must be 3 alphanumeric characters)' };
  }
  
  return {
    valid: true,
    formatted: swiftUpper,
    institutionCode,
    countryCode,
    locationCode,
    branchCode
  };
};

/**
 * Validate IBAN format
 * Format: Up to 34 alphanumeric characters
 * - 2 letters: Country code
 * - 2 digits: Check digits
 * - Up to 30 alphanumeric: Basic Bank Account Number (BBAN)
 */
export const validateIBAN = (iban) => {
  if (!iban) return { valid: false, error: 'IBAN is required' };
  
  // Remove spaces and convert to uppercase
  const ibanClean = iban.replace(/\s/g, '').toUpperCase().trim();
  
  // IBAN must be between 15 and 34 characters
  if (ibanClean.length < 15 || ibanClean.length > 34) {
    return { valid: false, error: 'IBAN must be between 15 and 34 characters' };
  }
  
  // Must start with 2 letters (country code)
  if (!/^[A-Z]{2}/.test(ibanClean)) {
    return { valid: false, error: 'IBAN must start with 2-letter country code' };
  }
  
  // Next 2 characters must be digits (check digits)
  if (!/^[A-Z]{2}[0-9]{2}/.test(ibanClean)) {
    return { valid: false, error: 'IBAN check digits must be numeric' };
  }
  
  // Rest must be alphanumeric
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(ibanClean)) {
    return { valid: false, error: 'IBAN contains invalid characters' };
  }
  
  // Perform mod-97 check digit validation
  const checkDigitsValid = validateIBANCheckDigits(ibanClean);
  if (!checkDigitsValid) {
    return { valid: false, error: 'IBAN check digits are invalid' };
  }
  
  const countryCode = ibanClean.substring(0, 2);
  const checkDigits = ibanClean.substring(2, 4);
  const bban = ibanClean.substring(4);
  
  return {
    valid: true,
    formatted: formatIBAN(ibanClean),
    countryCode,
    checkDigits,
    bban
  };
};

/**
 * Validate IBAN check digits using mod-97 algorithm
 */
const validateIBANCheckDigits = (iban) => {
  // Move first 4 characters to end
  const rearranged = iban.substring(4) + iban.substring(0, 4);
  
  // Replace letters with numbers (A=10, B=11, ..., Z=35)
  const numeric = rearranged.split('').map(char => {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) { // A-Z
      return (code - 55).toString();
    }
    return char;
  }).join('');
  
  // Calculate mod 97
  const remainder = mod97(numeric);
  
  return remainder === 1;
};

/**
 * Calculate mod 97 for large numbers (as strings)
 */
const mod97 = (string) => {
  let checksum = string.slice(0, 2);
  let fragment;
  
  for (let offset = 2; offset < string.length; offset += 7) {
    fragment = checksum + string.substring(offset, offset + 7);
    checksum = (parseInt(fragment, 10) % 97).toString();
  }
  
  return parseInt(checksum, 10);
};

/**
 * Format IBAN with spaces for readability
 */
const formatIBAN = (iban) => {
  return iban.match(/.{1,4}/g).join(' ');
};

/**
 * Validate US routing number (9 digits)
 */
export const validateRoutingNumber = (routingNumber) => {
  if (!routingNumber) return { valid: false, error: 'Routing number is required' };
  
  const cleaned = routingNumber.replace(/\D/g, '');
  
  if (cleaned.length !== 9) {
    return { valid: false, error: 'Routing number must be 9 digits' };
  }
  
  // Checksum validation (ABA routing number algorithm)
  const digits = cleaned.split('').map(Number);
  const checksum = (
    3 * (digits[0] + digits[3] + digits[6]) +
    7 * (digits[1] + digits[4] + digits[7]) +
    (digits[2] + digits[5] + digits[8])
  ) % 10;
  
  if (checksum !== 0) {
    return { valid: false, error: 'Invalid routing number checksum' };
  }
  
  return {
    valid: true,
    formatted: cleaned
  };
};

/**
 * Validate account number format
 */
export const validateAccountNumber = (accountNumber, minLength = 8, maxLength = 17) => {
  if (!accountNumber) return { valid: false, error: 'Account number is required' };
  
  const cleaned = accountNumber.replace(/\D/g, '');
  
  if (cleaned.length < minLength || cleaned.length > maxLength) {
    return { valid: false, error: `Account number must be between ${minLength} and ${maxLength} digits` };
  }
  
  return {
    valid: true,
    formatted: cleaned
  };
};

/**
 * Validate bank name
 */
export const validateBankName = (bankName) => {
  if (!bankName || bankName.trim().length === 0) {
    return { valid: false, error: 'Bank name is required' };
  }
  
  if (bankName.trim().length < 3) {
    return { valid: false, error: 'Bank name must be at least 3 characters' };
  }
  
  return {
    valid: true,
    formatted: bankName.trim()
  };
};

/**
 * Validate recipient name
 */
export const validateRecipientName = (name) => {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Recipient name is required' };
  }
  
  if (name.trim().length < 2) {
    return { valid: false, error: 'Recipient name must be at least 2 characters' };
  }
  
  // Only letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s\-']+$/.test(name)) {
    return { valid: false, error: 'Recipient name contains invalid characters' };
  }
  
  return {
    valid: true,
    formatted: name.trim()
  };
};

/**
 * Validate country code (ISO 3166-1 alpha-2)
 */
export const validateCountryCode = (countryCode) => {
  if (!countryCode) return { valid: false, error: 'Country code is required' };
  
  const cleaned = countryCode.toUpperCase().trim();
  
  if (cleaned.length !== 2) {
    return { valid: false, error: 'Country code must be 2 letters' };
  }
  
  if (!/^[A-Z]{2}$/.test(cleaned)) {
    return { valid: false, error: 'Country code must contain only letters' };
  }
  
  return {
    valid: true,
    formatted: cleaned
  };
};
