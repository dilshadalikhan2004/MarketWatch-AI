
export const formatCurrency = (
  amount: number | undefined | null,
  currency = 'USD',
  maximumFractionDigits = 2
): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `${currency} N/A`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits,
  }).format(amount);
};

export const formatLargeNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return 'N/A';
  if (Math.abs(num) < 1_000_000) {
    return num.toLocaleString();
  }
  if (Math.abs(num) < 1_000_000_000) {
    return (num / 1_000_000).toFixed(2) + 'M';
  }
  if (Math.abs(num) < 1_000_000_000_000) {
    return (num / 1_000_000_000).toFixed(2) + 'B';
  }
  return (num / 1_000_000_000_000).toFixed(2) + 'T';
};


export const formatPercentage = (value: number | undefined | null, fractionDigits = 2): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return 'N/A %';
  }
  return `${(value * 100).toFixed(fractionDigits)}%`;
};

export const formatDate = (dateInput: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return 'Invalid Date';
    return new Intl.DateTimeFormat('en-US', options || {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch (e) {
    return 'Invalid Date';
  }
};

export const formatDateTime = (dateInput: string | Date): string => {
  return formatDate(dateInput, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const capitalizeFirstLetter = (string: string): string => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};
