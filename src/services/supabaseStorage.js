/**
 * @module services/supabaseStorage
 * @description Wrapper para Supabase Storage - Migração de Firebase Storage
 */

import { supabase } from './supabase';

const STORAGE_BUCKET = 'files';

export const uploadFile = async (file, path, options = {}) => {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      cacheControl: options.cacheControl || '3600',
      contentType: file.type,
      upsert: options.upsert || false
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  return urlData.publicUrl;
};

export const uploadFileWithUrl = async (file, path, options = {}) => {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      cacheControl: options.cacheControl || '3600',
      contentType: file.type,
      upsert: options.upsert || false
    });

  if (error) throw error;

  return getPublicUrl(path);
};

export const getPublicUrl = (path) => {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
};

export const deleteFile = async (path) => {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path]);

  if (error) throw error;
};

export const listFiles = async (folder, options = {}) => {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(folder, {
      limit: options.limit || 100,
      offset: options.offset || 0,
      sortBy: options.sortBy || { column: 'name', order: 'asc' }
    });

  if (error) throw error;
  return data;
};

export const downloadFile = async (path) => {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(path);

  if (error) throw error;
  return data;
};