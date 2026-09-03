import { CalendarDto } from './CalendarDto.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('CalendarDto', () => {
  it('should be defined', () => {
    expect(CalendarDto).toBeDefined();
  });

  it('should have all properties', () => {
    const dto = new CalendarDto();
    expect(dto).toHaveProperty('id');
    expect(dto).toHaveProperty('name');
    expect(dto).toHaveProperty('defaultTimezone');
    expect(dto).toHaveProperty('externalId');
    expect(dto).toHaveProperty('creationTime');
    expect(dto).toHaveProperty('deletionTime');
  });
});
