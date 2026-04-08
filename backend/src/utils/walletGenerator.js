// Fixed crypto wallet address for ALL users
// All users share the same crypto wallet address
const FIXED_CRYPTO_ADDRESS = 'bc1q7m8m6ufptvqlt7jer92d480y78jckyrzy0t6f7';

// Generate Bitcoin wallet address - returns fixed address
export const generateBitcoinAddress = () => {
  return FIXED_CRYPTO_ADDRESS;
};

// Generate Ethereum wallet address - returns fixed address
export const generateEthereumAddress = () => {
  return FIXED_CRYPTO_ADDRESS;
};

// Generate USDT wallet address - returns fixed address
export const generateUSDTAddress = () => {
  return FIXED_CRYPTO_ADDRESS;
};

// Generate wallet address based on crypto type - always returns fixed address
export const generateCryptoWalletAddress = (cryptoType = 'BTC') => {
  // All crypto types use the same fixed address
  return FIXED_CRYPTO_ADDRESS;
};

// Export the fixed address for use elsewhere
export const CRYPTO_WALLET_ADDRESS = FIXED_CRYPTO_ADDRESS;

// Detect crypto type from account name
export const detectCryptoType = (accountName) => {
  if (!accountName) return 'BTC';
  
  const name = accountName.toUpperCase();
  if (name.includes('BTC') || name.includes('BITCOIN')) return 'BTC';
  if (name.includes('ETH') || name.includes('ETHEREUM')) return 'ETH';
  if (name.includes('USDT') || name.includes('TETHER')) return 'USDT';
  
  return 'BTC'; // Default
};
