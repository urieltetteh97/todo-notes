import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../hooks/useTheme';
import { HIT, type ThemeColors } from '../theme';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: Props<T>) {
  const styles = useThemedStyles(createStyles);
  return (
    <View accessibilityRole="tablist" accessibilityLabel={accessibilityLabel} style={styles.track}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.soft,
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    minHeight: HIT,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: { backgroundColor: colors.primary },
  label: { fontSize: 14, fontWeight: '600', color: colors.accent },
  labelSelected: { fontWeight: '700', color: colors.ink },
  });
}
