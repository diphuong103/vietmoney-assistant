const RATES = {
  VND: 1,
  USD: 25420,
  EUR: 27810,
  KRW: 18.9,
  JPY: 165.4,
  GBP: 32150,
  CNY: 3497,
};

/**
 * Format a VND amount into a display string.
 * @param {number} amountVND
 * @returns {string}  e.g. "₫25,000"
 */
export function formatVND(amountVND) {
  return `₫${Math.round(amountVND).toLocaleString('en-US')}`;
}

/**
 * Convert an amount from one currency to another.
 * @param {number} amount
 * @param {string} from  - currency code
 * @param {string} to    - currency code
 * @param {object} rates - optional custom rates map
 * @returns {number}
 */
export function convertCurrency(amount, from, to, rates = RATES) {
  const inVND = parseFloat(amount) * (rates[from] ?? 1);
  return inVND / (rates[to] ?? 1);
}

/**
 * Format currency with symbol.
 * @param {number} amount
 * @param {string} currency
 * @param {object} rates
 * @returns {string}
 */
export function formatCurrency(amount, currency = 'VND', rates = RATES) {
  const symbols = { VND: '₫', USD: '$', EUR: '€', KRW: '₩', JPY: '¥', GBP: '£', CNY: '¥' };
  const sym = symbols[currency] ?? currency;
  const decimals = ['VND', 'KRW'].includes(currency) ? 0 : 2;
  return `${sym}${parseFloat(amount).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
