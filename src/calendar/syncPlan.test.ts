import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildEventDetails, planSync, type SyncContext } from './syncPlan';
import type { Task } from '../types';

function makeTask(over: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Send invoice',
    isDone: false,
    dueDate: '2026-11-17',
    dueTime: '16:00',
    calendarEventId: null,
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
    ...over,
  };
}

const on: SyncContext = {
  settings: { syncEnabled: true, completionBehavior: 'keep' },
  permissionGranted: true,
};

// ---- planSync ----

test('dated open task with no event -> create', () => {
  assert.deepEqual(planSync(makeTask(), on), { type: 'create' });
});

test('dated open task with an event -> update', () => {
  assert.deepEqual(planSync(makeTask({ calendarEventId: 'e1' }), on), {
    type: 'update',
    eventId: 'e1',
  });
});

test('task without a due date and no event -> nothing', () => {
  assert.deepEqual(planSync(makeTask({ dueDate: null, dueTime: null }), on), { type: 'none' });
});

test('clearing the due date removes the existing event', () => {
  const task = makeTask({ dueDate: null, dueTime: null, calendarEventId: 'e1' });
  assert.deepEqual(planSync(task, on), { type: 'delete', eventId: 'e1' });
});

test('deleted task removes its event', () => {
  const task = makeTask({ deletedAt: 123, calendarEventId: 'e1' });
  assert.deepEqual(planSync(task, on), { type: 'delete', eventId: 'e1' });
});

test('deleted task with no event -> nothing', () => {
  assert.deepEqual(planSync(makeTask({ deletedAt: 123 }), on), { type: 'none' });
});

test('completed task, behavior "keep" -> update the event', () => {
  const task = makeTask({ isDone: true, calendarEventId: 'e1' });
  assert.deepEqual(planSync(task, on), { type: 'update', eventId: 'e1' });
});

test('completed task, behavior "remove" -> delete the event', () => {
  const ctx: SyncContext = { ...on, settings: { ...on.settings, completionBehavior: 'remove' } };
  const task = makeTask({ isDone: true, calendarEventId: 'e1' });
  assert.deepEqual(planSync(task, ctx), { type: 'delete', eventId: 'e1' });
});

test('un-completing a task under "remove" recreates its event', () => {
  const ctx: SyncContext = { ...on, settings: { ...on.settings, completionBehavior: 'remove' } };
  // The event was deleted on completion, so the id is null again.
  assert.deepEqual(planSync(makeTask({ isDone: false }), ctx), { type: 'create' });
});

test('completed task that never had an event, behavior "remove" -> nothing', () => {
  const ctx: SyncContext = { ...on, settings: { ...on.settings, completionBehavior: 'remove' } };
  assert.deepEqual(planSync(makeTask({ isDone: true }), ctx), { type: 'none' });
});

test('completed task that has no event, behavior "keep" -> nothing (no catch-up flood)', () => {
  assert.deepEqual(planSync(makeTask({ isDone: true }), on), { type: 'none' });
});

test('sync turned off -> never touches the calendar, even with an event', () => {
  const ctx: SyncContext = { ...on, settings: { ...on.settings, syncEnabled: false } };
  assert.deepEqual(planSync(makeTask({ calendarEventId: 'e1' }), ctx), { type: 'none' });
  assert.deepEqual(planSync(makeTask(), ctx), { type: 'none' });
});

test('permission not granted -> never touches the calendar', () => {
  const ctx: SyncContext = { ...on, permissionGranted: false };
  assert.deepEqual(planSync(makeTask({ calendarEventId: 'e1' }), ctx), { type: 'none' });
  assert.deepEqual(planSync(makeTask(), ctx), { type: 'none' });
});

// ---- buildEventDetails ----

test('timed task -> 30 minute event at the local time', () => {
  const d = buildEventDetails(makeTask());
  assert.equal(d.allDay, false);
  assert.equal(d.title, 'Send invoice');
  assert.equal(d.startDate.getFullYear(), 2026);
  assert.equal(d.startDate.getMonth(), 10); // November
  assert.equal(d.startDate.getDate(), 17);
  assert.equal(d.startDate.getHours(), 16);
  assert.equal(d.startDate.getMinutes(), 0);
  assert.equal(d.endDate.getTime() - d.startDate.getTime(), 30 * 60 * 1000);
});

test('date-only task -> all-day event spanning midnight to midnight', () => {
  const d = buildEventDetails(makeTask({ dueTime: null }));
  assert.equal(d.allDay, true);
  assert.equal(d.startDate.getHours(), 0);
  assert.equal(d.endDate.getDate(), 18);
  assert.equal(d.endDate.getHours(), 0);
});

test('all-day event on the last day of the month ends on the 1st of the next', () => {
  const d = buildEventDetails(makeTask({ dueDate: '2026-11-30', dueTime: null }));
  assert.equal(d.endDate.getMonth(), 11); // December
  assert.equal(d.endDate.getDate(), 1);
});

test('timed event late in the evening rolls the end time into the next day', () => {
  const d = buildEventDetails(makeTask({ dueTime: '23:45' }));
  assert.equal(d.endDate.getDate(), 18);
  assert.equal(d.endDate.getHours(), 0);
  assert.equal(d.endDate.getMinutes(), 15);
});

test('completed task title is prefixed so a kept event reads as done', () => {
  const d = buildEventDetails(makeTask({ isDone: true }));
  assert.equal(d.title, '[Done] Send invoice');
});

test('building details for an undated task is a programming error', () => {
  assert.throws(() => buildEventDetails(makeTask({ dueDate: null, dueTime: null })));
});
