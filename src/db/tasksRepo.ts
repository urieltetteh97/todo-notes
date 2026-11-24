import { getDb } from './database';
import { newId } from '../utils/id';
import type { Task } from '../types';

type TaskRow = {
  id: string;
  title: string;
  is_done: number;
  due_date: string | null;
  due_time: string | null;
  calendar_event_id: string | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
};

function fromRow(r: TaskRow): Task {
  return {
    id: r.id,
    title: r.title,
    isDone: r.is_done === 1,
    dueDate: r.due_date,
    dueTime: r.due_time,
    calendarEventId: r.calendar_event_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

export type NewTask = {
  title: string;
  dueDate?: string | null;
  dueTime?: string | null;
};

export async function insertTask(input: NewTask): Promise<Task> {
  const db = await getDb();
  const now = Date.now();
  const id = newId();
  // A time without a date makes no sense, so drop it.
  const dueDate = input.dueDate ?? null;
  const dueTime = dueDate ? input.dueTime ?? null : null;
  await db.runAsync(
    `INSERT INTO tasks (id, title, is_done, due_date, due_time, calendar_event_id, created_at, updated_at, deleted_at)
     VALUES (?, ?, 0, ?, ?, NULL, ?, ?, NULL)`,
    [id, input.title, dueDate, dueTime, now, now]
  );
  return (await getTask(id))!;
}

export async function getTask(id: string): Promise<Task | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<TaskRow>(
    'SELECT * FROM tasks WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return row ? fromRow(row) : null;
}

// Includes soft-deleted rows. The sync step needs these to clean up events.
export async function getTaskIncludingDeleted(id: string): Promise<Task | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<TaskRow>('SELECT * FROM tasks WHERE id = ?', [id]);
  return row ? fromRow(row) : null;
}

export type TaskFilter = 'today' | 'upcoming' | 'done';

export async function listTasks(filter: TaskFilter, todayDate: string): Promise<Task[]> {
  const db = await getDb();
  let sql: string;
  let params: (string | number)[] = [];
  switch (filter) {
    case 'today':
      // Overdue, due today, and undated open tasks (shown as "Anytime"). Dated tasks
      // come first by date and time; undated ones last.
      sql = `SELECT * FROM tasks
             WHERE deleted_at IS NULL AND is_done = 0 AND (due_date IS NULL OR due_date <= ?)
             ORDER BY due_date IS NULL, due_date ASC, due_time IS NULL, due_time ASC, created_at ASC`;
      params = [todayDate];
      break;
    case 'upcoming':
      sql = `SELECT * FROM tasks
             WHERE deleted_at IS NULL AND is_done = 0 AND due_date > ?
             ORDER BY due_date ASC, due_time IS NULL, due_time ASC`;
      params = [todayDate];
      break;
    case 'done':
      sql = `SELECT * FROM tasks
             WHERE deleted_at IS NULL AND is_done = 1
             ORDER BY updated_at DESC`;
      break;
  }
  const rows = await db.getAllAsync<TaskRow>(sql, params);
  return rows.map(fromRow);
}

export type TaskPatch = Partial<Pick<Task, 'title' | 'isDone' | 'dueDate' | 'dueTime'>>;

export async function patchTask(id: string, patch: TaskPatch): Promise<Task | null> {
  const db = await getDb();
  const current = await getTask(id);
  if (!current) return null;

  const next = { ...current, ...patch };
  if (!next.dueDate) next.dueTime = null; // clearing the date clears the time

  await db.runAsync(
    `UPDATE tasks SET title = ?, is_done = ?, due_date = ?, due_time = ?, updated_at = ? WHERE id = ?`,
    [next.title, next.isDone ? 1 : 0, next.dueDate, next.dueTime, Date.now(), id]
  );
  return getTask(id);
}

export async function setTaskCalendarEventId(
  id: string,
  eventId: string | null
): Promise<void> {
  const db = await getDb();
  // Deliberately does not touch updated_at: this is bookkeeping, not a user edit.
  await db.runAsync('UPDATE tasks SET calendar_event_id = ? WHERE id = ?', [eventId, id]);
}

export async function softDeleteTask(id: string): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync('UPDATE tasks SET deleted_at = ?, updated_at = ? WHERE id = ?', [now, now, id]);
  // Notes linked to the task stay, but become standalone.
  await db.runAsync('UPDATE notes SET task_id = NULL, updated_at = ? WHERE task_id = ?', [now, id]);
}

// Used when the user turns sync on, or after a permission change.
export async function listTasksWithDueDate(): Promise<Task[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<TaskRow>(
    'SELECT * FROM tasks WHERE deleted_at IS NULL AND due_date IS NOT NULL'
  );
  return rows.map(fromRow);
}
