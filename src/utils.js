export const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36);

export const cap = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);

export const norm = (s = '') => s.trim().toLowerCase();

export const round = (n) => Math.round(n * 100) / 100;

const FRACTIONS = [[0.25, '¼'], [0.33, '⅓'], [0.5, '½'], [0.67, '⅔'], [0.75, '¾']];

/** 1.5 -> "1½", 0.333 -> "⅓", 2 -> "2" */
export function formatQty(n) {
  if (n === null || n === undefined || n === '') return '';
  const whole = Math.floor(n);
  const frac = n - whole;
  if (frac < 0.03) return String(whole);
  if (frac > 0.97) return String(whole + 1);
  const hit = FRACTIONS.find(([v]) => Math.abs(frac - v) < 0.03);
  if (hit) return (whole ? whole : '') + hit[1];
  return String(round(n));
}

export function formatAmount(qty, unit) {
  const q = formatQty(qty);
  return [q, unit].filter(Boolean).join(' ');
}

const JS_DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const todayKey = () => JS_DAYS[new Date().getDay()];

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
export const modKey = isMac ? '⌘' : 'Ctrl';
