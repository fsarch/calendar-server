import { EventDto } from './EventDto.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('EventDto', () => {
  it('should be defined', () => {
    expect(EventDto).toBeDefined();
  });

  it('should have all properties', () => {
    const dto = new EventDto();
    expect(dto).toHaveProperty('id');
    expect(dto).toHaveProperty('calendarId');
    expect(dto).toHaveProperty('title');
    expect(dto).toHaveProperty('description');
    expect(dto).toHaveProperty('externalId');
    expect(dto).toHaveProperty('timezone');
    expect(dto).toHaveProperty('startAt');
    expect(dto).toHaveProperty('endAt');
    expect(dto).toHaveProperty('metadata');
    expect(dto).toHaveProperty('creationTime');
    expect(dto).toHaveProperty('deletionTime');
  });
});
