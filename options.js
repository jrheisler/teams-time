import timezones from './timezones-data.js';
import timezoneAliases from './timezone-aliases.js';

const runtimeChrome = typeof chrome !== 'undefined' ? chrome : undefined;
const storageArea = runtimeChrome?.storage?.sync;
const fallbackStore = new Map();

let cachedTimezones = null;
const FALLBACK_TIMEZONES = timezones;
const FALLBACK_TIMEZONE_ALIASES = timezoneAliases;

function getFallbackKey(key) {
  return `teams-time::${key}`;
}

function readFallback(key, defaultValue) {
  if (fallbackStore.has(key)) {
    return fallbackStore.get(key);
  }
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(getFallbackKey(key));
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        fallbackStore.set(key, parsed);
        return parsed;
      }
    } catch (error) {
      console.warn('Unable to read options fallback storage', error);
    }
  }
  return defaultValue;
}

function writeFallback(key, value) {
  fallbackStore.set(key, value);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(getFallbackKey(key), JSON.stringify(value));
    } catch (error) {
      console.warn('Unable to persist options fallback storage', error);
    }
  }
}

function getFromStorage(key, defaultValue) {
  if (!storageArea) {
    return Promise.resolve(readFallback(key, defaultValue));
  }

  return new Promise((resolve) => {
    storageArea.get([key], (result) => {
      if (runtimeChrome?.runtime?.lastError) {
        console.warn('Storage get error', runtimeChrome.runtime.lastError);
        resolve(readFallback(key, defaultValue));
        return;
      }
      resolve(result[key] ?? defaultValue);
    });
  });
}

function setInStorage(key, value) {
  if (!storageArea) {
    writeFallback(key, value);
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    storageArea.set({ [key]: value }, () => {
      if (runtimeChrome?.runtime?.lastError) {
        console.warn('Storage set error', runtimeChrome.runtime.lastError);
        writeFallback(key, value);
      }
      resolve();
    });
  });
}

async function loadTimezones() {
  if (cachedTimezones) {
    return cachedTimezones;
  }

  const url = runtimeChrome?.runtime?.getURL
    ? runtimeChrome.runtime.getURL('timezones.json')
    : 'timezones.json';

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load time zones: ${response.status}`);
    }
    const zones = await response.json();
    if (Array.isArray(zones)) {
      cachedTimezones = zones;
      return zones;
    }
  } catch (error) {
    console.warn('Unable to load time zone list', error);
  }

  cachedTimezones = [...FALLBACK_TIMEZONES];
  return cachedTimezones;
}

const timezoneList = document.getElementById('timezone-list');
const personForm = document.getElementById('person-form');
const nameInput = document.getElementById('person-name');
const noteInput = document.getElementById('person-note');
const timezoneInput = document.getElementById('person-timezone');
const peopleList = document.getElementById('people-list');
const hourFormatSelect = document.getElementById('hour-format');
const timelineSection = document.getElementById('timeline-section');
const timelineRows = document.getElementById('timeline-rows');

const STORAGE_KEYS = {
  people: 'people',
  settings: 'settings'
};

const DEFAULT_SETTINGS = {
  hour12: true
};

const TIMELINE_REFRESH_INTERVAL = 5 * 60 * 1000;

let people = [];
let settings = { ...DEFAULT_SETTINGS };
let timelineRefreshIntervalId = null;

function getTimezoneOffsetMinutes(referenceDate, timeZone) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const parts = formatter.formatToParts(referenceDate).reduce((accumulator, part) => {
      if (part.type !== 'literal') {
        accumulator[part.type] = part.value;
      }
      return accumulator;
    }, {});

    if (
      !parts.year ||
      !parts.month ||
      !parts.day ||
      !parts.hour ||
      typeof parts.minute === 'undefined' ||
      typeof parts.second === 'undefined'
    ) {
      return Number.POSITIVE_INFINITY;
    }

    const timeAsUTC = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second)
    );

    return Math.round((timeAsUTC - referenceDate.getTime()) / (60 * 1000));
  } catch (error) {
    console.warn('Unable to determine time zone offset', timeZone, error);
    return Number.POSITIVE_INFINITY;
  }
}

function getSortedPeople(referenceDate = new Date(), list = people) {
  if (!Array.isArray(list)) {
    return [];
  }

  const baseDate = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  const entries = [...list];
  const offsetCache = new Map();
  const collator = new Intl.Collator(undefined, { sensitivity: 'accent', numeric: true });

  const getOffset = (timeZone) => {
    if (!timeZone) {
      return Number.POSITIVE_INFINITY;
    }

    if (offsetCache.has(timeZone)) {
      return offsetCache.get(timeZone);
    }

    const offset = getTimezoneOffsetMinutes(baseDate, timeZone);
    offsetCache.set(timeZone, offset);
    return offset;
  };

  return entries.sort((a, b) => {
    const offsetDifference = getOffset(a.timezone) - getOffset(b.timezone);
    if (offsetDifference !== 0) {
      return offsetDifference;
    }

    return collator.compare(a.name ?? '', b.name ?? '');
  });
}

function resolveViewerTimezone() {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone && typeof timezone === 'string') {
      return { timezone, isFallback: false };
    }
  } catch (error) {
    console.warn('Unable to detect viewer time zone', error);
  }

  return { timezone: 'UTC', isFallback: true };
}

const viewerTimezoneInfo = resolveViewerTimezone();

function populateTimezoneDatalist(zones, aliases) {
  timezoneList.innerHTML = '';

  const fragment = document.createDocumentFragment();
  for (const zone of zones) {
    const option = document.createElement('option');
    option.value = zone;
    option.textContent = zone;
    option.label = zone;
    option.dataset.zone = zone;
    fragment.append(option);
  }

  for (const [alias, canonical] of Object.entries(aliases)) {
    const option = document.createElement('option');
    option.value = alias;
    option.textContent = alias;
    option.label = `${alias} (${canonical})`;
    option.dataset.zone = canonical;
    fragment.append(option);
  }

  timezoneList.append(fragment);
}

function normalizeTimezone(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (Object.prototype.hasOwnProperty.call(timezoneAliases, trimmed)) {
    return timezoneAliases[trimmed];
  }

  const matchingOption = Array.from(timezoneList.options).find(
    (option) => option.value === trimmed
  );

  if (matchingOption?.dataset?.zone) {
    return matchingOption.dataset.zone;
  }

  return trimmed;
}

function renderEmptyState() {
  const message = document.createElement('div');
  message.className = 'empty-message';
  message.textContent = 'No teammates added yet. Use the form above to add one.';
  peopleList.append(message);
}

function renderPeople(referenceDate, sortedEntries) {
  peopleList.innerHTML = '';

  const now = referenceDate instanceof Date ? referenceDate : new Date();
  const entries = Array.isArray(sortedEntries) ? sortedEntries : getSortedPeople(now);

  if (!entries.length) {
    renderEmptyState();
  } else {
    for (const person of entries) {
      const item = document.createElement('div');
      item.className = 'person';
      item.setAttribute('role', 'listitem');

      const details = document.createElement('div');
      details.className = 'person-details';

      const name = document.createElement('span');
      name.className = 'person-name';
      name.textContent = person.name;

      details.append(name);

      if (person.note) {
        const note = document.createElement('p');
        note.className = 'person-note';
        note.textContent = person.note;
        details.append(note);
      }

      const timezone = document.createElement('p');
      timezone.className = 'person-timezone';
      timezone.textContent = person.timezone;
      details.append(timezone);

      const actions = document.createElement('div');
      actions.className = 'person-actions';

      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.textContent = 'Remove';
      removeButton.addEventListener('click', async () => {
        const filteredPeople = people.filter((entry) => entry.id !== person.id);
        const removalReference = new Date();
        people = getSortedPeople(removalReference, filteredPeople);
        await setInStorage(STORAGE_KEYS.people, people);
        renderPeople(removalReference, people);
      });

      actions.append(removeButton);

      item.append(details, actions);
      peopleList.append(item);
    }
  }

  renderTimelines(entries, now);
}

function getDayKey(date, formatter) {
  const parts = formatter.formatToParts(date);
  let year = '';
  let month = '';
  let day = '';

  for (const part of parts) {
    if (part.type === 'year') {
      year = part.value;
    } else if (part.type === 'month') {
      month = part.value;
    } else if (part.type === 'day') {
      day = part.value;
    }
  }

  return `${year}-${month}-${day}`;
}

function createTimelineRow(entry, referenceDate) {
  const { name, note, timezone, trackLabel, extraClass } = entry;
  let hourFormatter;
  let dayLabelFormatter;
  let dayKeyFormatter;

  try {
    hourFormatter = new Intl.DateTimeFormat(undefined, {
      timeZone: timezone,
      hour: 'numeric',
      hour12: settings.hour12
    });

    dayLabelFormatter = new Intl.DateTimeFormat(undefined, {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

    dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.warn('Unable to render timeline for entry', entry, error);
    return null;
  }

  const row = document.createElement('div');
  row.className = 'timeline-row';
  if (extraClass) {
    row.classList.add(extraClass);
  }
  row.setAttribute('role', 'listitem');

  const personInfo = document.createElement('div');
  personInfo.className = 'timeline-person';

  const nameElement = document.createElement('span');
  nameElement.className = 'timeline-person-name';
  nameElement.textContent = name;
  personInfo.append(nameElement);

  if (note) {
    const noteElement = document.createElement('span');
    noteElement.className = 'timeline-person-note';
    noteElement.textContent = note;
    personInfo.append(noteElement);
  }

  const timezoneElement = document.createElement('span');
  timezoneElement.className = 'timeline-person-timezone';
  timezoneElement.textContent = timezone;
  personInfo.append(timezoneElement);

  const track = document.createElement('div');
  track.className = 'timeline-track';
  track.setAttribute('role', 'list');
  const accessibleLabel = trackLabel ?? `${name}'s next 24 hours`;
  track.setAttribute('aria-label', accessibleLabel);

  let previousDayKey = null;
  const baseDate = referenceDate ?? new Date();

  for (let offset = 0; offset < 24; offset += 1) {
    const segmentDate = new Date(baseDate.getTime() + offset * 60 * 60 * 1000);
    const hourLabel = hourFormatter.format(segmentDate);
    const dayKey = getDayKey(segmentDate, dayKeyFormatter);
    const dayLabel = dayLabelFormatter.format(segmentDate);
    const isCurrentHour = offset === 0;
    const isDayChange = previousDayKey !== null && dayKey !== previousDayKey;

    const hourElement = document.createElement('div');
    hourElement.className = 'timeline-hour';
    if (isCurrentHour) {
      hourElement.classList.add('is-current');
    }
    if (isDayChange) {
      hourElement.classList.add('is-day-change');
    }
    hourElement.setAttribute('role', 'listitem');
    hourElement.setAttribute('aria-label', `${name}: ${hourLabel} (${dayLabel})`);
    hourElement.title = `${dayLabel} • ${hourLabel}`;

    const hourLabelElement = document.createElement('span');
    hourLabelElement.className = 'timeline-hour-label';
    hourLabelElement.textContent = hourLabel;
    hourElement.append(hourLabelElement);

    if (isDayChange || offset === 0) {
      const dayLabelElement = document.createElement('span');
      dayLabelElement.className = 'timeline-day-label';
      dayLabelElement.textContent = dayLabel;
      hourElement.append(dayLabelElement);
    }

    track.append(hourElement);
    previousDayKey = dayKey;
  }

  row.append(personInfo, track);
  return row;
}

function renderTimelines(sortedEntries, referenceDate) {
  if (!timelineRows) {
    return;
  }

  timelineRows.innerHTML = '';

  const now = referenceDate instanceof Date ? referenceDate : new Date();
  const entries = Array.isArray(sortedEntries) ? sortedEntries : getSortedPeople(now);

  const viewerRow = createTimelineRow(
    {
      name: 'You',
      note: viewerTimezoneInfo.isFallback ? 'Defaulting to UTC' : 'Your local time',
      timezone: viewerTimezoneInfo.timezone,
      trackLabel: 'Your next 24 hours',
      extraClass: 'is-viewer'
    },
    now
  );

  if (viewerRow) {
    timelineRows.append(viewerRow);
  }

  if (!entries.length) {
    const message = document.createElement('div');
    message.className = 'empty-message';
    message.textContent = 'Timelines will appear after you add teammates.';
    message.setAttribute('role', 'listitem');
    timelineRows.append(message);
    return;
  }

  for (const person of entries) {
    const row = createTimelineRow(
      {
        name: person.name,
        note: person.note,
        timezone: person.timezone
      },
      now
    );

    if (row) {
      timelineRows.append(row);
    }
  }
}

function startTimelineRefresh() {
  if (typeof window === 'undefined') {
    return;
  }

  if (!timelineRows) {
    return;
  }

  if (timelineRefreshIntervalId) {
    window.clearInterval(timelineRefreshIntervalId);
  }

  timelineRefreshIntervalId = window.setInterval(() => {
    renderTimelines();
  }, TIMELINE_REFRESH_INTERVAL);
}

function validateTimezone(value) {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch (error) {
    return false;
  }
}

personForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const note = noteInput.value.trim();
  const timezone = timezoneInput.value.trim();
  const canonicalTimezone = normalizeTimezone(timezone);

  if (!name || !canonicalTimezone) {
    return;
  }

  timezoneInput.setCustomValidity('');
  if (!validateTimezone(canonicalTimezone)) {
    timezoneInput.setCustomValidity('Enter a valid IANA time zone.');
    timezoneInput.reportValidity();
    return;
  }

  timezoneInput.value = canonicalTimezone;

  const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `person-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const entry = {
    id,
    name,
    note,
    timezone: canonicalTimezone
  };

  const additionReference = new Date();
  people = getSortedPeople(additionReference, [...people, entry]);
  await setInStorage(STORAGE_KEYS.people, people);
  renderPeople(additionReference, people);

  personForm.reset();
  nameInput.focus();
});

hourFormatSelect.addEventListener('change', async () => {
  const hour12 = hourFormatSelect.value === '12';
  settings = { ...settings, hour12 };
  await setInStorage(STORAGE_KEYS.settings, settings);
  renderTimelines();
});

async function initialize() {
  const [zones, storedPeople, storedSettings] = await Promise.all([
    loadTimezones(),
    getFromStorage(STORAGE_KEYS.people, []),
    getFromStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS)
  ]);

  const storedList = Array.isArray(storedPeople) ? storedPeople : [];
  const initializationReference = new Date();
  const normalizedPeople = getSortedPeople(initializationReference, storedList);

  people = normalizedPeople;
  settings = { ...DEFAULT_SETTINGS, ...(storedSettings ?? {}) };

  if (JSON.stringify(storedList) !== JSON.stringify(normalizedPeople)) {
    await setInStorage(STORAGE_KEYS.people, people);
  }

  populateTimezoneDatalist(
    Array.isArray(zones) ? zones : [],
    FALLBACK_TIMEZONE_ALIASES
  );

  hourFormatSelect.value = settings.hour12 ? '12' : '24';
  renderPeople(initializationReference, people);

  if (timelineSection && timelineRows) {
    startTimelineRefresh();
  }
}

timezoneInput.addEventListener('change', () => {
  const canonical = normalizeTimezone(timezoneInput.value);
  if (canonical) {
    timezoneInput.value = canonical;
  }
});

timezoneInput.addEventListener('blur', () => {
  const canonical = normalizeTimezone(timezoneInput.value);
  if (canonical) {
    timezoneInput.value = canonical;
  }
});

initialize();
