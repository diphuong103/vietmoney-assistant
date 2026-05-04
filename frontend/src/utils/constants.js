export const SUPPORTED_CURRENCIES = ['VND', 'USD', 'EUR', 'KRW', 'JPY', 'GBP', 'CNY'];

export const CURRENCY_SYMBOLS = {
  VND: '₫', USD: '$', EUR: '€', KRW: '₩', JPY: '¥', GBP: '£', CNY: '¥',
};

export const CURRENCY_FLAGS = {
  USD: '🇺🇸', EUR: '🇪🇺', KRW: '🇰🇷', JPY: '🇯🇵', GBP: '🇬🇧', CNY: '🇨🇳', VND: '🇻🇳',
};

export const VND_DENOMINATIONS = [500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000];

export const DEFAULT_DAILY_BUDGET_VND = 2_000_000;

export const APP_NAME = 'VietMoney';

export const ROUTES = {
  HOME:           '/',
  NEWS:           '/news',
  SCAN:           '/scan',
  SCAN_HISTORY:   '/scan/history',
  BUDGET:         '/budget',
  EXCHANGE:       '/exchange',
  WIKI:           '/wiki',
  GUIDE:          '/wiki/guide',
  PLANS:          '/plans',
  ATM_MAP:        '/atm-map',
  SPOTS:          '/spots',
  PROFILE:        '/profile',
  LOGIN:          '/login',
  REGISTER:       '/register',
  FORGOT_PW:      '/forgot-password',
  VERIFY_OTP:     '/verify-otp',
  ADMIN:          '/admin',
  ADMIN_ARTICLES: '/admin/articles',
  ADMIN_USERS:    '/admin/users',
};
