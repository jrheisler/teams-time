import timezones from './timezones-data.js';
import timezoneAliases from './timezone-aliases.js';
import timezoneGeoFallback from './timezones-geo-fallback.js';

const runtimeChrome = typeof chrome !== 'undefined' ? chrome : undefined;
const storageArea = runtimeChrome?.storage?.sync;
const fallbackStore = new Map();

let cachedTimezones = null;
const FALLBACK_TIMEZONES = timezones;
const FALLBACK_TIMEZONE_ALIASES = timezoneAliases;
const FALLBACK_TIMEZONE_METADATA = createFallbackMetadata(FALLBACK_TIMEZONES);
let cachedTimezoneMetadata = null;
let timezoneMetadataIndex = null;

const FALLBACK_TIMEZONE_GEO_DATA = JSON.parse(JSON.stringify(timezoneGeoFallback));

let cachedTimezoneGeoData = null;
const timezoneMapRegionsByZone = new Map();
let activeTimezoneMapRegion = null;
const MAP_POINT_RADIUS = 4.5;
const WORLD_BASEMAP_URL = runtimeChrome?.runtime?.getURL
  ? runtimeChrome.runtime.getURL('assets/world-outline.svg')
  : new URL('./assets/world-outline.svg', import.meta.url).toString();

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
const timezoneBrowseContainer = document.getElementById('timezone-browse');
const timezoneCountrySelect = document.getElementById('timezone-country');
const timezoneRegionSelect = document.getElementById('timezone-region');
const timezoneBrowseStatus = document.getElementById('timezone-browse-status');
const timezoneMapContainer = document.getElementById('timezone-map');
const peopleList = document.getElementById('people-list');
const hourFormatSelect = document.getElementById('hour-format');
const timelineSection = document.getElementById('timeline-section');
const timelineRows = document.getElementById('timeline-rows');
const peopleExportButton = document.getElementById('people-export');
const peopleImportButton = document.getElementById('people-import');
const peopleImportInput = document.getElementById('people-import-input');
const peopleFeedback = document.getElementById('people-feedback');

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

function toFriendlySegment(segment) {
  return segment
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function createFallbackMetadata(zoneList) {
  const metadata = {};
  const zones = Array.isArray(zoneList) ? zoneList : [];

  for (const zone of zones) {
    if (typeof zone !== 'string') {
      continue;
    }

    const [territory, ...rest] = zone.split('/');
    const friendlyTerritory = toFriendlySegment(territory);
    const friendlySegments = rest.map(toFriendlySegment);
    const country = friendlySegments[0] || friendlyTerritory;
    const subdivision = friendlySegments.length > 1
      ? friendlySegments.slice(1).join(', ')
      : null;
    const baseLabel = friendlySegments.length
      ? friendlySegments.join(' – ')
      : friendlyTerritory;
    const displayLabel =
      friendlyTerritory && friendlyTerritory !== country
        ? `${baseLabel} (${friendlyTerritory})`
        : baseLabel;

    metadata[zone] = {
      zone,
      territory: friendlyTerritory,
      country,
      subdivision,
      displayLabel,
      coordinates: null
    };
  }

  return metadata;
}

async function loadTimezoneMetadata(zoneList) {
  if (cachedTimezoneMetadata) {
    return cachedTimezoneMetadata;
  }

  const fallbackMetadata =
    Array.isArray(zoneList) && zoneList.length
      ? createFallbackMetadata(zoneList)
      : FALLBACK_TIMEZONE_METADATA;

  const url = runtimeChrome?.runtime?.getURL
    ? runtimeChrome.runtime.getURL('timezones-meta.json')
    : 'timezones-meta.json';

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load metadata: ${response.status}`);
    }
    const metadata = await response.json();
    if (metadata && typeof metadata === 'object') {
      cachedTimezoneMetadata = metadata;
      return metadata;
    }
  } catch (error) {
    console.warn('Unable to load time zone metadata', error);
  }

  cachedTimezoneMetadata = fallbackMetadata;
  return cachedTimezoneMetadata;
}

function buildTimezoneMetadataIndex(metadata) {
  const byZone = new Map();
  const countriesByKey = new Map();
  const countries = [];
  const collator = new Intl.Collator(undefined, {
    sensitivity: 'accent',
    numeric: true
  });

  const entries = Object.values(metadata ?? {});

  for (const entry of entries) {
    if (!entry?.zone) {
      continue;
    }

    const zoneId = entry.zone;
    const countryLabel = entry.country || entry.displayLabel || zoneId;
    const territoryLabel = entry.territory || '';
    const countryKey = `${territoryLabel}::${countryLabel}`;

    let countryInfo = countriesByKey.get(countryKey);
    if (!countryInfo) {
      const displayLabel =
        territoryLabel && territoryLabel !== countryLabel
          ? `${countryLabel} (${territoryLabel})`
          : countryLabel;

      countryInfo = {
        key: countryKey,
        label: countryLabel,
        territory: territoryLabel,
        displayLabel,
        directZones: [],
        subdivisions: new Map()
      };

      countriesByKey.set(countryKey, countryInfo);
      countries.push(countryInfo);
    }

    const subdivisionLabel = entry.subdivision;
    const subdivisionKey = subdivisionLabel ? `${countryKey}::${subdivisionLabel}` : null;
    const zoneLabel = entry.displayLabel || zoneId;
    const zoneInfo = {
      zone: zoneId,
      label: zoneLabel,
      countryKey,
      subdivisionKey,
      subdivisionLabel
    };

    if (subdivisionLabel) {
      let subdivisionInfo = countryInfo.subdivisions.get(subdivisionLabel);
      if (!subdivisionInfo) {
        subdivisionInfo = {
          key: subdivisionKey,
          label: subdivisionLabel,
          zones: []
        };
        countryInfo.subdivisions.set(subdivisionLabel, subdivisionInfo);
      }
      subdivisionInfo.zones.push(zoneInfo);
    } else {
      countryInfo.directZones.push(zoneInfo);
    }

    byZone.set(zoneId, {
      ...entry,
      label: zoneLabel,
      countryKey,
      subdivisionKey
    });
  }

  const sortZones = (list) => list.sort((a, b) => collator.compare(a.label, b.label));

  for (const country of countries) {
    country.directZones = sortZones(country.directZones);
    const subdivisionList = Array.from(country.subdivisions.values());
    subdivisionList.sort((a, b) => collator.compare(a.label, b.label));
    for (const subdivision of subdivisionList) {
      subdivision.zones = sortZones(subdivision.zones);
    }
    country.subdivisions = subdivisionList;
  }

  countries.sort((a, b) => collator.compare(a.displayLabel, b.displayLabel));

  return {
    byZone,
    countries,
    countriesByKey
  };
}

function announceTimezoneSelection(message) {
  if (!timezoneBrowseStatus) {
    return;
  }

  timezoneBrowseStatus.textContent = '';

  if (!message) {
    return;
  }

  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => {
      timezoneBrowseStatus.textContent = message;
    });
  } else {
    timezoneBrowseStatus.textContent = message;
  }
}

async function loadTimezoneGeoData() {
  if (cachedTimezoneGeoData) {
    return cachedTimezoneGeoData;
  }

  const url = runtimeChrome?.runtime?.getURL
    ? runtimeChrome.runtime.getURL('timezones-geo.json')
    : 'timezones-geo.json';

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load map data: ${response.status}`);
    }
    const data = await response.json();
    if (data && typeof data === 'object' && Array.isArray(data.features)) {
      cachedTimezoneGeoData = data;
      return data;
    }
  } catch (error) {
    console.warn('Unable to load time zone map data', error);
  }

  cachedTimezoneGeoData = FALLBACK_TIMEZONE_GEO_DATA;
  return cachedTimezoneGeoData;
}

function normalizeLongitude(lng) {
  if (!Number.isFinite(lng)) {
    return 0;
  }

  const normalized = ((lng + 180) % 360 + 360) % 360 - 180;
  return normalized;
}

function clampLatitude(lat) {
  if (!Number.isFinite(lat)) {
    return 0;
  }

  return Math.min(90, Math.max(-90, lat));
}

function projectCoordinates(lng, lat, width, height) {
  const safeLng = normalizeLongitude(lng);
  const safeLat = clampLatitude(lat);
  const x = ((safeLng + 180) / 360) * width;
  const y = ((90 - safeLat) / 180) * height;
  return [x, y];
}

function polygonToPath(coordinates, width, height) {
  if (!Array.isArray(coordinates)) {
    return '';
  }

  const rings = [];

  for (const ring of coordinates) {
    if (!Array.isArray(ring) || !ring.length) {
      continue;
    }

    const commands = [];
    let previousLng = null;
    let hasSubpath = false;

    for (let index = 0; index < ring.length; index += 1) {
      const point = ring[index];
      if (!Array.isArray(point) || point.length < 2) {
        continue;
      }

      const [lng, lat] = point;
      const normalizedLng = normalizeLongitude(lng);
      const [x, y] = projectCoordinates(normalizedLng, lat, width, height);

      if (!hasSubpath) {
        commands.push(`M${x.toFixed(2)} ${y.toFixed(2)}`);
        hasSubpath = true;
        previousLng = normalizedLng;
        continue;
      }

      if (previousLng !== null) {
        const delta = Math.abs(normalizedLng - previousLng);
        if (delta > 180) {
          // Dateline wrap – close the current ring and start a new one.
          commands.push('Z');
          commands.push(`M${x.toFixed(2)} ${y.toFixed(2)}`);
          previousLng = normalizedLng;
          continue;
        }
      }

      commands.push(`L${x.toFixed(2)} ${y.toFixed(2)}`);
      previousLng = normalizedLng;
    }

    if (commands.length) {
      if (commands[commands.length - 1] !== 'Z') {
        commands.push('Z');
      }
      rings.push(commands.join(' '));
    }
  }

  return rings.join(' ');
}

function createMapRegionElement(feature, width, height) {
  const { geometry } = feature;
  if (!geometry) {
    return null;
  }

  if (geometry.type === 'GeometryCollection') {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    for (const child of geometry.geometries || []) {
      const element = createMapRegionElement({ ...feature, geometry: child }, width, height);
      if (element) {
        group.append(element);
      }
    }

    if (!group.childNodes.length) {
      return null;
    }

    return group;
  }

  if (geometry.type === 'MultiPoint') {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    for (const point of geometry.coordinates || []) {
      const element = createMapRegionElement(
        { ...feature, geometry: { type: 'Point', coordinates: point } },
        width,
        height
      );
      if (element) {
        group.append(element);
      }
    }

    if (!group.childNodes.length) {
      return null;
    }

    return group;
  }

  if (geometry.type === 'Polygon') {
    const pathData = polygonToPath(geometry.coordinates, width, height);
    if (!pathData) {
      return null;
    }

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    return path;
  }

  if (geometry.type === 'MultiPolygon') {
    const parts = [];
    for (const polygon of geometry.coordinates || []) {
      const part = polygonToPath(polygon, width, height);
      if (part) {
        parts.push(part);
      }
    }

    if (!parts.length) {
      return null;
    }

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', parts.join(' '));
    return path;
  }

  if (geometry.type === 'Point') {
    const coordinates = geometry.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return null;
    }

    const [lng, lat] = coordinates;
    const [x, y] = projectCoordinates(lng, lat, width, height);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x.toFixed(2));
    circle.setAttribute('cy', y.toFixed(2));
    circle.setAttribute('r', MAP_POINT_RADIUS.toString());
    circle.classList.add('timezone-map-region-point');
    return circle;
  }

  return null;
}

function getMapZoneLabel(zoneId) {
  const metadata = timezoneMetadataIndex?.byZone?.get(zoneId);
  return metadata?.displayLabel || metadata?.label || zoneId;
}

function formatMapSelection(zoneId) {
  if (!zoneId) {
    return '';
  }

  const label = getMapZoneLabel(zoneId);
  return label && label !== zoneId ? `${label} (${zoneId})` : zoneId;
}

function clearTimezoneMapSelection() {
  if (activeTimezoneMapRegion) {
    activeTimezoneMapRegion.classList.remove('is-active');
    activeTimezoneMapRegion.removeAttribute('aria-current');
    activeTimezoneMapRegion = null;
  }
}

function setActiveTimezoneOnMap(zoneId) {
  if (!timezoneMapRegionsByZone.size) {
    return;
  }

  if (!zoneId || !timezoneMapRegionsByZone.has(zoneId)) {
    clearTimezoneMapSelection();
    return;
  }

  const nextRegion = timezoneMapRegionsByZone.get(zoneId);
  if (activeTimezoneMapRegion && activeTimezoneMapRegion !== nextRegion) {
    activeTimezoneMapRegion.classList.remove('is-active');
    activeTimezoneMapRegion.removeAttribute('aria-current');
  }

  activeTimezoneMapRegion = nextRegion;
  if (activeTimezoneMapRegion) {
    activeTimezoneMapRegion.classList.add('is-active');
    activeTimezoneMapRegion.setAttribute('aria-current', 'true');
  }
}

function handleMapRegionActivate(zoneId, { focusInput = false } = {}) {
  if (!zoneId) {
    return;
  }

  const canonical = normalizeTimezone(zoneId);
  if (!canonical) {
    return;
  }

  setActiveTimezoneOnMap(canonical);

  if (timezoneInput) {
    timezoneInput.value = canonical;
    const changeEvent = new Event('change', { bubbles: false });
    timezoneInput.dispatchEvent(changeEvent);
    if (focusInput) {
      timezoneInput.focus();
    }
  }

  const selectionMessage = formatMapSelection(canonical);
  if (selectionMessage) {
    announceTimezoneSelection(`Time zone set to ${selectionMessage}.`);
  }
}

function renderTimezoneMap(features) {
  if (!timezoneMapContainer) {
    return;
  }

  timezoneMapRegionsByZone.clear();
  clearTimezoneMapSelection();

  timezoneMapContainer.innerHTML = '';

  if (!Array.isArray(features) || !features.length) {
    const fallback = document.createElement('p');
    fallback.className = 'timezone-map-placeholder';
    fallback.textContent = 'Map unavailable. Use the selectors to choose a time zone.';
    timezoneMapContainer.append(fallback);
    return;
  }

  const width = 800;
  const height = 400;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('class', 'timezone-map-canvas');
  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-label', 'Selectable time zones');

  const basemap = document.createElementNS('http://www.w3.org/2000/svg', 'image');
  basemap.setAttribute('href', WORLD_BASEMAP_URL);
  basemap.setAttribute('class', 'timezone-map-basemap');
  basemap.setAttribute('x', '0');
  basemap.setAttribute('y', '0');
  basemap.setAttribute('width', String(width));
  basemap.setAttribute('height', String(height));
  basemap.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.append(basemap);

  for (const feature of features) {
    if (!feature || !feature.id) {
      continue;
    }

    const region = createMapRegionElement(feature, width, height);
    if (!region) {
      continue;
    }

    region.classList.add('timezone-map-region');
    region.dataset.zone = feature.id;
    region.setAttribute('tabindex', '0');
    region.setAttribute('role', 'button');

    const label = feature.properties?.label || getMapZoneLabel(feature.id);
    region.setAttribute('aria-label', label);

    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = label;
    region.append(title);

    region.addEventListener('click', (event) => {
      event.preventDefault();
      handleMapRegionActivate(feature.id);
    });

    region.addEventListener('keydown', (event) => {
      const isSpace = event.key === ' ' || event.key === 'Spacebar' || event.key === 'Space';
      if (event.key === 'Enter' || isSpace) {
        event.preventDefault();
        handleMapRegionActivate(feature.id, { focusInput: isSpace });
      }
    });

    region.addEventListener('focus', () => {
      announceTimezoneSelection(`${label}. Press Enter to select this time zone.`);
    });

    region.addEventListener('blur', () => {
      if (activeTimezoneMapRegion) {
        const activeZone = activeTimezoneMapRegion.dataset.zone;
        const selection = formatMapSelection(activeZone);
        if (selection) {
          announceTimezoneSelection(`Time zone set to ${selection}.`);
        } else {
          announceTimezoneSelection('');
        }
      } else {
        announceTimezoneSelection('');
      }
    });

    timezoneMapRegionsByZone.set(feature.id, region);
    svg.append(region);
  }

  timezoneMapContainer.append(svg);
}

async function initializeTimezoneMap(metadataIndex) {
  if (!timezoneMapContainer) {
    return;
  }

  try {
    const geoData = await loadTimezoneGeoData();
    const features = Array.isArray(geoData?.features) ? geoData.features : [];
    const validZones = metadataIndex?.byZone ?? new Map();
    const filtered = features.filter((feature) => validZones.has(feature.id));
    renderTimezoneMap(filtered);

    const canonical = normalizeTimezone(timezoneInput?.value ?? '');
    if (canonical && validZones.has(canonical)) {
      setActiveTimezoneOnMap(canonical);
    }
  } catch (error) {
    console.warn('Unable to initialize time zone map', error);
    renderTimezoneMap([]);
  }
}

function updateRegionSelect(countryKey, selectedZone, { preserveValue = false } = {}) {
  if (!timezoneRegionSelect) {
    return;
  }

  const previousValue = preserveValue ? timezoneRegionSelect.value : '';

  timezoneRegionSelect.innerHTML = '';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select a region or time zone';
  timezoneRegionSelect.append(placeholder);

  if (!countryKey) {
    timezoneRegionSelect.disabled = true;
    timezoneRegionSelect.value = '';
    return;
  }

  const country = timezoneMetadataIndex?.countriesByKey.get(countryKey);
  if (!country) {
    timezoneRegionSelect.disabled = true;
    timezoneRegionSelect.value = '';
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const zone of country.directZones) {
    const option = document.createElement('option');
    option.value = zone.zone;
    option.textContent = zone.label;
    option.dataset.zone = zone.zone;
    fragment.append(option);
  }

  for (const subdivision of country.subdivisions) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = subdivision.label;
    for (const zone of subdivision.zones) {
      const option = document.createElement('option');
      option.value = zone.zone;
      option.textContent = zone.label;
      option.dataset.zone = zone.zone;
      optgroup.append(option);
    }
    fragment.append(optgroup);
  }

  timezoneRegionSelect.append(fragment);
  timezoneRegionSelect.disabled = false;

  const targetValue = selectedZone ?? (preserveValue ? previousValue : '');
  timezoneRegionSelect.value = targetValue;
}

function resetGeographicSelector() {
  if (!timezoneCountrySelect || !timezoneRegionSelect) {
    return;
  }

  timezoneCountrySelect.value = '';
  updateRegionSelect('', null);
  clearTimezoneMapSelection();
}

function populateGeographicSelector(metadataIndex) {
  if (!timezoneBrowseContainer || !timezoneCountrySelect || !timezoneRegionSelect) {
    return;
  }

  timezoneCountrySelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select a country or territory';
  timezoneCountrySelect.append(placeholder);

  for (const country of metadataIndex.countries) {
    const option = document.createElement('option');
    option.value = country.key;
    option.textContent = country.displayLabel;
    timezoneCountrySelect.append(option);
  }

  updateRegionSelect('', null);
  timezoneBrowseContainer.hidden = false;
}

function syncSelectorsToTimezone(zoneId) {
  if (!timezoneMetadataIndex || !zoneId) {
    resetGeographicSelector();
    return;
  }

  const zoneInfo = timezoneMetadataIndex.byZone.get(zoneId);
  if (!zoneInfo) {
    resetGeographicSelector();
    return;
  }

  const { countryKey } = zoneInfo;
  if (!countryKey) {
    resetGeographicSelector();
    return;
  }

  if (timezoneCountrySelect && timezoneCountrySelect.value !== countryKey) {
    timezoneCountrySelect.value = countryKey;
    updateRegionSelect(countryKey, zoneId);
  } else {
    updateRegionSelect(countryKey, zoneId, { preserveValue: true });
  }

  if (timezoneRegionSelect) {
    timezoneRegionSelect.value = zoneId;
  }

  setActiveTimezoneOnMap(zoneId);
}

function handleTimezoneCountryChange() {
  if (!timezoneMetadataIndex || !timezoneCountrySelect) {
    return;
  }

  const key = timezoneCountrySelect.value;
  updateRegionSelect(key, null);

  if (!key) {
    announceTimezoneSelection('Country selection cleared.');
    return;
  }

  const country = timezoneMetadataIndex.countriesByKey.get(key);
  if (country) {
    announceTimezoneSelection(
      `${country.displayLabel} selected. Choose a region or time zone to finish.`
    );
  }
}

function handleTimezoneRegionChange() {
  if (!timezoneMetadataIndex || !timezoneRegionSelect) {
    return;
  }

  const zoneId = timezoneRegionSelect.value;
  if (!zoneId) {
    announceTimezoneSelection('Region selection cleared.');
    return;
  }

  timezoneInput.value = zoneId;
  const selectionMessage = formatMapSelection(zoneId);
  if (selectionMessage) {
    announceTimezoneSelection(`Time zone set to ${selectionMessage}.`);
  }
  const changeEvent = new Event('change', { bubbles: false });
  timezoneInput.dispatchEvent(changeEvent);
}

function handleTimezoneInputLiveChange() {
  if (!timezoneMetadataIndex) {
    return;
  }

  const value = timezoneInput.value.trim();

  if (!value) {
    resetGeographicSelector();
    announceTimezoneSelection('Time zone field cleared.');
    return;
  }

  const canonical = normalizeTimezone(value);
  if (canonical && timezoneMetadataIndex.byZone.has(canonical)) {
    syncSelectorsToTimezone(canonical);
  }
}

const viewerTimezoneInfo = resolveViewerTimezone();

function populateTimezoneDatalist(zones, aliases, metadataByZone) {
  timezoneList.innerHTML = '';

  const fragment = document.createDocumentFragment();
  for (const zone of zones) {
    const option = document.createElement('option');
    const metadata = metadataByZone?.get(zone);
    const label = metadata?.label || metadata?.displayLabel || zone;
    option.value = zone;
    option.textContent = label;
    option.label = metadata ? `${label} (${zone})` : zone;
    option.dataset.zone = zone;
    fragment.append(option);
  }

  for (const [alias, canonical] of Object.entries(aliases)) {
    const option = document.createElement('option');
    option.value = alias;
    option.textContent = alias;
    const canonicalMeta = metadataByZone?.get(canonical);
    const canonicalLabel = canonicalMeta?.label || canonical;
    option.label = `${alias} (${canonicalLabel})`;
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

function updatePeopleFeedback(message, status = 'info') {
  if (!peopleFeedback) {
    return;
  }

  peopleFeedback.textContent = message;
  peopleFeedback.dataset.status = status;
}

function createDownload(filename, contents, mimeType = 'application/json') {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  const parent = document.body || document.documentElement;
  if (parent) {
    parent.append(anchor);
    anchor.click();
    anchor.remove();
  } else {
    anchor.click();
  }
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

async function exportPeopleRoster() {
  try {
    const reference = new Date();
    const sorted = getSortedPeople(reference, people);
    await setInStorage(STORAGE_KEYS.people, sorted);

    const serialized = JSON.stringify(sorted, null, 2);
    const timestamp = reference
      .toISOString()
      .replace(/[:]/g, '')
      .replace(/\..+$/, '');
    const filename = `teams-time-roster-${timestamp}.json`;

    createDownload(filename, serialized);
    updatePeopleFeedback(
      `Exported ${sorted.length} teammate${sorted.length === 1 ? '' : 's'}.`,
      'success'
    );
  } catch (error) {
    console.error('Unable to export teammates', error);
    updatePeopleFeedback('Unable to export roster. Please try again.', 'error');
  }
}

function normalizeImportedEntry(rawEntry) {
  if (!rawEntry || typeof rawEntry !== 'object') {
    return null;
  }

  const id = typeof rawEntry.id === 'string' ? rawEntry.id.trim() : '';
  const name = typeof rawEntry.name === 'string' ? rawEntry.name.trim() : '';
  const note = typeof rawEntry.note === 'string' ? rawEntry.note.trim() : '';
  const timezoneValue = typeof rawEntry.timezone === 'string' ? rawEntry.timezone.trim() : '';
  const canonicalTimezone = normalizeTimezone(timezoneValue);

  if (!id || !name || !canonicalTimezone) {
    return null;
  }

  if (!validateTimezone(canonicalTimezone)) {
    return null;
  }

  return {
    id,
    name,
    note,
    timezone: canonicalTimezone
  };
}

async function handlePeopleImport(file) {
  try {
    const text = await file.text();
    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (error) {
      updatePeopleFeedback('Import file is not valid JSON.', 'error');
      return;
    }

    let entries = [];
    let mode = 'merge';

    if (Array.isArray(parsed)) {
      entries = parsed;
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.people)) {
        entries = parsed.people;
      } else {
        updatePeopleFeedback('Import file must include a "people" array.', 'error');
        return;
      }

      if (typeof parsed.mode === 'string' && parsed.mode.toLowerCase() === 'replace') {
        mode = 'replace';
      }
    } else {
      updatePeopleFeedback('Import file does not match the expected format.', 'error');
      return;
    }

    const normalizedEntries = [];
    let skipped = 0;

    for (const entry of entries) {
      const normalized = normalizeImportedEntry(entry);
      if (normalized) {
        normalizedEntries.push(normalized);
      } else {
        skipped += 1;
      }
    }

    if (!normalizedEntries.length) {
      updatePeopleFeedback('No valid teammates found in the import file.', 'error');
      return;
    }

    let nextPeople;
    if (mode === 'replace') {
      nextPeople = normalizedEntries;
    } else {
      const merged = new Map(people.map((person) => [person.id, person]));
      for (const entry of normalizedEntries) {
        merged.set(entry.id, entry);
      }
      nextPeople = Array.from(merged.values());
    }

    const reference = new Date();
    const sorted = getSortedPeople(reference, nextPeople);
    people = sorted;
    await setInStorage(STORAGE_KEYS.people, people);
    renderPeople(reference, people);

    const summaryParts = [`Imported ${normalizedEntries.length} teammate${normalizedEntries.length === 1 ? '' : 's'}`];
    if (mode === 'replace') {
      summaryParts.push('and replaced the current roster');
    } else {
      summaryParts.push('and merged with existing teammates');
    }
    if (skipped > 0) {
      summaryParts.push(`(${skipped} entr${skipped === 1 ? 'y was' : 'ies were'} skipped)`);
    }

    updatePeopleFeedback(`${summaryParts.join(' ')}.`, 'success');
  } catch (error) {
    console.error('Unable to import teammates', error);
    updatePeopleFeedback('Unable to import roster. Check the file and try again.', 'error');
  } finally {
    if (peopleImportInput) {
      peopleImportInput.value = '';
    }
  }
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

if (peopleExportButton) {
  peopleExportButton.addEventListener('click', () => {
    exportPeopleRoster();
  });
}

if (peopleImportButton && peopleImportInput) {
  peopleImportButton.addEventListener('click', () => {
    peopleImportInput.click();
  });

  peopleImportInput.addEventListener('change', (event) => {
    const input = event.target;
    const files = input?.files;
    const file = files && files.length ? files[0] : null;

    if (!file) {
      return;
    }

    updatePeopleFeedback('Importing roster…');
    handlePeopleImport(file);
  });
}

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

  const zoneList = Array.isArray(zones) ? zones : [];
  const metadataResponse = await loadTimezoneMetadata(zoneList);
  timezoneMetadataIndex = buildTimezoneMetadataIndex(
    metadataResponse ?? FALLBACK_TIMEZONE_METADATA
  );

  populateTimezoneDatalist(
    zoneList,
    FALLBACK_TIMEZONE_ALIASES,
    timezoneMetadataIndex.byZone
  );

  if (timezoneMetadataIndex.countries.length) {
    populateGeographicSelector(timezoneMetadataIndex);
    if (timezoneInput?.value) {
      const canonical = normalizeTimezone(timezoneInput.value);
      if (canonical && timezoneMetadataIndex.byZone.has(canonical)) {
        syncSelectorsToTimezone(canonical);
      }
    }
  } else if (timezoneBrowseContainer) {
    timezoneBrowseContainer.hidden = true;
  }

  await initializeTimezoneMap(timezoneMetadataIndex);

  const storedList = Array.isArray(storedPeople) ? storedPeople : [];
  const initializationReference = new Date();
  const normalizedPeople = getSortedPeople(initializationReference, storedList);

  people = normalizedPeople;
  settings = { ...DEFAULT_SETTINGS, ...(storedSettings ?? {}) };

  if (JSON.stringify(storedList) !== JSON.stringify(normalizedPeople)) {
    await setInStorage(STORAGE_KEYS.people, people);
  }

  hourFormatSelect.value = settings.hour12 ? '12' : '24';
  renderPeople(initializationReference, people);

  if (timelineSection && timelineRows) {
    startTimelineRefresh();
  }
}

timezoneInput.addEventListener('input', handleTimezoneInputLiveChange);

timezoneInput.addEventListener('change', () => {
  const canonical = normalizeTimezone(timezoneInput.value);
  if (canonical) {
    timezoneInput.value = canonical;
    if (timezoneMetadataIndex?.byZone?.has(canonical)) {
      syncSelectorsToTimezone(canonical);
    }
  } else if (timezoneMetadataIndex) {
    resetGeographicSelector();
  }
});

timezoneInput.addEventListener('blur', () => {
  const canonical = normalizeTimezone(timezoneInput.value);
  if (canonical) {
    timezoneInput.value = canonical;
    if (timezoneMetadataIndex?.byZone?.has(canonical)) {
      syncSelectorsToTimezone(canonical);
    }
  } else if (timezoneMetadataIndex) {
    resetGeographicSelector();
  }
});

if (timezoneCountrySelect) {
  timezoneCountrySelect.addEventListener('change', handleTimezoneCountryChange);
}

if (timezoneRegionSelect) {
  timezoneRegionSelect.addEventListener('change', handleTimezoneRegionChange);
}

initialize();
