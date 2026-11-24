// Dates are stored as plain strings so they never shift with time zones.
// dueDate: "YYYY-MM-DD", dueTime: "HH:mm" (24h, local time) or null for all-day.

export type Task = {
  id: string;
  title: string;
  isDone: boolean;
  dueDate: string | null;
  dueTime: string | null;
  calendarEventId: string | null;
  createdAt: number; // epoch ms
  updatedAt: number;
  deletedAt: number | null; // soft delete, kept for future account sync
};

export type Note = {
  id: string;
  title: string;
  body: string;
  taskId: string | null; // optional link to a task
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
};

export type CompletionBehavior = 'keep' | 'remove';

export type SyncSettings = {
  syncEnabled: boolean;
  completionBehavior: CompletionBehavior;
};

export const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  syncEnabled: true,
  completionBehavior: 'keep',
};
