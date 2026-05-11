import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedOrb } from '../../../../components/AnimatedOrb';
import { useTheme } from '../../../../lib/theme-context';
import { VoiceState } from '../hooks/useVoice';

interface VoicePanelProps {
  visible: boolean;
  vmState: VoiceState;
  micAmplitude: number;
  // Current orb emotional state — seeded from live chat orb
  orbTrust: number;
  orbValence: number;
  orbLonging: number;
  onTap: () => void;
  onExit: () => void;
}

const LABELS: Record<VoiceState, string> = {
  idle:      'Tap to speak',
  listening: 'Listening…',
  thinking:  'Anjo is thinking…',
  speaking:  'Anjo is speaking…',
};

export function VoicePanel({
  visible,
  vmState,
  micAmplitude,
  orbTrust,
  orbValence,
  orbLonging,
  onTap,
  onExit,
}: VoicePanelProps) {
  const insets      = useSafeAreaInsets();
  const { muted }   = useTheme();
  const translateY  = useSharedValue(1000);

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : 1000, {
      duration: 380,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
    });
  }, [visible]);

  // Arousal drives the orb animation in voice mode:
  //   idle      → slow breath (awaiting=true handles this, low arousal)
  //   listening → audio-reactive: amplitude maps to arousal
  //   thinking  → gentle pulse, negative arousal (calm)
  //   speaking  → active but smooth
  const orbArousal =
    vmState === 'listening' ? Math.max(-0.4, micAmplitude * 2 - 0.5)
    : vmState === 'speaking' ? 0.30
    : vmState === 'thinking' ? -0.20
    : -0.35; // idle — very slow, awaiting handles the breathing

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const canTap = vmState !== 'thinking';

  return (
    <Reanimated.View
      style={[styles.panel, panelStyle]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      {/* Exit button */}
      <TouchableOpacity
        style={[styles.exitBtn, { top: insets.top + 16 }]}
        onPress={onExit}
        hitSlop={{ top: 12, left: 12, right: 12, bottom: 12 }}
      >
        <Text style={[styles.exitText, { color: muted }]}>✕</Text>
      </TouchableOpacity>

      {/* Orb — fills most of the screen, tap to interact */}
      <TouchableOpacity
        style={styles.orbArea}
        onPress={canTap ? onTap : undefined}
        activeOpacity={canTap ? 0.82 : 1}
      >
        <AnimatedOrb
          size={220}
          trust={orbTrust}
          valence={orbValence}
          arousal={orbArousal}
          longing={orbLonging}
          awaiting={vmState === 'idle' || vmState === 'thinking'}
        />
      </TouchableOpacity>

      {/* State label */}
      <Text style={[styles.label, { color: muted }]}>
        {LABELS[vmState]}
      </Text>

      {/* Secondary hint when speaking */}
      {vmState === 'speaking' && (
        <Text style={[styles.subLabel, { color: muted }]}>tap to stop</Text>
      )}

      <View style={{ height: insets.bottom + 48 }} />
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 500,
  },
  exitBtn: {
    position: 'absolute',
    right: 20,
    padding: 8,
    zIndex: 10,
  },
  exitText: {
    fontSize: 22,
    fontWeight: '300',
  },
  orbArea: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  label: {
    marginTop: 36,
    fontSize: 15,
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  subLabel: {
    marginTop: 8,
    fontSize: 12,
    opacity: 0.4,
  },
});
