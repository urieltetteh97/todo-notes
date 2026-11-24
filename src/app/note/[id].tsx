import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GradientHeader } from '../../components/GradientHeader';
import { HeaderButton } from '../../components/HeaderButton';
import { getNote, softDeleteNote, updateNote } from '../../db/notesRepo';
import { getTask } from '../../db/tasksRepo';
import { colors, HIT } from '../../theme';
import {
  BULLET,
  CHECKBOX,
  isBlankNote,
  toggleLinePrefix,
  type Selection,
} from '../../utils/text';

const AUTOSAVE_MS = 600;

export default function NoteEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [ready, setReady] = useState(false);
  const [missing, setMissing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState<string | null>(null);
  const [status, setStatus] = useState<'saved' | 'saving'>('saved');
  // Only set when the toolbar moves the caret; otherwise the input owns its selection.
  const [forcedSelection, setForcedSelection] = useState<Selection | undefined>(undefined);

  const latest = useRef({ title: '', body: '' });
  const selectionRef = useRef<Selection>({ start: 0, end: 0 });
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef = useRef(false);
  const deletedRef = useRef(false);

  useEffect(() => {
    (async () => {
      const note = await getNote(id);
      if (!note) {
        setMissing(true);
        return;
      }
      latest.current = { title: note.title, body: note.body };
      setTitle(note.title);
      setBody(note.body);
      setTaskId(note.taskId);
      if (note.taskId) {
        const task = await getTask(note.taskId);
        setTaskTitle(task?.title ?? null);
      }
      loadedRef.current = true;
      setReady(true);
    })().catch((err) => console.warn('Load note failed', err));
  }, [id]);

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (!dirty.current || deletedRef.current) return;
    dirty.current = false;
    await updateNote(id, { title: latest.current.title, body: latest.current.body });
    setStatus('saved');
  }, [id]);

  const schedule = useCallback(() => {
    dirty.current = true;
    setStatus('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      flush().catch((err) => console.warn('Autosave failed', err));
    }, AUTOSAVE_MS);
  }, [flush]);

  // On leaving: save pending edits, or drop the note if it was never written in.
  useEffect(() => {
    return () => {
      if (!loadedRef.current || deletedRef.current) return;
      const { title: t, body: b } = latest.current;
      if (isBlankNote(t, b)) {
        deletedRef.current = true;
        softDeleteNote(id).catch((err) => console.warn('Cleanup failed', err));
      } else {
        flush().catch((err) => console.warn('Final save failed', err));
      }
    };
  }, [id, flush]);

  function onTitleChange(text: string) {
    setTitle(text);
    latest.current.title = text;
    schedule();
  }

  function onBodyChange(text: string) {
    setBody(text);
    latest.current.body = text;
    schedule();
  }

  function applyPrefix(prefix: string) {
    const result = toggleLinePrefix(latest.current.body, selectionRef.current, prefix);
    onBodyChange(result.body);
    selectionRef.current = result.selection;
    setForcedSelection(result.selection);
  }

  async function unlink() {
    setTaskId(null);
    setTaskTitle(null);
    await updateNote(id, { taskId: null });
  }

  function confirmDelete() {
    Alert.alert('Delete note?', 'This note will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          deletedRef.current = true;
          if (timer.current) clearTimeout(timer.current);
          await softDeleteNote(id);
          router.back();
        },
      },
    ]);
  }

  if (missing) {
    return (
      <View style={styles.screen}>
        <GradientHeader left={<HeaderButton kind="back" label="Back" onPress={() => router.back()} />} />
        <View style={styles.missing}>
          <Text style={styles.missingText}>This note no longer exists.</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <GradientHeader
        left={<HeaderButton kind="back" label="Back" onPress={() => router.back()} />}
        right={
          <View style={styles.headerRight}>
            <Text accessibilityLiveRegion="polite" style={styles.status}>
              {status === 'saving' ? 'Saving…' : 'Saved'}
            </Text>
            <HeaderButton
              kind="icon"
              icon="trash-outline"
              accessibilityLabel="Delete note"
              onPress={confirmDelete}
            />
          </View>
        }
      />

      {taskId && taskTitle ? (
        <View style={styles.chipRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Linked to task ${taskTitle}. Opens the task.`}
            onPress={() => router.push(`/task/${taskId}`)}
            style={styles.chip}
          >
            <Ionicons name="link-outline" size={18} color={colors.accent} />
            <Text style={styles.chipText} numberOfLines={1}>
              Linked to: {taskTitle}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Unlink from task"
            onPress={unlink}
            style={styles.unlink}
          >
            <Ionicons name="close-circle" size={22} color={colors.muted} />
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          accessibilityLabel="Note title"
          editable={ready}
          value={title}
          onChangeText={onTitleChange}
          placeholder="Title"
          placeholderTextColor={colors.muted}
          style={styles.titleInput}
        />
        <TextInput
          accessibilityLabel="Note body"
          editable={ready}
          multiline
          scrollEnabled={false}
          textAlignVertical="top"
          value={body}
          onChangeText={onBodyChange}
          onSelectionChange={(e) => {
            selectionRef.current = e.nativeEvent.selection;
            if (forcedSelection) setForcedSelection(undefined);
          }}
          selection={forcedSelection}
          placeholder="Start writing"
          placeholderTextColor={colors.muted}
          style={styles.bodyInput}
        />
      </ScrollView>

      <View style={styles.toolbar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Bulleted list"
          onPress={() => applyPrefix(BULLET)}
          style={styles.tool}
        >
          <Ionicons name="list" size={24} color={colors.ink} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Checklist"
          onPress={() => applyPrefix(CHECKBOX)}
          style={styles.tool}
        >
          <Ionicons name="checkbox-outline" size={24} color={colors.ink} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  status: { fontSize: 13, color: colors.muted },
  chipRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, gap: 4 },
  chip: {
    flexShrink: 1,
    minHeight: HIT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
    backgroundColor: colors.softAlt,
  },
  chipText: { flexShrink: 1, fontSize: 14, color: colors.ink },
  unlink: { width: HIT, height: HIT, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  titleInput: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.ink,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.chipBorder,
  },
  bodyInput: {
    minHeight: 280,
    fontSize: 17,
    lineHeight: 26,
    color: colors.ink,
    paddingTop: 16,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.soft,
  },
  tool: { width: HIT, height: HIT, alignItems: 'center', justifyContent: 'center' },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missingText: { fontSize: 16, color: colors.muted },
});
