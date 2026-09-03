import { DATABASE_OPTIONS } from './index.js';
import { Calendar } from './entities/calendar.entity.js';
import { Event } from './entities/event.entity.js';
import { EventSeries } from './entities/event_series.entity.js';
import { EventException } from './entities/event_exception.entity.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('DATABASE_OPTIONS', () => {
  it('should export DATABASE_OPTIONS with all entities', () => {
    expect(DATABASE_OPTIONS).toBeDefined();
    expect(DATABASE_OPTIONS.entities).toContain(Calendar);
    expect(DATABASE_OPTIONS.entities).toContain(Event);
    expect(DATABASE_OPTIONS.entities).toContain(EventSeries);
    expect(DATABASE_OPTIONS.entities).toContain(EventException);
  });

  it('should have migrations array', () => {
    expect(DATABASE_OPTIONS.migrations).toBeDefined();
    expect(Array.isArray(DATABASE_OPTIONS.migrations)).toBe(true);
  });

  it('should have synchronize option', () => {
    expect(DATABASE_OPTIONS.synchronize).toBeDefined();
    expect(typeof DATABASE_OPTIONS.synchronize).toBe('boolean');
  });
});
