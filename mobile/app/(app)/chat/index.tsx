import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import type { DisplayMessage } from './types';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../../lib/api';
import { clearAuth, getLanguage } from '../../../lib/storage';
import { useAuth } from '../../../lib/auth-context';
import { useTheme } from '../../../lib/theme-context';
import { useChat } from './hooks/useChat';
import { useEmotionalState } from './hooks/useEmotionalState';
import { useStreaming } from './hooks/useStreaming';
import { useVoice } from './hooks/useVoice';
import { Header } from './components/Header';
import { InputBar } from './components/InputBar';
import { MenuDropdown } from './components/MenuDropdown';
import { MessageList } from './components/MessageList';
import { VoicePanel } from './components/VoicePanel';

export default function Chat() {
  const [input, setInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [voicePanelOpen, setVoicePanelOpen] = useState(false);
  const [langCode, setLangCode] = useState<string | undefined>(undefined);

  // Stable ref so streaming callback (which closes over stale state) reads
  // the current voicePanelOpen value without needing to be in dep arrays
  const voiceModeRef = useRef(false);
  useEffect(() => { voiceModeRef.current = voicePanelOpen; }, [voicePanelOpen]);

  // Load language preference saved during onboarding
  useEffect(() => {
    getLanguage().then((lang) => { if (lang) setLangCode(lang.code); });
  }, []);

  const listRef = useRef<FlatList<DisplayMessage>>(null);
  const insets = useSafeAreaInsets();
  const { setAuthed } = useAuth();
  const { background, updateMood } = useTheme();

  const scrollToBottom = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }, []);

  const { messages, setMessages, sessionId, initSession } = useChat();

  const {
    orbTrust,
    orbValence,
    orbArousal,
    orbLonging,
    setOrbValence,
    setOrbArousal,
    setOrbLonging,
    orbTrustRef,
    orbLongingRef,
    loadEmotionalState,
  } = useEmotionalState(updateMood);

  const { vmState, setVmState, micAmplitude, tapOrb, speakResponse, cleanup } = useVoice(langCode);

  const { streaming, cancelStreamRef, send } = useStreaming({
    sessionId,
    setMessages,
    setOrbValence,
    setOrbArousal,
    setOrbLonging,
    orbTrustRef,
    orbLongingRef,
    updateMood,
    scrollToBottom,
    onResponseComplete: (text) => {
      if (!voiceModeRef.current) return;
      if (text) speakResponse(text);
      else setVmState('idle');
    },
  });

  useEffect(() => {
    (async () => {
      try {
        await initSession();
        loadEmotionalState().catch(() => {});
      } catch {
        setMessages([{
          id: 'init_error',
          role: 'assistant',
          content: "Couldn't connect to Anjo. Check your connection and restart.",
          timestamp: new Date().toISOString(),
          isSystem: true,
        }]);
      }
    })();
    return () => { cancelStreamRef.current?.(); };
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    setMenuOpen(false);
    await send(text);
  }, [input, send]);

  const signOut = useCallback(async () => {
    setMenuOpen(false);
    if (sessionId) await api.chat.end(sessionId).catch(() => {});
    await clearAuth();
    setAuthed(false);
  }, [sessionId, setAuthed]);

  const openVoicePanel = useCallback(() => {
    setMenuOpen(false);
    setVoicePanelOpen(true);
  }, []);

  const closeVoicePanel = useCallback(() => {
    cleanup();
    setVoicePanelOpen(false);
  }, [cleanup]);

  const topPadding    = insets.top + 60;
  const bottomPadding = insets.bottom + 100;
  const canSend       = !!input.trim() && !streaming;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <MessageList
          ref={listRef}
          messages={messages}
          orbTrust={orbTrust}
          orbValence={orbValence}
          orbArousal={orbArousal}
          orbLonging={orbLonging}
          paddingTop={topPadding}
          paddingBottom={bottomPadding}
          onContentSizeChange={scrollToBottom}
        />

        <Header
          orbTrust={orbTrust}
          orbValence={orbValence}
          orbArousal={orbArousal}
          orbLonging={orbLonging}
          streaming={streaming}
          paddingTop={insets.top + 10}
          onMenuPress={() => setMenuOpen((v) => !v)}
        />

        {menuOpen && (
          <MenuDropdown
            onClose={() => setMenuOpen(false)}
            onSignOut={signOut}
          />
        )}

        <InputBar
          value={input}
          onChangeText={setInput}
          onSend={handleSend}
          onMicPress={openVoicePanel}
          canSend={canSend}
          streaming={streaming}
          paddingBottom={insets.bottom + 10}
        />

        <VoicePanel
          visible={voicePanelOpen}
          vmState={vmState}
          micAmplitude={micAmplitude}
          orbTrust={orbTrust}
          orbValence={orbValence}
          orbLonging={orbLonging}
          onTap={() => tapOrb((text) => send(text))}
          onExit={closeVoicePanel}
        />
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
