import { useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';

// Pega a data de 'days' atras no formato YYYY-MM-DD
const getDateDaysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const useDatabaseCleanup = ({ db, isRealAdmin }) => {
  const cleanupRun = useRef(false);

  useEffect(() => {
    if (!isRealAdmin || cleanupRun.current) return;
    cleanupRun.current = true;

    const cleanupPastDates = async () => {
      try {
        // Limpar dados com mais de 1 dia de atraso para ter uma margem de seguranca
        const cutoffDate = getDateDaysAgo(1);
        
        const deleteOldDocs = async (tableName) => {
          const { data, error } = await supabase
            .from(tableName)
            .delete()
            .lt('date', cutoffDate)
            .select('id');
          
          if (error) {
            console.error(`Error cleaning ${tableName}:`, error);
          }
        };

        await deleteOldDocs('assignments');
        await deleteOldDocs('meetings');
        await deleteOldDocs('talks');
        
        console.log('Database cleanup completed.');
      } catch (error) {
        console.error('Failed to cleanup database:', error);
      }
    };

    // Roda em background para nao travar a renderizacao
    setTimeout(cleanupPastDates, 5000);
  }, [db, isRealAdmin]);
};
