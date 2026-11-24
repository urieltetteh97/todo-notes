import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupTasks } from './groupTasks';
import type { Task } from '../types';

const TODAY = '2026-11-17';

function t(id: string, dueDate: string | null, over: Partial<Task> = {}): Task {
  return {
    id,
    title: id,
    isDone: false,
    dueDate,
    dueTime: null,
    calendarEventId: null,
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
    ...over,
  };
}

test('empty list gives no sections, so the screen can show its empty state', () => {
  assert.deepEqual(groupTasks('today', [], TODAY), []);
  assert.deepEqual(groupTasks('upcoming', [], TODAY), []);
  assert.deepEqual(groupTasks('done', [], TODAY), []);
});

test('today splits overdue from today and puts undated tasks under Today', () => {
  const s = groupTasks('today', [t('a', '2026-11-16'), t('b', TODAY), t('c', null)], TODAY);
  assert.deepEqual(s.map((x) => [x.title, x.data.map((y) => y.id)]), [
    ['Overdue', ['a']],
    ['Today', ['b', 'c']],
  ]);
});

test('today drops the Overdue section when nothing is overdue', () => {
  const s = groupTasks('today', [t('b', TODAY)], TODAY);
  assert.deepEqual(s.map((x) => x.title), ['Today']);
});

test('upcoming groups by date with friendly titles, in input order', () => {
  const s = groupTasks(
    'upcoming',
    [t('a', '2026-11-18'), t('b', '2026-11-18'), t('c', '2026-11-20')],
    TODAY
  );
  assert.deepEqual(s.map((x) => [x.title, x.data.length]), [
    ['Tomorrow', 2],
    ['Fri, 20 Nov', 1],
  ]);
});

test('done is a single untitled section', () => {
  const s = groupTasks('done', [t('a', null, { isDone: true })], TODAY);
  assert.equal(s.length, 1);
  assert.equal(s[0].title, null);
});
