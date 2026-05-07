import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  startAfter,
  writeBatch,
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sanitizeText } from '../utils/textUtils';

const BACKUP_COLLECTIONS = [
  'users',
  'assignments',
  'meetings',
  'talks',
  'notifications',
  'announcements',
  'swap_logs',
  'specialEvents',
  'audit_logs',
  'swap_requests'
];

export function createAppApi({ auth, db, storage, ensureAuth, withRetry }) {
  const ensureSignedIn = ensureAuth
    ? ensureAuth
    : async () => {
        if (!auth?.currentUser) throw new Error('not-authenticated');
        return auth.currentUser;
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
    const storageRef = ref(storage, `${pathPrefix}/${safeName}`);
    await uploadBytes(storageRef, payload);
    const url = await getDownloadURL(storageRef);
    return {
      url,
      name: file.name || 'arquivo',
      type: file.type || 'application/octet-stream',
      size: file.size || 0
    };
  };

  const createAnnouncement = async ({ title, message, pinned, authorId }) => {
    await ensureSignedIn();
    return addDoc(collection(db, 'announcements'), {
      title: sanitizeText(title, 200),
      message: sanitizeText(message, 2000),
      pinned: !!pinned,
      authorId,
      created_at: serverTimestamp(),
      read_by: authorId ? [authorId] : []
    });
  };

  const deleteAnnouncement = async (id) => {
    await ensureSignedIn();
    return deleteDoc(doc(db, 'announcements', id));
  };

  const exportData = async () => {
    await ensureSignedIn();
    const MAX_EXPORT_LIMIT = 5000;
    const PAGE_SIZE = 500;
    const data = {};

    for (const col of BACKUP_COLLECTIONS) {
      const allDocs = [];
      let lastDoc = null;
      let hasMore = true;

      while (hasMore && allDocs.length < MAX_EXPORT_LIMIT) {
        const q = lastDoc
          ? query(collection(db, col), startAfter(lastDoc), limit(PAGE_SIZE))
          : query(collection(db, col), limit(PAGE_SIZE));

        const snap = await withRetry(() => getDocs(q));

        if (snap.empty) {
          hasMore = false;
        } else {
          lastDoc = snap.docs[snap.docs.length - 1];
          allDocs.push(...snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          hasMore = snap.docs.length === PAGE_SIZE;
        }
      }

      data[col] = allDocs;
    }

    return data;
  };

  const importData = async (payload) => {
    await ensureSignedIn();
    const entries = [];
    BACKUP_COLLECTIONS.forEach((col) => {
      const docs = payload?.[col] || [];
      docs.forEach((item) => {
        const { id, ...rest } = item;
        entries.push({ col, id, data: rest });
      });
    });
    const chunks = [];
    for (let i = 0; i < entries.length; i += 450) {
      chunks.push(entries.slice(i, i + 450));
    }
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach((e) => {
        const refDoc = doc(db, e.col, e.id || doc(collection(db, e.col)).id);
        batch.set(refDoc, e.data, { merge: true });
      });
      await batch.commit();
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
