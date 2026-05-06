import { useEffect, useState } from 'react';

const storageKeyFor = (userId) => `dismissed_pins_${userId}`;

export const useDismissedPins = (userId) => {
  const [dismissedPinned, setDismissedPinned] = useState([]);

  useEffect(() => {
    if (!userId) {
      setDismissedPinned([]);
      return;
    }
    const stored = localStorage.getItem(storageKeyFor(userId));
    try {
      setDismissedPinned(stored ? JSON.parse(stored) : []);
    } catch (e) {
      setDismissedPinned([]);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    localStorage.setItem(storageKeyFor(userId), JSON.stringify(dismissedPinned));
  }, [dismissedPinned, userId]);

  return { dismissedPinned, setDismissedPinned };
};
