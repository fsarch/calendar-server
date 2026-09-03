import { validate } from 'class-validator';
import { CreateEventExceptionDto } from './CreateEventExceptionDto.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('CreateEventExceptionDto', () => {
  it('should be defined', () => {
    expect(CreateEventExceptionDto).toBeDefined();
  });

  it('should accept valid data with isCancelled', async () => {
    const dto = new CreateEventExceptionDto();
    dto.isCancelled = true;
    dto.isMoved = false;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept valid data with isMoved and newEventId', async () => {
    const dto = new CreateEventExceptionDto();
    dto.isCancelled = false;
    dto.isMoved = true;
    dto.newEventId = '550e8400-e29b-41d4-a716-446655440000';
    dto.externalId = 'ext-123';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept valid data with defaults', async () => {
    const dto = new CreateEventExceptionDto();
    dto.isCancelled = false;
    dto.isMoved = false;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject missing isCancelled', async () => {
    const dto = new CreateEventExceptionDto();
    dto.isMoved = false;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject missing isMoved', async () => {
    const dto = new CreateEventExceptionDto();
    dto.isCancelled = false;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
