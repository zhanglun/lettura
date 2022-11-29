type EventKey = string | symbol
type EventHandler<T = any> = (payload: T) => void
type EventMap = Record<EventKey, EventHandler>

export interface EventBus<T extends EventMap> {
  on<Key extends keyof T>(key: Key, handler: T[Key]): () => void
  off<Key extends keyof T>(key: Key, handler: T[Key]): void
  emit<Key extends keyof T>(key: Key, ...payload: Parameters<T[Key]>): void
  once<Key extends keyof T>(key: Key, handler: T[Key]): void
}

type Bus<E> = Record<keyof E, E[keyof E][]>

export function eventbus<E extends EventMap>(config?: {
  onError: (...params: any[]) => void;
}): EventBus<E> {
  const bus: Partial<Bus<E>> = {};
  const on: EventBus<E>["on"] = (key, handler) => {
    if (bus[key] === undefined) {
      bus[key] = [];
    }

    bus[key]?.push(handler);

    return () => {
      off(key, handler);
    };
  };

  const off: EventBus<E>["off"] = (key, handler) => {
    const index = bus[key]?.indexOf(handler) ?? -1;

    bus[key]?.splice(index >>> 0, 1);
  };

  const emit: EventBus<E>["emit"] = (key, payload) => {
    bus[key]?.forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        config?.onError(e);
      }
    });
  };

  const once: EventBus<E>["once"] = (key, handler) => {
    const handleOnce = (payload: Parameters<typeof handler>) => {
      handler(payload);
      off(key, handleOnce as typeof handler);
    };

    on(key, handleOnce as typeof handler);
  };

  return { on, off, once, emit };
}
