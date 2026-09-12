import { format, parseISO, isValid } from 'date-fns';
const date = (value: string | null | undefined, pattern: string) => {
  if (!value) return '—';
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, pattern) : '—';
};
export const formatDate = (value?: string | null) => date(value, 'dd MMM yyyy');
export const formatDateTime = (value?: string | null) =>
  date(value, 'dd MMM yyyy, HH:mm');
export const formatTime = (value?: string | null) =>
  value && /^\d{2}:\d{2}/.test(value)
    ? value.slice(0, 5)
    : date(value, 'HH:mm');
export const formatNumber = (value?: number | null) =>
  value == null
    ? '—'
    : new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(
        value,
      );
export const formatCurrency = (value?: number | null) =>
  value == null
    ? '—'
    : new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(value);
