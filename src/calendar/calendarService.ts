// Thin wrapper over expo-calendar. All decisions live in syncPlan.ts.
//
// NOTE: since SDK 58 the main 'expo-calendar' entry is a new object-based API, and the
// function-based API lives at 'expo-calendar/legacy'. This file uses the function-based
// one because it also works in Expo Go. Migrate to the object API later if you want.

import * as Calendar from 'expo-calendar/legacy';
import { Platform } from 'react-native';
import { getSetting, setSetting } from '../db/database';
import { buildEventDetails, planSync, type SyncContext } from './syncPlan';
import type { Task } from '../types';

const CALENDAR_ID_KEY = 'app_calendar_id';
const CALENDAR_TITLE = 'App Tasks';

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export async function getPermissionState(): Promise<PermissionState> {
  const { status } = await Calendar.getCalendarPermissionsAsync();
  return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
}

// Call from the "Allow calendar access" button, never on app launch.
export async function requestPermission(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

async function findOrCreateAppCalendar(): Promise<string> {
  // Reuse the calendar we made earlier if it still exists (the user may have deleted it).
  const savedId = await getSetting(CALENDAR_ID_KEY);
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

  if (savedId && calendars.some((c) => c.id === savedId)) return savedId;

  const byName = calendars.find((c) => c.title === CALENDAR_TITLE && c.allowsModifications);
  if (byName) {
    await setSetting(CALENDAR_ID_KEY, byName.id);
    return byName.id;
  }

  const source =
    Platform.OS === 'ios'
      ? (await Calendar.getDefaultCalendarAsync()).source
      : { isLocalAccount: true, name: CALENDAR_TITLE, type: Calendar.SourceType.LOCAL };

  const id = await Calendar.createCalendarAsync({
    title: CALENDAR_TITLE,
    color: '#7C3AED',
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: Platform.OS === 'ios' ? (source as Calendar.Source).id : undefined,
    source: source as Calendar.Source,
    name: CALENDAR_TITLE,
    ownerAccount: 'personal',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
  await setSetting(CALENDAR_ID_KEY, id);
  return id;
}

export type ApplyResult = {
  // The value to store in tasks.calendar_event_id after this sync.
  calendarEventId: string | null;
};

/**
 * Brings one task's calendar event in line with the task. Returns the event id to store.
 * Never throws for calendar problems: a failed sync must not block saving a task.
 * On failure it returns the id it was given, so a later sync can retry.
 */
export async function syncTask(task: Task, ctx: SyncContext): Promise<ApplyResult> {
  const action = planSync(task, ctx);
  const unchanged: ApplyResult = { calendarEventId: task.calendarEventId };

  try {
    switch (action.type) {
      case 'none':
        return unchanged;

      case 'create': {
        const calendarId = await findOrCreateAppCalendar();
        const details = buildEventDetails(task);
        const eventId = await Calendar.createEventAsync(calendarId, details);
        return { calendarEventId: eventId };
      }

      case 'update': {
        const details = buildEventDetails(task);
        try {
          await Calendar.updateEventAsync(action.eventId, details);
          return { calendarEventId: action.eventId };
        } catch {
          // The user deleted the event in their calendar app. Recreate it.
          const calendarId = await findOrCreateAppCalendar();
          const eventId = await Calendar.createEventAsync(calendarId, details);
          return { calendarEventId: eventId };
        }
      }

      case 'delete': {
        try {
          await Calendar.deleteEventAsync(action.eventId);
        } catch {
          // Already gone: that's the outcome we wanted.
        }
        return { calendarEventId: null };
      }
    }
  } catch (err) {
    console.warn('Calendar sync failed', err);
    return unchanged;
  }
}
