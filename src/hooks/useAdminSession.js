import { useCallback, useEffect, useMemo, useState } from 'react';

const ORIGINAL_ADMIN_STORAGE_KEY = 'original_admin';

const readStoredOriginalAdmin = () => {
  try {
    const raw = localStorage.getItem(ORIGINAL_ADMIN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    localStorage.removeItem(ORIGINAL_ADMIN_STORAGE_KEY);
    return null;
  }
};

const syncStoredOriginalAdmin = (value) => {
  try {
    if (value) {
      localStorage.setItem(ORIGINAL_ADMIN_STORAGE_KEY, JSON.stringify(value));
    } else {
      localStorage.removeItem(ORIGINAL_ADMIN_STORAGE_KEY);
    }
  } catch (error) {
    // ignore localStorage sync issues
  }
};

const isAdminUser = (entry, isAdminUid) =>
  Boolean(entry && entry.id && (entry.isAdmin || isAdminUid(entry.id)));

export const useAdminSession = ({ authReady, authUid, user, isAdminUid }) => {
  const [originalAdminState, setOriginalAdminState] = useState(() => readStoredOriginalAdmin());

  const setOriginalAdmin = useCallback((nextValue) => {
    setOriginalAdminState((prev) => {
      const resolved = typeof nextValue === 'function' ? nextValue(prev) : nextValue;
      syncStoredOriginalAdmin(resolved);
      return resolved;
    });
  }, []);

  const clearOriginalAdmin = useCallback(() => {
    setOriginalAdmin(null);
  }, [setOriginalAdmin]);

  const isImpersonating = Boolean(originalAdminState && authUid && user?.id && authUid !== user.id);

  const hasAdminAccess = useMemo(
    () => isAdminUser(user, isAdminUid) || isAdminUser(originalAdminState, isAdminUid),
    [isAdminUid, originalAdminState, user]
  );

  const isRealAdminUser = useMemo(
    () => hasAdminAccess && !isImpersonating,
    [hasAdminAccess, isImpersonating]
  );

  useEffect(() => {
    if (!authReady || !originalAdminState?.id || !user?.id || !authUid) return;
    if (originalAdminState.id === authUid && user.id === authUid) {
      clearOriginalAdmin();
    }
  }, [authReady, authUid, clearOriginalAdmin, originalAdminState, user]);

  return {
    originalAdmin: originalAdminState,
    setOriginalAdmin,
    clearOriginalAdmin,
    hasAdminAccess,
    isImpersonating,
    isRealAdminUser
  };
};
