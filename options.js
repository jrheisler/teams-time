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
const currentUserTimeline = document.getElementById('current-user-timeline');
const timelineList = document.getElementById('timeline-list');

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

function renderPeople() {
  peopleList.innerHTML = '';

  if (!people.length) {
    renderEmptyState();
  } else {
    for (const person of people) {
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
        people = people.filter((entry) => entry.id !== person.id);
        await setInStorage(STORAGE_KEYS.people, people);
        renderPeople();
      });

      actions.append(removeButton);

      item.append(details, actions);
      peopleList.append(item);
    }
  }

  renderTimelines();
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

function renderTimelines() {
  if (!timelineList || !currentUserTimeline) {
    return;
  }

  currentUserTimeline.innerHTML = '';
  timelineList.innerHTML = '';

  const now = new Date();

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
    currentUserTimeline.append(viewerRow);
  }

  if (!people.length) {
    const message = document.createElement('div');
    message.className = 'empty-message';
    message.textContent = 'Timelines will appear after you add teammates.';
    timelineList.append(message);
    return;
  }

  for (const person of people) {
    const row = createTimelineRow(
      {
        name: person.name,
        note: person.note,
        timezone: person.timezone
      },
      now
    );

    if (row) {
      timelineList.append(row);
    }
  }
}

function startTimelineRefresh() {
  if (typeof window === 'undefined') {
    return;
  }

  if (!timelineList || !currentUserTimeline) {
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

  people = [...people, entry];
  await setInStorage(STORAGE_KEYS.people, people);
  renderPeople();

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

  people = Array.isArray(storedPeople) ? storedPeople : [];
  settings = { ...DEFAULT_SETTINGS, ...(storedSettings ?? {}) };

  populateTimezoneDatalist(
    Array.isArray(zones) ? zones : [],
    FALLBACK_TIMEZONE_ALIASES
  );

  hourFormatSelect.value = settings.hour12 ? '12' : '24';
  renderPeople();

  if (timelineSection && timelineList && currentUserTimeline) {
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
