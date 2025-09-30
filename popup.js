import { getStoredValue, fmtTime, dayDelta, timeValue, escapeHtml } from './util.js';
import { loadTimezoneMetadata, getDisplayLabel } from './timezone-metadata.js';

const DEFAULT_PEOPLE = [];
const DEFAULT_SETTINGS = {
  sortMode: 'time',
  baseTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  hour12: true
};

const currentTimeElement = document.getElementById('current-time');
const peopleListElement = document.getElementById('people-list');
const settingsButton = document.getElementById('open-settings');

let state = {
  people: DEFAULT_PEOPLE,
  settings: DEFAULT_SETTINGS,
  metadata: null
};
let renderTimerId = null;

function normalizePeople(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => ({
      name: entry?.name ?? '',
      timezone: entry?.timezone ?? ''
    }))
    .filter((entry) => entry.name && entry.timezone);
}

function normalizeSettings(value) {
  const normalized = { ...DEFAULT_SETTINGS };
  if (!value || typeof value !== 'object') {
    return normalized;
  }
  if (typeof value.sortMode === 'string') {
    const lower = value.sortMode.toLowerCase();
    if (lower === 'name' || lower === 'time') {
      normalized.sortMode = lower;
    }
  }
  const suppliedBase =
    value.baseTimeZone || value.defaultTimezone || value.timezone || value.referenceTimezone;
  if (typeof suppliedBase === 'string' && suppliedBase) {
    normalized.baseTimeZone = suppliedBase;
  }
  if (typeof value.hour12 === 'boolean') {
    normalized.hour12 = value.hour12;
  }
  return normalized;
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
  const currentTime = fmtTime(now, baseTimeZone, { hour12 });
  const timezoneLabel = baseTimeZone || 'Local time';
  currentTimeElement.innerHTML = `${escapeHtml(currentTime)} • ${escapeHtml(timezoneLabel)}`;
}

function renderPeople(now, baseTimeZone, sortMode, hour12) {
  peopleListElement.innerHTML = '';
  if (!state.people.length) {
    const empty = document.createElement('li');
    empty.className = 'people-list__empty';
    empty.textContent = 'Add teammates from the options page to see their local time.';
    peopleListElement.append(empty);
    return;
  }

  const sorted = sortPeople(state.people, sortMode, now);
  for (const person of sorted) {
    const delta = dayDelta(now, person.timezone, baseTimeZone);
    const timezoneLabel = getDisplayLabel(person.timezone, {
      includeOffset: true,
      metadata: state.metadata
    });
    const item = document.createElement('li');
    item.className = 'person';
    item.innerHTML = `
      <div class="person__header">
        <h3 class="person__name">${escapeHtml(person.name)}</h3>
        <span class="person__time">${escapeHtml(fmtTime(now, person.timezone, { hour12 }))}</span>
      </div>
      <div class="person__meta">
        <span class="person__delta">${escapeHtml(describeDayDelta(delta))}</span>
        <span class="person__timezone">${escapeHtml(timezoneLabel)}</span>
      </div>
    `;
    const timezoneElement = item.querySelector('.person__timezone');
    if (timezoneElement && person.timezone) {
      timezoneElement.dataset.zoneId = person.timezone;
      timezoneElement.title = person.timezone;
      if (timezoneLabel !== person.timezone) {
        timezoneElement.setAttribute(
          'aria-label',
          `${timezoneLabel} (${person.timezone})`
        );
      }
    }
    peopleListElement.append(item);
  }
}

function render() {
  const now = new Date();
  const baseTimeZone = state.settings.baseTimeZone || DEFAULT_SETTINGS.baseTimeZone;
  const sortMode = state.settings.sortMode || DEFAULT_SETTINGS.sortMode;
  const hour12 =
    typeof state.settings.hour12 === 'boolean' ? state.settings.hour12 : DEFAULT_SETTINGS.hour12;
  renderCurrentTime(now, baseTimeZone, hour12);
  renderPeople(now, baseTimeZone, sortMode, hour12);
}

function startRenderTimer() {
  if (renderTimerId !== null) {
    clearInterval(renderTimerId);
  }
  renderTimerId = setInterval(render, 60000);
}

async function hydrate() {
  const [storedPeople, storedSettings, metadata] = await Promise.all([
    getStoredValue('people', []),
    getStoredValue('settings', {}),
    loadTimezoneMetadata()
  ]);
  state = {
    people: normalizePeople(storedPeople),
    settings: normalizeSettings(storedSettings),
    metadata
  };
  render();
  startRenderTimer();
}

window.addEventListener('unload', () => {
  if (renderTimerId !== null) {
    clearInterval(renderTimerId);
    renderTimerId = null;
  }
});

document.addEventListener('DOMContentLoaded', hydrate);

if (settingsButton) {
  settingsButton.addEventListener('click', (event) => {
    event.preventDefault();
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'), '_blank');
    }
  });
}
