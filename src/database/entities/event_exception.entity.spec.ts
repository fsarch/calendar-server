import { EventException } from './event_exception.entity.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('EventException Entity', () => {
  it('should have correct entity name', () => {
    const entityMetadata = EventException;
    expect(entityMetadata).toBeDefined();
  });

  it('should have all required columns', () => {
    const exception = new EventException();
    expect(exception).toHaveProperty('id');
    expect(exception).toHaveProperty('externalId');
    expect(exception).toHaveProperty('eventSeriesId');
    expect(exception).toHaveProperty('originalStart');
    expect(exception).toHaveProperty('isMoved');
    expect(exception).toHaveProperty('isCancelled');
    expect(exception).toHaveProperty('newEventId');
    expect(exception).toHaveProperty('creationTime');
    expect(exception).toHaveProperty('deletionTime');
  });
});
