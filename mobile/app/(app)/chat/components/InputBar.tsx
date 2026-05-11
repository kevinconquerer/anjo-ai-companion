import { memo } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../../../lib/theme-context';

interface InputBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onMicPress: () => void;
  canSend: boolean;
  streaming: boolean;
  paddingBottom: number;
}

export const InputBar = memo(function InputBar({
  value,
  onChangeText,
  onSend,
  onMicPress,
  canSend,
  streaming,
  paddingBottom,
}: InputBarProps) {
  const { primary, text, muted, background } = useTheme();

  return (
    <BlurView
      intensity={85}
      tint="dark"
      style={[styles.container, { paddingBottom }]}
    >
      <View style={styles.row}>
        {/* Mic button — opens voice mode; hidden while streaming */}
        {!streaming && (
          <TouchableOpacity
            style={styles.micBtn}
            onPress={onMicPress}
            hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}
          >
            <Text style={{ fontSize: 20, color: muted }}>🎤</Text>
          </TouchableOpacity>
        )}

        <TextInput
          style={[styles.input, { color: text, borderColor: 'rgba(255,255,255,0.1)' }]}
          placeholder="Message Anjo…"
          placeholderTextColor={muted}
          value={value}
          onChangeText={onChangeText}
          multiline
          maxLength={2000}
        />

        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: primary, shadowColor: primary }, !canSend && styles.sendDisabled]}
          onPress={onSend}
          disabled={!canSend}
        >
          <Text style={{ fontSize: 18, color: background, fontWeight: '700', lineHeight: 22 }}>↑</Text>
        </TouchableOpacity>
      </View>
    </BlurView>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(26,25,24,0.8)',
    borderWidth: 1,
    borderRadius: 22,
    fontSize: 16,
    paddingHorizontal: 18,
    paddingVertical: 11,
    maxHeight: 140,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  sendDisabled: { opacity: 0.3, shadowOpacity: 0 },
  micBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
});
