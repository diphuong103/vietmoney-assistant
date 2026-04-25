import { useState, useRef, useCallback } from 'react';

const API_URL = 'http://localhost:8000/chat/stream';

/**
 * Custom hook for streaming chat with the VietMoney RAG API.
 * Uses fetch + ReadableStream to parse SSE events in real time.
 */
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

    /**
     * Build the conversation history array for the API.
     */
    const buildHistory = useCallback(
        (currentMessages) =>
            currentMessages
                .filter((m) => m.id !== 'welcome')
                .map((m) => ({ role: m.role, content: m.content })),
        [],
    );

    /**
     * Send a message and stream the response.
     */
    const sendMessage = useCallback(
        async (text) => {
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

            setMessages((prev) => {
                const next = [...prev, userMsg, botMsg];
                // fire-and-forget the stream
                startStream(text.trim(), next, botId);
                return next;
            });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [isStreaming],
    );

    /**
     * Internal: connect to SSE and progressively update the bot message.
     */
    const startStream = async (query, snapshot, botId) => {
        setIsStreaming(true);
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const history = buildHistory(snapshot.slice(0, -1)); // exclude the empty bot msg

            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, history }),
                signal: controller.signal,
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // keep incomplete line in buffer

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data: ')) continue;

                    try {
                        const event = JSON.parse(trimmed.slice(6));

                        if (event.type === 'token') {
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.id === botId
                                        ? { ...m, content: m.content + event.content }
                                        : m,
                                ),
                            );
                        } else if (event.type === 'sources') {
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.id === botId ? { ...m, sources: event.content } : m,
                                ),
                            );
                        } else if (event.type === 'error') {
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.id === botId
                                        ? { ...m, content: m.content + '\n⚠️ ' + event.content }
                                        : m,
                                ),
                            );
                        }
                        // 'done' — nothing extra to do, loop will end
                    } catch {
                        // skip unparseable lines
                    }
                }
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === botId
                            ? {
                                ...m,
                                content:
                                    m.content ||
                                    '⚠️ Không thể kết nối đến server. / Could not connect to server.',
                            }
                            : m,
                    ),
                );
            }
        } finally {
            // Mark streaming done
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === botId ? { ...m, streaming: false } : m,
                ),
            );
            setIsStreaming(false);
            abortRef.current = null;
        }
    };

    /**
     * Abort an in-progress stream.
     */
    const stopStreaming = useCallback(() => {
        if (abortRef.current) {
            abortRef.current.abort();
        }
    }, []);

    /**
     * Clear all messages and reset to welcome.
     */
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

    return { messages, sendMessage, isStreaming, stopStreaming, clearChat };
}
