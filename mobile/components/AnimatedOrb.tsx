import { useEffect } from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import Reanimated, {
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolateColor,
  interpolate,
  Easing,
  Extrapolation,
} from 'react-native-reanimated';
import {
  T_TRUST, V_COLORS, A_COLORS, L_COLORS,
  sampleHex, BLOB_CONFIGS, LUTS, CLOCK_INPUT_RANGE,
} from '../lib/orb-colors';

interface OrbProps {
  size?: number;
  trust?: number;
  valence?: number;
  arousal?: number;
  longing?: number;
  awaiting?: boolean;
}

const BLOB_SHADOW_COLORS = [
  sampleHex(T_TRUST,  0.5),
  sampleHex(V_COLORS, 0.5),
  sampleHex(A_COLORS, 0.5),
  sampleHex(L_COLORS, 0.5),
];

const BLOB_OPACITIES = [0.55, 0.50, 0.46, 0.42];

// Color stops per blob — indexed to match BLOB_CONFIGS order
const BLOB_COLOR_STOPS = [
  ['#4A6FA5', '#2EC4B6', '#E86F5C'],
  ['#7B6B9E', '#5AC8BE', '#F7D26A'],
  ['#2C3E6B', '#45B7A0', '#FF6F91'],
  ['#3D1A5C', '#C060C0', '#FFB0E8'],
] as const;

interface BlobLayerProps {
  clock: SharedValue<number>;
  colorAnim: SharedValue<number>;
  colorStops: readonly [string, string, string];
  lut: { tx: readonly number[]; ty: readonly number[] };
  spread: number;
  diameter: number;
  offset: number;
  opacity: number;
  shadowStyle: ViewStyle;
}

// Extracted into its own component so useAnimatedStyle is called at the
// top level of a component — not inside a .map() callback (Rules of Hooks).
function BlobLayer({ clock, colorAnim, colorStops, lut, spread, diameter, offset, opacity, shadowStyle }: BlobLayerProps) {
  const blobStyle = useAnimatedStyle(() => {
    const tx = interpolate(clock.value, CLOCK_INPUT_RANGE, lut.tx as number[], Extrapolation.CLAMP) * spread;
    const ty = interpolate(clock.value, CLOCK_INPUT_RANGE, lut.ty as number[], Extrapolation.CLAMP) * spread;
    return {
      backgroundColor: interpolateColor(colorAnim.value, [0, 0.5, 1], [...colorStops]),
      transform: [{ translateX: tx }, { translateY: ty }],
    };
  });

  return (
    <Reanimated.View
      style={[
        {
          position: 'absolute',
          left: offset,
          top: offset,
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          opacity,
        },
        shadowStyle,
        blobStyle,
      ]}
    />
  );
}

export function AnimatedOrb({
  size = 38,
  trust   = 0.5,
  valence = 0,
  arousal = 0,
  longing = 0,
  awaiting = false,
}: OrbProps) {
  const pulseFactor = useSharedValue(1);
  const clock = useSharedValue(0);

  const trustAnim   = useSharedValue(trust);
  const valenceAnim = useSharedValue(valence * 0.5 + 0.5);
  const arousalAnim = useSharedValue(arousal * 0.5 + 0.5);
  const longingAnim = useSharedValue(longing);

  // Maps blob index → its color shared value (stable refs, safe to array-index)
  const colorAnims = [trustAnim, valenceAnim, arousalAnim, longingAnim];

  useEffect(() => {
    if (awaiting) {
      pulseFactor.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0,  { duration: 900, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseFactor.value = withTiming(1.0, { duration: 300 });
    }
  }, [awaiting]); // pulseFactor is a stable shared-value ref — intentionally excluded

  useEffect(() => {
    clock.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 8000, easing: Easing.linear }),
        withTiming(0, { duration: 8000, easing: Easing.linear })
      ),
      -1,
      false
    );
  }, []); // clock is a stable shared-value ref — runs once on mount

  // Reanimated shared values are stable refs, intentionally excluded from deps
  useEffect(() => { trustAnim.value   = withTiming(trust,               { duration: 1800 }); }, [trust]);
  useEffect(() => { valenceAnim.value = withTiming(valence * 0.5 + 0.5, { duration: 1800 }); }, [valence]);
  useEffect(() => { arousalAnim.value = withTiming(arousal * 0.5 + 0.5, { duration: 1800 }); }, [arousal]);
  useEffect(() => { longingAnim.value = withTiming(longing,              { duration: 1800 }); }, [longing]);

  const spread = (size / 2) * 0.30;

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseFactor.value }],
  }));

  return (
    <Reanimated.View style={containerStyle}>
      <View style={[styles.orb, { width: size, height: size, borderRadius: size / 2 }]}>
        {BLOB_CONFIGS.map((cfg, i) => {
          const blobDiameter = size * cfg.sizeFactor;
          const offset = (size - blobDiameter) / 2;
          const iosShadow: ViewStyle = Platform.OS === 'ios' ? {
            shadowColor:   BLOB_SHADOW_COLORS[i],
            shadowOffset:  { width: 0, height: 0 },
            shadowOpacity: 0.65,
            shadowRadius:  size * 0.28,
          } : {};
          return (
            <BlobLayer
              key={i}
              clock={clock}
              colorAnim={colorAnims[i]}
              colorStops={BLOB_COLOR_STOPS[i]}
              lut={LUTS[i]}
              spread={spread}
              diameter={blobDiameter}
              offset={offset}
              opacity={BLOB_OPACITIES[i]}
              shadowStyle={iosShadow}
            />
          );
        })}
      </View>
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  orb: {
    overflow: 'hidden',
    backgroundColor: '#100e0c',
  },
});
