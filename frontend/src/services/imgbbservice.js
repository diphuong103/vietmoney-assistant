/**
 * imgbbService.js
 * Upload ảnh lên ImgBB API, trả về URL công khai để lưu vào DB.
 *
 * Cách lấy API key:
 * 1. Vào https://imgbb.com → đăng ký tài khoản
 * 2. Vào https://api.imgbb.com → lấy API key
 * 3. Dán vào .env.development:  VITE_IMGBB_API_KEY=your_key_here
 */

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;
const IMGBB_URL     = 'https://api.imgbb.com/1/upload';

/**
 * Upload một file ảnh hoặc Blob lên ImgBB.
 *
 * @param {File | Blob} fileOrBlob  - Ảnh cần upload
 * @param {string}      name        - Tên file (tuỳ chọn, dùng để đặt tên trên ImgBB)
 * @returns {Promise<{
 *   imageUrl:  string,   // URL xem trực tiếp  (data.url)
 *   thumbUrl:  string,   // URL thumbnail nhỏ  (data.thumb.url)
 *   deleteUrl: string,   // URL để xóa ảnh sau này
 *   size:      number,   // Kích thước bytes
 * }>}
 */
export async function uploadToImgBB(fileOrBlob, name = 'scan.jpg') {
  if (!IMGBB_API_KEY) {
    throw new Error('Chưa cấu hình VITE_IMGBB_API_KEY trong file .env');
  }

  // ImgBB nhận base64 hoặc multipart — ta dùng base64 để tiện hơn
  const base64 = await _toBase64(fileOrBlob);

  const formData = new FormData();
  formData.append('key',    IMGBB_API_KEY);
  formData.append('image',  base64);          // base64 string (không có prefix data:...)
  formData.append('name',   name);
  // Tuỳ chọn: expiration (giây). Bỏ comment nếu muốn ảnh tự xóa sau X giây
  // formData.append('expiration', '604800');  // 7 ngày

  const res = await fetch(IMGBB_URL, { method: 'POST', body: formData });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ImgBB lỗi ${res.status}: ${text}`);
  }

  const json = await res.json();

  if (!json.success) {
    throw new Error(`ImgBB trả về lỗi: ${JSON.stringify(json.error)}`);
  }

  return {
    imageUrl:  json.data.url,            // https://i.ibb.co/xxx/scan.jpg
    thumbUrl:  json.data.thumb?.url,     // thumbnail nhỏ
    deleteUrl: json.data.delete_url,     // URL để xóa ảnh
    size:      json.data.size,
  };
}

// ── Helper: File/Blob → base64 string (không có prefix) ──────────────────────
function _toBase64(fileOrBlob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => {
      // reader.result = "data:image/jpeg;base64,/9j/4AAQ..."
      // ImgBB chỉ cần phần sau dấu phẩy
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Không đọc được file ảnh'));
    reader.readAsDataURL(fileOrBlob);
  });
}