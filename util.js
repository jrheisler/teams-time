export const STORAGE_KEYS = {
  teamMembers: 'teamMembers',
  preferences: 'preferences'
};

const runtime = typeof chrome !== 'undefined' ? chrome : undefined;
const storageArea = runtime?.storage?.sync;
const memoryStore = new Map();
let timezoneCachePromise = null;

function getFallbackKey(key) {
  return `teams-time::${key}`;
}

function readFromFallback(key, fallback) {
  const stored = memoryStore.get(key);
  if (stored !== undefined) {
    return stored;
  }
  if (typeof localStorage !== 'undefined') {
    try {
      const value = localStorage.getItem(getFallbackKey(key));
      if (value !== null) {
        return JSON.parse(value);
      }
    } catch (error) {
      console.warn('Unable to read localStorage fallback', error);
    }
  }
  return fallback;
}

function writeToFallback(key, value) {
  memoryStore.set(key, value);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(getFallbackKey(key), JSON.stringify(value));
    } catch (error) {
      console.warn('Unable to persist to localStorage fallback', error);
    }
  }
}

export function getStoredValue(key, fallback) {
  if (!storageArea) {
    return Promise.resolve(readFromFallback(key, fallback));
  }
  return new Promise((resolve) => {
    storageArea.get([key], (result) => {
      if (runtime.runtime?.lastError) {
        console.warn('Storage get error', runtime.runtime.lastError);
        resolve(readFromFallback(key, fallback));
        return;
      }
      resolve(result[key] ?? fallback);
    });
  });
}

export function setStoredValue(key, value) {
  if (!storageArea) {
    writeToFallback(key, value);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    storageArea.set({ [key]: value }, () => {
      if (runtime.runtime?.lastError) {
        console.warn('Storage set error', runtime.runtime.lastError);
        writeToFallback(key, value);
      }
      resolve();
    });
  });
}

function createMember(payload) {
  const id =
    payload.id ||
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `member-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  return {
    id,
    name: payload.name,
    timezone: payload.timezone
  };
}

export function upsertMember(members, payload) {
  const existingIndex = payload.id
    ? members.findIndex((member) => member.id === payload.id)
    : members.findIndex((member) => member.name === payload.name);

  if (existingIndex >= 0) {
    const updated = [...members];
    updated[existingIndex] = {
      ...members[existingIndex],
      ...payload,
      id: members[existingIndex].id
    };
    return updated;
  }

  return [...members, createMember(payload)];
}

export function removeMemberById(members, id) {
  return members.filter((member) => member.id !== id);
}

async function fetchTimezones() {
  if (!timezoneCachePromise) {
    const resourceUrl = runtime?.runtime?.getURL
      ? runtime.runtime.getURL('timezones.json')
      : 'timezones.json';
    timezoneCachePromise = fetch(resourceUrl).then((response) => response.json());
  }
  return timezoneCachePromise;
}

export async function loadTimezoneOptions(selectElement, { includeEmpty = false } = {}) {
  const zones = await fetchTimezones();
  selectElement.innerHTML = '';
  if (includeEmpty) {
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = 'Select a time zone';
    selectElement.append(emptyOption);
  }
  for (const zone of zones) {
    const option = document.createElement('option');
    option.value = zone.value;
    option.textContent = zone.label;
    selectElement.append(option);
  }
}