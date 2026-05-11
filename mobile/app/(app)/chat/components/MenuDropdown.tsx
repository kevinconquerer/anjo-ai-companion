import { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../../lib/theme-context';
import { COLORS } from '../types';

interface MenuDropdownProps {
  onClose: () => void;
  onSignOut: () => void;
}

export const MenuDropdown = memo(function MenuDropdown({ onClose, onSignOut }: MenuDropdownProps) {
  const { surface, border, text } = useTheme();
  const router = useRouter();

  const borderColor = border ?? 'rgba(255,255,255,0.1)';

  const items = [
    { label: 'Our story', onPress: () => { onClose(); router.push('/(app)/story'); } },
    { label: 'Plans & billing', onPress: () => { onClose(); router.push('/(app)/billing'); } },
    { label: 'Settings', onPress: () => { onClose(); router.push('/(app)/settings'); } },
    { label: 'Forget me', onPress: () => { onClose(); router.push('/(app)/forget'); }, danger: true },
    { label: 'Sign out', onPress: onSignOut, danger: true },
  ];

  return (
    <View style={[styles.container, { backgroundColor: surface, borderColor }]}>
      {items.map((item, i) => (
        <View key={item.label}>
          {i > 0 && <View style={[styles.divider, { backgroundColor: borderColor }]} />}
          <TouchableOpacity style={styles.item} onPress={item.onPress}>
            <Text style={[styles.label, { color: item.danger ? COLORS.danger : text }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 90,
    right: 16,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 8,
    minWidth: 200,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
  },
  item: { paddingVertical: 12, paddingHorizontal: 16 },
  label: { fontSize: 15, fontWeight: '500' },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 8 },
});
