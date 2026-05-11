import { memo, useEffect } from 'react';
import { View } from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
} from 'react-native-reanimated';

// Each dot has the same 920ms cycle: leading pause + up + down + trailing pause = 920ms
// This keeps all three in sync across every repetition.
const CYCLE = 920;
const UP_DOWN = 300;

function Dot({ mutedColor, leadDelay }: { mutedColor: string; leadDelay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withDelay(leadDelay, withTiming(1, { duration: UP_DOWN })),
        withTiming(0, { duration: UP_DOWN }),
        withDelay(CYCLE - leadDelay - UP_DOWN * 2, withTiming(0, { duration: 0 })),
      ),
      -1,
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: 0.3 + progress.value * 0.7,
    transform: [{ translateY: -progress.value * 5 }],
  }));

  return (
    <Reanimated.View
      style={[{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: mutedColor }, style]}
    />
  );
}

export const TypingDots = memo(function TypingDots({ mutedColor }: { mutedColor: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 5, paddingVertical: 8, paddingHorizontal: 4 }}>
      <Dot mutedColor={mutedColor} leadDelay={0} />
      <Dot mutedColor={mutedColor} leadDelay={160} />
      <Dot mutedColor={mutedColor} leadDelay={320} />
    </View>
  );
});
