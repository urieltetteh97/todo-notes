// Pure: what the Settings screen shows for "Calendar access" and which button goes with it.

import type { PermissionState } from './status';

export type CalendarAccess = {
  label: string;
  // none: nothing to do. ask: show the system prompt. open-settings: the OS won't ask
  // again after a denial, so the only way back is the system Settings app.
  action: 'none' | 'ask' | 'open-settings';
  actionLabel: string | null;
};

export function describeCalendarAccess(permission: PermissionState): CalendarAccess {
  switch (permission) {
    case 'granted':
      return { label: 'Allowed', action: 'none', actionLabel: null };
    case 'undetermined':
      return { label: 'Not asked yet', action: 'ask', actionLabel: 'Allow access' };
    case 'denied':
      return { label: 'Off', action: 'open-settings', actionLabel: 'Open system settings' };
  }
}
