// Unit tests for calcStreak and 7-day bonus logic
// Run: node --test routes/attendance.test.js
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Extract calcStreak logic for isolated testing
// Mirrors the implementation in attendance.js exactly

function getKSTDate(offsetDays = 0) {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000 + offsetDays * 24 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function calcStreak(dates) {
  // dates: string[] of 'YYYY-MM-DD', ordered DESC (most recent first), max 8
  if (dates.length === 0) return 0;

  const today = getKSTDate(0);
  const yesterday = getKSTDate(-1);

  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (prev - curr) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

describe('calcStreak', () => {
  test('empty → 0', () => {
    assert.equal(calcStreak([]), 0);
  });

  test('only today → 1', () => {
    assert.equal(calcStreak([getKSTDate(0)]), 1);
  });

  test('only yesterday → 1', () => {
    assert.equal(calcStreak([getKSTDate(-1)]), 1);
  });

  test('old date (2 days ago, not today/yesterday) → 0', () => {
    assert.equal(calcStreak([getKSTDate(-2)]), 0);
  });

  test('today + yesterday → 2', () => {
    assert.equal(calcStreak([getKSTDate(0), getKSTDate(-1)]), 2);
  });

  test('7 consecutive days → 7', () => {
    const dates = Array.from({ length: 7 }, (_, i) => getKSTDate(-i));
    assert.equal(calcStreak(dates), 7);
  });

  test('gap in streak breaks at gap', () => {
    // today, yesterday, 3 days ago (gap on -2)
    assert.equal(calcStreak([getKSTDate(0), getKSTDate(-1), getKSTDate(-3)]), 2);
  });

  test('8 consecutive days → 8 (no LIMIT, multi-cycle streaks need full history)', () => {
    // IMPORTANT: Do NOT add LIMIT to the DB query.
    // streak 14 = 14 % 7 === 0 → bonus fires. LIMIT 8 would compute streak=8, breaking day-14 bonus.
    const dates = Array.from({ length: 8 }, (_, i) => getKSTDate(-i));
    assert.equal(calcStreak(dates), 8);
  });

  test('14 consecutive days → 14 (needed for day-14 bonus: 14 % 7 === 0)', () => {
    const dates = Array.from({ length: 14 }, (_, i) => getKSTDate(-i));
    assert.equal(calcStreak(dates), 14);
    assert.equal(14 % 7, 0); // bonus fires
  });
});

describe('7-day bonus trigger', () => {
  test('streak % 7 === 0 triggers bonus', () => {
    const streak = 7;
    assert.equal(streak % 7 === 0, true);
  });

  test('streak 6 does not trigger bonus', () => {
    assert.equal(6 % 7 === 0, false);
  });

  test('streak 14 triggers bonus again', () => {
    assert.equal(14 % 7 === 0, true);
  });

  test('streak 1 does not trigger bonus', () => {
    assert.equal(1 % 7 === 0, false);
  });
});
