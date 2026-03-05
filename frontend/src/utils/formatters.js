import { format } from 'date-fns';

export const formatCurrency = (amount, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

export const formatDate = (date) => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return format(d, 'MMM d, yyyy');
};

export const formatPercent = (value) => `${Math.round(value)}%`;

export const formatShortDate = (date) => format(new Date(date), 'MMM d');
