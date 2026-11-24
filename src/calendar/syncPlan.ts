// Pure sync logic: no React Native or Expo imports, so it can be unit tested anywhere.
// It decides WHAT should happen to a task's calendar event. calendarService.ts does it.

import type { Task, SyncSettings } from '../types';

export type SyncAction =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'update'; eventId: string }
  | { type: 'delete'; eventId: string };

export type SyncContext = {
  settings: SyncSettings;
  permissionGranted: boolean;
};

/**
 * Rules (one-way: app -> calendar):
 *  - Task has a due date and is open      -> event should exist (create or update)
 *  - Task is done                         -> keep/update the event, or delete it,
 *                                            depending on the completion setting. A done task
 *                                            with no event never gets a new one.
 *  - Task has no due date or is deleted   -> event should not exist (delete if present)
 *  - Sync off or no permission            -> do nothing at all. Existing events are
 *                                            left alone so nothing is lost by a toggle.
 */
export function planSync(task: Task, ctx: SyncContext): SyncAction {
  if (!ctx.settings.syncEnabled || !ctx.permissionGranted) {
    return { type: 'none' };
  }

  const eventId = task.calendarEventId;

  const removedBecauseDone = task.isDone && ctx.settings.completionBehavior === 'remove';
  const shouldHaveEvent = task.deletedAt === null && task.dueDate !== null && !removedBecauseDone;

  if (shouldHaveEvent) {
    if (eventId) return { type: 'update', eventId };
    // A completed task with no event never gets one. Otherwise switching the setting from
    // "remove" back to "keep" would flood the calendar with old finished tasks.
    return task.isDone ? { type: 'none' } : { type: 'create' };
  }
  return eventId ? { type: 'delete', eventId } : { type: 'none' };
}

export type EventDetails = {
  title: string;
  allDay: boolean;
  startDate: Date;
  endDate: Date;
  notes?: string;
};

const DEFAULT_DURATION_MINUTES = 30;
const DONE_PREFIX = '[Done] ';

function parseDate(dueDate: string): [number, number, number] {
  const [y, m, d] = dueDate.split('-').map(Number);
  return [y, m, d];
}

/**
 * Builds the event for a task. Dates are built in LOCAL time from the stored strings,
 * so "4:00 PM" stays 4:00 PM wherever the device is.
 * Throws if the task has no due date: callers only ask after planSync said so.
 */
export function buildEventDetails(task: Task): EventDetails {
  if (!task.dueDate) {
    throw new Error('buildEventDetails called for a task with no due date');
  }
  const [y, m, d] = parseDate(task.dueDate);
  const title = task.isDone ? DONE_PREFIX + task.title : task.title;

  if (!task.dueTime) {
    // All-day events run from midnight to midnight of the next day.
    const startDate = new Date(y, m - 1, d, 0, 0, 0, 0);
    const endDate = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
    return { title, allDay: true, startDate, endDate };
  }

  const [hh, mm] = task.dueTime.split(':').map(Number);
  const startDate = new Date(y, m - 1, d, hh, mm, 0, 0);
  const endDate = new Date(startDate.getTime() + DEFAULT_DURATION_MINUTES * 60 * 1000);
  return { title, allDay: false, startDate, endDate };
}
