import { getDb } from './database';
import { newId } from '../utils/id';
import type { Note } from '../types';

type NoteRow = {
  id: string;
  title: string;
  body: string;
  task_id: string | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
};

function fromRow(r: NoteRow): Note {
  return {
    id: r.id,
    title: r.title,
    body: r.body,
    taskId: r.task_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

export async function insertNote(input: {
  title?: string;
  body?: string;
  taskId?: string | null;
}): Promise<Note> {
  const db = await getDb();
  const now = Date.now();
  const id = newId();
  await db.runAsync(
    `INSERT INTO notes (id, title, body, task_id, created_at, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL)`,
    [id, input.title ?? '', input.body ?? '', input.taskId ?? null, now, now]
  );
  return (await getNote(id))!;
}

export async function getNote(id: string): Promise<Note | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<NoteRow>(
    'SELECT * FROM notes WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return row ? fromRow(row) : null;
}

// Most recently edited first. Optional search matches title or body.
export async function listNotes(search?: string): Promise<Note[]> {
  const db = await getDb();
  const term = search?.trim();
  if (term) {
    const like = `%${term.replace(/[%_]/g, (c) => '\\' + c)}%`;
    const rows = await db.getAllAsync<NoteRow>(
      `SELECT * FROM notes
       WHERE deleted_at IS NULL AND (title LIKE ? ESCAPE '\\' OR body LIKE ? ESCAPE '\\')
       ORDER BY updated_at DESC`,
      [like, like]
    );
    return rows.map(fromRow);
  }
  const rows = await db.getAllAsync<NoteRow>(
    'SELECT * FROM notes WHERE deleted_at IS NULL ORDER BY updated_at DESC'
  );
  return rows.map(fromRow);
}

export async function listNotesForTask(taskId: string): Promise<Note[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<NoteRow>(
    'SELECT * FROM notes WHERE deleted_at IS NULL AND task_id = ? ORDER BY updated_at DESC',
    [taskId]
  );
  return rows.map(fromRow);
}

// Called on every autosave pause from the editor.
export async function updateNote(
  id: string,
  patch: Partial<Pick<Note, 'title' | 'body' | 'taskId'>>
): Promise<Note | null> {
  const db = await getDb();
  const current = await getNote(id);
  if (!current) return null;
  const next = { ...current, ...patch };
  await db.runAsync(
    'UPDATE notes SET title = ?, body = ?, task_id = ?, updated_at = ? WHERE id = ?',
    [next.title, next.body, next.taskId, Date.now(), id]
  );
  return getNote(id);
}

// Ids of tasks that have at least one linked note, for the "has notes" icon on task rows.
export async function taskIdsWithNotes(): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ task_id: string }>(
    'SELECT DISTINCT task_id FROM notes WHERE deleted_at IS NULL AND task_id IS NOT NULL'
  );
  return new Set(rows.map((r) => r.task_id));
}

export async function softDeleteNote(id: string): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync('UPDATE notes SET deleted_at = ?, updated_at = ? WHERE id = ?', [now, now, id]);
}
