import type { Task } from '../types';
import type { TaskFilter } from '../db/tasksRepo';
import { relativeDateLabel } from './dates';

export type TaskSection = { key: string; title: string | null; data: Task[] };

/**
 * Splits a filtered task list into the sections the Tasks screen shows.
 *  today:    "Overdue" (earlier dates), then "Today" (due today, plus undated tasks)
 *  upcoming: one section per date, titled Tomorrow / Fri, 20 Nov / ...
 *  done:     a single untitled section
 * Empty sections are dropped. Input order is preserved inside each section.
 */
export function groupTasks(filter: TaskFilter, tasks: Task[], today: string): TaskSection[] {
  if (tasks.length === 0) return [];

  if (filter === 'done') {
    return [{ key: 'done', title: null, data: tasks }];
  }

  if (filter === 'today') {
    const overdue = tasks.filter((t) => t.dueDate !== null && t.dueDate < today);
    const rest = tasks.filter((t) => t.dueDate === null || t.dueDate >= today);
    const sections: TaskSection[] = [];
    if (overdue.length) sections.push({ key: 'overdue', title: 'Overdue', data: overdue });
    if (rest.length) sections.push({ key: 'today', title: 'Today', data: rest });
    return sections;
  }

  const byDate = new Map<string, Task[]>();
  for (const t of tasks) {
    const key = t.dueDate ?? 'none';
    const list = byDate.get(key);
    if (list) list.push(t);
    else byDate.set(key, [t]);
  }
  return [...byDate.entries()].map(([date, data]) => ({
    key: date,
    title: date === 'none' ? 'No date' : relativeDateLabel(date, today),
    data,
  }));
}
