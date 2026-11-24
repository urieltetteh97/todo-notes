import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeCalendarStatus } from './status';

const base = {
  dueDate: '2026-11-17',
  calendarEventId: null,
  syncEnabled: true,
  permission: 'granted' as const,
};

test('task with an event is synced', () => {
  const s = describeCalendarStatus({ ...base, calendarEventId: 'e1' });
  assert.equal(s.synced, true);
  assert.equal(s.title, 'Synced to calendar');
});

test('no due date explains how to get synced', () => {
  const s = describeCalendarStatus({ ...base, dueDate: null });
  assert.equal(s.synced, false);
  assert.match(s.detail, /due date/);
});

test('sync off is reported before permission', () => {
  const s = describeCalendarStatus({ ...base, syncEnabled: false, permission: 'denied' });
  assert.match(s.detail, /turned off/);
});

test('no permission is reported for denied and undetermined', () => {
  assert.match(describeCalendarStatus({ ...base, permission: 'denied' }).detail, /access is off/);
  assert.match(describeCalendarStatus({ ...base, permission: 'undetermined' }).detail, /access is off/);
});

test('everything fine but no event yet means a sync is pending', () => {
  const s = describeCalendarStatus(base);
  assert.equal(s.title, 'Not synced yet');
});

test('an existing event wins even if sync was turned off afterwards', () => {
  const s = describeCalendarStatus({ ...base, calendarEventId: 'e1', syncEnabled: false });
  assert.equal(s.synced, true);
});
