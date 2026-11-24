// Pure: turns a task's saved state into the "Synced to calendar" line on the task screen.

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export type CalendarStatus = {
  synced: boolean;
  title: string;
  detail: string;
};

export function describeCalendarStatus(input: {
  dueDate: string | null;
  calendarEventId: string | null;
  syncEnabled: boolean;
  permission: PermissionState;
}): CalendarStatus {
  if (input.calendarEventId) {
    return {
      synced: true,
      title: 'Synced to calendar',
      detail: 'Shown in the "App Tasks" calendar',
    };
  }
  if (!input.dueDate) {
    return {
      synced: false,
      title: 'Not synced',
      detail: 'Add a due date to show this task in your calendar',
    };
  }
  if (!input.syncEnabled) {
    return { synced: false, title: 'Not synced', detail: 'Calendar sync is turned off in Settings' };
  }
  if (input.permission !== 'granted') {
    return { synced: false, title: 'Not synced', detail: 'Calendar access is off. You can allow it in Settings' };
  }
  return {
    synced: false,
    title: 'Not synced yet',
    detail: 'It will sync the next time you save this task',
  };
}
