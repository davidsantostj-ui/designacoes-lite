import { useCallback } from 'react';
import { supabase } from '../services/supabase';

export const useMonthlyAssignments = () => {
  const fetchMonthlyAssignments = useCallback(async (start, end) => {
    try {
      const { data } = await supabase
        .from('assignments')
        .select('*')
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true })
        .limit(500);
      
      return data || [];
    } catch (err) {
      console.error('Erro ao buscar designacoes do mes:', err);
      throw err; // Re-throw para que o chamador possa lidar
    }
  }, []);

  return { fetchMonthlyAssignments };
};
