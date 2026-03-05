export function formatNaira(amount) {
  const normalized = typeof amount === 'string' ? amount.replace(/,/g, '') : amount;
  const safeAmount = Number.isFinite(Number(normalized)) ? Number(normalized) : 0;
  return `₦${Math.round(safeAmount).toLocaleString('en-NG')}`;
}

export function formatUSD(amount) {
  const normalized = typeof amount === 'string' ? amount.replace(/,/g, '') : amount;
  const safeAmount = Number.isFinite(Number(normalized)) ? Number(normalized) : 0;
  return `$${safeAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function formatShortDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short'
  });
}

export function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function toNumber(value) {
  const normalized = typeof value === 'string' ? value.replace(/,/g, '') : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
