// Date helpers. Tasks store plain "YYYY-MM-DD" and "HH:mm" strings; these convert
// between those and Date objects in LOCAL time, and build the labels the UI shows.
// Formatting is done by hand (no Intl) so output is identical on every device.

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toTimeString(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function todayString(now: Date = new Date()): string {
  return toDateString(now);
}

/** Builds a local Date from stored strings. A missing time means midnight. */
export function dateFromStrings(dueDate: string, dueTime: string | null): Date {
  const [y, m, d] = dueDate.split('-').map(Number);
  const [hh, mm] = dueTime ? dueTime.split(':').map(Number) : [0, 0];
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return toDateString(new Date(y, m - 1, d + days));
}

/** "Tue, 17 Nov" */
export function formatDateShort(dateStr: string): string {
  const d = dateFromStrings(dateStr, null);
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** "Tuesday, 17 November" */
export function formatDateLong(d: Date): string {
  return `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS_LONG[d.getMonth()]}`;
}

/** "4:00 PM" from "16:00" */
export function formatTime(timeStr: string): string {
  const [hh, mm] = timeStr.split(':').map(Number);
  const suffix = hh >= 12 ? 'PM' : 'AM';
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${hour12}:${pad(mm)} ${suffix}`;
}

/** "Today", "Tomorrow", "Yesterday", or "Tue, 17 Nov" */
export function relativeDateLabel(dateStr: string, today: string): string {
  if (dateStr === today) return 'Today';
  if (dateStr === addDays(today, 1)) return 'Tomorrow';
  if (dateStr === addDays(today, -1)) return 'Yesterday';
  return formatDateShort(dateStr);
}

/** Second line of a task row: "Yesterday, 4:00 PM", "9:30 AM", "Anytime today", "Anytime". */
export function describeDue(
  task: { dueDate: string | null; dueTime: string | null },
  today: string
): string {
  if (!task.dueDate) return 'Anytime';
  if (task.dueDate === today) {
    return task.dueTime ? formatTime(task.dueTime) : 'Anytime today';
  }
  const label = relativeDateLabel(task.dueDate, today);
  return task.dueTime ? `${label}, ${formatTime(task.dueTime)}` : label;
}

/** Last edited label for notes: "Today, 11:20 AM", "Yesterday", "Mon, 9 Nov". */
export function formatNoteDate(timestamp: number, now: Date = new Date()): string {
  const d = new Date(timestamp);
  const day = toDateString(d);
  const today = toDateString(now);
  if (day === today) return `Today, ${formatTime(toTimeString(d))}`;
  if (day === addDays(today, -1)) return 'Yesterday';
  return formatDateShort(day);
}

/** The next whole hour after `now`, used as the default when a user adds a time. */
export function nextHour(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}
