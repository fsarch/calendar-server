import { Calendar } from './calendar.entity.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Calendar Entity', () => {
  it('should have correct entity name', () => {
    const entityMetadata = Calendar;
    expect(entityMetadata).toBeDefined();
  });

  it('should have all required columns', () => {
    const calendar = new Calendar();
    expect(calendar).toHaveProperty('id');
    expect(calendar).toHaveProperty('name');
    expect(calendar).toHaveProperty('defaultTimezone');
    expect(calendar).toHaveProperty('externalId');
    expect(calendar).toHaveProperty('creationTime');
    expect(calendar).toHaveProperty('deletionTime');
  });
});
