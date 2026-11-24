import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Fab } from '../../components/Fab';
import { GradientHeader } from '../../components/GradientHeader';
import { SegmentedControl } from '../../components/SegmentedControl';
import { TaskRow } from '../../components/TaskRow';
import { listTasks, type TaskFilter } from '../../db/tasksRepo';
import { taskIdsWithNotes } from '../../db/notesRepo';
import { useFocusLoad } from '../../hooks/useFocusLoad';
import { deleteTask, toggleDone } from '../../services/taskService';
import { colors, HIT } from '../../theme';
import type { Task } from '../../types';
import { formatDateLong, todayString } from '../../utils/dates';
import { groupTasks } from '../../utils/groupTasks';

const FILTERS: { value: TaskFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'done', label: 'Done' },
];

const TITLES: Record<TaskFilter, string> = {
  today: 'Today',
  upcoming: 'Upcoming',
  done: 'Done',
};

const EMPTY: Record<TaskFilter, string> = {
  today: 'Nothing due today',
  upcoming: 'No upcoming tasks',
  done: 'No completed tasks yet',
};

export default function TasksScreen() {
  const [filter, setFilter] = useState<TaskFilter>('today');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [withNotes, setWithNotes] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const [list, noteIds] = await Promise.all([
      listTasks(filter, todayString()),
      taskIdsWithNotes(),
    ]);
    setTasks(list);
    setWithNotes(noteIds);
    setLoaded(true);
  }, [filter]);
  useFocusLoad(load);

  const today = todayString();
  const sections = useMemo(() => groupTasks(filter, tasks, today), [filter, tasks, today]);

  async function onToggle(task: Task) {
    await toggleDone(task.id);
    await load();
  }

  function onLongPress(task: Task) {
    Alert.alert('Delete task?', `"${task.title}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTask(task.id);
          await load();
        },
      },
    ]);
  }

  return (
    <View style={styles.screen}>
      <GradientHeader
        title={TITLES[filter]}
        subtitle={filter === 'today' ? formatDateLong(new Date()) : undefined}
      />

      <View style={styles.segmentWrap}>
        <SegmentedControl
          accessibilityLabel="Task filter"
          options={FILTERS}
          value={filter}
          onChange={setFilter}
        />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(t) => t.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        renderSectionHeader={({ section }) =>
          section.title ? (
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              {section.title}
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TaskRow
            task={item}
            today={today}
            hasNotes={withNotes.has(item.id)}
            onToggle={() => onToggle(item)}
            onOpen={() => router.push(`/task/${item.id}`)}
            onLongPress={() => onLongPress(item)}
          />
        )}
        ListEmptyComponent={
          loaded ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{EMPTY[filter]}</Text>
              {filter !== 'done' ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/quick-add')}
                  style={styles.emptyButton}
                >
                  <Text style={styles.emptyButtonText}>Add a task</Text>
                </Pressable>
              ) : null}
            </View>
          ) : undefined
        }
      />

      <Fab accessibilityLabel="Add task or note" onPress={() => router.push('/quick-add')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  segmentWrap: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  listContent: { paddingBottom: 120 },
  sectionTitle: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: colors.accent,
  },
  empty: { alignItems: 'center', paddingTop: 64, gap: 16 },
  emptyText: { fontSize: 16, color: colors.muted },
  emptyButton: {
    minHeight: HIT,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonText: { fontSize: 16, fontWeight: '700', color: colors.ink },
});
