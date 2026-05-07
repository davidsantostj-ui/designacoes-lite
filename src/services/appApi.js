import { supabase } from './supabase';
import { sanitizeText } from '../utils/textUtils';

const BACKUP_TABLES = [
  'profiles',
  'assignments',
  'meetings',
  'talks',
  'notifications',
  'announcements',
  'swap_logs',
  'specialEvents',
  'audit_logs',
  'swap_requests',
  'app_settings'
];

export function createAppApi({ auth, db, storage, ensureAuth, withRetry }) {
  const ensureSignedIn = ensureAuth
    ? ensureAuth
    : async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('not-authenticated');
        return user;
      };

  const compressImage = (file) => {
    if (!file || !file.type.startsWith('image/')) return Promise.resolve(file);
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const maxWidth = 1024;
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            resolve(blob || file);
          },
          'image/jpeg',
          0.8
        );
      };
      img.onerror = () => resolve(file);
      img.src = url;
    });
  };

  const uploadFile = async (file, pathPrefix = 'uploads') => {
    if (!file) return null;
    if (file.type && file.type.startsWith('video/')) {
      throw new Error('Vídeos não permitidos');
    }
    if (file.size && file.size > 20 * 1024 * 1024) {
      throw new Error('Arquivo acima de 20MB');
    }
    let payload = file;
    if (file.type && file.type.startsWith('image/')) {
      payload = await compressImage(file);
    }
    const safeName = `${Date.now()}_${file.name || 'arquivo'}`;
    const path = `${pathPrefix}/${safeName}`;

    const { data, error } = await supabase.storage
      .from('files')
      .upload(path, payload, {
        cacheControl: '3600',
        contentType: file.type || 'application/octet-stream',
        upsert: false
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('files')
      .getPublicUrl(path);

    return {
      url: urlData.publicUrl,
      name: file.name || 'arquivo',
      type: file.type || 'application/octet-stream',
      size: file.size || 0
    };
  };

  const createAnnouncement = async ({ title, message, pinned, authorId }) => {
    await ensureSignedIn();
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title: sanitizeText(title, 200),
        content: sanitizeText(message, 2000),
        pinned: !!pinned,
        created_by: authorId,
        read_by: authorId ? [authorId] : []
      });

    if (error) throw error;
    return data;
  };

  const deleteAnnouncement = async (id) => {
    await ensureSignedIn();
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) throw error;
  };

  const exportData = async () => {
    await ensureSignedIn();
    const data = {};

    for (const table of BACKUP_TABLES) {
      const { data: rows, error } = await supabase
        .from(table)
        .select('*')
        .limit(5000);

      if (error) {
        console.warn(`Erro ao exportar ${table}:`, error);
        data[table] = [];
      } else {
        data[table] = rows || [];
      }
    }

    return data;
  };

  const importData = async (payload) => {
    await ensureSignedIn();

    for (const table of BACKUP_TABLES) {
      const rows = payload?.[table] || [];
      if (rows.length === 0) continue;

      const { error } = await supabase
        .from(table)
        .upsert(rows, { onConflict: 'id' });

      if (error) {
        console.error(`Erro ao importar ${table}:`, error);
        throw error;
      }
    }
  };

  return {
    compressImage,
    uploadFile,
    createAnnouncement,
    deleteAnnouncement,
    exportData,
    importData
  };
}