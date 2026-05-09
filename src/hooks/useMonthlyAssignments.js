import { useCallback } from 'react';
import { createDataProvider } from '../services/dataProvider';

const provider = createDataProvider();

export const useMonthlyAssignments = () => {
  const fetchMonthlyAssignments = useCallback(async (start, end) => {
    try {
      const all = await provider.getAssignments();
      return all
        .filter((a) => a.date >= start && a.date <= end)
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (err) {
      console.error('Erro ao buscar designações do mês:', err);
      throw err;
    }
  }, []);

  return { fetchMonthlyAssignments };
};