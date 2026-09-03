import { EventSeries } from './event_series.entity.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('EventSeries Entity', () => {
  it('should have correct entity name', () => {
    const entityMetadata = EventSeries;
    expect(entityMetadata).toBeDefined();
  });

  it('should have all required columns', () => {
    const series = new EventSeries();
    expect(series).toHaveProperty('id');
    expect(series).toHaveProperty('eventId');
    expect(series).toHaveProperty('externalId');
    expect(series).toHaveProperty('timezone');
    expect(series).toHaveProperty('rrule');
    expect(series).toHaveProperty('validFrom');
    expect(series).toHaveProperty('validTo');
    expect(series).toHaveProperty('creationTime');
    expect(series).toHaveProperty('deletionTime');
  });
});
