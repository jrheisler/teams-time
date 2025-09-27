import timezones from './timezones-data.js';

const manualAliases = {
  'Alexandria Egypt': 'Africa/Cairo',
  Alexandria: 'Africa/Cairo',
  Belgium: 'Europe/Brussels',
  Bishkek: 'Asia/Bishkek',
  Uzbekistan: 'Asia/Tashkent'
};

function toFriendlySegment(segment) {
  return segment.replace(/_/g, ' ');
}

const americaAliases = {};

for (const zone of timezones) {
  if (!zone.startsWith('America/')) {
    continue;
  }

  const segments = zone.split('/').slice(1);
  if (!segments.length) {
    continue;
  }

  const friendlySegments = segments.map(toFriendlySegment);
  const fullAlias = friendlySegments.join(', ');
  const primaryAlias = friendlySegments[friendlySegments.length - 1];

  if (fullAlias && !americaAliases[fullAlias] && !manualAliases[fullAlias]) {
    americaAliases[fullAlias] = zone;
  }

  if (
    primaryAlias &&
    !americaAliases[primaryAlias] &&
    !manualAliases[primaryAlias]
  ) {
    americaAliases[primaryAlias] = zone;
  }
}

const timezoneAliases = {
  ...americaAliases,
  ...manualAliases
};

export default timezoneAliases;
