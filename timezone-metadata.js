import timezones from './timezones-data.js';

const runtime = typeof chrome !== 'undefined' ? chrome : undefined;
let cachedMetadata = null;
let metadataPromise = null;

function toFriendlySegment(segment) {
  return segment
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function buildDisplayLabel(zone) {
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

  return {
    zone,
    territory: friendlyTerritory,
    country,
    subdivision,
    displayLabel,
    coordinates: null
  };
}

export function createFallbackMetadata(zoneList = timezones) {
  const metadata = {};
  const zones = Array.isArray(zoneList) ? zoneList : [];

  for (const zone of zones) {
    if (typeof zone !== 'string') {
      continue;
    }
    metadata[zone] = buildDisplayLabel(zone);
  }

  return metadata;
}

function resolveFallbackMetadata(zoneList) {
  if (Array.isArray(zoneList) && zoneList.length) {
    return createFallbackMetadata(zoneList);
  }
  return createFallbackMetadata(timezones);
}

function getMetadataUrl() {
  if (runtime?.runtime?.getURL) {
    return runtime.runtime.getURL('timezones-meta.json');
  }
  return new URL('./timezones-meta.json', import.meta.url).toString();
}

export async function loadTimezoneMetadata(zoneList) {
  if (cachedMetadata) {
    return cachedMetadata;
  }
  if (!metadataPromise) {
    const fallbackMetadata = resolveFallbackMetadata(zoneList);
    const url = getMetadataUrl();

    metadataPromise = fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load metadata: ${response.status}`);
        }
        return response.json();
      })
      .then((metadata) => {
        if (metadata && typeof metadata === 'object') {
          cachedMetadata = metadata;
        } else {
          cachedMetadata = fallbackMetadata;
        }
        return cachedMetadata;
      })
      .catch((error) => {
        console.warn('Unable to load time zone metadata', error);
        cachedMetadata = fallbackMetadata;
        return cachedMetadata;
      });
  }

  return metadataPromise;
}

const offsetCache = new Map();

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

function formatOffset(offsetMinutes) {
  if (!Number.isFinite(offsetMinutes)) {
    return '';
  }
  const sign = offsetMinutes < 0 ? '\u2212' : '+';
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteMinutes / 60);
  const minutes = absoluteMinutes % 60;
  const paddedHours = String(hours).padStart(2, '0');
  const paddedMinutes = String(minutes).padStart(2, '0');
  return `UTC${sign}${paddedHours}:${paddedMinutes}`;
}

function resolveMetadata(metadata) {
  if (metadata && typeof metadata === 'object') {
    return metadata;
  }
  if (cachedMetadata) {
    return cachedMetadata;
  }
  return null;
}

export function getDisplayLabel(zoneId, { includeOffset = false, metadata } = {}) {
  if (!zoneId) {
    return '';
  }

  const sourceMetadata = resolveMetadata(metadata);
  const entry = sourceMetadata?.[zoneId];
  const baseLabel = entry?.displayLabel || entry?.country || zoneId;

  if (!includeOffset) {
    return baseLabel;
  }

  const now = new Date();
  const cacheKey = `${zoneId}::${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}`;
  let offsetLabel = offsetCache.get(cacheKey);
  if (!offsetLabel) {
    const offsetMinutes = getTimezoneOffsetMinutes(now, zoneId);
    offsetLabel = formatOffset(offsetMinutes);
    offsetCache.set(cacheKey, offsetLabel);
  }

  return offsetLabel ? `${baseLabel} • ${offsetLabel}` : baseLabel;
}

export function getCachedTimezoneMetadata() {
  return cachedMetadata;
}
