import { validate } from 'class-validator';
import { CreateEventSeriesDto } from './CreateEventSeriesDto.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('CreateEventSeriesDto', () => {
  it('should be defined', () => {
    expect(CreateEventSeriesDto).toBeDefined();
  });

  it('should accept valid data', async () => {
    const dto = new CreateEventSeriesDto();
    dto.eventId = '550e8400-e29b-41d4-a716-446655440000';
    dto.timezone = 'Europe/Berlin';
    dto.rrule = 'FREQ=WEEKLY;BYDAY=MO,WE,FR';
    dto.validFrom = new Date('2024-01-01T00:00:00Z');

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept valid data with validTo', async () => {
    const dto = new CreateEventSeriesDto();
    dto.eventId = '550e8400-e29b-41d4-a716-446655440000';
    dto.timezone = 'Europe/Berlin';
    dto.rrule = 'FREQ=MONTHLY;INTERVAL=1';
    dto.validFrom = new Date('2024-01-01T00:00:00Z');
    dto.validTo = new Date('2024-12-31T23:59:59Z');

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept data without validFrom', async () => {
    const dto = new CreateEventSeriesDto();
    dto.eventId = '550e8400-e29b-41d4-a716-446655440000';
    dto.timezone = 'Europe/Berlin';
    dto.rrule = 'FREQ=WEEKLY;BYDAY=MO';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept data without eventId', async () => {
    const dto = new CreateEventSeriesDto();
    dto.timezone = 'Europe/Berlin';
    dto.rrule = 'FREQ=WEEKLY;BYDAY=MO';
    dto.validFrom = new Date('2024-01-01T00:00:00Z');

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject invalid timezone', async () => {
    const dto = new CreateEventSeriesDto();
    dto.eventId = '550e8400-e29b-41d4-a716-446655440000';
    dto.timezone = 'Invalid/Timezone';
    dto.rrule = 'FREQ=WEEKLY;BYDAY=MO';
    dto.validFrom = new Date('2024-01-01T00:00:00Z');

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject invalid RRULE', async () => {
    const dto = new CreateEventSeriesDto();
    dto.eventId = '550e8400-e29b-41d4-a716-446655440000';
    dto.timezone = 'Europe/Berlin';
    dto.rrule = 'INVALID_RRULE';
    dto.validFrom = new Date('2024-01-01T00:00:00Z');

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
