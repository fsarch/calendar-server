import { validate } from 'class-validator';
import { CreateCalendarDto } from './CreateCalendarDto.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('CreateCalendarDto', () => {
  it('should be defined', () => {
    expect(CreateCalendarDto).toBeDefined();
  });

  it('should accept valid data', async () => {
    const dto = new CreateCalendarDto();
    dto.name = 'Test Calendar';
    dto.defaultTimezone = 'Europe/Berlin';
    dto.externalId = 'ext-123';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject empty name', async () => {
    const dto = new CreateCalendarDto();
    dto.name = '';
    dto.defaultTimezone = 'Europe/Berlin';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject missing timezone', async () => {
    const dto = new CreateCalendarDto();
    dto.name = 'Test Calendar';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
