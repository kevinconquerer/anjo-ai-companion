import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Reanimated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { AnimatedOrb } from '../../../../components/AnimatedOrb';
import { useTheme } from '../../../../lib/theme-context';
import { DisplayMessage, formatTs } from '../types';
import { TypingDots } from './TypingDots';

interface MessageItemProps {
  message: DisplayMessage;
  orbTrust: number;
  orbValence: number;
  orbArousal: number;
  orbLonging: number;
}

export const MessageItem = memo(function MessageItem({
  message,
  orbTrust,
  orbValence,
  orbArousal,
  orbLonging,
}: MessageItemProps) {
  const { primary, surface, surface2, text, muted, background } = useTheme();

  const isUser = message.role === 'user';
  const showDots = !isUser && message.streaming && message.content === '';

  return (
    <Reanimated.View
      layout={LinearTransition}
      entering={FadeInDown}
      exiting={FadeOut}
      style={[styles.row, isUser ? styles.rowUser : styles.rowAnjo]}
    >
      {!isUser && (
        <AnimatedOrb
          size={28}
          trust={orbTrust}
          valence={orbValence}
          arousal={orbArousal}
          longing={orbLonging}
        />
      )}

      <View style={isUser ? styles.wrapUser : styles.wrapAnjo}>
        <View
          style={[
            styles.bubble,
            isUser
              ? [styles.bubbleUser, { backgroundColor: primary }]
              : styles.bubbleAnjo,
            !isUser && { backgroundColor: surface },
            message.isSystem && { backgroundColor: surface2, borderColor: primary },
          ]}
        >
          {showDots ? (
            <TypingDots mutedColor={muted} />
          ) : (
            <Text
              style={[
                styles.bubbleText,
                isUser ? { color: background, fontWeight: '500' } : { color: text },
              ]}
            >
              {message.content}
              {message.streaming && message.content !== '' && (
                <Text style={{ color: muted }}>▌</Text>
              )}
            </Text>
          )}
        </View>

        {message.timestamp && !message.streaming && (
          <Text style={[styles.timestamp, { color: muted }, isUser ? styles.tsRight : styles.tsLeft]}>
            {formatTs(message.timestamp)}
          </Text>
        )}
      </View>

      {isUser && <View style={{ width: 28 }} />}
    </Reanimated.View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  rowUser: { flexDirection: 'row-reverse' },
  rowAnjo: { flexDirection: 'row' },
  wrapUser: { alignItems: 'flex-end', maxWidth: '72%', gap: 3 },
  wrapAnjo: { alignItems: 'flex-start', maxWidth: '72%', gap: 3 },
  bubble: { borderRadius: 18, paddingHorizontal: 15, paddingVertical: 11 },
  bubbleUser: { borderBottomRightRadius: 5 },
  bubbleAnjo: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderBottomLeftRadius: 5,
  },
  bubbleText: { fontSize: 15, lineHeight: 24 },
  timestamp: { fontSize: 11, opacity: 0.7, paddingHorizontal: 4 },
  tsRight: { textAlign: 'right' },
  tsLeft: { textAlign: 'left' },
});
