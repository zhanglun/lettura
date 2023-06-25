import { useEffect, useRef } from "react";

type ShortcutCallback = (event: KeyboardEvent) => void;

type ShortcutEntry = {
  keys: string | string[],
  callback: ShortcutCallback;
  context?: any;
}

type ShortcutMap = Map<string, ShortcutEntry>;

export const useShortcut = () => {
  const shortcutsRef = useRef<ShortcutMap>(new Map());

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const shortcut = getShortcut(event);

      console.log('====> shortcut', shortcut, event.key);

      if (shortcut) {
        const matchedShortcut = shortcutsRef.current.get(shortcut);

        if (matchedShortcut) {
          event.preventDefault();
          const { callback, context } = matchedShortcut;
          callback.call(context, event);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function normalizeKey(key: string) {
    const isUpperCase = key === key.toUpperCase() && key !== key.toLowerCase();

    return isUpperCase ? `_${ key.toLowerCase() }` : key.toLowerCase();
  }

  function getShortcut(event: KeyboardEvent) {
    const parts = [];

    // if (event.ctrlKey) parts.push('ctrl');
    // if (event.shiftKey) parts.push('shift');
    // if (event.altKey) parts.push('alt');

    parts.push(normalizeKey(event.key));

    return parts.join('+');
  }

  function registerShortcut(shortcut: string | string[], callback: ShortcutCallback, context?: any) {
    shortcut = Array.isArray(shortcut) ? shortcut : [shortcut];
    shortcut.forEach((key) => {
      shortcutsRef.current.set(normalizeKey(key), { keys: shortcut, callback, context });
    });

    console.log('shortcutsRef.current', shortcutsRef.current);
  }

  function unregisterShortcut(shortcut: string | string[]) {
    shortcut = Array.isArray(shortcut) ? shortcut : [shortcut];
    shortcut.forEach((key) => {
      shortcutsRef.current.delete(normalizeKey(key));
    });
  }

  return { registerShortcut, unregisterShortcut };
}
