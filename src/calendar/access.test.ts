import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeCalendarAccess } from './access';

test('granted -> allowed, nothing to do', () => {
  assert.deepEqual(describeCalendarAccess('granted'), {
    label: 'Allowed',
    action: 'none',
    actionLabel: null,
  });
});

test('undetermined -> offers the system prompt', () => {
  const a = describeCalendarAccess('undetermined');
  assert.equal(a.action, 'ask');
  assert.equal(a.actionLabel, 'Allow access');
});

test('denied -> sends the user to system settings', () => {
  const a = describeCalendarAccess('denied');
  assert.equal(a.label, 'Off');
  assert.equal(a.action, 'open-settings');
});
