import { ExpandedEventDto } from './ExpandedEventDto.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ExpandedEventDto', () => {
  it('should be defined', () => {
    expect(ExpandedEventDto).toBeDefined();
  });

  it('should have all properties', () => {
    const dto = new ExpandedEventDto();
    expect(dto).toHaveProperty('id');
    expect(dto).toHaveProperty('calendarId');
    expect(dto).toHaveProperty('title');
    expect(dto).toHaveProperty('description');
    expect(dto).toHaveProperty('externalId');
    expect(dto).toHaveProperty('timezone');
    expect(dto).toHaveProperty('startAt');
    expect(dto).toHaveProperty('endAt');
    expect(dto).toHaveProperty('metadata');
    expect(dto).toHaveProperty('isRecurring');
    expect(dto).toHaveProperty('recurringInstanceOf');
    expect(dto).toHaveProperty('isException');
    expect(dto).toHaveProperty('exceptionType');
  });
});
