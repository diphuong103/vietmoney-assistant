/**
 * scanApi.js
 */
import axiosClient from './axiosClient';

const scanApi = {
  /**
   * Gửi ảnh lên Spring Boot để nhận diện và lưu lịch sử.
   *
   * Hỗ trợ 2 cách gọi:
   *   1. scanImage(blob, imageUrl?, filename?)   — gọi từ scanWithImgBB
   *   2. scanImage(formData)                     — KHÔNG dùng nữa, giữ backward-compat
   *
   * @param {Blob | File | FormData} blobOrFormData
   * @param {string|null}            imageUrl   - URL ImgBB (hoặc null)
   * @param {string}                 filename
   */
  scanImage: (blobOrFormData, imageUrl = null, filename = 'scan.jpg') => {
    let formData;

    if (blobOrFormData instanceof FormData) {
      // backward-compat: caller đã tự build FormData
      formData = blobOrFormData;
      // Nếu imageUrl được truyền thêm, append vào
      if (imageUrl) formData.append('imageUrl', imageUrl);
    } else {
      // Normal path: blobOrFormData là Blob / File
      formData = new FormData();
      formData.append('image', blobOrFormData, filename);
      if (imageUrl) formData.append('imageUrl', imageUrl);
    }

    return axiosClient.post('/scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getHistory: (params) =>
    axiosClient.get('/scan/history', { params }),

  deleteHistory: (id) =>
    axiosClient.delete(`/scan/history/${id}`),
};

export default scanApi;