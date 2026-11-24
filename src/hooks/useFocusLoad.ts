import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Runs `load` every time the screen gains focus (including returning from a screen
 * pushed on top), so lists are never stale after an edit elsewhere.
 * `load` must be wrapped in useCallback; when its identity changes it runs again.
 */
export function useFocusLoad(load: () => Promise<void>) {
  useFocusEffect(
    useCallback(() => {
      load().catch((err) => console.warn('Load failed', err));
    }, [load])
  );
}
