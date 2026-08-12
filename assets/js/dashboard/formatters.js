// Shared dashboard formatting helpers. Keep these dependency-free so all dashboard sections can reuse them.

const formatMoney = (value) => {
  const amount = Math.max(0, Math.trunc(Number(value) || 0));
  return `$${new Intl.NumberFormat('en-AU').format(amount)}`;
};

const formatDuration = (value) => {
  const totalMinutes = Math.max(0, Math.trunc((Number(value) || 0) / 60));
  const days = Math.trunc(totalMinutes / 1440);
  const hours = Math.trunc((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  return `${hours}h ${minutes}m`;
};

const titleCaseState = (value) => String(value || 'unknown')
  .replace(/_/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatAccountDate = (value, fallback = 'Not recorded') => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
};
