import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  dateFromStrings,
  describeDue,
  formatDateLong,
  formatDateShort,
  formatNoteDate,
  formatTime,
  nextHour,
  relativeDateLabel,
  toDateString,
  toTimeString,
} from './dates';

const TODAY = '2026-11-17'; // a Tuesday

test('toDateString and toTimeString use local time and zero padding', () => {
  const d = new Date(2026, 0, 5, 7, 3);
  assert.equal(toDateString(d), '2026-01-05');
  assert.equal(toTimeString(d), '07:03');
});

test('dateFromStrings round-trips through the formatters', () => {
  const d = dateFromStrings('2026-11-17', '16:45');
  assert.equal(toDateString(d), '2026-11-17');
  assert.equal(toTimeString(d), '16:45');
  assert.equal(toTimeString(dateFromStrings('2026-11-17', null)), '00:00');
});

test('addDays crosses month and year boundaries', () => {
  assert.equal(addDays('2026-11-30', 1), '2026-12-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
});

test('formatTime handles midnight, noon and afternoon', () => {
  assert.equal(formatTime('00:05'), '12:05 AM');
  assert.equal(formatTime('12:00'), '12:00 PM');
  assert.equal(formatTime('16:00'), '4:00 PM');
  assert.equal(formatTime('09:30'), '9:30 AM');
});

test('formatDateShort and formatDateLong', () => {
  assert.equal(formatDateShort('2026-11-17'), 'Tue, 17 Nov');
  assert.equal(formatDateLong(new Date(2026, 10, 17)), 'Tuesday, 17 November');
});

test('relativeDateLabel', () => {
  assert.equal(relativeDateLabel('2026-11-17', TODAY), 'Today');
  assert.equal(relativeDateLabel('2026-11-18', TODAY), 'Tomorrow');
  assert.equal(relativeDateLabel('2026-11-16', TODAY), 'Yesterday');
  assert.equal(relativeDateLabel('2026-11-20', TODAY), 'Fri, 20 Nov');
});

test('describeDue matches the wireframe subtitles', () => {
  assert.equal(describeDue({ dueDate: '2026-11-16', dueTime: '16:00' }, TODAY), 'Yesterday, 4:00 PM');
  assert.equal(describeDue({ dueDate: TODAY, dueTime: '09:30' }, TODAY), '9:30 AM');
  assert.equal(describeDue({ dueDate: TODAY, dueTime: null }, TODAY), 'Anytime today');
  assert.equal(describeDue({ dueDate: null, dueTime: null }, TODAY), 'Anytime');
  assert.equal(describeDue({ dueDate: '2026-11-18', dueTime: null }, TODAY), 'Tomorrow');
  assert.equal(describeDue({ dueDate: '2026-11-20', dueTime: '10:00' }, TODAY), 'Fri, 20 Nov, 10:00 AM');
});

test('formatNoteDate', () => {
  const now = new Date(2026, 10, 17, 15, 0);
  assert.equal(formatNoteDate(new Date(2026, 10, 17, 11, 20).getTime(), now), 'Today, 11:20 AM');
  assert.equal(formatNoteDate(new Date(2026, 10, 16, 23, 0).getTime(), now), 'Yesterday');
  assert.equal(formatNoteDate(new Date(2026, 10, 9, 8, 0).getTime(), now), 'Mon, 9 Nov');
});

test('nextHour rounds up to the next whole hour, including across midnight', () => {
  assert.equal(toTimeString(nextHour(new Date(2026, 10, 17, 9, 41))), '10:00');
  const late = nextHour(new Date(2026, 10, 17, 23, 30));
  assert.equal(toDateString(late), '2026-11-18');
  assert.equal(toTimeString(late), '00:00');
});
