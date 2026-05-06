import { useEffect, useRef, useCallback } from 'react';
import { CACHE_KEYS, safeLocalStorageSet } from '../utils/cacheUtils';

const hasChanged = (a, b) => {
  if (a === b) return false;
  if (!a && b) return true;
  if (a && !b) return true;
  if (typeof a !== 'object' || typeof b !== 'object') return true;
  if (Array.isArray(a) !== Array.isArray(b)) return true;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return true;
    return a.some((item, i) => hasChanged(item, b[i]));
  }
  const keysA = Object.keys(a || {});
  const keysB = Object.keys(b || {});
  if (keysA.length !== keysB.length) return true;
  return keysA.some((key) => hasChanged(a[key], b[key]));
};

const createDebouncedWriter = (delay = 1000) => {
  const timeouts = {};
  const locks = {};
  
  const write = (key, value) => {
    if (locks[key]) return;
    locks[key] = true;
    
    if (timeouts[key]) clearTimeout(timeouts[key]);
    timeouts[key] = setTimeout(() => {
      try {
        safeLocalStorageSet(key, value);
      } catch (err) {
        console.error('Cache sync error:', err);
      } finally {
        delete timeouts[key];
        delete locks[key];
      }
    }, delay);
  };
  
  write.immediate = (key, value) => {
    if (locks[key]) return;
    locks[key] = true;
    if (timeouts[key]) clearTimeout(timeouts[key]);
    try {
      safeLocalStorageSet(key, value);
    } catch (err) {
      console.error('Cache sync error:', err);
    } finally {
      delete locks[key];
    }
  };
  
  write.cancel = (key) => {
    if (timeouts[key]) {
      clearTimeout(timeouts[key]);
      delete timeouts[key];
    }
    delete locks[key];
  };
  
  return write;
};

export const useCacheSync = (data) => {
  const prevDataRef = useRef({});
  const isMountedRef = useRef(true);
  const writeRef = useRef(createDebouncedWriter(1000));

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      Object.keys(CACHE_KEYS).forEach((key) => {
        writeRef.current.cancel(CACHE_KEYS[key]);
      });
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) return;
    
    Object.keys(CACHE_KEYS).forEach((key) => {
      const cacheKey = CACHE_KEYS[key];
      const currentData = data[key];
      const prevData = prevDataRef.current[key];

      if (hasChanged(prevData, currentData)) {
        writeRef.current(cacheKey, currentData);
        prevDataRef.current[key] = currentData;
      }
    });
  }, [data]);
};
