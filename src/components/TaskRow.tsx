import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Task } from '../types';
import { describeDue } from '../utils/dates';
import { colors, HIT } from '../theme';

type Props = {
  task: Task;
  today: string;
  hasNotes: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onLongPress: () => void;
};

export function TaskRow({ task, today, hasNotes, onToggle, onOpen, onLongPress }: Props) {
  const subtitle = describeDue(task, today);
  const synced = task.calendarEventId !== null;
  const spoken = [
    task.title,
    task.isDone ? 'Completed' : subtitle,
    hasNotes ? 'Has notes' : null,
    synced ? 'In your calendar' : null,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.isDone }}
        accessibilityLabel={`Mark ${task.title} ${task.isDone ? 'not done' : 'complete'}`}
        onPress={onToggle}
        style={styles.checkHit}
      >
        <View style={[styles.circle, task.isDone && styles.circleDone]}>
          {task.isDone ? <Ionicons name="checkmark" size={16} color={colors.ink} /> : null}
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={spoken}
        accessibilityHint="Opens the task. Long press to delete."
        onPress={onOpen}
        onLongPress={onLongPress}
        style={styles.main}
      >
        <Text style={[styles.title, task.isDone && styles.titleDone]} numberOfLines={2}>
          {task.title}
        </Text>
        <Text style={styles.subtitle}>{task.isDone ? 'Completed' : subtitle}</Text>
      </Pressable>

      <View style={styles.icons} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {hasNotes ? <Ionicons name="document-text-outline" size={20} color={colors.accent} /> : null}
        {synced ? <Ionicons name="calendar-outline" size={20} color={colors.accent} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 20,
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  checkHit: { width: HIT, height: HIT, alignItems: 'center', justifyContent: 'center' },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: { backgroundColor: colors.primary, borderColor: colors.ink },
  main: { flex: 1, minHeight: HIT, justifyContent: 'center', paddingHorizontal: 4 },
  title: { fontSize: 16, fontWeight: '500', color: colors.ink },
  titleDone: { textDecorationLine: 'line-through', color: colors.muted },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
  icons: { flexDirection: 'row', gap: 8, marginLeft: 6 },
});
