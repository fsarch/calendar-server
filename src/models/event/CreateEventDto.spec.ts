import { validate } from 'class-validator';
import { CreateEventDto } from './CreateEventDto.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('CreateEventDto', () => {
  it('should be defined', () => {
    expect(CreateEventDto).toBeDefined();
  });

  it('should accept valid data with required fields only', async () => {
    const dto = new CreateEventDto();
    dto.startAt = new Date('2024-01-01T10:00:00Z');

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept valid data with all fields', async () => {
    const dto = new CreateEventDto();
    dto.title = 'Test Event';
    dto.description = 'Test Description';
    dto.externalId = 'ext-123';
    dto.timezone = 'Europe/Berlin';
    dto.startAt = new Date('2024-01-01T10:00:00Z');
    dto.endAt = new Date('2024-01-01T11:00:00Z');

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject missing startAt', async () => {
    const dto = new CreateEventDto();

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject invalid timezone', async () => {
    const dto = new CreateEventDto();
    dto.startAt = new Date('2024-01-01T10:00:00Z');
    dto.timezone = 'Invalid/Timezone';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should accept an object as metadata', async () => {
    const dto = new CreateEventDto();
    dto.startAt = new Date('2024-01-01T10:00:00Z');
    dto.metadata = { source: 'import', tags: ['a', 'b'] };

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject non-object metadata', async () => {
    const dto = new CreateEventDto();
    dto.startAt = new Date('2024-01-01T10:00:00Z');
    (dto as unknown as { metadata: unknown }).metadata = 'not-an-object';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
