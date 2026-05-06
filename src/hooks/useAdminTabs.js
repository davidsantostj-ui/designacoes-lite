import { useState } from 'react';

export const useAdminTabs = (initialTab = 'PROG_ADJUST') => {
  const [adminTab, setAdminTab] = useState(initialTab);
  return { adminTab, setAdminTab };
};
