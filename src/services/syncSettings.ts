import { getSetting, setSetting } from '../db/database';
import { DEFAULT_SYNC_SETTINGS, type CompletionBehavior, type SyncSettings } from '../types';

export async function loadSyncSettings(): Promise<SyncSettings> {
  const enabled = await getSetting('sync_enabled');
  const behavior = await getSetting('completion_behavior');
  return {
    syncEnabled: enabled === null ? DEFAULT_SYNC_SETTINGS.syncEnabled : enabled === '1',
    completionBehavior:
      behavior === 'remove' || behavior === 'keep'
        ? behavior
        : DEFAULT_SYNC_SETTINGS.completionBehavior,
  };
}

export async function saveSyncEnabled(enabled: boolean): Promise<void> {
  await setSetting('sync_enabled', enabled ? '1' : '0');
}

export async function saveCompletionBehavior(b: CompletionBehavior): Promise<void> {
  await setSetting('completion_behavior', b);
}

// The calendar explainer screen is shown once, the first time a due date is set.
// "Not now" is remembered so the user isn't nagged on every task.
export async function isCalendarPromptDismissed(): Promise<boolean> {
  return (await getSetting('calendar_prompt_dismissed')) === '1';
}

export async function dismissCalendarPrompt(): Promise<void> {
  await setSetting('calendar_prompt_dismissed', '1');
}
