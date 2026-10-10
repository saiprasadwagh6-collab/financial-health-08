export const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export const formatINR = (val: number | string): string => {
  const n = Number(val);
  return inrFormatter.format(Number.isFinite(n) ? Math.round(n) : 0);
};

export const formatSignedINR = (val: number | string): string => {
  const n = Number(val);
  const safe = Number.isFinite(n) ? Math.round(n) : 0;
  return `${safe < 0 ? '- ' : '+ '}${formatINR(Math.abs(safe))}`;
};

export const formatPercent = (val: number): string => {
  return `${Math.round(Number.isFinite(val) ? val : 0)}%`;
};

export const formatDate = (isoString?: string): string => {
  if (!isoString) return '—';
  try {
    const parts = isoString.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(d);
    }
  } catch {
    // fallback
  }
  return isoString;
};

export const clamp = (num: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, num));
};
