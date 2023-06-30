export const StorageType = {
  LOCAL_STORAGE: "local_storage",
  SESSION_STORAGE: "session_storage",
} as const;

export type StorageType = (typeof StorageType)[keyof typeof StorageType];

export type ChangeSource = string;

export const STORAGE_CHANGE_SOURCE = "Storage";

export interface MapStore<T extends Record<string, unknown>> {
  value: T;
  setKey(key: keyof T, value: T[keyof T] | undefined, changeSource?: ChangeSource): void;
  deleteKey(key: keyof T, changeSource?: ChangeSource): void;
  listen(listener: (key: keyof T, value: T[keyof T] | undefined, changeSource?: ChangeSource) => void): void;
}

class MapStoreImpl<T extends Record<string, unknown>> implements MapStore<T> {
  storage: Storage;

  initialValue: T;

  value: T;

  prefix: string;

  listeners: ((key: keyof T, value: T[keyof T] | undefined, changeSource?: ChangeSource) => void)[] = [];

  constructor(value: T, prefix: string, storageType?: StorageType) {
    this.storage = storageType === StorageType.LOCAL_STORAGE ? localStorage : sessionStorage;

    this.initialValue = { ...value };
    this.value = { ...value };
    this.prefix = prefix;

    for (const key in this.initialValue)
      if (Object.hasOwn(this.value, key)) {
        const storageKey: string = this.getStorageKey(key);
        const storageValue: string | null = this.storage.getItem(storageKey);
        let propertyValue: T[Extract<keyof T, string>] = this.initialValue[key];
        if (storageValue !== null)
          if (typeof propertyValue === "string") propertyValue = storageValue as T[Extract<keyof T, string>];
          else if (typeof propertyValue === "number")
            propertyValue = Number(storageValue) as T[Extract<keyof T, string>];
          else if (typeof propertyValue === "boolean")
            propertyValue = (storageValue.toLowerCase() === "true") as T[Extract<keyof T, string>];
          else propertyValue = JSON.parse(storageValue) as typeof propertyValue;

        this.value[key] = propertyValue;
      }

    window.addEventListener("storage", this.storageListener);
  }

  notify(key: keyof T, changeSource?: ChangeSource): void {
    this.listeners.forEach((listener): void => {
      const value: T[keyof T] = this.value[key];
      listener(key, value, changeSource);
    });
  }

  deleteKey(key: keyof T, changeSource?: ChangeSource): void {
    if (typeof key === "number" || typeof key === "symbol") return;

    const storageKey: string = this.getStorageKey(key);

    if (key in this.value) {
      this.value = { ...this.value };
      delete this.value[key];
      if (changeSource !== STORAGE_CHANGE_SOURCE) this.storage.removeItem(storageKey);
      this.notify(key, changeSource);
    }
  }

  setKey(key: keyof T, value: T[keyof T] | undefined, changeSource?: ChangeSource): void {
    if (typeof key === "number" || typeof key === "symbol") return;

    const storageKey: string = this.getStorageKey(key);

    if (typeof value === "undefined") this.deleteKey(key, changeSource);
    else {
      this.value = {
        ...this.value,
        [key]: value,
      };
      if (changeSource !== STORAGE_CHANGE_SOURCE)
        if (typeof value === "string") this.storage.setItem(storageKey, value);
        else this.storage.setItem(storageKey, JSON.stringify(value));
      this.notify(key, changeSource);
    }
  }

  listen(listener: (key: keyof T, value: T[keyof T] | undefined, changeSource?: ChangeSource) => void): void {
    this.listeners.push(listener);
  }

  storageListener = (event: StorageEvent): void => {
    if (!event.key?.startsWith(this.prefix)) return;

    const key: string = this.getPropertyKey(event.key);

    if (Object.hasOwn(this.value, key)) {
      const storageValue: string | null = event.newValue;
      let propertyValue: T[keyof T] = this.value[key] as T[keyof T];
      if (storageValue === null) this.setKey(key, undefined, STORAGE_CHANGE_SOURCE);
      else if (typeof propertyValue === "string") propertyValue = storageValue as T[keyof T];
      else if (typeof propertyValue === "number") propertyValue = Number(storageValue) as T[keyof T];
      else if (typeof propertyValue === "boolean")
        propertyValue = (storageValue.toLowerCase() === "true") as T[keyof T];
      else propertyValue = JSON.parse(storageValue) as typeof propertyValue;

      this.setKey(key, propertyValue, STORAGE_CHANGE_SOURCE);
    }
  };

  getStorageKey(propertyKey: string): string {
    // Camel case to kebab case
    const kebabKey: string = propertyKey.replace(
      /[A-Z]+(?![a-z])|[A-Z]/gu,
      ($, ofs): string => (ofs ? "-" : "") + $.toLowerCase(),
    );
    const storageKey = `${this.prefix}${kebabKey}`;
    return storageKey;
  }

  getPropertyKey(storageKey: string): string {
    const key: string = storageKey.slice(this.prefix.length);
    // Kebab case to camel case
    const propertyKey: string = key.replace(/-./gu, (x): string => (x[1] ?? "").toUpperCase());
    return propertyKey;
  }
}

export const defineMapStore = function defineMapStore<T extends Record<string, unknown>>(
  initValue: T,
  prefix: string,
  storageType?: StorageType,
): MapStore<T> {
  const store = new MapStoreImpl(initValue, prefix, storageType);
  return store;
};
