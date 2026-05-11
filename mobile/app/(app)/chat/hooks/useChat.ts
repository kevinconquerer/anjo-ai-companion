import { useState, useCallback } from 'react';
import { api, Message } from '../../../../lib/api';
import { DisplayMessage } from '../types';

export function useChat() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const initSession = useCallback(async () => {
    // getTimezoneOffset() returns UTC−local (negative for east-of-UTC zones).
    // The server expects minutes-to-add-to-UTC, so negate it.
    const tzOffset = -new Date().getTimezoneOffset();
    const [{ history }, sessionData] = await Promise.all([
      api.chat.history(),
      api.chat.start(tzOffset),
    ]);

    setSessionId(sessionData.session_id);

    const histMsgs: DisplayMessage[] = history.map((m: Message, i: number) => ({
      id: String(i),
      role: m.role,
      content: m.content,
      timestamp: m.ts ?? m.timestamp,
    }));

    if (sessionData.pending_outreach) {
      setMessages([
        ...histMsgs,
        {
          id: 'outreach_0',
          role: 'assistant',
          content: sessionData.pending_outreach,
          timestamp: new Date().toISOString(),
        },
      ]);
    } else {
      setMessages(histMsgs);
    }
  }, []);

  return { messages, setMessages, sessionId, initSession };
}
