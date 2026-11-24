// Small collision-resistant id, good enough for local-only records.
// Swap for expo-crypto's randomUUID() when you add account sync.
export function newId(): string {
  return (
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2, 10)
  );
}
