import { useEffect, useRef } from 'react';
import { collection, getDocs, query, where, writeBatch } from 'firebase/firestore';

// Pega a data de 'days' atrás no formato YYYY-MM-DD
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
        // Limpar dados com mais de 1 dia de atraso para ter uma margem de segurança
        const cutoffDate = getDateDaysAgo(1);
        
        const deleteOldDocs = async (collectionName) => {
          const q = query(
            collection(db, collectionName),
            where('date', '<', cutoffDate)
          );
          const snap = await getDocs(q);
          if (snap.empty) return;

          const docsArr = snap.docs;
          for (let i = 0; i < docsArr.length; i += 400) {
            const batch = writeBatch(db);
            const chunk = docsArr.slice(i, i + 400);
            chunk.forEach((docSnap) => {
              batch.delete(docSnap.ref);
            });
            await batch.commit();
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

    // Roda em background para não travar a renderização
    setTimeout(cleanupPastDates, 5000);
  }, [db, isRealAdmin]);
};
