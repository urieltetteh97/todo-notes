import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DateField } from '../components/DateField';
import { SegmentedControl } from '../components/SegmentedControl';
import { insertNote } from '../db/notesRepo';
import { shouldAskForCalendarAccess } from '../services/calendarPrompt';
import { createTask } from '../services/taskService';
import { colors, HIT, radius } from '../theme';
import { toDateString, toTimeString } from '../utils/dates';

type Kind = 'task' | 'note';

const KINDS: { value: Kind; label: string }[] = [
  { value: 'task', label: 'Task' },
  { value: 'note', label: 'Note' },
];

export default function QuickAdd() {
  const insets = useSafeAreaInsets();
  const [kind, setKind] = useState<Kind>('task');
  const [text, setText] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  const canSave = text.trim().length > 0 && !saving;

  async function save() {
    if (!canSave) return;
    setSaving(true);
    try {
      const title = text.trim();
      if (kind === 'note') {
        const note = await insertNote({ title });
        router.replace(`/note/${note.id}`);
        return;
      }
      await createTask({
        title,
        dueDate: date ? toDateString(date) : null,
        dueTime: date && time ? toTimeString(time) : null,
      });
      if (date && (await shouldAskForCalendarAccess())) {
        router.replace('/calendar-permission');
      } else {
        router.back();
      }
    } finally {
      setSaving(false);
    }
  }

  function changeDate(next: Date | null) {
    setDate(next);
    if (!next) setTime(null);
  }

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close quick add"
        onPress={() => router.back()}
        style={styles.backdrop}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />

          <SegmentedControl
            accessibilityLabel="What to add"
            options={KINDS}
            value={kind}
            onChange={setKind}
          />

          <TextInput
            autoFocus
            accessibilityLabel={kind === 'task' ? 'Task title' : 'Note title'}
            placeholder={kind === 'task' ? 'What needs doing?' : 'Note title'}
            placeholderTextColor={colors.muted}
            value={text}
            onChangeText={setText}
            onSubmitEditing={save}
            returnKeyType="done"
            style={styles.input}
          />

          <View style={styles.actions}>
            {kind === 'task' ? (
              <View style={styles.chips}>
                <DateField
                  mode="date"
                  value={date}
                  onChange={changeDate}
                  placeholder="Add date"
                  accessibilityLabel="Due date"
                  clearable
                />
                {date ? (
                  <DateField
                    mode="time"
                    value={time}
                    onChange={(d) => setTime(d ?? null)}
                    placeholder="Add time"
                    accessibilityLabel="Due time"
                    clearable
                  />
                ) : null}
              </View>
            ) : (
              <View style={styles.chips} />
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSave }}
              disabled={!canSave}
              onPress={save}
              style={[styles.save, !canSave && styles.saveDisabled]}
            >
              <Text style={styles.saveText}>{kind === 'task' ? 'Save' : 'Create'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 3,
    borderTopColor: colors.primary,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 14,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  input: {
    minHeight: 52,
    paddingHorizontal: 14,
    fontSize: 18,
    color: colors.ink,
    borderWidth: 2,
    borderColor: '#7C3AED',
    borderRadius: radius.input,
    backgroundColor: colors.white,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chips: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  save: {
    minHeight: HIT,
    minWidth: 88,
    paddingHorizontal: 16,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDisabled: { opacity: 0.5 },
  saveText: { fontSize: 16, fontWeight: '800', color: colors.ink },
});
