export const selectAssignmentsByDate = (assignments) => {
  const map = {};
  if (!assignments) return map;
  for (let i = 0; i < assignments.length; i++) {
    const a = assignments[i];
    if (!a?.date) continue;
    if (!map[a.date]) map[a.date] = [];
    map[a.date].push(a);
  }
  return map;
};

export const selectAssignmentCountsByMonthUser = (assignments) => {
  const map = {};
  if (!assignments) return map;
  for (let i = 0; i < assignments.length; i++) {
    const a = assignments[i];
    if (!a?.date || !a?.usuario_id) continue;
    const month = a.date.slice(0, 7);
    if (!map[month]) map[month] = {};
    map[month][a.usuario_id] = (map[month][a.usuario_id] || 0) + 1;
  }
  return map;
};

export const selectAssignmentsByUser = (assignments) => {
  const map = {};
  if (!assignments) return map;
  for (let i = 0; i < assignments.length; i++) {
    const a = assignments[i];
    if (!a?.usuario_id) continue;
    if (!map[a.usuario_id]) map[a.usuario_id] = [];
    map[a.usuario_id].push(a);
  }
  return map;
};

export const selectUserAssignmentKeys = (assignments) => {
  const set = new Set();
  if (!assignments) return set;
  for (let i = 0; i < assignments.length; i++) {
    const a = assignments[i];
    if (!a?.usuario_id || !a?.date) continue;
    set.add(`${a.usuario_id}|${a.date}`);
  }
  return set;
};
