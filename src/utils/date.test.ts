import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { formatDate } from './date';

describe('formatDate', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-05-10T12:00:00Z'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('returns Today for current day', () => {
    const result = formatDate('2024-05-10T08:00:00Z');
    expect(result).toBe('Today');
  });

  it('returns Yesterday for previous day', () => {
    const result = formatDate('2024-05-09T08:00:00Z');
    expect(result).toBe('Yesterday');
  });

  it('returns relative days for recent dates', () => {
    const result = formatDate('2024-05-06T12:00:00Z');
    expect(result).toBe('3 days ago');
  });
});
