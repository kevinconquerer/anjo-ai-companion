import { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { AnimatedOrb } from '../../../../components/AnimatedOrb';
import { useTheme } from '../../../../lib/theme-context';
import { COLORS } from '../types';
import { StatusDot } from './StatusDot';

interface HeaderProps {
  orbTrust: number;
  orbValence: number;
  orbArousal: number;
  orbLonging: number;
  streaming: boolean;
  paddingTop: number;
  onMenuPress: () => void;
}

export const Header = memo(function Header({
  orbTrust,
  orbValence,
  orbArousal,
  orbLonging,
  streaming,
  paddingTop,
  onMenuPress,
}: HeaderProps) {
  const { primary, muted } = useTheme();

  return (
    <BlurView
      intensity={85}
      tint="dark"
      style={[styles.container, { paddingTop }]}
    >
      <View style={styles.content}>
        <View style={styles.left}>
          <AnimatedOrb
            size={38}
            trust={orbTrust}
            valence={orbValence}
            arousal={orbArousal}
            longing={orbLonging}
            awaiting={streaming}
          />
          <Text style={[styles.name, { color: primary }]}>Anjo</Text>
          <StatusDot streaming={streaming} accentColor={primary} greenColor={COLORS.green} />
        </View>
        <TouchableOpacity style={styles.menuBtn} onPress={onMenuPress}>
          <Text style={{ color: muted, fontSize: 20, lineHeight: 24 }}>···</Text>
        </TouchableOpacity>
      </View>
    </BlurView>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontSize: 16, fontWeight: '600' },
  menuBtn: {
    padding: 8,
    borderRadius: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
