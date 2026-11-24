import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { describeCalendarAccess } from '../../calendar/access';
import { getPermissionState } from '../../calendar/calendarService';
import type { PermissionState } from '../../calendar/status';
import { GradientHeader } from '../../components/GradientHeader';
import { useFocusLoad } from '../../hooks/useFocusLoad';
import { loadSyncSettings, saveCompletionBehavior, saveSyncEnabled } from '../../services/syncSettings';
import { syncAllTasks } from '../../services/taskService';
import { colors, HIT, radius } from '../../theme';
import { DEFAULT_SYNC_SETTINGS, type CompletionBehavior, type SyncSettings } from '../../types';

const BEHAVIORS: { value: CompletionBehavior; label: string; hint: string }[] = [
  { value: 'keep', label: 'Keep it, marked [Done]', hint: 'The event stays and its title starts with [Done]' },
  { value: 'remove', label: 'Remove it from the calendar', hint: 'Un-completing the task brings it back' },
];

export default function SettingsScreen() {
  const [settings, setSettings] = useState<SyncSettings>(DEFAULT_SYNC_SETTINGS);
  const [permission, setPermission] = useState<PermissionState>('undetermined');
  const lastPermission = useRef<PermissionState | null>(null);

  const refresh = useCallback(async () => {
    const [s, p] = await Promise.all([loadSyncSettings(), getPermissionState()]);
    setSettings(s);
    setPermission(p);
    // Access just came back (granted in the permission screen or in system settings):
    // catch up tasks saved while it was off.
    if (p === 'granted' && lastPermission.current !== null && lastPermission.current !== 'granted' && s.syncEnabled) {
      await syncAllTasks();
    }
    lastPermission.current = p;
  }, []);
  useFocusLoad(refresh);

  // Coming back from the system Settings app does not "focus" this screen again.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh().catch((e) => console.warn('Refresh failed', e));
    });
    return () => sub.remove();
  }, [refresh]);

  const access = describeCalendarAccess(permission);

  async function toggleSync(next: boolean) {
    setSettings((s) => ({ ...s, syncEnabled: next }));
    await saveSyncEnabled(next);
    if (!next) return; // Existing events stay where they are.
    if (permission === 'granted') {
      await syncAllTasks();
    } else if (permission === 'undetermined') {
      router.push('/calendar-permission');
    }
  }

  async function chooseBehavior(next: CompletionBehavior) {
    if (next === settings.completionBehavior) return;
    setSettings((s) => ({ ...s, completionBehavior: next }));
    await saveCompletionBehavior(next);
    if (permission === 'granted' && settings.syncEnabled) await syncAllTasks();
  }

  function onAccessAction() {
    if (access.action === 'ask') router.push('/calendar-permission');
    else if (access.action === 'open-settings') Linking.openSettings().catch(() => {});
  }

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={styles.screen}>
      <GradientHeader title="Settings" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.section}>
          Calendar sync
        </Text>

        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Sync tasks to calendar</Text>
            <Text style={styles.rowHint}>Tasks with a due date appear in your calendar</Text>
          </View>
          <Switch
            accessibilityLabel="Sync tasks to calendar"
            value={settings.syncEnabled}
            onValueChange={toggleSync}
            trackColor={{ false: colors.trackOff, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Calendar</Text>
            <Text style={styles.rowHint}>Events go into this calendar</Text>
          </View>
          <Text style={styles.value}>App Tasks</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Calendar access</Text>
            <Text style={styles.rowHint}>{access.label}</Text>
          </View>
          {access.actionLabel ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={access.actionLabel}
              onPress={onAccessAction}
              style={styles.linkButton}
            >
              <Text style={styles.linkText}>{access.actionLabel}</Text>
            </Pressable>
          ) : (
            <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
          )}
        </View>

        <Text accessibilityRole="header" style={styles.section}>
          When a task is completed
        </Text>
        {BEHAVIORS.map((b) => {
          const selected = settings.completionBehavior === b.value;
          return (
            <Pressable
              key={b.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => chooseBehavior(b.value)}
              style={styles.row}
            >
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{b.label}</Text>
                <Text style={styles.rowHint}>{b.hint}</Text>
              </View>
              <View style={[styles.radio, selected && styles.radioOn]}>
                {selected ? <View style={styles.radioDot} /> : null}
              </View>
            </Pressable>
          );
        })}

        <Text accessibilityRole="header" style={styles.section}>
          About
        </Text>
        <View style={styles.row}>
          <Text style={styles.rowTitle}>Version</Text>
          <Text style={styles.value}>{version}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  content: { paddingBottom: 48 },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
    fontSize: 14,
    fontWeight: '800',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  rowHint: { fontSize: 13, lineHeight: 18, color: colors.muted, marginTop: 2 },
  value: { fontSize: 16, color: colors.muted },
  linkButton: {
    minHeight: HIT,
    paddingHorizontal: 14,
    borderRadius: radius.button,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: { fontSize: 15, fontWeight: '700', color: colors.accent },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.accent },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent },
});
