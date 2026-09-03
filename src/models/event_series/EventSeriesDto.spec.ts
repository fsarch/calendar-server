import { EventSeriesDto } from './EventSeriesDto.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('EventSeriesDto', () => {
  it('should be defined', () => {
    expect(EventSeriesDto).toBeDefined();
  });

  it('should have all properties', () => {
    const dto = new EventSeriesDto();
    expect(dto).toHaveProperty('id');
    expect(dto).toHaveProperty('eventId');
    expect(dto).toHaveProperty('externalId');
    expect(dto).toHaveProperty('timezone');
    expect(dto).toHaveProperty('rrule');
    expect(dto).toHaveProperty('validFrom');
    expect(dto).toHaveProperty('validTo');
    expect(dto).toHaveProperty('creationTime');
    expect(dto).toHaveProperty('deletionTime');
  });
});
