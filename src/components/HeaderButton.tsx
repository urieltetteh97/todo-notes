import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, HIT } from '../theme';

type Props =
  | { kind: 'back'; label: string; onPress: () => void }
  | { kind: 'icon'; icon: keyof typeof Ionicons.glyphMap; accessibilityLabel: string; onPress: () => void }
  | { kind: 'pill'; label: string; onPress: () => void; disabled?: boolean };

export function HeaderButton(props: Props) {
  if (props.kind === 'back') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Back to ${props.label}`}
        onPress={props.onPress}
        style={styles.back}
      >
        <Ionicons name="chevron-back" size={24} color={colors.ink} />
        <Text style={styles.backText}>{props.label}</Text>
      </Pressable>
    );
  }
  if (props.kind === 'icon') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={props.accessibilityLabel}
        onPress={props.onPress}
        style={styles.icon}
      >
        <Ionicons name={props.icon} size={22} color={colors.ink} />
      </Pressable>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: props.disabled }}
      disabled={props.disabled}
      onPress={props.onPress}
      style={[styles.pill, props.disabled && styles.pillDisabled]}
    >
      <Text style={styles.pillText}>{props.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  back: { minHeight: HIT, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  backText: { fontSize: 16, fontWeight: '600', color: colors.ink },
  icon: { width: HIT, height: HIT, alignItems: 'center', justifyContent: 'center' },
  pill: {
    minHeight: HIT,
    paddingHorizontal: 16,
    marginRight: 12,
    borderRadius: 22,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillDisabled: { opacity: 0.5 },
  pillText: { fontSize: 15, fontWeight: '700', color: colors.pill },
});
