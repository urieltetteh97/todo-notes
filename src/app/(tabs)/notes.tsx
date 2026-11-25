import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Fab } from '../../components/Fab';
import { GradientHeader } from '../../components/GradientHeader';
import { insertNote, listNotes } from '../../db/notesRepo';
import { useFocusLoad } from '../../hooks/useFocusLoad';
import { useTheme, useThemedStyles } from '../../hooks/useTheme';
import type { ThemeColors } from '../../theme';
import type { Note } from '../../types';
import { formatNoteDate } from '../../utils/dates';
import { firstLine } from '../../utils/text';

export default function NotesScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [query, setQuery] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setNotes(await listNotes(query));
    setLoaded(true);
  }, [query]);
  useFocusLoad(load);

  async function addNote() {
    const note = await insertNote({});
    router.push(`/note/${note.id}`);
  }

  return (
    <View style={styles.screen}>
      <GradientHeader title="Notes" />

      <View style={styles.searchWrap}>
        <View style={styles.search}>
          <Ionicons name="search" size={20} color={colors.accent} />
          <TextInput
            accessibilityLabel="Search notes"
            placeholder="Search notes"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
            style={styles.searchInput}
          />
        </View>
      </View>

      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const title = item.title.trim() || firstLine(item.body) || 'Untitled note';
          const preview = item.title.trim() ? item.body.trim() : item.body.trim().split('\n').slice(1).join(' ');
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${title}. ${formatNoteDate(item.updatedAt)}${item.taskId ? '. Linked to a task' : ''}`}
              onPress={() => router.push(`/note/${item.id}`)}
              style={styles.row}
            >
              <View style={styles.rowTop}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {title}
                </Text>
                {item.taskId ? (
                  <Ionicons name="link-outline" size={18} color={colors.accent} />
                ) : null}
              </View>
              {preview ? (
                <Text style={styles.rowPreview} numberOfLines={2}>
                  {preview}
                </Text>
              ) : null}
              <Text style={styles.rowDate}>{formatNoteDate(item.updatedAt)}</Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          loaded ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {query.trim() ? 'No notes match your search' : 'No notes yet. Capture your first idea.'}
              </Text>
            </View>
          ) : undefined
        }
      />

      <Fab accessibilityLabel="Add note" onPress={addNote} />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  searchWrap: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  search: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    backgroundColor: colors.soft,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.ink, paddingVertical: 10 },
  listContent: { paddingBottom: 120 },
  row: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rowTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.ink },
  rowPreview: { fontSize: 14, lineHeight: 20, color: colors.muted, marginTop: 4 },
  rowDate: { fontSize: 12, color: colors.muted, marginTop: 6 },
  empty: { alignItems: 'center', paddingTop: 64, paddingHorizontal: 32 },
  emptyText: { fontSize: 16, color: colors.muted, textAlign: 'center' },
  });
}
