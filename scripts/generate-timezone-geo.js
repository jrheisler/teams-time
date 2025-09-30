#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const zones = require('../timezones.json');

const regionBounds = {
  Africa: { minLon: -20, maxLon: 55, minLat: -35, maxLat: 35, columns: 9 },
  America: { minLon: -170, maxLon: -30, minLat: -60, maxLat: 70, columns: 14 },
  Antarctica: { minLon: -180, maxLon: 180, minLat: -90, maxLat: -60, columns: 4 },
  Arctic: { minLon: -180, maxLon: 180, minLat: 60, maxLat: 85, columns: 2 },
  Asia: { minLon: 55, maxLon: 150, minLat: -15, maxLat: 75, columns: 11 },
  Atlantic: { minLon: -60, maxLon: -15, minLat: -50, maxLat: 65, columns: 4 },
  Australia: { minLon: 110, maxLon: 160, minLat: -45, maxLat: -10, columns: 4 },
  Europe: { minLon: -25, maxLon: 45, minLat: 32, maxLat: 72, columns: 8 },
  Indian: { minLon: 40, maxLon: 110, minLat: -40, maxLat: 25, columns: 5 },
  Pacific: { minLon: -180, maxLon: -110, minLat: -50, maxLat: 35, columns: 7 }
};

const counts = new Map();
for (const zone of zones) {
  const [prefix] = zone.split('/');
  counts.set(prefix, (counts.get(prefix) || 0) + 1);
}

const positions = new Map();

function wrapLongitude(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const normalized = ((value + 180) % 360 + 360) % 360 - 180;
  return normalized;
}

const features = zones.map((zone) => {
  const [prefix] = zone.split('/');
  const bounds = regionBounds[prefix] || {
    minLon: -180,
    maxLon: 180,
    minLat: -90,
    maxLat: 90,
    columns: Math.ceil(Math.sqrt(counts.get(prefix) || 1)) || 1
  };
  const count = counts.get(prefix) || 1;
  const index = positions.get(prefix) || 0;
  const columns = bounds.columns || Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);
  const col = index % columns;
  const row = Math.floor(index / columns);

  const lonSpan = bounds.maxLon - bounds.minLon;
  const latSpan = bounds.maxLat - bounds.minLat;

  const longitude = wrapLongitude(
    bounds.minLon + ((col + 0.5) / columns) * lonSpan
  );
  const latitude = Math.max(
    -90,
    Math.min(90, bounds.maxLat - ((row + 0.5) / rows) * latSpan)
  );

  positions.set(prefix, index + 1);

  return {
    id: zone,
    properties: { label: zone },
    geometry: {
      type: 'Point',
      coordinates: [Number(longitude.toFixed(6)), Number(latitude.toFixed(6))]
    }
  };
});

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
