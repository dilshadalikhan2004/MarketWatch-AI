export const formatCurrency = (amount: number, currency = 'USD', maximumFractionDigits = 2) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: maximumFractionDigits,
  }).format(amount);
};

export const formatPercentage = (value: number) => {
  return `${value.toFixed(2)}%`;
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
