import { useState, useRef, useCallback, useEffect, MutableRefObject } from 'react';
import * as Haptics from 'expo-haptics';
import { streamMessage } from '../../../../lib/sse';
import { ThemeContextValue } from '../../../../lib/theme-context';
import { DisplayMessage } from '../types';

type UpdateMood = ThemeContextValue['updateMood'];
type SetMessages = (updater: (prev: DisplayMessage[]) => DisplayMessage[]) => void;

interface StreamingDeps {
  sessionId: string | null;
  setMessages: SetMessages;
  setOrbValence: (v: number) => void;
  setOrbArousal: (v: number) => void;
  setOrbLonging: (v: number) => void;
  orbTrustRef: MutableRefObject<number>;
  orbLongingRef: MutableRefObject<number>;
  updateMood: UpdateMood;
  scrollToBottom: () => void;
  /** Optional: called with the full response text when streaming completes. Used by voice mode to trigger TTS. */
  onResponseComplete?: (text: string) => void;
}

export function useStreaming({
  sessionId,
  setMessages,
  setOrbValence,
  setOrbArousal,
  setOrbLonging,
  orbTrustRef,
  orbLongingRef,
  updateMood,
  scrollToBottom,
  onResponseComplete,
}: StreamingDeps) {
  const [streaming, setStreaming] = useState(false);
  const cancelStreamRef = useRef<(() => void) | null>(null);

  // Stable ref so the streaming callback always calls the latest version
  // without needing to be in the useCallback dependency array
  const onResponseCompleteRef = useRef(onResponseComplete);
  useEffect(() => { onResponseCompleteRef.current = onResponseComplete; }, [onResponseComplete]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || streaming || !sessionId) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: DisplayMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    const assistantId = `${Date.now()}_a`;
    const assistantMsg: DisplayMessage = { id: assistantId, role: 'assistant', content: '', streaming: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setStreaming(true);
    scrollToBottom();

    cancelStreamRef.current = await streamMessage(sessionId, text, {
      onToken: (chunk) => {
        setMessages((prev) =>
          prev.map((m) => m.id === assistantId ? { ...m, content: m.content + chunk } : m),
        );
        scrollToBottom();
      },
      onDone: (fullText, _emotions, _intent, mood, attachment) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: fullText, streaming: false, timestamp: new Date().toISOString() }
              : m,
          ),
        );
        setStreaming(false);
        cancelStreamRef.current = null;
        setOrbValence(mood.valence);
        setOrbArousal(mood.arousal);
        if (attachment.longing !== undefined) setOrbLonging(attachment.longing);
        updateMood(orbTrustRef.current, mood.valence, mood.arousal, attachment.longing ?? orbLongingRef.current);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Notify voice mode so it can speak the response
        onResponseCompleteRef.current?.(fullText);
      },
      onSilent: () => {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== assistantId),
          {
            id: `${assistantId}_silent`,
            role: 'assistant',
            content: 'Anjo read the message and chose not to respond.',
            timestamp: new Date().toISOString(),
            isSystem: true,
          },
        ]);
        setStreaming(false);
        cancelStreamRef.current = null;
        onResponseCompleteRef.current?.('');
      },
      onNoCredits: (tier) => {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== assistantId),
          {
            id: `${assistantId}_nocredits`,
            role: 'assistant',
            content:
              tier === 'free'
                ? "You've used all your free messages today. Upgrade to Pro for 300 messages a day."
                : "You've used all your messages for today. Come back tomorrow or grab a credit pack.",
            timestamp: new Date().toISOString(),
            isSystem: true,
          },
        ]);
        setStreaming(false);
        cancelStreamRef.current = null;
        onResponseCompleteRef.current?.('');
      },
      onError: (detail) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `Error: ${detail}`, streaming: false }
              : m,
          ),
        );
        setStreaming(false);
        cancelStreamRef.current = null;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        onResponseCompleteRef.current?.('');
      },
    });
  }, [sessionId, streaming, setMessages, setOrbValence, setOrbArousal, setOrbLonging, orbTrustRef, orbLongingRef, updateMood, scrollToBottom]);

  return { streaming, cancelStreamRef, send };
}
