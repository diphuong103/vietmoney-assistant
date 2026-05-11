import axiosClient from './axiosClient';

const notificationApi = {
    getAll: () => axiosClient.get('/notifications'),
    getUnreadCount: () => axiosClient.get('/notifications/unread-count'),
    markAllRead: () => axiosClient.put('/notifications/read-all'),
    markRead: (id) => axiosClient.put(`/notifications/${id}/read`),
};

export default notificationApi;
