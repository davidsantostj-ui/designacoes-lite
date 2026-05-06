const escapeHtml = (value) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return String(value || '').replace(/[&<>"']/g, (ch) => map[ch]);
};

const sanitizeText = (value, maxLength = 1000) => {
  const escaped = escapeHtml(String(value || '').trim());
  return escaped.length > maxLength ? escaped.substring(0, maxLength) : escaped;
};

const MOJIBAKE_PATTERN = /(?:[\u00C3][\u0080-\u00BF]|[\u00C2][\u0080-\u00BF]|\uFFFD)/g;
const MOJIBAKE_RE = /(?:[\u00C3][\u0080-\u00BF]|[\u00C2][\u0080-\u00BF]|\uFFFD)/;
const countMojibake = (value) => (String(value || '').match(MOJIBAKE_PATTERN) || []).length;

const fixMojibake = (value) => {
  if (typeof value !== 'string') return value;
  if (!MOJIBAKE_RE.test(value)) return value;
  let fixed = value;
  try {
    fixed = decodeURIComponent(escape(value));
  } catch (e) {
    return value;
  }
  if (fixed === value) return value;
  if (countMojibake(fixed) <= countMojibake(value)) return fixed;
  return value;
};

const normalizePhone = (phone) => {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.startsWith('55')) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
};

const buildWhatsAppLink = (phone, message) => {
  const number = normalizePhone(phone);
  const text = encodeURIComponent(message || '');
  return number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;
};

const stripAccents = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

const normalizePersonName = (value) => {
  const raw = stripAccents(fixMojibake(String(value || '')).toLowerCase());
  return raw
    .replace(/\b(de|da|do|dos|das|junior|jr|filho|neto)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const capitalizeWords = (value) => {
  return String(value || '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

const deriveNameFromEmail = (email) => {
  if (!email || !email.includes('@')) return { name: '', surname: '' };
  const local = email.split('@')[0];
  const cleaned = local.replace(/[._-]+/g, ' ').trim();
  if (!cleaned) return { name: '', surname: '' };
  const parts = cleaned.split(' ').filter(Boolean);
  const name = capitalizeWords(parts.shift() || '');
  const surname = capitalizeWords(parts.join(' '));
  return { name, surname };
};

const getUserDisplayName = (u) => {
  if (!u) return '';
  const byName = [fixMojibake(u.name), fixMojibake(u.surname)].filter(Boolean).join(' ').trim();
  if (byName) return byName;
  if (u.displayName) return fixMojibake(u.displayName);
  const fromEmail = deriveNameFromEmail(u.email || '');
  const byEmail = [fixMojibake(fromEmail.name), fixMojibake(fromEmail.surname)]
    .filter(Boolean)
    .join(' ')
    .trim();
  return byEmail || u.email || 'Usuário';
};

export {
  escapeHtml,
  sanitizeText,
  fixMojibake,
  normalizePhone,
  buildWhatsAppLink,
  stripAccents,
  normalizePersonName,
  capitalizeWords,
  deriveNameFromEmail,
  getUserDisplayName
};
