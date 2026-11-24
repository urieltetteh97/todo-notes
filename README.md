# To-Do & Notes App

A mobile to-do list with notes, where tasks with a due date show up in your calendar.
Built with Expo SDK 58, Expo Router, SQLite (offline first) and one-way calendar sync.

## Run it

```bash
npm install
npx expo start
```

Then open it on your phone with Expo Go, or press `a` / `i` for an emulator or simulator.

Calendar access is the one thing worth testing on a real device first. If the permission
prompt never appears or events don't show up, make a development build instead:

```bash
npx expo run:android   # or: npx expo run:ios (needs a Mac)
```

## What is built

| Screen | File | Notes |
| --- | --- | --- |
| Tasks (home) | `src/app/(tabs)/index.tsx` | Today / Upcoming / Done, Overdue group, tick to complete, long press to delete |
| Quick add | `src/app/quick-add.tsx` | Task or note, optional date and time, bottom sheet |
| Task detail | `src/app/task/[id].tsx` | Edit title, date, time, completed; calendar status; linked notes; delete |
| Notes list | `src/app/(tabs)/notes.tsx` | Search, previews, link icon, add note |
| Note editor | `src/app/note/[id].tsx` | Autosave, bullet and checklist buttons, link to task, delete |
| Calendar permission | `src/app/calendar-permission.tsx` | Shown once, after the first due date is saved |
| Settings | `src/app/(tabs)/settings.tsx` | Sync on/off, calendar access status with a way back, keep or remove on completion, version |

Not built yet: dark mode, and a "Send feedback" row in Settings (there is no contact target yet).

## Code layout

```
src/
  app/              screens (Expo Router)
  components/       GradientHeader, TaskRow, DateField, SegmentedControl, Fab, HeaderButton
  hooks/            useFocusLoad (reload a list when the screen regains focus)
  db/               SQLite schema and repositories for tasks, notes, settings
  calendar/         syncPlan (pure rules), calendarService (expo-calendar), status, access
  services/         taskService (save, then sync), sync settings, calendar prompt
  utils/            dates, text editing, task grouping
  theme.ts          the purple palette from the wireframes
```

Screens change tasks only through `services/taskService.ts`. It saves to the database first
and syncs the calendar second, so a calendar problem never loses a task.

## Sync rules

| Situation | Result |
| --- | --- |
| Open task with a due date | event created, or updated if it exists |
| Task completed, setting "keep" | event stays, title gets a "[Done]" prefix |
| Task completed, setting "remove" | event deleted; un-completing recreates it |
| Completed task that has no event | none is created, so switching "remove" back to "keep" adds no old tasks |
| Due date cleared, or task deleted | event deleted |
| Sync off, or permission not granted | calendar is never touched |
| Event deleted in the calendar app | recreated the next time the task is saved |
| Event edited in the calendar app | ignored (one-way sync) |

Timed tasks become 30 minute events. Dates are stored as `YYYY-MM-DD` and `HH:mm` strings
and turned into local-time events, so 4:00 PM stays 4:00 PM when the phone changes time zone.

Events go into a dedicated "App Tasks" calendar. The calendar code uses
`expo-calendar/legacy`, the function-based API that also works in Expo Go; the main
`expo-calendar` entry became an object-based API in SDK 58.

## Checks

```bash
npm run typecheck                                       # tsc, strict
npx eslint src                                          # lint
npm test                                                # 51 unit tests, no device needed
npx expo export --platform android --output-dir dist    # full Metro build
```

Verified in the sandbox this was built in: typecheck, lint, all 51 tests (in several time
zones), and a full Android bundle build.

Not verified: running on a phone or emulator. Nothing here has been seen on a screen, so
expect layout and behavior fixes on first run. In particular, check the calendar permission
flow (including denying it, then using Settings to recover), the date and time pickers on both iOS and Android, the quick-add sheet with the keyboard
open, and the note editor's caret after using the bullet and checklist buttons.

## Known gaps

- Swipe to delete and the undo snackbar from the spec are not built; delete is long press on
  the Tasks screen, or the Delete button on the task.
- The checklist button inserts a plain "☐ " at the start of the line. The boxes are not
  tappable, and there is no bold or italic.
- A note can be linked to a task only by creating it from that task. Linking an existing
  note to a task, or a task to an existing note, needs a picker that doesn't exist yet.
- Tasks that lose their due date while sync is off keep a stale calendar event until they
  are edited again.
- Recurring tasks, reminders and two-way sync are out of scope for the MVP.
