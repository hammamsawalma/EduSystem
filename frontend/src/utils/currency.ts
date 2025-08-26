/**
 * Currency utility functions for the EduSystem
 */

export const DEFAULT_CURRENCY = 'DZD';

/**
 * Format currency amount with proper symbol and formatting
 * @param amount - The amount to format
 * @param currency - The currency code (default: DZD)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency: string = DEFAULT_CURRENCY): string => {
  if (!amount && amount !== 0) return `0.00 DA`;
  
  const value = Number(amount);
  if (isNaN(value)) return `0.00 DA`;

  if (currency === 'DZD') {
    return `${value.toFixed(2)} DA`;
  }

  // For other currencies, use Intl.NumberFormat
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(value);
  } catch {
    // Fallback if currency is not supported
    return `${currency} ${value.toFixed(2)}`;
  }
};

/**
 * Get currency symbol for a given currency code
 * @param currency - The currency code
 * @returns Currency symbol
 */
export const getCurrencySymbol = (currency: string = DEFAULT_CURRENCY): string => {
  const symbols: Record<string, string> = {
    DZD: 'DA',
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
    AUD: 'A$',
    JPY: '¥',
    TRY: '₺'
  };
  
  return symbols[currency] || currency;
};

/**
 * Parse currency string to number
 * @param currencyString - String like "100.50 DA"
 * @returns Parsed number
 */
export const parseCurrency = (currencyString: string): number => {
  if (!currencyString) return 0;
  
  // Remove currency symbols and letters, keep only numbers and decimal points
  const numericString = currencyString.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(numericString);
  
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Format currency for input fields (without symbol)
 * @param amount - The amount to format
 * @returns Formatted string for input
 */
export const formatCurrencyForInput = (amount: number): string => {
  if (!amount && amount !== 0) return '';
  const value = Number(amount);
  return isNaN(value) ? '' : value.toFixed(2);
};
