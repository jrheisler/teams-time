import { getStoredValue, fmtTime, dayDelta, timeValue, escapeHtml } from './util.js';

const DEFAULT_PEOPLE = [];
const DEFAULT_SETTINGS = {
  sortMode: 'time',
  baseTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
};

const currentTimeElement = document.getElementById('current-time');
const peopleListElement = document.getElementById('people-list');

let state = {
  people: DEFAULT_PEOPLE,
  settings: DEFAULT_SETTINGS
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

function renderCurrentTime(now, baseTimeZone) {
  const currentTime = fmtTime(now, baseTimeZone);
  const timezoneLabel = baseTimeZone || 'Local time';
  currentTimeElement.innerHTML = `${escapeHtml(currentTime)} • ${escapeHtml(timezoneLabel)}`;
}

function renderPeople(now, baseTimeZone, sortMode) {
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
    const item = document.createElement('li');
    item.className = 'person';
    item.innerHTML = `
      <div class="person__header">
        <h3 class="person__name">${escapeHtml(person.name)}</h3>
        <span class="person__time">${escapeHtml(fmtTime(now, person.timezone))}</span>
      </div>
      <div class="person__meta">
        <span class="person__delta">${escapeHtml(describeDayDelta(delta))}</span>
        <span class="person__timezone">${escapeHtml(person.timezone)}</span>
      </div>
    `;
    peopleListElement.append(item);
  }
}

function render() {
  const now = new Date();
  const baseTimeZone = state.settings.baseTimeZone || DEFAULT_SETTINGS.baseTimeZone;
  const sortMode = state.settings.sortMode || DEFAULT_SETTINGS.sortMode;
  renderCurrentTime(now, baseTimeZone);
  renderPeople(now, baseTimeZone, sortMode);
}

function startRenderTimer() {
  if (renderTimerId !== null) {
    clearInterval(renderTimerId);
  }
  renderTimerId = setInterval(render, 60000);
}

async function hydrate() {
  const [storedPeople, storedSettings] = await Promise.all([
    getStoredValue('people', []),
    getStoredValue('settings', {})
  ]);
  state = {
    people: normalizePeople(storedPeople),
    settings: normalizeSettings(storedSettings)
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
