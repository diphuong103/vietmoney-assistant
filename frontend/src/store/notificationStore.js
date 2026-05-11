import { create } from 'zustand';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import notificationApi from '../api/notificationApi';

let stompClient = null;

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1')
    .replace('/api/v1', '');

export const useNotificationStore = create((set, get) => ({
    notifications: [],
    unreadCount: 0,
    connected: false,

    // ── REST fetch ───────────────────────────────────────────────
    fetch: async () => {
        if (!localStorage.getItem('accessToken')) return;
        try {
            const [listRes, countRes] = await Promise.all([
                notificationApi.getAll(),
                notificationApi.getUnreadCount(),
            ]);
            const list = listRes?.data?.data ?? listRes?.data ?? [];
            const count = countRes?.data?.data ?? countRes?.data ?? 0;
            set({ notifications: Array.isArray(list) ? list : [], unreadCount: Number(count) });
        } catch { /* silent */ }
    },

    markAllRead: async () => {
        if (!localStorage.getItem('accessToken')) return;
        try {
            await notificationApi.markAllRead();
            set(state => ({
                notifications: state.notifications.map(n => ({ ...n, read: true })),
                unreadCount: 0,
            }));
        } catch { /* silent */ }
    },

    markRead: async (id) => {
        if (!localStorage.getItem('accessToken')) return;
        try {
            await notificationApi.markRead(id);
            set(state => ({
                notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
                unreadCount: Math.max(0, state.unreadCount - 1),
            }));
        } catch { /* silent */ }
    },

    // ── WebSocket / STOMP ────────────────────────────────────────
    connect: (userId) => {
        if (!userId || get().connected || stompClient) return;

        stompClient = new Client({
            webSocketFactory: () => new SockJS(`${BASE_URL}/ws`),
            reconnectDelay: 5000,
            onConnect: () => {
                set({ connected: true });
                stompClient.subscribe(`/topic/notifications/${userId}`, (message) => {
                    try {
                        const notification = JSON.parse(message.body);
                        set(state => ({
                            notifications: [notification, ...state.notifications],
                            unreadCount: state.unreadCount + 1,
                        }));
                    } catch { /* skip */ }
                });
            },
            onDisconnect: () => { set({ connected: false }); },
            onStompError: () => { set({ connected: false }); },
        });

        stompClient.activate();
    },

    disconnect: () => {
        if (stompClient) {
            try { stompClient.deactivate(); } catch { /* ignore */ }
            stompClient = null;
        }
        set({ connected: false });
    },
}));
