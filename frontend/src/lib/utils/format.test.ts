import { describe, expect, it } from 'vitest';
import { dayLabel, fmtClock, relAgo, relShort } from './format';

const now = new Date(2026, 9, 19, 15, 30).getTime();
const min = 60_000;

describe('format', () => {
  it('formats short relative times for the chat list', () => {
    expect(relShort(now - 20_000, now)).toBe('now');
    expect(relShort(now - 5 * min, now)).toBe('5m');
    expect(relShort(now - 3 * 60 * min, now)).toBe('3h');
    expect(relShort(new Date(2026, 9, 18, 10).getTime(), now)).toBe('Yesterday');
    expect(relShort(new Date(2026, 9, 15, 10).getTime(), now)).toBe('Thu');
    expect(relShort(new Date(2026, 8, 1).getTime(), now)).toBe('Sep 1');
  });

  it('formats story ages', () => {
    expect(relAgo(now - 10_000, now)).toBe('just now');
    expect(relAgo(now - 12 * min, now)).toBe('12m ago');
    expect(relAgo(now - 5 * 60 * min, now)).toBe('5h ago');
  });

  it('labels days for separators', () => {
    expect(dayLabel(now - min, now)).toBe('Today');
    expect(dayLabel(new Date(2026, 9, 18, 23).getTime(), now)).toBe('Yesterday');
    expect(dayLabel(new Date(2026, 9, 12).getTime(), now)).toBe('Monday, Oct 12');
  });

  it('formats a recording clock', () => {
    expect(fmtClock(0)).toBe('0:00');
    expect(fmtClock(7_400)).toBe('0:07');
    expect(fmtClock(15_000)).toBe('0:15');
  });
});
