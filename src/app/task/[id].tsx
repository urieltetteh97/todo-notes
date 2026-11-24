import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getPermissionState } from '../../calendar/calendarService';
import { describeCalendarStatus, type PermissionState } from '../../calendar/status';
import { DateField } from '../../components/DateField';
import { GradientHeader } from '../../components/GradientHeader';
import { HeaderButton } from '../../components/HeaderButton';
import { insertNote, listNotesForTask } from '../../db/notesRepo';
import { getTask } from '../../db/tasksRepo';
import { useFocusLoad } from '../../hooks/useFocusLoad';
import { shouldAskForCalendarAccess } from '../../services/calendarPrompt';
import { loadSyncSettings } from '../../services/syncSettings';
import { deleteTask, updateTask } from '../../services/taskService';
import { colors, HIT, radius } from '../../theme';
import type { Note, Task } from '../../types';
import { dateFromStrings, nextHour, toDateString, toTimeString } from '../../utils/dates';
import { firstLine } from '../../utils/text';

export default function TaskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // The saved task (for calendar status) vs. the form fields being edited.
  const [task, setTask] = useState<Task | null>(null);
  const [missing, setMissing] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [hasTime, setHasTime] = useState(false);
  const [time, setTime] = useState<Date>(nextHour());
  const [done, setDone] = useState(false);

  const [notes, setNotes] = useState<Note[]>([]);
  const [calendar, setCalendar] = useState<{ syncEnabled: boolean; permission: PermissionState }>({
    syncEnabled: true,
    permission: 'undetermined',
  });
  const [saving, setSaving] = useState(false);

  // Fill the form once. Later focus reloads must not overwrite unsaved edits.
  useEffect(() => {
    (async () => {
      const t = await getTask(id);
      if (!t) {
        setMissing(true);
        return;
      }
      setTask(t);
      setTitle(t.title);
      setDone(t.isDone);
      if (t.dueDate) {
        setDate(dateFromStrings(t.dueDate, t.dueTime));
        if (t.dueTime) {
          setHasTime(true);
          setTime(dateFromStrings(t.dueDate, t.dueTime));
        }
      }
    })().catch((err) => console.warn('Load task failed', err));
  }, [id]);

  // Refresh what can change elsewhere: linked notes, calendar state, the saved event id.
  const refresh = useCallback(async () => {
    const [linked, settings, permission, fresh] = await Promise.all([
      listNotesForTask(id),
      loadSyncSettings(),
      getPermissionState(),
      getTask(id),
    ]);
    setNotes(linked);
    setCalendar({ syncEnabled: settings.syncEnabled, permission });
    if (fresh) setTask(fresh);
  }, [id]);
  useFocusLoad(refresh);

  function changeDate(next: Date | null) {
    setDate(next);
    if (!next) setHasTime(false);
  }

  async function save() {
    if (!task || saving) return;
    setSaving(true);
    try {
      const dueDate = date ? toDateString(date) : null;
      const dueTime = date && hasTime ? toTimeString(time) : null;
      await updateTask(task.id, {
        title: title.trim() || task.title,
        isDone: done,
        dueDate,
        dueTime,
      });
      if (dueDate && (await shouldAskForCalendarAccess())) {
        router.replace('/calendar-permission');
      } else {
        router.back();
      }
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    if (!task) return;
    Alert.alert('Delete task?', `"${task.title}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTask(task.id);
          router.back();
        },
      },
    ]);
  }

  async function addNote() {
    if (!task) return;
    const note = await insertNote({ taskId: task.id });
    router.push(`/note/${note.id}`);
  }

  if (missing) {
    return (
      <View style={styles.screen}>
        <GradientHeader left={<HeaderButton kind="back" label="Tasks" onPress={() => router.back()} />} />
        <View style={styles.missing}>
          <Text style={styles.missingText}>This task no longer exists.</Text>
        </View>
      </View>
    );
  }

  const status = describeCalendarStatus({
    dueDate: task?.dueDate ?? null,
    calendarEventId: task?.calendarEventId ?? null,
    syncEnabled: calendar.syncEnabled,
    permission: calendar.permission,
  });

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <GradientHeader
        left={<HeaderButton kind="back" label="Tasks" onPress={() => router.back()} />}
        right={<HeaderButton kind="pill" label="Save" onPress={save} disabled={saving || !task} />}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View>
          <Text style={styles.label}>Title</Text>
          <TextInput
            accessibilityLabel="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Task title"
            placeholderTextColor={colors.muted}
            style={styles.titleInput}
          />
        </View>

        <View style={styles.card}>
          <View style={[styles.cardRow, styles.cardRowDivider]}>
            <Text style={styles.rowLabel}>Due date</Text>
            <DateField
              mode="date"
              value={date}
              onChange={changeDate}
              placeholder="Add date"
              accessibilityLabel="Due date"
              clearable
            />
          </View>

          <View style={[styles.cardRow, styles.cardRowDivider]}>
            <Text style={[styles.rowLabel, !date && styles.rowLabelDisabled]}>Add time</Text>
            <Switch
              accessibilityLabel="Add time"
              disabled={!date}
              value={hasTime}
              onValueChange={setHasTime}
              trackColor={{ false: colors.trackOff, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          {date && hasTime ? (
            <View style={[styles.cardRow, styles.cardRowDivider]}>
              <Text style={styles.rowLabel}>Time</Text>
              <DateField
                mode="time"
                value={time}
                onChange={(d) => d && setTime(d)}
                placeholder="Add time"
                accessibilityLabel="Due time"
              />
            </View>
          ) : null}

          <View style={styles.cardRow}>
            <Text style={styles.rowLabel}>Completed</Text>
            <Switch
              accessibilityLabel="Completed"
              value={done}
              onValueChange={setDone}
              trackColor={{ false: colors.trackOff, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        <View style={styles.status} accessibilityRole="summary">
          <Ionicons
            name={status.synced ? 'checkmark-circle-outline' : 'calendar-outline'}
            size={22}
            color={colors.accent}
          />
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>{status.title}</Text>
            <Text style={styles.statusDetail}>{status.detail}</Text>
          </View>
        </View>

        <View>
          <View style={styles.notesHeader}>
            <Text style={styles.label}>Linked notes</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add note to this task"
              onPress={addNote}
              style={styles.addNote}
            >
              <Ionicons name="add" size={20} color={colors.accent} />
              <Text style={styles.addNoteText}>Add note</Text>
            </Pressable>
          </View>

          {notes.length === 0 ? (
            <Text style={styles.noNotes}>No notes yet.</Text>
          ) : (
            <View style={styles.noteList}>
              {notes.map((n) => {
                const noteTitle = n.title.trim() || firstLine(n.body) || 'Untitled note';
                const preview = n.title.trim() ? n.body.trim() : '';
                return (
                  <Pressable
                    key={n.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Open note ${noteTitle}`}
                    onPress={() => router.push(`/note/${n.id}`)}
                    style={styles.noteCard}
                  >
                    <Text style={styles.noteTitle} numberOfLines={1}>
                      {noteTitle}
                    </Text>
                    {preview ? (
                      <Text style={styles.notePreview} numberOfLines={2}>
                        {preview}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={confirmDelete}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteText}>Delete task</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  content: { padding: 20, gap: 18, paddingBottom: 48 },
  label: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: colors.accent,
    marginBottom: 6,
  },
  titleInput: {
    minHeight: 52,
    paddingHorizontal: 14,
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
    borderWidth: 2,
    borderColor: '#7C3AED',
    borderRadius: radius.input,
  },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.card },
  cardRow: {
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardRowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  rowLabel: { fontSize: 16, color: colors.ink },
  rowLabelDisabled: { color: colors.muted, opacity: 0.6 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#8B5CF6',
    backgroundColor: colors.softAlt,
  },
  statusText: { flex: 1 },
  statusTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  statusDetail: { fontSize: 13, color: colors.muted, marginTop: 2 },
  notesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addNote: { minHeight: HIT, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  addNoteText: { fontSize: 15, fontWeight: '700', color: colors.accent },
  noNotes: { fontSize: 14, color: colors.muted },
  noteList: { gap: 8 },
  noteCard: {
    padding: 14,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.soft,
  },
  noteTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  notePreview: { fontSize: 13, lineHeight: 18, color: colors.muted, marginTop: 3 },
  deleteButton: {
    minHeight: 48,
    borderRadius: radius.button,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  deleteText: { fontSize: 16, fontWeight: '700', color: colors.accent },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missingText: { fontSize: 16, color: colors.muted },
});
