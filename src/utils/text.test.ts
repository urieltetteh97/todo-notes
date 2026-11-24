import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BULLET, CHECKBOX, CHECKED, firstLine, isBlankNote, toggleLinePrefix } from './text';

test('adds a bullet to the line the caret is on, and moves the caret', () => {
  const r = toggleLinePrefix('one\ntwo', { start: 5, end: 5 }, BULLET);
  assert.equal(r.body, 'one\n• two');
  assert.equal(r.selection.start, 7);
});

test('adds a prefix on the first line', () => {
  const r = toggleLinePrefix('hello', { start: 0, end: 0 }, CHECKBOX);
  assert.equal(r.body, '☐ hello');
  assert.equal(r.selection.start, 2);
});

test('toggling the same prefix removes it', () => {
  const r = toggleLinePrefix('• item', { start: 4, end: 4 }, BULLET);
  assert.equal(r.body, 'item');
  assert.equal(r.selection.start, 2);
});

test('removal never moves the caret before the start of the line', () => {
  const r = toggleLinePrefix('a\n• b', { start: 2, end: 2 }, BULLET);
  assert.equal(r.body, 'a\nb');
  assert.equal(r.selection.start, 2);
});

test('switching between bullet and checkbox swaps the mark', () => {
  const r = toggleLinePrefix('• item', { start: 6, end: 6 }, CHECKBOX);
  assert.equal(r.body, '☐ item');
});

test('a checked box counts as a checklist line and is removed by the checklist button', () => {
  const r = toggleLinePrefix(`${CHECKED}done`, { start: 3, end: 3 }, CHECKBOX);
  assert.equal(r.body, 'done');
});

test('works on an empty body', () => {
  const r = toggleLinePrefix('', { start: 0, end: 0 }, BULLET);
  assert.equal(r.body, '• ');
  assert.equal(r.selection.start, 2);
});

test('firstLine skips blank lines and trims', () => {
  assert.equal(firstLine('\n  \n  Hello world  \nmore'), 'Hello world');
  assert.equal(firstLine('   '), '');
});

test('isBlankNote', () => {
  assert.equal(isBlankNote('  ', '\n'), true);
  assert.equal(isBlankNote('', 'x'), false);
  assert.equal(isBlankNote('Title', ''), false);
});
