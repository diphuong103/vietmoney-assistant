import { useState, useRef, useCallback, useEffect } from 'react';

const API_URL = 'http://localhost:8000/chat/stream';
const CONFIRM_SEARCH_URL = 'http://localhost:8000/chat/confirm-search'; // đổi từ /chat/web-search

export default function useStreamChat() {
    const [messages, setMessages] = useState([
        {
            id: 'welcome',
            role: 'assistant',
            content:
                "👋 Xin chào! Tôi là trợ lý du lịch & tài chính VietMoney. Hãy hỏi tôi về tỷ giá, địa điểm du lịch, hoặc mẹo tài chính!\n\nHi! I'm your VietMoney Travel & Finance assistant. Ask me about exchange rates, tourist spots, or financial tips!",
            sources: [],
        },
    ]);
    const [isStreaming, setIsStreaming] = useState(false);
    const abortRef = useRef(null);
    const messagesRef = useRef(messages);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // ── Build history gửi lên server (bỏ welcome + suggestSearch cards) ──────
    const buildHistory = useCallback(
        (msgs) =>
            msgs
                .filter((m) => m.id !== 'welcome' && !m.suggestSearch)
                .map((m) => ({ role: m.role, content: m.content })),
        [],
    );

    // ── Core streaming function ───────────────────────────────────────────────
    const startStream = useCallback(
        async (query, currentMsgs, botId, url) => {
            setIsStreaming(true);
            const controller = new AbortController();
            abortRef.current = controller;

            try {
                const history = buildHistory(currentMsgs.slice(0, -1));

                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query, history }),
                    signal: controller.signal,
                });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                let suggestReceived = false;

                outer: while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed.startsWith('data: ')) continue;

                        let event;
                        try {
                            event = JSON.parse(trimmed.slice(6));
                        } catch {
                            continue;
                        }

                        switch (event.type) {
                            case 'token':
                                setMessages((prev) =>
                                    prev.map((m) =>
                                        m.id === botId
                                            ? { ...m, content: m.content + event.content }
                                            : m,
                                    ),
                                );
                                break;

                            case 'sources':
                                setMessages((prev) =>
                                    prev.map((m) =>
                                        m.id === botId
                                            ? { ...m, sources: event.content }
                                            : m,
                                    ),
                                );
                                break;

                            // ── Không có dữ liệu nội bộ → hỏi user ───────────
                            case 'suggest_search':
                                suggestReceived = true;
                                setMessages((prev) => {
                                    // Xoá bot placeholder rỗng đang streaming
                                    const withoutEmptyBot = prev.filter(
                                        (m) => !(m.id === botId && m.content === ''),
                                    );
                                    return [
                                        ...withoutEmptyBot,
                                        {
                                            id: `suggest-${Date.now()}`,
                                            role: 'assistant',
                                            content:
                                                'Tôi chưa có dữ liệu về nội dung này. ' +
                                                'Bạn có muốn tôi tìm kiếm từ nguồn bên ngoài không?',
                                            sources: [],
                                            suggestSearch: true,
                                            originalQuery: event.content, // query gốc để gửi lại
                                        },
                                    ];
                                });
                                reader.cancel();
                                break outer;

                            case 'error':
                                setMessages((prev) =>
                                    prev.map((m) =>
                                        m.id === botId
                                            ? {
                                                ...m,
                                                content: m.content + '\n⚠️ ' + event.content,
                                            }
                                            : m,
                                    ),
                                );
                                break;

                            case 'done':
                                break outer;

                            default:
                                break;
                        }
                    }
                }

                if (!suggestReceived) {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === botId ? { ...m, streaming: false } : m,
                        ),
                    );
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === botId
                                ? {
                                    ...m,
                                    streaming: false,
                                    content:
                                        m.content ||
                                        '⚠️ Không thể kết nối đến server. / Could not connect to server.',
                                }
                                : m,
                        ),
                    );
                }
            } finally {
                setIsStreaming(false);
                abortRef.current = null;
            }
        },
        [buildHistory],
    );

    // ── Gửi câu hỏi thông thường ─────────────────────────────────────────────
    const sendMessage = useCallback(
        (text) => {
            if (!text.trim() || isStreaming) return;

            const userMsg = {
                id: `user-${Date.now()}`,
                role: 'user',
                content: text.trim(),
                sources: [],
            };
            const botId = `bot-${Date.now()}`;
            const botMsg = {
                id: botId,
                role: 'assistant',
                content: '',
                sources: [],
                streaming: true,
            };

            const nextMsgs = [
                ...messagesRef.current.filter((m) => !m.suggestSearch),
                userMsg,
                botMsg,
            ];

            setMessages(nextMsgs);
            startStream(text.trim(), nextMsgs, botId, API_URL);
        },
        [isStreaming, startStream],
    );

    // ── User bấm "Có, tìm kiếm" → gọi /chat/confirm-search ─────────────────
    const confirmWebSearch = useCallback(
        (query) => {
            if (isStreaming) return;

            const botId = `bot-web-${Date.now()}`;
            const botMsg = {
                id: botId,
                role: 'assistant',
                content: '',
                sources: [],
                streaming: true,
            };

            const nextMsgs = [
                ...messagesRef.current.filter((m) => !m.suggestSearch),
                botMsg,
            ];

            setMessages(nextMsgs);
            startStream(query, nextMsgs, botId, CONFIRM_SEARCH_URL);
        },
        [isStreaming, startStream],
    );

    // ── User bấm "Không" → xoá card, đợi câu hỏi mới ───────────────────────
    const dismissWebSearch = useCallback(() => {
        setMessages((prev) => prev.filter((m) => !m.suggestSearch));
    }, []);

    // ── Dừng stream đang chạy ─────────────────────────────────────────────────
    const stopStreaming = useCallback(() => {
        abortRef.current?.abort();
    }, []);

    // ── Xoá toàn bộ chat ──────────────────────────────────────────────────────
    const clearChat = useCallback(() => {
        setMessages([
            {
                id: 'welcome',
                role: 'assistant',
                content:
                    "👋 Xin chào! Tôi là trợ lý du lịch & tài chính VietMoney.\n\nHi! I'm your VietMoney Travel & Finance assistant.",
                sources: [],
            },
        ]);
    }, []);

    return {
        messages,
        isStreaming,
        sendMessage,
        confirmWebSearch,
        dismissWebSearch,
        stopStreaming,
        clearChat,
    };
}