import { useMemo } from 'react';

export const useReportsAnalytics = ({ assignments, formatAssignmentLabel }) => {
  const assignmentReport = useMemo(() => {
    const map = {};
    assignments.forEach((a) => {
      const month = a.date ? a.date.slice(0, 7) : 'sem-data';
      const type = formatAssignmentLabel(a.tipo_designacao || 'Outros');
      if (!map[month]) map[month] = {};
      map[month][type] = (map[month][type] || 0) + 1;
    });
    return map;
  }, [assignments, formatAssignmentLabel]);

  return { assignmentReport };
};
