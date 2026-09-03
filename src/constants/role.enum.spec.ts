import { Role } from './role.enum.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Role Enum', () => {
  it('should have all calendar permissions', () => {
    expect(Role.read_calendar).toBe('read_calendar');
    expect(Role.write_calendar).toBe('write_calendar');
    expect(Role.create_calendar).toBe('create_calendar');
    expect(Role.delete_calendar).toBe('delete_calendar');
    expect(Role.manage_calendar).toBe('manage_calendar');
  });

  it('should have all event permissions', () => {
    expect(Role.read_event).toBe('read_event');
    expect(Role.write_event).toBe('write_event');
    expect(Role.create_event).toBe('create_event');
    expect(Role.delete_event).toBe('delete_event');
    expect(Role.manage_event).toBe('manage_event');
  });

  it('should have all event series permissions', () => {
    expect(Role.read_event_series).toBe('read_event_series');
    expect(Role.write_event_series).toBe('write_event_series');
    expect(Role.create_event_series).toBe('create_event_series');
    expect(Role.delete_event_series).toBe('delete_event_series');
    expect(Role.manage_event_series).toBe('manage_event_series');
  });

  it('should have all event exception permissions', () => {
    expect(Role.read_event_exception).toBe('read_event_exception');
    expect(Role.write_event_exception).toBe('write_event_exception');
    expect(Role.create_event_exception).toBe('create_event_exception');
    expect(Role.delete_event_exception).toBe('delete_event_exception');
    expect(Role.manage_event_exception).toBe('manage_event_exception');
  });

  it('should have wildcard permission', () => {
    expect(Role.all).toBe('*');
  });
});
