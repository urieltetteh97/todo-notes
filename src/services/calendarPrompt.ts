import { getPermissionState } from '../calendar/calendarService';
import { isCalendarPromptDismissed, loadSyncSettings } from './syncSettings';

/**
 * True when we should show the calendar explainer screen: sync is on, the OS has never
 * been asked, and the user hasn't already said "Not now". Call it right after a due date
 * is saved, never on app launch.
 */
export async function shouldAskForCalendarAccess(): Promise<boolean> {
  const [settings, permission, dismissed] = await Promise.all([
    loadSyncSettings(),
    getPermissionState(),
    isCalendarPromptDismissed(),
  ]);
  return settings.syncEnabled && permission === 'undetermined' && !dismissed;
}
