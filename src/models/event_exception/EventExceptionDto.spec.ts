import { EventExceptionDto } from './EventExceptionDto.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('EventExceptionDto', () => {
  it('should be defined', () => {
    expect(EventExceptionDto).toBeDefined();
  });

  it('should have all properties', () => {
    const dto = new EventExceptionDto();
    expect(dto).toHaveProperty('id');
    expect(dto).toHaveProperty('externalId');
    expect(dto).toHaveProperty('eventSeriesId');
    expect(dto).toHaveProperty('originalStart');
    expect(dto).toHaveProperty('isMoved');
    expect(dto).toHaveProperty('isCancelled');
    expect(dto).toHaveProperty('newEventId');
    expect(dto).toHaveProperty('creationTime');
    expect(dto).toHaveProperty('deletionTime');
  });
});
