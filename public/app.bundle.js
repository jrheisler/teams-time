(() => {
  'use strict';

  const TIMEZONE_IDS = [
    "Africa/Abidjan",
    "Africa/Accra",
    "Africa/Addis_Ababa",
    "Africa/Algiers",
    "Africa/Asmera",
    "Africa/Bamako",
    "Africa/Bangui",
    "Africa/Banjul",
    "Africa/Bissau",
    "Africa/Blantyre",
    "Africa/Brazzaville",
    "Africa/Bujumbura",
    "Africa/Cairo",
    "Africa/Casablanca",
    "Africa/Ceuta",
    "Africa/Conakry",
    "Africa/Dakar",
    "Africa/Dar_es_Salaam",
    "Africa/Djibouti",
    "Africa/Douala",
    "Africa/El_Aaiun",
    "Africa/Freetown",
    "Africa/Gaborone",
    "Africa/Harare",
    "Africa/Johannesburg",
    "Africa/Juba",
    "Africa/Kampala",
    "Africa/Khartoum",
    "Africa/Kigali",
    "Africa/Kinshasa",
    "Africa/Lagos",
    "Africa/Libreville",
    "Africa/Lome",
    "Africa/Luanda",
    "Africa/Lubumbashi",
    "Africa/Lusaka",
    "Africa/Malabo",
    "Africa/Maputo",
    "Africa/Maseru",
    "Africa/Mbabane",
    "Africa/Mogadishu",
    "Africa/Monrovia",
    "Africa/Nairobi",
    "Africa/Ndjamena",
    "Africa/Niamey",
    "Africa/Nouakchott",
    "Africa/Ouagadougou",
    "Africa/Porto-Novo",
    "Africa/Sao_Tome",
    "Africa/Tripoli",
    "Africa/Tunis",
    "Africa/Windhoek",
    "America/Adak",
    "America/Anchorage",
    "America/Anguilla",
    "America/Antigua",
    "America/Araguaina",
    "America/Argentina/La_Rioja",
    "America/Argentina/Rio_Gallegos",
    "America/Argentina/Salta",
    "America/Argentina/San_Juan",
    "America/Argentina/San_Luis",
    "America/Argentina/Tucuman",
    "America/Argentina/Ushuaia",
    "America/Aruba",
    "America/Asuncion",
    "America/Bahia",
    "America/Bahia_Banderas",
    "America/Barbados",
    "America/Belem",
    "America/Belize",
    "America/Blanc-Sablon",
    "America/Boa_Vista",
    "America/Bogota",
    "America/Boise",
    "America/Buenos_Aires",
    "America/Cambridge_Bay",
    "America/Campo_Grande",
    "America/Cancun",
    "America/Caracas",
    "America/Catamarca",
    "America/Cayenne",
    "America/Cayman",
    "America/Chicago",
    "America/Chihuahua",
    "America/Ciudad_Juarez",
    "America/Coral_Harbour",
    "America/Cordoba",
    "America/Costa_Rica",
    "America/Coyhaique",
    "America/Creston",
    "America/Cuiaba",
    "America/Curacao",
    "America/Danmarkshavn",
    "America/Dawson",
    "America/Dawson_Creek",
    "America/Denver",
    "America/Detroit",
    "America/Dominica",
    "America/Edmonton",
    "America/Eirunepe",
    "America/El_Salvador",
    "America/Fort_Nelson",
    "America/Fortaleza",
    "America/Glace_Bay",
    "America/Godthab",
    "America/Goose_Bay",
    "America/Grand_Turk",
    "America/Grenada",
    "America/Guadeloupe",
    "America/Guatemala",
    "America/Guayaquil",
    "America/Guyana",
    "America/Halifax",
    "America/Havana",
    "America/Hermosillo",
    "America/Indiana/Knox",
    "America/Indiana/Marengo",
    "America/Indiana/Petersburg",
    "America/Indiana/Tell_City",
    "America/Indiana/Vevay",
    "America/Indiana/Vincennes",
    "America/Indiana/Winamac",
    "America/Indianapolis",
    "America/Inuvik",
    "America/Iqaluit",
    "America/Jamaica",
    "America/Jujuy",
    "America/Juneau",
    "America/Kentucky/Monticello",
    "America/Kralendijk",
    "America/La_Paz",
    "America/Lima",
    "America/Los_Angeles",
    "America/Louisville",
    "America/Lower_Princes",
    "America/Maceio",
    "America/Managua",
    "America/Manaus",
    "America/Marigot",
    "America/Martinique",
    "America/Matamoros",
    "America/Mazatlan",
    "America/Mendoza",
    "America/Menominee",
    "America/Merida",
    "America/Metlakatla",
    "America/Mexico_City",
    "America/Miquelon",
    "America/Moncton",
    "America/Monterrey",
    "America/Montevideo",
    "America/Montserrat",
    "America/Nassau",
    "America/New_York",
    "America/Nome",
    "America/Noronha",
    "America/North_Dakota/Beulah",
    "America/North_Dakota/Center",
    "America/North_Dakota/New_Salem",
    "America/Ojinaga",
    "America/Panama",
    "America/Paramaribo",
    "America/Phoenix",
    "America/Port-au-Prince",
    "America/Port_of_Spain",
    "America/Porto_Velho",
    "America/Puerto_Rico",
    "America/Punta_Arenas",
    "America/Rankin_Inlet",
    "America/Recife",
    "America/Regina",
    "America/Resolute",
    "America/Rio_Branco",
    "America/Santarem",
    "America/Santiago",
    "America/Santo_Domingo",
    "America/Sao_Paulo",
    "America/Scoresbysund",
    "America/Sitka",
    "America/St_Barthelemy",
    "America/St_Johns",
    "America/St_Kitts",
    "America/St_Lucia",
    "America/St_Thomas",
    "America/St_Vincent",
    "America/Swift_Current",
    "America/Tegucigalpa",
    "America/Thule",
    "America/Tijuana",
    "America/Toronto",
    "America/Tortola",
    "America/Vancouver",
    "America/Whitehorse",
    "America/Winnipeg",
    "America/Yakutat",
    "Antarctica/Casey",
    "Antarctica/Davis",
    "Antarctica/DumontDUrville",
    "Antarctica/Macquarie",
    "Antarctica/Mawson",
    "Antarctica/McMurdo",
    "Antarctica/Palmer",
    "Antarctica/Rothera",
    "Antarctica/Syowa",
    "Antarctica/Troll",
    "Antarctica/Vostok",
    "Arctic/Longyearbyen",
    "Asia/Aden",
    "Asia/Almaty",
    "Asia/Amman",
    "Asia/Anadyr",
    "Asia/Aqtau",
    "Asia/Aqtobe",
    "Asia/Ashgabat",
    "Asia/Atyrau",
    "Asia/Baghdad",
    "Asia/Bahrain",
    "Asia/Baku",
    "Asia/Bangkok",
    "Asia/Barnaul",
    "Asia/Beirut",
    "Asia/Bishkek",
    "Asia/Brunei",
    "Asia/Calcutta",
    "Asia/Chita",
    "Asia/Colombo",
    "Asia/Damascus",
    "Asia/Dhaka",
    "Asia/Dili",
    "Asia/Dubai",
    "Asia/Dushanbe",
    "Asia/Famagusta",
    "Asia/Gaza",
    "Asia/Hebron",
    "Asia/Hong_Kong",
    "Asia/Hovd",
    "Asia/Irkutsk",
    "Asia/Jakarta",
    "Asia/Jayapura",
    "Asia/Jerusalem",
    "Asia/Kabul",
    "Asia/Kamchatka",
    "Asia/Karachi",
    "Asia/Katmandu",
    "Asia/Khandyga",
    "Asia/Krasnoyarsk",
    "Asia/Kuala_Lumpur",
    "Asia/Kuching",
    "Asia/Kuwait",
    "Asia/Macau",
    "Asia/Magadan",
    "Asia/Makassar",
    "Asia/Manila",
    "Asia/Muscat",
    "Asia/Nicosia",
    "Asia/Novokuznetsk",
    "Asia/Novosibirsk",
    "Asia/Omsk",
    "Asia/Oral",
    "Asia/Phnom_Penh",
    "Asia/Pontianak",
    "Asia/Pyongyang",
    "Asia/Qatar",
    "Asia/Qostanay",
    "Asia/Qyzylorda",
    "Asia/Rangoon",
    "Asia/Riyadh",
    "Asia/Saigon",
    "Asia/Sakhalin",
    "Asia/Samarkand",
    "Asia/Seoul",
    "Asia/Shanghai",
    "Asia/Singapore",
    "Asia/Srednekolymsk",
    "Asia/Taipei",
    "Asia/Tashkent",
    "Asia/Tbilisi",
    "Asia/Tehran",
    "Asia/Thimphu",
    "Asia/Tokyo",
    "Asia/Tomsk",
    "Asia/Ulaanbaatar",
    "Asia/Urumqi",
    "Asia/Ust-Nera",
    "Asia/Vientiane",
    "Asia/Vladivostok",
    "Asia/Yakutsk",
    "Asia/Yekaterinburg",
    "Asia/Yerevan",
    "Atlantic/Azores",
    "Atlantic/Bermuda",
    "Atlantic/Canary",
    "Atlantic/Cape_Verde",
    "Atlantic/Faeroe",
    "Atlantic/Madeira",
    "Atlantic/Reykjavik",
    "Atlantic/South_Georgia",
    "Atlantic/St_Helena",
    "Atlantic/Stanley",
    "Australia/Adelaide",
    "Australia/Brisbane",
    "Australia/Broken_Hill",
    "Australia/Darwin",
    "Australia/Eucla",
    "Australia/Hobart",
    "Australia/Lindeman",
    "Australia/Lord_Howe",
    "Australia/Melbourne",
    "Australia/Perth",
    "Australia/Sydney",
    "Europe/Amsterdam",
    "Europe/Andorra",
    "Europe/Astrakhan",
    "Europe/Athens",
    "Europe/Belgrade",
    "Europe/Berlin",
    "Europe/Bratislava",
    "Europe/Brussels",
    "Europe/Bucharest",
    "Europe/Budapest",
    "Europe/Busingen",
    "Europe/Chisinau",
    "Europe/Copenhagen",
    "Europe/Dublin",
    "Europe/Gibraltar",
    "Europe/Guernsey",
    "Europe/Helsinki",
    "Europe/Isle_of_Man",
    "Europe/Istanbul",
    "Europe/Jersey",
    "Europe/Kaliningrad",
    "Europe/Kiev",
    "Europe/Kirov",
    "Europe/Lisbon",
    "Europe/Ljubljana",
    "Europe/London",
    "Europe/Luxembourg",
    "Europe/Madrid",
    "Europe/Malta",
    "Europe/Mariehamn",
    "Europe/Minsk",
    "Europe/Monaco",
    "Europe/Moscow",
    "Europe/Oslo",
    "Europe/Paris",
    "Europe/Podgorica",
    "Europe/Prague",
    "Europe/Riga",
    "Europe/Rome",
    "Europe/Samara",
    "Europe/San_Marino",
    "Europe/Sarajevo",
    "Europe/Saratov",
    "Europe/Simferopol",
    "Europe/Skopje",
    "Europe/Sofia",
    "Europe/Stockholm",
    "Europe/Tallinn",
    "Europe/Tirane",
    "Europe/Ulyanovsk",
    "Europe/Vaduz",
    "Europe/Vatican",
    "Europe/Vienna",
    "Europe/Vilnius",
    "Europe/Volgograd",
    "Europe/Warsaw",
    "Europe/Zagreb",
    "Europe/Zurich",
    "Indian/Antananarivo",
    "Indian/Chagos",
    "Indian/Christmas",
    "Indian/Cocos",
    "Indian/Comoro",
    "Indian/Kerguelen",
    "Indian/Mahe",
    "Indian/Maldives",
    "Indian/Mauritius",
    "Indian/Mayotte",
    "Indian/Reunion",
    "Pacific/Apia",
    "Pacific/Auckland",
    "Pacific/Bougainville",
    "Pacific/Chatham",
    "Pacific/Easter",
    "Pacific/Efate",
    "Pacific/Enderbury",
    "Pacific/Fakaofo",
    "Pacific/Fiji",
    "Pacific/Funafuti",
    "Pacific/Galapagos",
    "Pacific/Gambier",
    "Pacific/Guadalcanal",
    "Pacific/Guam",
    "Pacific/Honolulu",
    "Pacific/Kiritimati",
    "Pacific/Kosrae",
    "Pacific/Kwajalein",
    "Pacific/Majuro",
    "Pacific/Marquesas",
    "Pacific/Midway",
    "Pacific/Nauru",
    "Pacific/Niue",
    "Pacific/Norfolk",
    "Pacific/Noumea",
    "Pacific/Pago_Pago",
    "Pacific/Palau",
    "Pacific/Pitcairn",
    "Pacific/Ponape",
    "Pacific/Port_Moresby",
    "Pacific/Rarotonga",
    "Pacific/Saipan",
    "Pacific/Tahiti",
    "Pacific/Tarawa",
    "Pacific/Tongatapu",
    "Pacific/Truk",
    "Pacific/Wake",
    "Pacific/Wallis"
  ];

  const STORAGE_PREFIX = 'teams-time::';
  const memoryStore = new Map();

  function readStoredValue(key, fallback) {
    if (memoryStore.has(key)) {
      return memoryStore.get(key);
    }
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
        if (stored !== null) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.warn('Unable to read localStorage fallback', error);
      }
    }
    return fallback;
  }

  function writeStoredValue(key, value) {
    memoryStore.set(key, value);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
      } catch (error) {
        console.warn('Unable to persist to localStorage fallback', error);
      }
    }
  }

  function getStoredValue(key, fallback) {
    return Promise.resolve(readStoredValue(key, fallback));
  }

  function setStoredValue(key, value) {
    writeStoredValue(key, value);
    return Promise.resolve();
  }

  const formatterCache = new Map();

  function getFormatter(prefix, timeZone, options) {
    const zoneKey = timeZone ?? 'default';
    const optionsKey = options ? JSON.stringify(options) : 'default';
    const cacheKey = `${prefix}::${zoneKey}::${optionsKey}`;
    let formatter = formatterCache.get(cacheKey);
    if (!formatter) {
      const resolvedOptions = timeZone ? { ...options, timeZone } : { ...options };
      formatter = new Intl.DateTimeFormat(undefined, resolvedOptions);
      formatterCache.set(cacheKey, formatter);
    }
    return formatter;
  }

  function fmtIso(date, timeZone) {
    const formatter = getFormatter('iso', timeZone, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23'
    });
    const parts = formatter.formatToParts(date);
    const result = {};
    for (const part of parts) {
      if (part.type !== 'literal') {
        result[part.type] = part.value;
      }
    }
    const year = result.year ?? '0000';
    const month = result.month ?? '01';
    const day = result.day ?? '01';
    const hour = result.hour ?? '00';
    const minute = result.minute ?? '00';
    const second = result.second ?? '00';
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  }

  function ymd(date, timeZone) {
    const iso = fmtIso(date, timeZone);
    const [ymdPart] = iso.split('T');
    const [year, month, day] = ymdPart.split('-').map((value) => Number.parseInt(value, 10));
    return { year, month, day };
  }

  function fmtTime(date, timeZone, { hour12, hourCycle } = {}) {
    const formatterOptions = {
      hour: 'numeric',
      minute: '2-digit'
    };
    if (typeof hour12 === 'boolean') {
      formatterOptions.hour12 = hour12;
    }
    if (hourCycle) {
      formatterOptions.hourCycle = hourCycle;
    }
    const formatter = getFormatter('time', timeZone, formatterOptions);
    const parts = formatter.formatToParts(date);
    return parts
      .filter((part) =>
        part.type === 'hour' ||
        part.type === 'minute' ||
        part.type === 'dayPeriod' ||
        part.type === 'literal'
      )
      .map((part) => part.value)
      .join('');
  }

  function dayDelta(
    date,
    timeZone,
    baseTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  ) {
    const target = ymd(date, timeZone);
    const base = ymd(date, baseTimeZone);
    const targetUtc = Date.UTC(target.year, target.month - 1, target.day);
    const baseUtc = Date.UTC(base.year, base.month - 1, base.day);
    return Math.round((targetUtc - baseUtc) / 86400000);
  }

  function timeValue(date, timeZone) {
    const formatter = getFormatter('timeValue', timeZone, {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    });
    const parts = formatter.formatToParts(date);
    const values = {};
    for (const part of parts) {
      if (part.type === 'hour' || part.type === 'minute') {
        values[part.type] = part.value;
      }
    }
    const hour = values.hour ?? '00';
    const minute = values.minute ?? '00';
    return `${hour}:${minute}`;
  }

  const HTML_ESCAPE_PATTERN = /[&<>"']/g;
  const HTML_ESCAPE_LOOKUP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  function escapeHtml(value) {
    return String(value).replace(HTML_ESCAPE_PATTERN, (match) => HTML_ESCAPE_LOOKUP[match]);
  }

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
    const subdivision =
      friendlySegments.length > 1 ? friendlySegments.slice(1).join(', ') : null;
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

  function createMetadata(zoneList) {
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

  let cachedMetadata = null;

  function ensureMetadata(zoneList) {
    if (Array.isArray(zoneList) && zoneList.length) {
      return createMetadata(zoneList);
    }
    if (!cachedMetadata) {
      cachedMetadata = createMetadata(TIMEZONE_IDS);
    }
    return cachedMetadata;
  }

  function loadTimezoneMetadata(zoneList) {
    return Promise.resolve(ensureMetadata(zoneList));
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

  function getDisplayLabel(zoneId, { includeOffset = false, metadata } = {}) {
    if (!zoneId) {
      return '';
    }

    const sourceMetadata = metadata && typeof metadata === 'object'
      ? metadata
      : ensureMetadata();
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

  const DEFAULT_PEOPLE = [];
  const DEFAULT_SETTINGS = {
    sortMode: 'time',
    baseTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    hour12: true
  };
  const TIMELINE_REFRESH_INTERVAL = 5 * 60 * 1000;

  const tabListElement = document.getElementById('main-tablist');
  const tabElements = tabListElement
    ? Array.from(tabListElement.querySelectorAll('[role="tab"]'))
    : [];
  const tabPanelMap = new Map();
  let activeTabElement = null;
  let activePanelId = null;

  const currentTimeElement = document.getElementById('current-time');
  const rosterListElement = document.getElementById('roster-list');
  const overviewPeopleListElement = document.getElementById('overview-people-list');
  const teammateForm = document.getElementById('teammate-form');
  const teammateNameInput = document.getElementById('teammate-name');
  const teammateNoteInput = document.getElementById('teammate-note');
  const teammateTimezoneInput = document.getElementById('teammate-timezone');
  const timezoneListElement = document.getElementById('timezone-list');
  const hourFormatControl = document.getElementById('hour-format');
  const baseTimezoneControl = document.getElementById('base-timezone');
  const rosterImportButton = document.getElementById('roster-import');
  const rosterImportInput = document.getElementById('roster-import-input');
  const rosterExportButton = document.getElementById('roster-export');
  const rosterFeedbackElement = document.getElementById('roster-feedback');
  const timelineRowsElement = document.getElementById('timeline-rows');
  const viewerTimezoneInfo = resolveViewerTimezone();

  let state = {
    people: DEFAULT_PEOPLE,
    settings: DEFAULT_SETTINGS,
    metadata: null
  };
  let renderTimerId = null;
  let timelineRefreshIntervalId = null;
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

  function createTimelineRow(entry, referenceDate, options = {}) {
    const { hour12, metadata } = options;
    const personName =
      typeof entry?.name === 'string' && entry.name ? entry.name : 'Teammate';
    const note = typeof entry?.note === 'string' ? entry.note : '';
    const timezone = typeof entry?.timezone === 'string' ? entry.timezone : '';
    const trackLabel = entry?.trackLabel;
    const extraClass = entry?.extraClass;

    if (!timezone) {
      return null;
    }

    const resolvedHour12 =
      typeof hour12 === 'boolean'
        ? hour12
        : typeof state.settings.hour12 === 'boolean'
          ? state.settings.hour12
          : DEFAULT_SETTINGS.hour12;

    let hourFormatter;
    let dayLabelFormatter;
    let dayKeyFormatter;

    try {
      hourFormatter = new Intl.DateTimeFormat(undefined, {
        timeZone: timezone,
        hour: 'numeric',
        hour12: resolvedHour12
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
    nameElement.textContent = personName;
    personInfo.append(nameElement);

    if (note) {
      const noteElement = document.createElement('span');
      noteElement.className = 'timeline-person-note';
      noteElement.textContent = note;
      personInfo.append(noteElement);
    }

    const timezoneElement = document.createElement('span');
    timezoneElement.className = 'timeline-person-timezone';
    const timezoneLabel = getDisplayLabel(timezone, {
      includeOffset: true,
      metadata
    });
    timezoneElement.textContent = timezoneLabel;
    timezoneElement.dataset.zoneId = timezone;
    timezoneElement.title = timezone;
    if (timezoneLabel && timezoneLabel !== timezone) {
      timezoneElement.setAttribute(
        'aria-label',
        `${timezoneLabel} (${timezone})`
      );
    }
    personInfo.append(timezoneElement);

    const track = document.createElement('div');
    track.className = 'timeline-track';
    track.setAttribute('role', 'list');
    const accessibleLabel =
      typeof trackLabel === 'string' && trackLabel
        ? trackLabel
        : `${personName}'s next 24 hours`;
    track.setAttribute('aria-label', accessibleLabel);

    const baseDate = referenceDate instanceof Date ? referenceDate : new Date();
    let previousDayKey = null;

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
      hourElement.setAttribute(
        'aria-label',
        `${personName}: ${hourLabel} (${dayLabel})`
      );
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

  function renderTimeline(referenceDate, options = {}) {
    if (!timelineRowsElement) {
      return;
    }

    const now = referenceDate instanceof Date ? referenceDate : new Date();
    const metadata =
      options.metadata && typeof options.metadata === 'object'
        ? options.metadata
        : state.metadata;
    const hour12 =
      typeof options.hour12 === 'boolean'
        ? options.hour12
        : typeof state.settings.hour12 === 'boolean'
          ? state.settings.hour12
          : DEFAULT_SETTINGS.hour12;
    const sortMode =
      typeof options.sortMode === 'string' && options.sortMode
        ? options.sortMode
        : state.settings.sortMode || DEFAULT_SETTINGS.sortMode;

    timelineRowsElement.innerHTML = '';

    const viewerRow = createTimelineRow(
      {
        name: 'You',
        note: viewerTimezoneInfo.isFallback ? 'Defaulting to UTC' : 'Your local time',
        timezone: viewerTimezoneInfo.timezone,
        trackLabel: 'Your next 24 hours',
        extraClass: 'is-viewer'
      },
      now,
      { hour12, metadata }
    );

    if (viewerRow) {
      timelineRowsElement.append(viewerRow);
    }

    if (!state.people.length) {
      const message = document.createElement('div');
      message.className = 'empty-message';
      message.textContent = 'Timelines will appear after you add teammates.';
      message.setAttribute('role', 'listitem');
      timelineRowsElement.append(message);
      return;
    }

    const sorted = sortPeople(state.people, sortMode, now);

    for (const person of sorted) {
      const row = createTimelineRow(
        {
          name: person.name,
          note: person.note,
          timezone: person.timezone
        },
        now,
        { hour12, metadata }
      );

      if (row) {
        timelineRowsElement.append(row);
      }
    }
  }

  function startTimelineRefresh() {
    if (timelineRefreshIntervalId !== null) {
      return;
    }

    if (!timelineRowsElement || typeof window === 'undefined') {
      return;
    }

    timelineRefreshIntervalId = window.setInterval(() => {
      if (!isElementInActivePanel(timelineRowsElement)) {
        stopTimelineRefresh();
        return;
      }

      renderTimeline(new Date());
    }, TIMELINE_REFRESH_INTERVAL);
  }

  function stopTimelineRefresh() {
    if (timelineRefreshIntervalId !== null) {
      window.clearInterval(timelineRefreshIntervalId);
      timelineRefreshIntervalId = null;
    }
  }

  function isElementInActivePanel(element) {
    if (!element) {
      return false;
    }

    const panel = element.closest('[role="tabpanel"]');
    if (!panel) {
      return true;
    }

    if (panel.hasAttribute('hidden')) {
      return false;
    }

    if (!tabElements.length) {
      return true;
    }

    if (!activePanelId) {
      return true;
    }

    return panel.id === activePanelId;
  }

  function setActiveTab(nextTab, { focus = false } = {}) {
    if (!nextTab || !tabElements.includes(nextTab)) {
      return;
    }

    if (activeTabElement === nextTab) {
      if (focus) {
        nextTab.focus();
      }
      return;
    }

    activeTabElement = nextTab;
    const nextPanel = tabPanelMap.get(nextTab) || null;
    activePanelId = nextPanel?.id || null;

    for (const tabElement of tabElements) {
      const isSelected = tabElement === nextTab;
      tabElement.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      tabElement.setAttribute('tabindex', isSelected ? '0' : '-1');

      const panelElement = tabPanelMap.get(tabElement);
      if (!panelElement) {
        continue;
      }

      if (isSelected) {
        panelElement.removeAttribute('hidden');
      } else {
        panelElement.setAttribute('hidden', '');
      }
    }

    if (focus) {
      nextTab.focus();
    }
  }

  function setupTabInterface() {
    if (!tabElements.length) {
      return;
    }

    for (const tabElement of tabElements) {
      const panelId = tabElement.getAttribute('aria-controls');
      if (!panelId) {
        continue;
      }

      const panelElement = document.getElementById(panelId);
      if (panelElement) {
        tabPanelMap.set(tabElement, panelElement);
      }
    }

    let initialTab = tabElements.find(
      (tabElement) => tabElement.getAttribute('aria-selected') === 'true'
    );

    if (!initialTab) {
      [initialTab] = tabElements;
    }

    if (initialTab) {
      setActiveTab(initialTab);
    }

    for (const tabElement of tabElements) {
      tabElement.addEventListener('click', () => {
        setActiveTab(tabElement, { focus: true });
        render();
      });
    }
  }

  function renderCurrentTime(now, baseTimeZone, hour12) {
    if (!currentTimeElement) {
      return;
    }
    const currentTime = fmtTime(now, baseTimeZone, { hour12 });
    const timezoneLabel = baseTimeZone || 'Local time';
    currentTimeElement.innerHTML = `${escapeHtml(currentTime)} • ${escapeHtml(timezoneLabel)}`;
  }

  function renderRoster(now, baseTimeZone, sortMode, hour12, sortedPeople) {
    if (!rosterListElement) {
      return;
    }

    rosterListElement.innerHTML = '';

    const people = Array.isArray(sortedPeople)
      ? sortedPeople
      : sortPeople(state.people, sortMode, now);

    if (!people.length) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = 'No teammates added yet. Use the form above to add one.';
      rosterListElement.append(emptyMessage);
      return;
    }

    for (const person of people) {
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

  function renderOverviewRoster(now, baseTimeZone, sortMode, hour12, sortedPeople) {
    if (!overviewPeopleListElement) {
      return;
    }

    overviewPeopleListElement.innerHTML = '';

    const people = Array.isArray(sortedPeople)
      ? sortedPeople
      : sortPeople(state.people, sortMode, now);

    if (!people.length) {
      const empty = document.createElement('li');
      empty.className = 'people-list__empty';
      empty.textContent = 'Add teammates to see their local time here.';
      overviewPeopleListElement.append(empty);
      return;
    }

    for (const person of people) {
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
          timezoneElement.setAttribute('aria-label', `${timezoneLabel} (${person.timezone})`);
        }
      }

      overviewPeopleListElement.append(item);
    }
  }

  function render() {
    const now = new Date();
    const baseTimeZone = state.settings.baseTimeZone || DEFAULT_SETTINGS.baseTimeZone;
    const sortMode = state.settings.sortMode || DEFAULT_SETTINGS.sortMode;
    const hour12 =
      typeof state.settings.hour12 === 'boolean' ? state.settings.hour12 : DEFAULT_SETTINGS.hour12;
    const sortedPeople = sortPeople(state.people, sortMode, now);

    if (isElementInActivePanel(currentTimeElement)) {
      renderCurrentTime(now, baseTimeZone, hour12);
    }

    if (isElementInActivePanel(rosterListElement)) {
      renderRoster(now, baseTimeZone, sortMode, hour12, sortedPeople);
    }

    if (overviewPeopleListElement && isElementInActivePanel(overviewPeopleListElement)) {
      renderOverviewRoster(now, baseTimeZone, sortMode, hour12, sortedPeople);
    }

    if (timelineRowsElement) {
      if (isElementInActivePanel(timelineRowsElement)) {
        renderTimeline(now, { hour12, sortMode, metadata: state.metadata });
        startTimelineRefresh();
      } else {
        stopTimelineRefresh();
      }
    }
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

  function setRosterFeedback(message, status) {
    if (!rosterFeedbackElement) {
      return;
    }

    rosterFeedbackElement.textContent = message || '';

    if (status) {
      rosterFeedbackElement.dataset.status = status;
    } else {
      delete rosterFeedbackElement.dataset.status;
    }
  }

  function resetRosterImportInput() {
    if (rosterImportInput) {
      rosterImportInput.value = '';
    }
  }

  function formatList(items) {
    if (!items.length) {
      return '';
    }

    if (items.length === 1) {
      return items[0];
    }

    const initial = items.slice(0, -1);
    const last = items[items.length - 1];

    if (initial.length === 1) {
      return `${initial[0]} and ${last}`;
    }

    return `${initial.join(', ')}, and ${last}`;
  }

  function readFileText(file) {
    if (!file) {
      return Promise.resolve('');
    }

    if (typeof file.text === 'function') {
      return file.text();
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        resolve(typeof result === 'string' ? result : String(result ?? ''));
      };
      reader.onerror = () => {
        reject(reader.error || new Error('Unable to read file.'));
      };
      reader.onabort = () => {
        reject(new Error('File reading was aborted.'));
      };
      reader.readAsText(file);
    });
  }

  async function applyImportedRoster(people, { mode = 'replace' } = {}) {
    const now = new Date();
    const sortMode = state.settings.sortMode || DEFAULT_SETTINGS.sortMode;
    let nextPeople;

    if (mode === 'merge') {
      const existingById = new Map(state.people.map((person) => [person.id, person]));
      for (const person of people) {
        existingById.set(person.id, person);
      }
      nextPeople = Array.from(existingById.values());
    } else {
      nextPeople = [...people];
    }

    const sorted = sortPeople(nextPeople, sortMode, now);

    state = {
      ...state,
      people: sorted
    };

    await setStoredValue('people', sorted);
    render();
  }

  async function handleRosterImportChange(event) {
    const input = event?.target ?? rosterImportInput;
    const files = input?.files;

    if (!files || !files.length) {
      resetRosterImportInput();
      return;
    }

    const [file] = files;
    const requestedMode =
      rosterImportInput?.dataset?.importMode || rosterImportInput?.dataset?.mode || 'replace';
    const importMode = requestedMode === 'merge' ? 'merge' : 'replace';
    let text;

    try {
      text = await readFileText(file);
    } catch (error) {
      console.error('Unable to read roster file', error);
      setRosterFeedback('Unable to read the selected file. Please try again.', 'error');
      resetRosterImportInput();
      return;
    }

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (error) {
      setRosterFeedback('Unable to parse roster file. Please select a valid JSON file.', 'error');
      resetRosterImportInput();
      return;
    }

    let entries = [];

    if (Array.isArray(parsed)) {
      entries = parsed;
    } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.people)) {
      entries = parsed.people;
    } else {
      setRosterFeedback('Roster file must contain an array of people to import.', 'error');
      resetRosterImportInput();
      return;
    }

    const totalEntries = entries.length;

    if (!totalEntries) {
      setRosterFeedback('Roster file does not include any entries to import.', 'error');
      resetRosterImportInput();
      return;
    }

    const { list: normalizedList } = normalizePeople(entries);
    const missingRequiredCount = totalEntries - normalizedList.length;
    const deduped = [];
    const seenIds = new Set();
    let invalidTimezoneCount = 0;
    let duplicateIdCount = 0;

    for (const person of normalizedList) {
      const timezone = canonicalizeTimezone(person.timezone);
      if (!isValidTimeZone(timezone)) {
        invalidTimezoneCount += 1;
        continue;
      }

      if (seenIds.has(person.id)) {
        duplicateIdCount += 1;
        continue;
      }

      seenIds.add(person.id);
      deduped.push({ ...person, timezone });
    }

    if (!deduped.length) {
      const skippedTotal = missingRequiredCount + invalidTimezoneCount + duplicateIdCount;
      const reasonDetails = [];

      if (missingRequiredCount) {
        const label = missingRequiredCount === 1 ? 'entry' : 'entries';
        reasonDetails.push(`${missingRequiredCount} ${label} missing required information`);
      }

      if (invalidTimezoneCount) {
        const label = invalidTimezoneCount === 1 ? 'entry' : 'entries';
        reasonDetails.push(`${invalidTimezoneCount} ${label} with invalid time zones`);
      }

      if (duplicateIdCount) {
        const label = duplicateIdCount === 1 ? 'entry' : 'entries';
        reasonDetails.push(`${duplicateIdCount} ${label} with duplicate identifiers`);
      }

      const reasonSuffix = reasonDetails.length ? ` (${formatList(reasonDetails)})` : '';
      setRosterFeedback(
        `No valid roster entries were found in the selected file${reasonSuffix}.`,
        'error'
      );
      resetRosterImportInput();
      return;
    }

    try {
      await applyImportedRoster(deduped, { mode: importMode });
    } catch (error) {
      console.error('Unable to import roster', error);
      setRosterFeedback('Unable to import roster. Please try again.', 'error');
      resetRosterImportInput();
      return;
    }

    const importedCount = deduped.length;
    const skippedTotal = missingRequiredCount + invalidTimezoneCount + duplicateIdCount;
    const summaryParts = [];
    const actionVerb = importMode === 'merge' ? 'Merged' : 'Imported';
    summaryParts.push(`${actionVerb} ${importedCount} roster ${importedCount === 1 ? 'entry' : 'entries'}.`);

    if (skippedTotal > 0) {
      const reasons = [];

      if (missingRequiredCount) {
        const label = missingRequiredCount === 1 ? 'entry' : 'entries';
        reasons.push(`${missingRequiredCount} ${label} missing required information`);
      }

      if (invalidTimezoneCount) {
        const label = invalidTimezoneCount === 1 ? 'entry' : 'entries';
        reasons.push(`${invalidTimezoneCount} ${label} with invalid time zones`);
      }

      if (duplicateIdCount) {
        const label = duplicateIdCount === 1 ? 'entry' : 'entries';
        reasons.push(`${duplicateIdCount} ${label} with duplicate identifiers`);
      }

      const detail = reasons.length ? formatList(reasons) : 'invalid data';
      summaryParts.push(`Skipped ${skippedTotal} due to ${detail}.`);
    }

    const finalCount = state.people.length;
    summaryParts.push(
      `Roster now contains ${finalCount} ${finalCount === 1 ? 'entry' : 'entries'}.`
    );

    setRosterFeedback(summaryParts.join(' '), 'success');
    resetRosterImportInput();
  }

  function exportRoster() {
    let downloadUrl = null;
    let link = null;
    let appendTarget = null;

    try {
      if (!Array.isArray(state.people)) {
        throw new Error('Roster data is unavailable.');
      }

      const serialized = JSON.stringify(state.people, null, 2);
      const blob = new Blob([serialized], { type: 'application/json' });
      downloadUrl = URL.createObjectURL(blob);
      link = document.createElement('a');
      link.href = downloadUrl;
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `teams-time-roster-${timestamp}.json`;

      appendTarget = document.body || document.documentElement;
      if (!appendTarget) {
        throw new Error('Unable to access the document to trigger a download.');
      }

      appendTarget.append(link);
      link.click();

      setRosterFeedback('Roster exported successfully.', 'success');
    } catch (error) {
      console.error('Unable to export roster', error);
      setRosterFeedback('Unable to export roster. Please try again.', 'error');
    } finally {
      if (link && link.isConnected) {
        link.remove();
      }
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    }
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

  function populateTimezoneDatalist(metadata) {
    if (!timezoneListElement) {
      return;
    }

    const metadataSource = metadata && typeof metadata === 'object'
      ? metadata
      : ensureMetadata();
    const zoneSet = new Set(Object.keys(metadataSource));
    for (const zone of TIMEZONE_IDS) {
      if (typeof zone === 'string' && zone) {
        zoneSet.add(zone);
      }
    }

    const uniqueZones = Array.from(zoneSet).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );

    const fragment = document.createDocumentFragment();
    for (const zone of uniqueZones) {
      const option = document.createElement('option');
      option.value = zone;
      const label = getDisplayLabel(zone, { metadata: metadataSource, includeOffset: false });
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
    setupTabInterface();

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

    populateTimezoneDatalist(metadata);
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

    if (rosterExportButton) {
      rosterExportButton.addEventListener('click', () => {
        exportRoster();
      });
    }

    if (rosterImportButton && rosterImportInput) {
      rosterImportButton.addEventListener('click', (event) => {
        event.preventDefault();
        rosterImportInput.click();
      });
    }

    if (rosterImportInput) {
      rosterImportInput.addEventListener('change', (event) => {
        handleRosterImportChange(event).catch((error) => {
          console.error('Unable to import roster', error);
          setRosterFeedback('Unable to import roster. Please try again.', 'error');
          resetRosterImportInput();
        });
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
    stopTimelineRefresh();
  });
})();
