import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';

import { normalizeSettings } from './popup.js';
import { getStoredValue, setStoredValue } from './util.js';

beforeEach(async () => {
  await setStoredValue('settings', {});
});

test('normalizeSettings falls back to default timezone when stored zone is invalid', async () => {
  const invalidZone = 'Not/AZone';
  const normalized = normalizeSettings({ baseTimeZone: invalidZone, hour12: false });
  await Promise.resolve();

  const fallbackZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  assert.strictEqual(normalized.baseTimeZone, fallbackZone);
  assert.strictEqual(normalized.hour12, false);

  const stored = await getStoredValue('settings', {});
  assert.ok(!('baseTimeZone' in stored));
});

test('normalizeSettings keeps a valid timezone preference', () => {
  const zone = 'America/New_York';
  const normalized = normalizeSettings({ baseTimeZone: zone });
  assert.strictEqual(normalized.baseTimeZone, zone);
});

test('normalizeSettings skips invalid baseTimeZone in favor of valid aliases', async () => {
  const zone = 'Europe/London';
  const normalized = normalizeSettings({
    baseTimeZone: 'Invalid/Zone',
    timezone: zone,
    sortMode: 'name'
  });
  await Promise.resolve();

  assert.strictEqual(normalized.baseTimeZone, zone);
  assert.strictEqual(normalized.sortMode, 'name');

  const stored = await getStoredValue('settings', {});
  assert.ok(!('baseTimeZone' in stored));
  assert.strictEqual(stored.timezone, zone);
});
