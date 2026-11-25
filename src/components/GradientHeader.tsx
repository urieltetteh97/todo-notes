import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useThemedStyles } from '../hooks/useTheme';
import type { ThemeColors } from '../theme';

type Props = {
  title?: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
};

export function GradientHeader({ title, subtitle, left, right }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const hasBar = Boolean(left || right);

  return (
    <LinearGradient
      colors={[colors.gradientFrom, colors.gradientTo]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.base, { paddingTop: insets.top + (hasBar ? 4 : 16) }]}
    >
      {hasBar ? (
        <View style={styles.bar}>
          {left}
          <View style={styles.spacer} />
          {right}
        </View>
      ) : null}
      {title ? (
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      ) : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </LinearGradient>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  base: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: 4,
  },
  bar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: -12 },
  spacer: { flex: 1 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: colors.ink },
  subtitle: { fontSize: 14, color: colors.muted },
  });
}
