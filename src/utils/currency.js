import { getItem, KEYS, setItem } from './storage';

export async function fetchDollarRate() {
  const cached = getItem(KEYS.rate, null);

  if (!navigator.onLine) {
    return {
      rate: cached?.rate || null,
      source: 'offline',
      date: cached?.date || null
    };
  }

  let timeoutId = null;
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 4500);
    const response = await fetch('https://open.er-api.com/v6/latest/USD', { signal: controller.signal });
    if (!response.ok) throw new Error('Rate API error');
    const data = await response.json();
    const rate = Number(data?.rates?.NGN);
    if (!Number.isFinite(rate) || rate <= 0) throw new Error('Invalid NGN rate');
    const payload = { rate, date: new Date().toISOString() };
    setItem(KEYS.rate, payload);
    return { rate, source: 'live', date: payload.date };
  } catch {
    return {
      rate: cached?.rate || null,
      source: 'cached',
      date: cached?.date || null
    };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
