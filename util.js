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

const formatterCache = new Map();

function getFormatter(prefix, timeZone, options) {
  const zoneKey = timeZone ?? 'default';
  const cacheKey = `${prefix}::${zoneKey}`;
  let formatter = formatterCache.get(cacheKey);
  if (!formatter) {
    const resolvedOptions = timeZone ? { ...options, timeZone } : { ...options };
    formatter = new Intl.DateTimeFormat(undefined, resolvedOptions);
    formatterCache.set(cacheKey, formatter);
  }
  return formatter;
}

function fmtIso(date, timeZone) {
  const formatter = getFormatter('iso', timeZone, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  });
  const parts = formatter.formatToParts(date);
  const result = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      result[part.type] = part.value;
    }
  }
  const year = result.year ?? '0000';
  const month = result.month ?? '01';
  const day = result.day ?? '01';
  const hour = result.hour ?? '00';
  const minute = result.minute ?? '00';
  const second = result.second ?? '00';
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

function ymd(date, timeZone) {
  const iso = fmtIso(date, timeZone);
  const [ymdPart] = iso.split('T');
  const [year, month, day] = ymdPart.split('-').map((value) => Number.parseInt(value, 10));
  return { year, month, day };
}

export function fmtTime(date, timeZone) {
  const formatter = getFormatter('time', timeZone, {
    hour: 'numeric',
    minute: '2-digit'
  });
  const parts = formatter.formatToParts(date);
  return parts
    .filter((part) => part.type === 'hour' || part.type === 'minute' || part.type === 'dayPeriod' || part.type === 'literal')
    .map((part) => part.value)
    .join('');
}

export function fmtDate(date, timeZone) {
  const formatter = getFormatter('date', timeZone, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  const parts = formatter.formatToParts(date);
  return parts
    .filter((part) => part.type === 'weekday' || part.type === 'month' || part.type === 'day' || part.type === 'literal')
    .map((part) => part.value)
    .join('');
}

export function dayDelta(date, timeZone, baseTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  const target = ymd(date, timeZone);
  const base = ymd(date, baseTimeZone);
  const targetUtc = Date.UTC(target.year, target.month - 1, target.day);
  const baseUtc = Date.UTC(base.year, base.month - 1, base.day);
  return Math.round((targetUtc - baseUtc) / 86400000);
}

export function timeValue(date, timeZone) {
  const formatter = getFormatter('timeValue', timeZone, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  });
  const parts = formatter.formatToParts(date);
  const values = {};
  for (const part of parts) {
    if (part.type === 'hour' || part.type === 'minute') {
      values[part.type] = part.value;
    }
  }
  const hour = values.hour ?? '00';
  const minute = values.minute ?? '00';
  return `${hour}:${minute}`;
}

const HTML_ESCAPE_PATTERN = /[&<>"']/g;
const HTML_ESCAPE_LOOKUP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

export function escapeHtml(value) {
  return String(value).replace(HTML_ESCAPE_PATTERN, (match) => HTML_ESCAPE_LOOKUP[match]);
}
