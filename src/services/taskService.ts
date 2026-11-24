// The only place screens should call to change tasks. It writes to the database FIRST
// and syncs the calendar SECOND, so a calendar problem never loses a task.

import {
  getTask,
  getTaskIncludingDeleted,
  insertTask,
  patchTask,
  setTaskCalendarEventId,
  softDeleteTask,
  type NewTask,
  type TaskPatch,
} from '../db/tasksRepo';
import { getPermissionState, syncTask } from '../calendar/calendarService';
import { loadSyncSettings } from './syncSettings';
import type { Task } from '../types';

async function syncAndStore(task: Task): Promise<Task> {
  const [settings, permission] = await Promise.all([loadSyncSettings(), getPermissionState()]);
  const { calendarEventId } = await syncTask(task, {
    settings,
    permissionGranted: permission === 'granted',
  });
  if (calendarEventId !== task.calendarEventId) {
    await setTaskCalendarEventId(task.id, calendarEventId);
    return { ...task, calendarEventId };
  }
  return task;
}

export async function createTask(input: NewTask): Promise<Task> {
  const task = await insertTask(input);
  return syncAndStore(task);
}

export async function updateTask(id: string, patch: TaskPatch): Promise<Task | null> {
  const task = await patchTask(id, patch);
  return task ? syncAndStore(task) : null;
}

export async function toggleDone(id: string): Promise<Task | null> {
  const current = await getTask(id);
  return current ? updateTask(id, { isDone: !current.isDone }) : null;
}

export async function deleteTask(id: string): Promise<void> {
  await softDeleteTask(id);
  // Read the soft-deleted row so planSync sees deletedAt and removes the event.
  const task = await getTaskIncludingDeleted(id);
  if (task) await syncAndStore(task);
}

// Run after the user grants permission or switches sync back on, to catch up
// tasks that were created while sync was unavailable.
export async function syncAllTasks(): Promise<void> {
  const { listTasksWithDueDate } = await import('../db/tasksRepo');
  const tasks = await listTasksWithDueDate();
  for (const task of tasks) {
    await syncAndStore(task);
  }
}
