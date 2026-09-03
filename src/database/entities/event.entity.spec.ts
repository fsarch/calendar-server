import { Event } from './event.entity.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Event Entity', () => {
  it('should have correct entity name', () => {
    const entityMetadata = Event;
    expect(entityMetadata).toBeDefined();
  });

  it('should have all required columns', () => {
    const event = new Event();
    expect(event).toHaveProperty('id');
    expect(event).toHaveProperty('calendarId');
    expect(event).toHaveProperty('title');
    expect(event).toHaveProperty('description');
    expect(event).toHaveProperty('externalId');
    expect(event).toHaveProperty('timezone');
    expect(event).toHaveProperty('startAt');
    expect(event).toHaveProperty('endAt');
    expect(event).toHaveProperty('metadata');
    expect(event).toHaveProperty('creationTime');
    expect(event).toHaveProperty('deletionTime');
  });
});
