const parseIsoDate = (iso) => {
  if (!iso) return null;

  if (iso instanceof Date) return Number.isNaN(iso.getTime()) ? null : iso;
  if (typeof iso === 'object' && typeof iso.toDate === 'function') {
    return parseIsoDate(iso.toDate());
  }
  if (typeof iso === 'number' && Number.isFinite(iso)) {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const value = String(iso).trim();
  const canonicalDateMatch = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value);
  if (canonicalDateMatch) {
    const [, yearValue, monthValue, dayValue] = canonicalDateMatch;
    const year = Number(yearValue);
    const month = Number(monthValue);
    const day = Number(dayValue);
    const date = new Date(year, month - 1, day);
    if (
      Number.isNaN(date.getTime()) ||
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }
    return date;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatIsoDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

module.exports = {
  parseIsoDate,
  formatIsoDate
};
