// frontend/src/api/travelPlanApi.js
import axiosClient from './axiosClient';

const travelPlanApi = {
  // ── Travel Plans ──────────────────────────────────────────────────────
  getAll:   ()         => axiosClient.get('/travel-plans'),
  getById:  (id)       => axiosClient.get(`/travel-plans/${id}`),
  create:   (data)     => axiosClient.post('/travel-plans', data),
  update:   (id, data) => axiosClient.put(`/travel-plans/${id}`, data),
  delete:   (id)       => axiosClient.delete(`/travel-plans/${id}`),

  // ── AI ────────────────────────────────────────────────────────────────
  // timeout 90s vì Gemini có thể mất 10–30s
  aiSuggest: (id) => axiosClient.post(
    `/travel-plans/${id}/ai-suggest`,
    {},
    { timeout: 90000 }
  ),

  // ── Schedule (read) ───────────────────────────────────────────────────
  getSchedule: (id) => axiosClient.get(`/travel-plans/${id}/schedule`),

  // ── Schedule Items CRUD ───────────────────────────────────────────────
  // POST   /travel-plans/:planId/schedule-items
  addItem: (planId, data) =>
    axiosClient.post(`/travel-plans/${planId}/schedule-items`, data),

  // PUT    /travel-plans/:planId/schedule-items/:itemId
  updateItem: (planId, itemId, data) =>
    axiosClient.put(`/travel-plans/${planId}/schedule-items/${itemId}`, data),

  // DELETE /travel-plans/:planId/schedule-items/:itemId
  deleteItem: (planId, itemId) =>
    axiosClient.delete(`/travel-plans/${planId}/schedule-items/${itemId}`),
};

export default travelPlanApi;