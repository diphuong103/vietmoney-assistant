export const formatVND = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

export const formatUSD = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

export const formatCurrency = (amount, currency = 'VND') =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(amount)

export const DENOMINATION_VALUES = {
  '200': 200, '500': 500, '1000': 1000, '2000': 2000, '5000': 5000,
  '10000': 10000, '20000': 20000, '50000': 50000,
  '100000': 100000, '200000': 200000, '500000': 500000,
}
