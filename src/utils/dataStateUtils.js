const asArray = (value) => (Array.isArray(value) ? value : []);

const sortIfNeeded = (items, sortFn) => (typeof sortFn === 'function' ? [...items].sort(sortFn) : items);

const toPatch = (item, patch) => {
  if (typeof patch === 'function') return patch(item);
  return patch;
};

export const replaceCollection = (state, key, items) => ({
  ...state,
  [key]: asArray(items)
});

export const filterCollection = (state, key, predicate) => ({
  ...state,
  [key]: asArray(state[key]).filter(predicate)
});

export const mapCollection = (state, key, mapper, { sortFn } = {}) => ({
  ...state,
  [key]: sortIfNeeded(asArray(state[key]).map(mapper), sortFn)
});

export const patchCollectionItem = (state, key, itemId, patch, { sortFn } = {}) => ({
  ...state,
  [key]: sortIfNeeded(
    asArray(state[key]).map((item) => {
      if (item?.id !== itemId) return item;
      const nextPatch = toPatch(item, patch);
      return nextPatch ? { ...item, ...nextPatch } : item;
    }),
    sortFn
  )
});

export const patchCollectionItems = (state, key, patchesById, { sortFn } = {}) => ({
  ...state,
  [key]: sortIfNeeded(
    asArray(state[key]).map((item) => {
      const patch = patchesById?.get?.(item?.id);
      return patch ? { ...item, ...patch } : item;
    }),
    sortFn
  )
});

export const mergeCollectionById = (state, key, items, { sortFn } = {}) => {
  const merged = new Map();
  asArray(state[key]).forEach((item) => merged.set(item?.id, item));
  asArray(items).forEach((item) => merged.set(item?.id, item));
  return {
    ...state,
    [key]: sortIfNeeded(Array.from(merged.values()), sortFn)
  };
};

export const prependCollectionItems = (state, key, items, { limit, sortFn } = {}) => {
  const merged = [...asArray(items), ...asArray(state[key])];
  const sorted = sortIfNeeded(merged, sortFn);
  const limited = Number.isFinite(limit) && limit > 0 ? sorted.slice(0, limit) : sorted;
  return {
    ...state,
    [key]: limited
  };
};
