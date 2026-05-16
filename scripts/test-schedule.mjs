// Smoke tests for schedule.js — node --test scripts/test-schedule.mjs
import { resolve, LOCATIONS, outdoorActivity } from '../src/lib/schedule.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

// Helper: produce a Date that is exactly H:M IST on a given UTC date.
// IST is UTC+5:30 — to get a 09:00 IST instant, subtract 5h30m from 09:00 UTC.
function istDate(year, month, day, hour, minute) {
  const utcHour = hour - 5
  const utcMinute = minute - 30
  // Normalise to handle negative minutes/hours
  return new Date(Date.UTC(year, month - 1, day, utcHour, utcMinute, 0))
}

// Pick a Monday: 2026-05-18 (May 18, 2026 was a Monday)
const MON = (h, m) => istDate(2026, 5, 18, h, m)
// Saturday: 2026-05-23
const SAT = (h, m) => istDate(2026, 5, 23, h, m)
// Sunday: 2026-05-24
const SUN = (h, m) => istDate(2026, 5, 24, h, m)

test('weekday 03:00 -> bedroom', () => {
  assert.equal(resolve(MON(3, 0)).location, LOCATIONS.BEDROOM)
})
test('weekday 07:00 -> tennis', () => {
  assert.equal(resolve(MON(7, 0)).location, LOCATIONS.TENNIS)
})
test('weekday 08:00 -> kitchen (breakfast)', () => {
  const r = resolve(MON(8, 0))
  assert.equal(r.location, LOCATIONS.KITCHEN)
  assert.match(r.activity, /Breakfast/i)
})
test('weekday 12:00 -> workspace', () => {
  assert.equal(resolve(MON(12, 0)).location, LOCATIONS.WORKSPACE)
})
test('weekday 19:00 -> gym', () => {
  assert.equal(resolve(MON(19, 0)).location, LOCATIONS.GYM)
})
test('weekday 20:50 -> kitchen (dinner)', () => {
  const r = resolve(MON(20, 50))
  assert.equal(r.location, LOCATIONS.KITCHEN)
  assert.match(r.activity, /Dinner/i)
})
test('weekday 21:30 -> living room', () => {
  assert.equal(resolve(MON(21, 30)).location, LOCATIONS.LIVING)
})
test('weekday 23:30 -> bedroom', () => {
  assert.equal(resolve(MON(23, 30)).location, LOCATIONS.BEDROOM)
})
test('boundary: weekday 09:00 sharp -> workspace', () => {
  assert.equal(resolve(MON(9, 0)).location, LOCATIONS.WORKSPACE)
})
test('boundary: weekday 18:00 -> living (decompress)', () => {
  assert.equal(resolve(MON(18, 0)).location, LOCATIONS.LIVING)
})
test('Saturday 10:00 -> tennis', () => {
  assert.equal(resolve(SAT(10, 0)).location, LOCATIONS.TENNIS)
})
test('Saturday 13:00 -> cafe', () => {
  assert.equal(resolve(SAT(13, 0)).location, LOCATIONS.CAFE)
})
test('Saturday 17:00 -> outdoor', () => {
  assert.equal(resolve(SAT(17, 0)).location, LOCATIONS.OUTDOOR)
})
test('Sunday 12:00 -> outdoor', () => {
  assert.equal(resolve(SUN(12, 0)).location, LOCATIONS.OUTDOOR)
})
test('Sunday 02:00 -> bedroom', () => {
  assert.equal(resolve(SUN(2, 0)).location, LOCATIONS.BEDROOM)
})
test('outdoorActivity is one of beach/bike/cricket', () => {
  const a = outdoorActivity(SAT(15, 0))
  assert.ok(['beach', 'bike', 'cricket'].includes(a), a)
})
test('outdoorActivity changes across days', () => {
  const a = outdoorActivity(SAT(15, 0))
  const b = outdoorActivity(SUN(15, 0))
  // Same day-of-year +1 -> rotates one slot
  assert.notEqual(a, b)
})
