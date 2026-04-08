/**
 * Predefined merchant logos for transaction display
 * These are curated logo URLs for common merchants
 */

export const MERCHANT_LOGOS = {
  // Streaming & Entertainment
  'netflix': {
    name: 'Netflix',
    logo: 'https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.ico',
    category: 'ENTERTAINMENT'
  },
  'spotify': {
    name: 'Spotify',
    logo: 'https://www.scdn.co/i/_global/favicon.png',
    category: 'ENTERTAINMENT'
  },
  'hulu': {
    name: 'Hulu',
    logo: 'https://www.hulu.com/favicon.ico',
    category: 'ENTERTAINMENT'
  },
  'disney_plus': {
    name: 'Disney+',
    logo: 'https://static-assets.bamgrid.com/product/disneyplus/favicons/favicon-32x32.png',
    category: 'ENTERTAINMENT'
  },
  'amazon_prime': {
    name: 'Amazon Prime',
    logo: 'https://www.amazon.com/favicon.ico',
    category: 'ENTERTAINMENT'
  },
  'hbo_max': {
    name: 'HBO Max',
    logo: 'https://www.max.com/favicon.ico',
    category: 'ENTERTAINMENT'
  },
  'apple_tv': {
    name: 'Apple TV+',
    logo: 'https://www.apple.com/favicon.ico',
    category: 'ENTERTAINMENT'
  },
  'youtube_premium': {
    name: 'YouTube Premium',
    logo: 'https://www.youtube.com/s/desktop/favicon.ico',
    category: 'ENTERTAINMENT'
  },

  // Insurance
  'state_farm': {
    name: 'State Farm',
    logo: 'https://www.statefarm.com/favicon.ico',
    category: 'INSURANCE'
  },
  'geico': {
    name: 'GEICO',
    logo: 'https://www.geico.com/favicon.ico',
    category: 'INSURANCE'
  },
  'progressive': {
    name: 'Progressive',
    logo: 'https://www.progressive.com/favicon.ico',
    category: 'INSURANCE'
  },
  'allstate': {
    name: 'Allstate',
    logo: 'https://www.allstate.com/favicon.ico',
    category: 'INSURANCE'
  },

  // Utilities
  'spectrum': {
    name: 'Spectrum',
    logo: 'https://www.spectrum.com/favicon.ico',
    category: 'UTILITIES'
  },
  'att': {
    name: 'AT&T',
    logo: 'https://www.att.com/favicon.ico',
    category: 'UTILITIES'
  },
  'verizon': {
    name: 'Verizon',
    logo: 'https://www.verizon.com/favicon.ico',
    category: 'UTILITIES'
  },
  'comcast': {
    name: 'Comcast/Xfinity',
    logo: 'https://www.xfinity.com/favicon.ico',
    category: 'UTILITIES'
  },
  'ameren': {
    name: 'Ameren',
    logo: 'https://www.ameren.com/favicon.ico',
    category: 'UTILITIES'
  },
  'duke_energy': {
    name: 'Duke Energy',
    logo: 'https://www.duke-energy.com/favicon.ico',
    category: 'UTILITIES'
  },
  'pge': {
    name: 'PG&E',
    logo: 'https://www.pge.com/favicon.ico',
    category: 'UTILITIES'
  },

  // Groceries
  'walmart': {
    name: 'Walmart',
    logo: 'https://www.walmart.com/favicon.ico',
    category: 'GROCERIES'
  },
  'costco': {
    name: 'Costco',
    logo: 'https://www.costco.com/favicon.ico',
    category: 'GROCERIES'
  },
  'kroger': {
    name: 'Kroger',
    logo: 'https://www.kroger.com/favicon.ico',
    category: 'GROCERIES'
  },
  'aldi': {
    name: 'Aldi',
    logo: 'https://www.aldi.us/favicon.ico',
    category: 'GROCERIES'
  },
  'target': {
    name: 'Target',
    logo: 'https://www.target.com/favicon.ico',
    category: 'GROCERIES'
  },
  'whole_foods': {
    name: 'Whole Foods',
    logo: 'https://www.wholefoodsmarket.com/favicon.ico',
    category: 'GROCERIES'
  },
  'trader_joes': {
    name: "Trader Joe's",
    logo: 'https://www.traderjoes.com/favicon.ico',
    category: 'GROCERIES'
  },
  'publix': {
    name: 'Publix',
    logo: 'https://www.publix.com/favicon.ico',
    category: 'GROCERIES'
  },

  // Gas Stations / Transportation
  'shell': {
    name: 'Shell',
    logo: 'https://www.shell.com/favicon.ico',
    category: 'TRANSPORTATION'
  },
  'bp': {
    name: 'BP',
    logo: 'https://www.bp.com/favicon.ico',
    category: 'TRANSPORTATION'
  },
  'exxon': {
    name: 'Exxon',
    logo: 'https://www.exxon.com/favicon.ico',
    category: 'TRANSPORTATION'
  },
  'chevron': {
    name: 'Chevron',
    logo: 'https://www.chevron.com/favicon.ico',
    category: 'TRANSPORTATION'
  },
  'uber': {
    name: 'Uber',
    logo: 'https://www.uber.com/favicon.ico',
    category: 'TRANSPORTATION'
  },
  'lyft': {
    name: 'Lyft',
    logo: 'https://www.lyft.com/favicon.ico',
    category: 'TRANSPORTATION'
  },

  // Dining
  'mcdonalds': {
    name: "McDonald's",
    logo: 'https://www.mcdonalds.com/favicon.ico',
    category: 'DINING'
  },
  'starbucks': {
    name: 'Starbucks',
    logo: 'https://www.starbucks.com/favicon.ico',
    category: 'DINING'
  },
  'chipotle': {
    name: 'Chipotle',
    logo: 'https://www.chipotle.com/favicon.ico',
    category: 'DINING'
  },
  'olive_garden': {
    name: 'Olive Garden',
    logo: 'https://www.olivegarden.com/favicon.ico',
    category: 'DINING'
  },
  'panera': {
    name: 'Panera Bread',
    logo: 'https://www.panerabread.com/favicon.ico',
    category: 'DINING'
  },
  'chick_fil_a': {
    name: 'Chick-fil-A',
    logo: 'https://www.chick-fil-a.com/favicon.ico',
    category: 'DINING'
  },
  'wendys': {
    name: "Wendy's",
    logo: 'https://www.wendys.com/favicon.ico',
    category: 'DINING'
  },
  'subway': {
    name: 'Subway',
    logo: 'https://www.subway.com/favicon.ico',
    category: 'DINING'
  },
  'doordash': {
    name: 'DoorDash',
    logo: 'https://www.doordash.com/favicon.ico',
    category: 'DINING'
  },
  'grubhub': {
    name: 'Grubhub',
    logo: 'https://www.grubhub.com/favicon.ico',
    category: 'DINING'
  },
  'uber_eats': {
    name: 'Uber Eats',
    logo: 'https://www.ubereats.com/favicon.ico',
    category: 'DINING'
  },

  // Shopping
  'amazon': {
    name: 'Amazon',
    logo: 'https://www.amazon.com/favicon.ico',
    category: 'SHOPPING'
  },
  'ebay': {
    name: 'eBay',
    logo: 'https://www.ebay.com/favicon.ico',
    category: 'SHOPPING'
  },
  'best_buy': {
    name: 'Best Buy',
    logo: 'https://www.bestbuy.com/favicon.ico',
    category: 'SHOPPING'
  },
  'home_depot': {
    name: 'Home Depot',
    logo: 'https://www.homedepot.com/favicon.ico',
    category: 'SHOPPING'
  },
  'lowes': {
    name: "Lowe's",
    logo: 'https://www.lowes.com/favicon.ico',
    category: 'SHOPPING'
  },
  'apple_store': {
    name: 'Apple Store',
    logo: 'https://www.apple.com/favicon.ico',
    category: 'SHOPPING'
  },
  'avasflowers': {
    name: 'Avas Flowers',
    logo: 'https://www.avasflowers.net/favicon.ico',
    category: 'SHOPPING'
  },

  // Housing
  'rent': {
    name: 'Rent Payment',
    logo: null,
    category: 'HOUSING'
  },
  'mortgage': {
    name: 'Mortgage Payment',
    logo: null,
    category: 'HOUSING'
  },

  // Banking / Financial
  'gatwick_bank': {
    name: 'Gatwick Bank',
    logo: '/logo.png',
    category: 'BANKING'
  },
  'interest': {
    name: 'Interest Payment',
    logo: null,
    category: 'INTEREST'
  },
  'loan_payment': {
    name: 'Loan Payment',
    logo: null,
    category: 'LOAN_PAYMENT'
  },

  // Contractor / Income
  'conocophillips': {
    name: 'ConocoPhillips',
    logo: 'https://www.conocophillips.com/favicon.ico',
    category: 'CONTRACTOR'
  },
  'exxonmobil': {
    name: 'ExxonMobil',
    logo: 'https://corporate.exxonmobil.com/favicon.ico',
    category: 'CONTRACTOR'
  },
  'halliburton': {
    name: 'Halliburton',
    logo: 'https://www.halliburton.com/favicon.ico',
    category: 'CONTRACTOR'
  },
  'schlumberger': {
    name: 'Schlumberger',
    logo: 'https://www.slb.com/favicon.ico',
    category: 'CONTRACTOR'
  },

  // Default
  'default': {
    name: 'Transaction',
    logo: null,
    category: 'OTHER'
  }
};

// Category icons (fallback when no merchant logo)
export const CATEGORY_ICONS = {
  ENTERTAINMENT: '🎬',
  INSURANCE: '🛡️',
  UTILITIES: '💡',
  GROCERIES: '🛒',
  TRANSPORTATION: '🚗',
  DINING: '🍽️',
  SHOPPING: '🛍️',
  HOUSING: '🏠',
  BANKING: '🏦',
  INTEREST: '💰',
  LOAN_PAYMENT: '📋',
  CONTRACTOR: '🏗️',
  SALARY: '💵',
  TRANSFER: '↔️',
  OTHER: '📄'
};

// Get merchant info by key or description
export const getMerchantInfo = (merchantKey, description = '') => {
  // Try exact key match first
  if (MERCHANT_LOGOS[merchantKey]) {
    return MERCHANT_LOGOS[merchantKey];
  }

  // Try to match from description
  const descLower = description.toLowerCase();
  for (const [key, merchant] of Object.entries(MERCHANT_LOGOS)) {
    if (descLower.includes(merchant.name.toLowerCase()) || descLower.includes(key.replace(/_/g, ' '))) {
      return merchant;
    }
  }

  return MERCHANT_LOGOS.default;
};

// Get all merchants as array for dropdown
export const getMerchantList = () => {
  return Object.entries(MERCHANT_LOGOS)
    .filter(([key]) => key !== 'default')
    .map(([key, merchant]) => ({
      key,
      ...merchant
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

// Get merchants by category
export const getMerchantsByCategory = (category) => {
  return Object.entries(MERCHANT_LOGOS)
    .filter(([key, merchant]) => merchant.category === category && key !== 'default')
    .map(([key, merchant]) => ({
      key,
      ...merchant
    }));
};

export default MERCHANT_LOGOS;
