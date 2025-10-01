import {
  getStoredValue,
  setStoredValue,
  fmtTime,
  dayDelta,
  timeValue,
  escapeHtml
} from '../util.js';
import { loadTimezoneMetadata, getDisplayLabel } from '../timezone-metadata.js';

const DEFAULT_PEOPLE = [];
const DEFAULT_SETTINGS = {
  sortMode: 'time',
  baseTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  hour12: true
};

const currentTimeElement = document.getElementById('current-time');
const rosterListElement = document.getElementById('roster-list');
const teammateForm = document.getElementById('teammate-form');
const teammateNameInput = document.getElementById('teammate-name');
const teammateNoteInput = document.getElementById('teammate-note');
const teammateTimezoneInput = document.getElementById('teammate-timezone');
const timezoneListElement = document.getElementById('timezone-list');
const hourFormatControl = document.getElementById('hour-format');
const baseTimezoneControl = document.getElementById('base-timezone');

let state = {
  people: DEFAULT_PEOPLE,
  settings: DEFAULT_SETTINGS,
  metadata: null
};
let renderTimerId = null;
let generatedIdCounter = 0;

function generateMemberId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  generatedIdCounter += 1;
  return `person-${Date.now()}-${generatedIdCounter}`;
}

function normalizePeople(value) {
  if (!Array.isArray(value)) {
    return { list: [], changed: Boolean(value) };
  }

  const normalized = [];
  let changed = false;

  for (const entry of value) {
    const name = typeof entry?.name === 'string' ? entry.name.trim() : '';
    const timezone = typeof entry?.timezone === 'string' ? entry.timezone.trim() : '';
    if (!name || !timezone) {
      changed = true;
      continue;
    }

    const note = typeof entry?.note === 'string' ? entry.note.trim() : '';
    let id = typeof entry?.id === 'string' && entry.id ? entry.id : '';
    if (!id) {
      id = generateMemberId();
      changed = true;
    }

    if (note !== (entry?.note ?? '')) {
      changed = true;
    }

    normalized.push({ id, name, note, timezone });
  }

  return { list: normalized, changed };
}

function isValidTimeZone(value) {
  if (typeof value !== 'string' || !value) {
    return false;
  }

  try {
    new Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch (error) {
    console.warn('Invalid timezone provided', value, error);
    return false;
  }
}

function cleanupInvalidStoredTimeZones(source, invalidKeys) {
  if (!invalidKeys.length) {
    return;
  }
  const sanitized = { ...source };
  let modified = false;
  for (const key of invalidKeys) {
    if (key in sanitized) {
      delete sanitized[key];
      modified = true;
    }
  }
  if (!modified) {
    return;
  }
  void setStoredValue('settings', sanitized);
}

function normalizeSettings(value) {
  const normalized = { ...DEFAULT_SETTINGS };
  if (!value || typeof value !== 'object') {
    return { settings: normalized, changed: true };
  }

  let changed = false;
  const timezonePreferenceKeys = [
    'baseTimeZone',
    'defaultTimezone',
    'timezone',
    'referenceTimezone'
  ];

  if (typeof value.sortMode === 'string') {
    const lower = value.sortMode.toLowerCase();
    if (lower === 'name' || lower === 'time') {
      normalized.sortMode = lower;
    } else if (value.sortMode !== DEFAULT_SETTINGS.sortMode) {
      changed = true;
    }
  } else if (value?.sortMode !== undefined) {
    changed = true;
  }

  const invalidKeys = [];
  let selectedZone = null;
  for (const key of timezonePreferenceKeys) {
    const candidate = value[key];
    if (typeof candidate !== 'string' || !candidate) {
      if (candidate !== undefined) {
        changed = true;
      }
      continue;
    }
    if (isValidTimeZone(candidate)) {
      if (!selectedZone) {
        selectedZone = candidate;
      }
      continue;
    }
    invalidKeys.push(key);
  }

  if (selectedZone) {
    normalized.baseTimeZone = selectedZone;
  } else if (invalidKeys.length) {
    normalized.baseTimeZone = DEFAULT_SETTINGS.baseTimeZone;
    changed = true;
  } else if (typeof value.baseTimeZone === 'string' && value.baseTimeZone) {
    normalized.baseTimeZone = value.baseTimeZone;
  }

  if (invalidKeys.length) {
    cleanupInvalidStoredTimeZones(value, invalidKeys);
  }

  if (typeof value.hour12 === 'boolean') {
    normalized.hour12 = value.hour12;
  } else if (value?.hour12 !== undefined) {
    changed = true;
  }

  return { settings: normalized, changed };
}

function describeDayDelta(delta) {
  if (delta === 0) {
    return 'Today';
  }
  if (delta === 1) {
    return 'Tomorrow';
  }
  if (delta === -1) {
    return 'Yesterday';
  }
  if (delta > 1) {
    return `${delta} days ahead`;
  }
  return `${Math.abs(delta)} days behind`;
}

function sortPeople(people, sortMode, now) {
  const sorted = [...people];
  if (sortMode === 'name') {
    return sorted.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  }
  return sorted.sort((a, b) => {
    const timeComparison = timeValue(now, a.timezone).localeCompare(
      timeValue(now, b.timezone)
    );
    if (timeComparison !== 0) {
      return timeComparison;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}

function renderCurrentTime(now, baseTimeZone, hour12) {
  if (!currentTimeElement) {
    return;
  }
  const currentTime = fmtTime(now, baseTimeZone, { hour12 });
  const timezoneLabel = baseTimeZone || 'Local time';
  currentTimeElement.innerHTML = `${escapeHtml(currentTime)} • ${escapeHtml(timezoneLabel)}`;
}

function renderRoster(now, baseTimeZone, sortMode, hour12) {
  if (!rosterListElement) {
    return;
  }

  rosterListElement.innerHTML = '';

  if (!state.people.length) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-message';
    emptyMessage.textContent = 'No teammates added yet. Use the form above to add one.';
    rosterListElement.append(emptyMessage);
    return;
  }

  const sorted = sortPeople(state.people, sortMode, now);

  for (const person of sorted) {
    const item = document.createElement('div');
    item.className = 'person';
    item.dataset.personId = person.id;

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

    const timezoneLabel = getDisplayLabel(person.timezone, {
      includeOffset: true,
      metadata: state.metadata
    });
    const personTime = fmtTime(now, person.timezone, { hour12 });
    const deltaLabel = describeDayDelta(
      dayDelta(now, person.timezone, baseTimeZone)
    );

    const timezone = document.createElement('p');
    timezone.className = 'person-timezone';
    timezone.textContent = `${personTime} • ${deltaLabel} • ${timezoneLabel}`;
    if (person.timezone) {
      timezone.dataset.zoneId = person.timezone;
      timezone.title = person.timezone;
      if (timezoneLabel !== person.timezone) {
        timezone.setAttribute('aria-label', `${timezoneLabel} (${person.timezone})`);
      }
    }
    details.append(timezone);

    const actions = document.createElement('div');
    actions.className = 'person-actions';

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', () => {
      handleRemovePerson(person.id);
    });

    actions.append(removeButton);

    item.append(details, actions);
    rosterListElement.append(item);
  }
}

function render() {
  const now = new Date();
  const baseTimeZone = state.settings.baseTimeZone || DEFAULT_SETTINGS.baseTimeZone;
  const sortMode = state.settings.sortMode || DEFAULT_SETTINGS.sortMode;
  const hour12 =
    typeof state.settings.hour12 === 'boolean' ? state.settings.hour12 : DEFAULT_SETTINGS.hour12;

  renderCurrentTime(now, baseTimeZone, hour12);
  renderRoster(now, baseTimeZone, sortMode, hour12);
}

function startRenderTimer() {
  if (renderTimerId !== null) {
    window.clearInterval(renderTimerId);
  }
  renderTimerId = window.setInterval(render, 60000);
}

function stopRenderTimer() {
  if (renderTimerId !== null) {
    window.clearInterval(renderTimerId);
    renderTimerId = null;
  }
}

async function handleRemovePerson(id) {
  const filtered = state.people.filter((person) => person.id !== id);
  const updatedList = sortPeople(filtered, state.settings.sortMode, new Date());
  state = {
    ...state,
    people: updatedList
  };
  await setStoredValue('people', updatedList);
  render();
}

function canonicalizeTimezone(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (!timezoneListElement) {
    return trimmed;
  }

  const match = Array.from(timezoneListElement.options).find(
    (option) => option.value === trimmed
  );

  return match?.dataset?.zoneId || trimmed;
}

function validateTimezoneInput(inputElement) {
  if (!inputElement) {
    return true;
  }

  const canonical = canonicalizeTimezone(inputElement.value || '');
  if (!canonical) {
    inputElement.setCustomValidity('Enter a valid IANA time zone.');
    return false;
  }

  if (!isValidTimeZone(canonical)) {
    inputElement.setCustomValidity('Enter a valid IANA time zone.');
    return false;
  }

  inputElement.setCustomValidity('');
  if (canonical !== inputElement.value) {
    inputElement.value = canonical;
  }
  return true;
}

async function handleFormSubmit(event) {
  event.preventDefault();

  const name = teammateNameInput?.value?.trim() || '';
  const note = teammateNoteInput?.value?.trim() || '';
  const timezoneValue = teammateTimezoneInput?.value?.trim() || '';

  if (!name) {
    teammateNameInput?.focus();
    return;
  }

  if (!timezoneValue) {
    if (teammateTimezoneInput) {
      teammateTimezoneInput.setCustomValidity('Enter a valid IANA time zone.');
      teammateTimezoneInput.reportValidity();
    }
    return;
  }

  const canonicalTimezone = canonicalizeTimezone(timezoneValue);
  if (!isValidTimeZone(canonicalTimezone)) {
    if (teammateTimezoneInput) {
      teammateTimezoneInput.setCustomValidity('Enter a valid IANA time zone.');
      teammateTimezoneInput.reportValidity();
    }
    return;
  }

  if (teammateTimezoneInput) {
    teammateTimezoneInput.setCustomValidity('');
    teammateTimezoneInput.value = canonicalTimezone;
  }

  const now = new Date();
  const newPerson = {
    id: generateMemberId(),
    name,
    note,
    timezone: canonicalTimezone
  };

  const updatedList = sortPeople([...state.people, newPerson], state.settings.sortMode, now);
  state = {
    ...state,
    people: updatedList
  };

  await setStoredValue('people', updatedList);
  render();

  teammateForm?.reset();
  teammateNameInput?.focus();
}

async function populateTimezoneDatalist(metadata) {
  if (!timezoneListElement) {
    return;
  }

  let zones = [];
  try {
    const response = await fetch('../timezones.json');
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        zones = data.filter((value) => typeof value === 'string');
      }
    } else {
      console.warn('Failed to fetch time zone list', response.status);
    }
  } catch (error) {
    console.warn('Unable to fetch time zone list', error);
  }

  if (!zones.length) {
    const fallbackMetadata = metadata || (await loadTimezoneMetadata());
    if (fallbackMetadata && typeof fallbackMetadata === 'object') {
      zones = Object.keys(fallbackMetadata);
    }
  }

  const uniqueZones = Array.from(new Set(zones)).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );

  const fragment = document.createDocumentFragment();
  for (const zone of uniqueZones) {
    const option = document.createElement('option');
    option.value = zone;
    const label = getDisplayLabel(zone, { metadata, includeOffset: false });
    option.textContent = label && label !== zone ? label : zone;
    option.label = label && label !== zone ? `${label} (${zone})` : zone;
    option.dataset.zoneId = zone;
    fragment.append(option);
  }

  timezoneListElement.innerHTML = '';
  timezoneListElement.append(fragment);
}

async function persistSettings(settings) {
  await setStoredValue('settings', settings);
}

function setupSettingsControls() {
  if (hourFormatControl) {
    hourFormatControl.value = state.settings.hour12 ? '12' : '24';
    hourFormatControl.addEventListener('change', async () => {
      const hour12 = hourFormatControl.value === '12';
      state = {
        ...state,
        settings: {
          ...state.settings,
          hour12
        }
      };
      await persistSettings(state.settings);
      render();
    });
  }

  if (baseTimezoneControl) {
    baseTimezoneControl.value = state.settings.baseTimeZone || '';
    baseTimezoneControl.addEventListener('change', async () => {
      const inputValue = baseTimezoneControl.value.trim();
      if (!inputValue) {
        baseTimezoneControl.setCustomValidity('');
        const fallbackZone = DEFAULT_SETTINGS.baseTimeZone;
        baseTimezoneControl.value = fallbackZone;

        state = {
          ...state,
          settings: {
            ...state.settings,
            baseTimeZone: fallbackZone
          }
        };
        await persistSettings(state.settings);
        render();
        return;
      }

      const canonical = canonicalizeTimezone(inputValue);
      if (!isValidTimeZone(canonical)) {
        baseTimezoneControl.setCustomValidity('Enter a valid IANA time zone.');
        baseTimezoneControl.reportValidity();
        return;
      }

      baseTimezoneControl.setCustomValidity('');
      baseTimezoneControl.value = canonical;

      state = {
        ...state,
        settings: {
          ...state.settings,
          baseTimeZone: canonical
        }
      };
      await persistSettings(state.settings);
      render();
    });
  }
}

async function initialize() {
  const [storedPeople, storedSettings, metadata] = await Promise.all([
    getStoredValue('people', []),
    getStoredValue('settings', {}),
    loadTimezoneMetadata()
  ]);

  const { list: normalizedPeople, changed: peopleChanged } = normalizePeople(storedPeople);
  const { settings: normalizedSettings, changed: settingsChanged } = normalizeSettings(
    storedSettings
  );

  state = {
    people: normalizedPeople,
    settings: normalizedSettings,
    metadata
  };

  if (peopleChanged) {
    await setStoredValue('people', normalizedPeople);
  }

  if (settingsChanged) {
    await setStoredValue('settings', { ...normalizedSettings });
  }

  await populateTimezoneDatalist(metadata);
  setupSettingsControls();

  render();
  startRenderTimer();

  if (teammateForm) {
    teammateForm.addEventListener('submit', handleFormSubmit);
  }

  if (teammateTimezoneInput) {
    teammateTimezoneInput.addEventListener('blur', () => {
      validateTimezoneInput(teammateTimezoneInput);
    });
    teammateTimezoneInput.addEventListener('change', () => {
      validateTimezoneInput(teammateTimezoneInput);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initialize().catch((error) => {
    console.error('Unable to initialize application', error);
  });
});

window.addEventListener('beforeunload', () => {
  stopRenderTimer();
});
