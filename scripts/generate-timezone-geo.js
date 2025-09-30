#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const zones = require('../timezones.json');

const DATA_DIRECTORY = path.resolve(__dirname, 'data');
const DATA_FILES = ['zone1970.tab', 'zone.tab'];

function readDataFile(fileName) {
  const filePath = path.resolve(DATA_DIRECTORY, fileName);
  return fs.readFileSync(filePath, 'utf8');
}

function parseDms(part, degreeDigits) {
  if (!part) {
    return null;
  }

  const sign = part.startsWith('-') ? -1 : 1;
  const digits = part.slice(1);
  if (!digits.length) {
    return null;
  }

  const degrees = Number.parseInt(digits.slice(0, degreeDigits), 10);
  const minutes = Number.parseInt(digits.slice(degreeDigits, degreeDigits + 2) || '0', 10);
  const seconds = Number.parseInt(digits.slice(degreeDigits + 2, degreeDigits + 4) || '0', 10);

  if (Number.isNaN(degrees) || Number.isNaN(minutes) || Number.isNaN(seconds)) {
    return null;
  }

  const absolute = degrees + minutes / 60 + seconds / 3600;
  return sign * absolute;
}

function parseCoordinatePair(raw) {
  if (typeof raw !== 'string' || raw.length < 2) {
    return null;
  }

  let splitIndex = 1;
  while (splitIndex < raw.length) {
    const character = raw[splitIndex];
    if (character === '+' || character === '-') {
      break;
    }
    splitIndex += 1;
  }

  const latitudePart = raw.slice(0, splitIndex);
  const longitudePart = raw.slice(splitIndex);
  if (!latitudePart || !longitudePart) {
    return null;
  }

  const latitude = parseDms(latitudePart, 2);
  const longitude = parseDms(longitudePart, 3);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

function loadCoordinatesIndex() {
  const index = new Map();

  for (const fileName of DATA_FILES) {
    let contents;
    try {
      contents = readDataFile(fileName);
    } catch (error) {
      console.warn(`Unable to read ${fileName}:`, error.message);
      continue;
    }

    const lines = contents.split(/\r?\n/);
    for (const line of lines) {
      if (!line || line.startsWith('#')) {
        continue;
      }

      const [territories, coordinateString, zone] = line.split('\t');
      if (!coordinateString || !zone) {
        continue;
      }

      if (index.has(zone)) {
        continue;
      }

      const coordinates = parseCoordinatePair(coordinateString.trim());
      if (!coordinates) {
        continue;
      }

      index.set(zone, coordinates);
    }
  }

  return index;
}

function normalizeLongitude(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return ((value + 180) % 360 + 360) % 360 - 180;
}

function clampLatitude(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(90, Math.max(-90, value));
}

const coordinateIndex = loadCoordinatesIndex();

const coordinateAliases = new Map([
  ['Africa/Asmera', 'Africa/Asmara'],
  ['America/Buenos_Aires', 'America/Argentina/Buenos_Aires'],
  ['America/Catamarca', 'America/Argentina/Catamarca'],
  ['America/Coral_Harbour', 'America/Atikokan'],
  ['America/Cordoba', 'America/Argentina/Cordoba'],
  ['America/Godthab', 'America/Nuuk'],
  ['America/Indianapolis', 'America/Indiana/Indianapolis'],
  ['America/Jujuy', 'America/Argentina/Jujuy'],
  ['America/Louisville', 'America/Kentucky/Louisville'],
  ['America/Mendoza', 'America/Argentina/Mendoza'],
  ['Asia/Calcutta', 'Asia/Kolkata'],
  ['Asia/Katmandu', 'Asia/Kathmandu'],
  ['Asia/Rangoon', 'Asia/Yangon'],
  ['Asia/Saigon', 'Asia/Ho_Chi_Minh'],
  ['Atlantic/Faeroe', 'Atlantic/Faroe'],
  ['Europe/Kiev', 'Europe/Kyiv'],
  ['Pacific/Enderbury', 'Pacific/Kanton'],
  ['Pacific/Ponape', 'Pacific/Pohnpei'],
  ['Pacific/Truk', 'Pacific/Chuuk']
]);

function resolveCoordinates(zone) {
  const visited = new Set();
  let current = zone;

  while (current && !visited.has(current)) {
    visited.add(current);

    const direct = coordinateIndex.get(current);
    if (direct) {
      return direct;
    }

    const alias = coordinateAliases.get(current);
    current = alias;
  }

  return null;
}

const unresolvedZones = [];

const features = zones
  .map((zone) => {
    const coordinates = resolveCoordinates(zone);
    if (!coordinates) {
      unresolvedZones.push(zone);
      return null;
    }

    const longitude = normalizeLongitude(coordinates.longitude);
    const latitude = clampLatitude(coordinates.latitude);

    return {
      id: zone,
      properties: { label: zone },
      geometry: {
        type: 'Point',
        coordinates: [
          Number(longitude.toFixed(6)),
          Number(latitude.toFixed(6))
        ]
      }
    };
  })
  .filter(Boolean);

if (unresolvedZones.length) {
  console.warn('Missing coordinates for zones:', unresolvedZones.join(', '));
}

const featureCollection = {
  type: 'FeatureCollection',
  features
};

const outputPath = path.resolve(__dirname, '..', 'timezones-geo.json');
fs.writeFileSync(outputPath, `${JSON.stringify(featureCollection, null, 2)}\n`);

const fallbackModulePath = path.resolve(
  __dirname,
  '..',
  'timezones-geo-fallback.js'
);
const fallbackModuleSource = `const timezoneGeoData = ${JSON.stringify(
  featureCollection,
  null,
  2
)};\n\nexport default timezoneGeoData;\n`;
fs.writeFileSync(fallbackModulePath, fallbackModuleSource);

console.log(
  `Wrote ${features.length} features to ${outputPath} and ${fallbackModulePath}`
);
