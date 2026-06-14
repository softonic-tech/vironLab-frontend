// Viron Labs - Complete Configuration
// All API keys and settings in one place

type PaymentProvider = 'stripe' | 'bank_transfer';
const rawProvider = (import.meta.env.VITE_PAYMENT_PROVIDER || 'stripe').toLowerCase();
const PAYMENT_PROVIDER: PaymentProvider =
  rawProvider === 'bank_transfer' ? 'bank_transfer' : 'stripe';

export const CONFIG = {
  // Node/MongoDB backend — base URL for every /api/* endpoint the shim calls.
  API_URL: import.meta.env.VITE_API_URL,

  // Primary payment provider. Stripe is the default checkout flow; the manual
  // bank-transfer UI is retained as a backup and activated when this is
  // 'bank_transfer'.
  PAYMENT_PROVIDER,
  STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',

  // Email: routed via the backend `/api/functions/send-email` endpoint.
  RESEND_API_KEY: import.meta.env.VITE_RESEND_API_KEY || '',
  FROM_EMAIL: import.meta.env.VITE_FROM_EMAIL || 'orders@vironlabs.com',
  SUPPORT_EMAIL: 'support@vironlabs.com',
  /**
   * When false (default), transactional email uses branded HTML from code — not `email_templates` body.
   * Set VITE_EMAIL_USE_SUPABASE_HTML_TEMPLATES=true only if you maintain HTML in Supabase and want that instead.
   */
  EMAIL_USE_SUPABASE_HTML_TEMPLATES: import.meta.env.VITE_EMAIL_USE_SUPABASE_HTML_TEMPLATES === 'true',

  // Google Analytics (Optional)
  GA_MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-KPKKM59S9Y',

  // Royal Mail API (Optional - for live shipping rates)
  ROYAL_MAIL_API_KEY: import.meta.env.VITE_ROYAL_MAIL_API_KEY || 'e9d46a02-4dd2-49fb-9f8a-67bed3491f41',
  ROYAL_MAIL_API_SECRET: import.meta.env.VITE_ROYAL_MAIL_API_SECRET || '',

  // Bank Transfer Details - CUSTOMER PAYS TO THIS ACCOUNT (UK bank)
  BANK_DETAILS: {
    ACCOUNT_NAME: 'Viron Labs Ltd',
    SORT_CODE: '00-00-00',
    ACCOUNT_NUMBER: '00000000',
    BANK_NAME: 'Bank TBD',
  },

  // Site Info
  SITE_URL: import.meta.env.VITE_SITE_URL || 'https://vironlabs.com',
  SITE_NAME: 'Viron Labs - UK Peptides',
  SITE_DESCRIPTION: 'Premium UK peptides for research. Lab-tested, fast shipping, exceptional quality.',

  // Business Info
  BUSINESS: {
    NAME: 'Viron Labs',
    COMPANY_NUMBER: '', // Companies House registration number
    VAT_NUMBER: '',     // UK VAT number if registered
    PHONE: '',
    ADDRESS: '',
  },

  // Social Links
  SOCIAL: {
    TELEGRAM: 'https://t.me/vironlabs',
    INSTAGRAM: '',
    FACEBOOK: '',
  },

  // Shipping
  SHIPPING: {
    FREE_THRESHOLD: 250,
    EXPRESS_PRICE: 15,
    STANDARD_PRICE: 10,
    LONDON_DROPOFF_PRICE: 50,
  },

  // Rewards
  REWARDS: {
    POINTS_PER_100_SEK: 1,
    MIN_LIFETIME_SPEND: 500,
    REDEMPTION_TIERS: [
      { points: 100, value: 10, label: '10 kr off' },
      { points: 250, value: 30, label: '30 kr off' },
      { points: 500, value: 75, label: '75 kr off' },
    ],
  },

  // Features
  FEATURES: {
    ENABLE_REVIEWS: true,
    ENABLE_WISHLIST: true,
    ENABLE_NEWSLETTER: true,
    ENABLE_LIVE_CHAT: true,
    ENABLE_ANALYTICS: true,
  },
};

// Helper to check if config is valid
export const isConfigValid = () => {
  return !!CONFIG.API_URL;
};
