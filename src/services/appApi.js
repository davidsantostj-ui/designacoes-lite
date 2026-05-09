import { sanitizeText } from '../utils/textUtils';
import { createDataProvider } from './dataProvider';

const provider = createDataProvider();

export function createAppApi() {
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
    // Mock upload - return mock URL
    return {
      url: `https://example.com/uploads/${safeName}`,
      name: file.name || 'arquivo',
      type: file.type || 'application/octet-stream',
      size: file.size || 0
    };
  };

  const createAnnouncement = async ({ title, message, pinned, authorId }) => {
    const announcement = await provider.createAnnouncement({
      title: sanitizeText(title, 200),
      message: sanitizeText(message, 2000),
      pinned: !!pinned,
      authorId,
    });
    return announcement;
  };

  const deleteAnnouncement = async (id) => {
    await provider.deleteAnnouncement(id);
    return id;
  };

  const exportData = async () => {
    return await provider.exportAll();
  };

  const importData = async (payload) => {
    await provider.importAll(payload);
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