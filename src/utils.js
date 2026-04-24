function localDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const TODAY = localDateStr(new Date());

export function isOverdue(t) { return !t.done && t.date && t.date < TODAY; }
export function isToday(t)    { return !t.done && t.date === TODAY; }

export function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

export function dateStr(d) { return localDateStr(d); }

export function getKW(d) {
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const sow = new Date(jan4);
  sow.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1);
  return Math.ceil(((d - sow) / 86400000 + 1) / 7);
}

export function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// Russmedia Kategorien — angepasst für Lucas
export const CATEGORIES = ['VN', 'NEUE', 'VOL.AT+', 'VOL.AT', 'Ländlepunkte', 'Allgemein'];

export function catStyle(cat) {
  switch (cat) {
    case 'VN':           return { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' };   // Rot
    case 'NEUE':         return { bg: '#DBEAFE', color: '#1E40AF', border: '#BFDBFE' };   // Blau
    case 'VOL.AT+':      return { bg: '#EDE9FE', color: '#5B21B6', border: '#DDD6FE' };   // Violett
    case 'VOL.AT':       return { bg: '#FEF9C3', color: '#854D0E', border: '#FDE047' };   // Gelb
    case 'Ländlepunkte': return { bg: '#F1F5F9', color: '#0F172A', border: '#CBD5E1' };   // Dunkel
    case 'Allgemein':    return { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' };   // Grün
    default:             return { bg: 'transparent', color: 'var(--text-3)', border: 'var(--border)' };
  }
}
