// Text-editing helpers for the note editor's toolbar.

export type Selection = { start: number; end: number };

export const BULLET = '• ';
export const CHECKBOX = '☐ ';
export const CHECKED = '☑ ';

/**
 * Toggles a line prefix (bullet or checkbox) on the line the caret is on.
 *  - Line has this prefix        -> remove it
 *  - Line has the other list mark -> swap it for this one
 *  - Otherwise                    -> add it
 * Returns the new body and where the caret should go.
 */
export function toggleLinePrefix(
  body: string,
  selection: Selection,
  prefix: string
): { body: string; selection: Selection } {
  const caret = selection.start;
  const lineStart = body.lastIndexOf('\n', caret - 1) + 1;
  const rest = body.slice(lineStart);

  const marks = [BULLET, CHECKBOX, CHECKED];
  const existing = marks.find((m) => rest.startsWith(m));

  let newBody: string;
  let delta: number;

  if (existing === prefix || (prefix === CHECKBOX && existing === CHECKED)) {
    newBody = body.slice(0, lineStart) + rest.slice(existing.length);
    delta = -existing.length;
  } else if (existing) {
    newBody = body.slice(0, lineStart) + prefix + rest.slice(existing.length);
    delta = prefix.length - existing.length;
  } else {
    newBody = body.slice(0, lineStart) + prefix + rest;
    delta = prefix.length;
  }

  const moved = Math.max(lineStart, caret + delta);
  return { body: newBody, selection: { start: moved, end: moved } };
}

/** First non-empty line, for showing a title when a note has none. */
export function firstLine(text: string): string {
  const line = text.split('\n').find((l) => l.trim().length > 0);
  return line ? line.trim() : '';
}

export function isBlankNote(title: string, body: string): boolean {
  return title.trim() === '' && body.trim() === '';
}
