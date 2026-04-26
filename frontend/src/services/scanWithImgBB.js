/**
 * scanWithImgBB.js
 * Upload ImgBB → gọi scanApi với blob + imageUrl riêng biệt.
 * KHÔNG tự build FormData ở đây — để scanApi.js xử lý.
 */
import { uploadToImgBB } from './imgbbService';
import scanApi from '../api/scanApi';

/**
 * @param {Blob | File} blob
 * @param {string}      filename
 * @returns {Promise<{ result: object, imageUrl: string|null }>}
 */
export async function scanWithImgBB(blob, filename = 'scan.jpg') {
  // ── Bước 1: Upload ImgBB ──────────────────────────────────────────────────
  let imageUrl = null;
  try {
    const imgbb = await uploadToImgBB(blob, filename);
    imageUrl = imgbb.imageUrl;
  } catch (err) {
    console.warn('[ImgBB] Upload thất bại, scan vẫn tiếp tục:', err.message);
  }

  // ── Bước 2: Gọi scanApi — truyền blob và imageUrl riêng, KHÔNG dùng FormData ──
  const res  = await scanApi.scanImage(blob, imageUrl, filename);
  const data = res.data?.data;
  if (!data) throw new Error('Response không hợp lệ từ server');

  return { result: data, imageUrl };
}