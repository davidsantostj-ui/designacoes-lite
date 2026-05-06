const assert = require('assert');
const { parseIsoDate, formatIsoDate } = require('../../../src/utils/meetingViewUtils.cjs');

describe('meetingViewUtils', () => {
  it('parses plain ISO dates in YYYY-MM-DD format', () => {
    const date = parseIsoDate('2026-05-02');
    assert.ok(date instanceof Date);
    assert.strictEqual(formatIsoDate(date), '2026-05-02');
  });

  it('parses full ISO datetime strings', () => {
    const date = parseIsoDate('2026-05-02T15:30:00Z');
    assert.ok(date instanceof Date);
    assert.strictEqual(formatIsoDate(date), '2026-05-02');
  });

  it('parses JavaScript Date instances', () => {
    const input = new Date(2026, 4, 2);
    const date = parseIsoDate(input);
    assert.ok(date instanceof Date);
    assert.strictEqual(formatIsoDate(date), '2026-05-02');
  });

  it('parses Firestore Timestamp-like objects with toDate()', () => {
    const timestamp = { toDate: () => new Date(2026, 4, 2) };
    const date = parseIsoDate(timestamp);
    assert.ok(date instanceof Date);
    assert.strictEqual(date.getFullYear(), 2026);
    assert.strictEqual(date.getMonth(), 4);
    assert.strictEqual(date.getDate(), 2);
  });

  it('returns null for invalid canonical date values', () => {
    assert.strictEqual(parseIsoDate('2026-13-01'), null);
    assert.strictEqual(parseIsoDate('2026-02-30'), null);
  });

  it('returns null for badly formatted or missing date values', () => {
    assert.strictEqual(parseIsoDate('not-a-date'), null);
    assert.strictEqual(parseIsoDate(''), null);
  });
});
