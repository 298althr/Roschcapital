/**
 * Rosch Capital Bank Design System
 * Enterprise-grade design tokens for consistent UI/UX
 */

export const designTokens = {
  // Color System - Semantic naming
  colors: {
    // Primary - Main brand actions
    primary: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',  // Main primary
      600: '#4f46e5',  // Primary hover
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
    },
    
    // Success - Positive states
    success: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',  // Main success
      600: '#059669',  // Success hover
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    
    // Warning - Caution states
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',  // Main warning
      600: '#d97706',  // Warning hover
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    
    // Error - Destructive actions only
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',  // Main error
      600: '#dc2626',  // Error hover
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    
    // Neutral - Backgrounds, borders, text
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },

  // Typography Scale
  typography: {
    fontFamily: {
      sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
    },
    
    fontSize: {
      // Display - Hero numbers, total balance
      display: {
        sm: ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700', letterSpacing: '-0.02em' }],  // 36px
        md: ['3rem', { lineHeight: '3rem', fontWeight: '700', letterSpacing: '-0.02em' }],       // 48px
        lg: ['3.75rem', { lineHeight: '1', fontWeight: '700', letterSpacing: '-0.02em' }],       // 60px
      },
      
      // Headings
      h1: ['1.875rem', { lineHeight: '2.25rem', fontWeight: '600', letterSpacing: '-0.01em' }], // 30px
      h2: ['1.5rem', { lineHeight: '2rem', fontWeight: '600', letterSpacing: '-0.01em' }],      // 24px
      h3: ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],                            // 20px
      h4: ['1.125rem', { lineHeight: '1.75rem', fontWeight: '600' }],                           // 18px
      
      // Body
      base: ['0.9375rem', { lineHeight: '1.5rem', fontWeight: '400' }],                         // 15px
      sm: ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],                           // 14px
      xs: ['0.8125rem', { lineHeight: '1rem', fontWeight: '400' }],                             // 13px
      
      // Special
      caption: ['0.75rem', { lineHeight: '1rem', fontWeight: '500', letterSpacing: '0.02em' }], // 12px
    },
  },

  // Spacing System (8pt grid)
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.375rem',   // 6px - badges, pills
    md: '0.5rem',     // 8px - buttons, inputs
    lg: '0.75rem',    // 12px - cards
    xl: '1rem',       // 16px - large cards
    '2xl': '1.25rem', // 20px - hero sections
    full: '9999px',   // circular
  },

  // Shadow System (elevation)
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',                                      // Static cards
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // Interactive cards
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', // Modals
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', // Hover lift
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',                             // Dropdowns
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',                             // Pressed state
  },

  // Transitions
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: '500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Z-index layers
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    overlay: 1200,
    modal: 1300,
    popover: 1400,
    toast: 1500,
  },
};

// Utility functions
export const getColor = (color, shade = 500) => {
  const [colorName, colorShade] = color.includes('-') 
    ? color.split('-') 
    : [color, shade];
  return designTokens.colors[colorName]?.[colorShade] || color;
};

export const getSpacing = (size) => designTokens.spacing[size] || size;

export const getShadow = (size) => designTokens.shadows[size] || size;

export default designTokens;
