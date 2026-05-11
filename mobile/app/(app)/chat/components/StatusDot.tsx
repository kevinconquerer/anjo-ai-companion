import { memo, useEffect } from 'react';
import Reanimated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence } from 'react-native-reanimated';

interface StatusDotProps {
  streaming: boolean;
  accentColor: string;
  greenColor: string;
}

export const StatusDot = memo(function StatusDot({ streaming, accentColor, greenColor }: StatusDotProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (streaming) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.35, { duration: 500 }),
          withTiming(1, { duration: 500 }),
        ),
        -1,
      );
    } else {
      opacity.value = withTiming(1, { duration: 200 });
    }
  }, [streaming]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    backgroundColor: streaming ? accentColor : greenColor,
  }));

  return (
    <Reanimated.View
      style={[{ width: 8, height: 8, borderRadius: 4, marginLeft: 6 }, style]}
    />
  );
});
