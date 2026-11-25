import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { requestPermission } from '../calendar/calendarService';
import { dismissCalendarPrompt } from '../services/syncSettings';
import { syncAllTasks } from '../services/taskService';
import { useTheme, useThemedStyles } from '../hooks/useTheme';
import { radius, type ThemeColors } from '../theme';

export default function CalendarPermission() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);

  async function allow() {
    if (busy) return;
    setBusy(true);
    try {
      const granted = await requestPermission();
      // Tasks saved before access was granted catch up now.
      if (granted) await syncAllTasks();
      // Whatever the answer, don't ask again: Settings can bring this back later.
      await dismissCalendarPrompt();
      router.back();
    } finally {
      setBusy(false);
    }
  }

  async function notNow() {
    await dismissCalendarPrompt();
    router.back();
  }

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.center}>
        <LinearGradient
          colors={[colors.gradientFrom, colors.gradientTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.icon}
        >
          <Ionicons name="calendar-outline" size={64} color={colors.ink} />
        </LinearGradient>

        <Text accessibilityRole="header" style={styles.title}>
          Show your tasks in your calendar
        </Text>
        <Text style={styles.body}>
          Allow calendar access so tasks with a due date appear in your calendar. The app only
          adds and updates events in its own &ldquo;App Tasks&rdquo; calendar.
        </Text>
      </View>

      <View style={styles.buttons}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={allow}
          style={[styles.primary, busy && styles.disabled]}
        >
          <Text style={styles.primaryText}>Allow calendar access</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={notNow} style={styles.secondary}>
          <Text style={styles.secondaryText}>Not now</Text>
        </Pressable>
        <Text style={styles.footnote}>You can change this any time in Settings.</Text>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white, paddingHorizontal: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 8 },
  icon: {
    width: 128,
    height: 128,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  body: { fontSize: 16, lineHeight: 24, color: colors.muted, textAlign: 'center' },
  buttons: { gap: 8 },
  primary: {
    minHeight: 52,
    borderRadius: radius.card,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { fontSize: 17, fontWeight: '800', color: colors.ink },
  disabled: { opacity: 0.6 },
  secondary: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 16, fontWeight: '700', color: colors.accent },
  footnote: { textAlign: 'center', fontSize: 13, lineHeight: 18, color: colors.muted },
  });
}
