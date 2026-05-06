const formatDatePt = (dateStr) => (dateStr ? dateStr.split('-').reverse().join('/') : '');

const getFriendlyTime = (timestamp) => {
  if (!timestamp) return '';
  const now = new Date();
  const msgDate = timestamp?.toDate
    ? timestamp.toDate()
    : timestamp instanceof Date
      ? timestamp
      : new Date(timestamp);
  if (isNaN(msgDate.getTime())) return '';
  const diffDays = Math.floor((now - msgDate) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Ontem';
  return msgDate.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
};

const formatChatDay = (timestamp) => {
  if (!timestamp) return '';
  const msgDate = timestamp?.toDate
    ? timestamp.toDate()
    : timestamp instanceof Date
      ? timestamp
      : new Date(timestamp);
  if (isNaN(msgDate.getTime())) return '';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());
  const diffDays = Math.round((today - msgDay) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  return msgDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatIsoDateLocal = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getDateDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatIsoDateLocal(date);
};

const getMonthStartIso = (baseDate = new Date()) => {
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  return formatIsoDateLocal(start);
};

const getMonthBounds = (monthValue) => {
  if (!/^\d{4}-\d{2}$/.test(String(monthValue || ''))) {
    return { start: '', end: '' };
  }
  const [yearStr, monthStr] = monthValue.split('-');
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const startDate = new Date(year, monthIndex, 1);
  const endDate = new Date(year, monthIndex + 1, 0);
  return {
    start: formatIsoDateLocal(startDate),
    end: formatIsoDateLocal(endDate)
  };
};

const getMonthDates = (monthValue) => {
  const { start, end } = getMonthBounds(monthValue);
  if (!start || !end) return [];
  const dates = [];
  let cursor = new Date(`${start}T12:00:00`);
  const endDate = new Date(`${end}T12:00:00`);
  while (cursor <= endDate) {
    dates.push(formatIsoDateLocal(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

const compareIsoDates = (left, right) => String(left || '').localeCompare(String(right || ''));

const isPastDate = (dateStr, referenceDate = formatIsoDateLocal(new Date())) => {
  if (!dateStr) return false;
  return compareIsoDates(dateStr, referenceDate) < 0;
};

const isCurrentOrFutureDate = (dateStr, referenceDate = formatIsoDateLocal(new Date())) => {
  if (!dateStr) return false;
  return compareIsoDates(dateStr, referenceDate) >= 0;
};

const getMonthMatrix = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = (firstDay.getDay() + 6) % 7; // Monday=0
  const daysInMonth = lastDay.getDate();
  const weeks = [];
  let day = 1 - startWeekday;
  while (day <= daysInMonth) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(year, month, day);
      const inMonth = current.getMonth() === month;
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      week.push({ date: current, dateStr, inMonth });
      day++;
    }
    weeks.push(week);
  }
  return weeks;
};

export {
  formatDatePt,
  getFriendlyTime,
  formatChatDay,
  formatIsoDateLocal,
  getDateDaysAgo,
  getMonthStartIso,
  getMonthBounds,
  getMonthDates,
  compareIsoDates,
  isPastDate,
  isCurrentOrFutureDate,
  getMonthMatrix
};
