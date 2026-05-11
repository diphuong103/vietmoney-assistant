import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api/v1`
  : 'http://localhost:8080/api/v1';

const uploadMedia = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('accessToken');

  const res = await axios.post(
    `${BASE}/media/upload`,
    formData,
    {
      headers: {
        Authorization: token
          ? `Bearer ${token}`
          : undefined,
      },
      onUploadProgress,
    }
  );

  return res.data?.data;
};

const uploadMultipleMedia = async (
  files = [],
  onProgress
) => {
  const results = [];
  let completed = 0;

  for (const file of files) {
    const result = await uploadMedia(
      file,
      (progressEvent) => {
        if (!progressEvent.total) return;

        const current =
          progressEvent.loaded /
          progressEvent.total;

        const overall = Math.round(
          ((completed + current) /
            files.length) *
            100
        );

        if (onProgress) {
          onProgress(overall);
        }
      }
    );

    results.push(result);
    completed++;
  }

  if (onProgress) onProgress(100);

  return results;
};

export default {
  uploadMedia,
  uploadMultipleMedia,
};