import { useState, useEffect } from 'react';
import { apiProvider } from '../services/apiProvider';

export const useGuestData = () => {
  const [guests, setGuests] = useState([]);
  
  useEffect(() => {
    // Load mock guests
    apiProvider.getUsers().then(users => {
      setGuests(users.filter(u => u.approved));
    });
  }, []);

  return { guests };
};