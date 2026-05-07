import { supabase } from './supabase';

export const collection = (db, name) => name;
export const doc = (db, name, id) => ({ collection: name, id: id });

export const serverTimestamp = () => new Date().toISOString();

export const getDocs = async (collectionName) => {
  const { data, error } = await supabase.from(collectionName).select('*');
  if (error) throw error;
  return {
    empty: !data || data.length === 0,
    docs: (data || []).map(d => ({ id: d.id, data: () => d }))
  };
};

export const getDoc = async (col, name, id) => {
  const { data, error } = await supabase.from(name).select('*').eq('id', id).single();
  if (error) throw error;
  return {
    exists: () => !!data,
    id: data?.id,
    data: () => data
  };
};

export const setDoc = async (ref, data) => {
  await supabase.from(ref.collection).upsert({ id: ref.id, ...data });
};

export const addDoc = async (collectionName, data) => {
  const { data: result, error } = await supabase.from(collectionName).insert(data).select().single();
  if (error) throw error;
  return { id: result.id };
};

export const updateDoc = async (ref, data) => {
  await supabase.from(ref.collection).update(data).eq('id', ref.id);
};

export const deleteDoc = async (ref) => {
  await supabase.from(ref.collection).delete().eq('id', ref.id);
};

export const query = (collectionName, ...conditions) => collectionName;

export const where = (field, op, value) => [field, op, value];
export const orderBy = (field, direction) => field;
export const limit = (count) => count;
export const startAfter = (doc) => doc;

export const writeBatch = () => ({
  operations: [],
  set: (ref, data) => {},
  update: (ref, data) => {},
  delete: (ref) => {},
  commit: async () => {}
});

export const arrayUnion = (...items) => items;

export const Timestamp = {
  now: () => new Date().toISOString()
};