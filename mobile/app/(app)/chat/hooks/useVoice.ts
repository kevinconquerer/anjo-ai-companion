import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { API_BASE } from '../../../../lib/api';
import { getToken } from '../../../../lib/storage';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

// Silence detection: stop recording after this many ms of quiet
const SILENCE_THRESHOLD_DB = -45;
const SILENCE_DURATION_MS  = 1600;
const MONITOR_INTERVAL_MS  = 100;

// Shared audio mode for playback (used after recording stops and before TTS)
const PLAYBACK_MODE = {
  allowsRecordingIOS: false,
  playsInSilentModeIOS: true,   // ensures TTS plays even when ringer is silent
} as const;

// Fallback: device language code (e.g. "zh" from "zh-TW").
const DEVICE_LANG = Intl.DateTimeFormat().resolvedOptions().locale.split('-')[0];

// langCode param overrides device locale — set from user's onboarding selection.
export function useVoice(langCode?: string) {
  const langRef = useRef(langCode ?? DEVICE_LANG);
  langRef.current = langCode ?? DEVICE_LANG;
  const [vmState, setVmState]       = useState<VoiceState>('idle');
  const [micAmplitude, setMicAmplitude] = useState(0);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const monitorRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Internal helpers ────────────────────────────────────────────────────────

  const _stopMonitor = useCallback(() => {
    if (monitorRef.current) {
      clearInterval(monitorRef.current);
      monitorRef.current = null;
    }
  }, []);

  const _stopRecording = useCallback(async (): Promise<string | null> => {
    _stopMonitor();
    setMicAmplitude(0);
    const rec = recordingRef.current;
    if (!rec) return null;
    recordingRef.current = null;
    try {
      await rec.stopAndUnloadAsync();
      // Switch to playback mode so TTS works immediately after
      await Audio.setAudioModeAsync(PLAYBACK_MODE);
      return rec.getURI() ?? null;
    } catch {
      return null;
    }
  }, [_stopMonitor]);

  // ── Transcribe a recorded file and call onTranscribed with the text ────────

  const _transcribeAndNotify = useCallback(async (
    uri: string,
    onTranscribed: (text: string) => void,
  ) => {
    setVmState('thinking');
    try {
      const token = await getToken();
      const form  = new FormData();
      form.append('audio', { uri, name: 'audio.m4a', type: 'audio/m4a' } as any);
      form.append('language', langRef.current);

      const res  = await fetch(`${API_BASE}/api/voice/transcribe`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = await res.json();
      if (data.text?.trim()) {
        onTranscribed(data.text.trim());
        // vmState stays 'thinking' — caller drives it to 'speaking' via speakResponse
      } else {
        setVmState('idle');
      }
    } catch {
      setVmState('idle');
    }
  }, []);

  // ── Start recording with VAD ─────────────────────────────────────────────

  const startRecording = useCallback(async (onTranscribed: (text: string) => void) => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Microphone access needed', 'Enable microphone permission in Settings to use voice.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      });
      await rec.startAsync();
      recordingRef.current = rec;
      setVmState('listening');

      let silenceAccumMs = 0;

      monitorRef.current = setInterval(async () => {
        if (!recordingRef.current) return;
        const status = await rec.getStatusAsync().catch(() => null);
        if (!status?.isRecording) return;

        const db  = status.metering ?? -160;
        const amp = Math.max(0, Math.min(1, (db + 60) / 60));
        setMicAmplitude(amp);

        if (db < SILENCE_THRESHOLD_DB) {
          silenceAccumMs += MONITOR_INTERVAL_MS;
          if (silenceAccumMs >= SILENCE_DURATION_MS) {
            _stopMonitor();
            const uri = await _stopRecording();
            if (uri) await _transcribeAndNotify(uri, onTranscribed);
            else setVmState('idle');
          }
        } else {
          silenceAccumMs = 0;
        }
      }, MONITOR_INTERVAL_MS);
    } catch {
      setVmState('idle');
    }
  }, [_stopMonitor, _stopRecording, _transcribeAndNotify]);

  // ── Manual stop (user taps orb while listening) ──────────────────────────

  const stopManually = useCallback(async (onTranscribed: (text: string) => void) => {
    _stopMonitor();
    const uri = await _stopRecording();
    if (uri) await _transcribeAndNotify(uri, onTranscribed);
    else setVmState('idle');
  }, [_stopMonitor, _stopRecording, _transcribeAndNotify]);

  // ── Speak a response via on-device TTS ───────────────────────────────────

  const speakResponse = useCallback((text: string) => {
    // Ensure audio session is in playback mode before speaking.
    // After recording, iOS leaves the session in recording mode which
    // causes Speech.speak to fail silently.
    Audio.setAudioModeAsync(PLAYBACK_MODE)
      .then(() => {
        setVmState('speaking');
        Speech.speak(text, {
          rate:      0.92,
          pitch:     1.0,
          language:  langRef.current,
          onDone:    () => setVmState('idle'),
          onError:   () => setVmState('idle'),
          onStopped: () => setVmState('idle'),
        });
      })
      .catch(() => {
        setVmState('speaking');
        Speech.speak(text, {
          rate:      0.92,
          pitch:     1.0,
          onDone:    () => setVmState('idle'),
          onError:   () => setVmState('idle'),
          onStopped: () => setVmState('idle'),
        });
      });
  }, []);

  // ── Orb tap handler ───────────────────────────────────────────────────────

  const tapOrb = useCallback((onTranscribed: (text: string) => void) => {
    if (vmState === 'idle') {
      startRecording(onTranscribed).catch(() => setVmState('idle'));
    } else if (vmState === 'listening') {
      stopManually(onTranscribed).catch(() => setVmState('idle'));
    } else if (vmState === 'speaking') {
      Speech.stop();
      setVmState('idle');
    }
    // 'thinking' → do nothing, wait for response
  }, [vmState, startRecording, stopManually]);

  // ── Full cleanup (on voice panel close) ──────────────────────────────────

  const cleanup = useCallback(() => {
    _stopMonitor();
    Speech.stop();
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }
    Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: false }).catch(() => {});
    setVmState('idle');
    setMicAmplitude(0);
  }, [_stopMonitor]);

  return {
    vmState,
    setVmState,
    micAmplitude,
    tapOrb,
    speakResponse,
    cleanup,
  };
}
