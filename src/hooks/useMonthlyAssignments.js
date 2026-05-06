import { useCallback } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';

export const useMonthlyAssignments = () => {
  const fetchMonthlyAssignments = useCallback(async (start, end) => {
    try {
      const snap = await getDocs(
        query(
          collection(db, 'assignments'),
          where('date', '>=', start),
          where('date', '<=', end),
          orderBy('date', 'asc'),
          limit(500)
        )
      );
      return snap.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
    } catch (err) {
      console.error('Erro ao buscar designações do mês:', err);
      throw err; // Re-throw para que o chamador possa lidar
    }
  }, []);

  return { fetchMonthlyAssignments };
};