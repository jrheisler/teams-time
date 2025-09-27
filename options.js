import timezones from './timezones.json' assert { type: 'json' };

const runtimeChrome = typeof chrome !== 'undefined' ? chrome : undefined;
const storageArea = runtimeChrome?.storage?.sync;
const fallbackStore = new Map();

let cachedTimezones = null;
const FALLBACK_TIMEZONES = [...timezones];

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

const STORAGE_KEYS = {
  people: 'people',
  settings: 'settings'
};

const DEFAULT_SETTINGS = {
  hour12: true
};

let people = [];
let settings = { ...DEFAULT_SETTINGS };

function populateTimezoneDatalist(zones) {
  timezoneList.innerHTML = '';
  for (const zone of zones) {
    const option = document.createElement('option');
    option.value = zone;
    option.textContent = zone;
    option.label = zone;
    timezoneList.append(option);
  }
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
    return;
  }

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

  if (!name || !timezone) {
    return;
  }

  timezoneInput.setCustomValidity('');
  if (!validateTimezone(timezone)) {
    timezoneInput.setCustomValidity('Enter a valid IANA time zone.');
    timezoneInput.reportValidity();
    return;
  }

  const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `person-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const entry = {
    id,
    name,
    note,
    timezone
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
});

async function initialize() {
  const [zones, storedPeople, storedSettings] = await Promise.all([
    loadTimezones(),
    getFromStorage(STORAGE_KEYS.people, []),
    getFromStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS)
  ]);

  people = Array.isArray(storedPeople) ? storedPeople : [];
  settings = { ...DEFAULT_SETTINGS, ...(storedSettings ?? {}) };

  populateTimezoneDatalist(Array.isArray(zones) ? zones : []);

  hourFormatSelect.value = settings.hour12 ? '12' : '24';
  renderPeople();
}

initialize();
