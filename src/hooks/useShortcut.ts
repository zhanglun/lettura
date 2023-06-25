import { useEffect, useRef } from "react";

type ShortcutCallback = (event: KeyboardEvent) => void;

type ShortcutEntry = {
  callback: ShortcutCallback;
  context?: any;
}

type ShortcutMap = Map<string, ShortcutEntry>;

export const useShortcut = () => {
  const shortcutsRef = useRef<ShortcutMap>(new Map());

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const shortcut = getShortcut(event);
      if (shortcut && shortcutsRef.current.has(shortcut)) {
        event.preventDefault();
        const { callback, context } = shortcutsRef.current.get(shortcut)!;
        callback.call(context, event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function getShortcut(event: KeyboardEvent) {
    const parts = [];

    if (event.ctrlKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');

    parts.push(event.key.toLowerCase());

    return parts.join('+');
  }

  function registerShortcut(shortcut: string, callback: ShortcutCallback, context?: any) {
    shortcutsRef.current.set(shortcut.toLowerCase(), { callback, context });
  }

  function unregisterShortcut(shortcut: string) {
    shortcutsRef.current.delete(shortcut.toLowerCase());
  }

  return { registerShortcut, unregisterShortcut };
}
