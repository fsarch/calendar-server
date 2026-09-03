import { Test, TestingModule } from '@nestjs/testing';
import { EventController } from './event.controller.js';
import { EventService } from './event.service.js';
import { EventExpanderService } from './event-expander.service.js';
import { CreateEventDto } from '../../models/event/CreateEventDto.js';
import { EventDto } from '../../models/event/EventDto.js';
import { ExpandedEventDto } from '../../models/event/ExpandedEventDto.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthGuard } from '@fsarch/server/auth';
import { Roles } from '@fsarch/server/uac';

class MockAuthGuard {
  canActivate() {
    return true;
  }
}

class MockRolesDecorator {
  apply() {
    return true;
  }
}

const mockEventDto: EventDto = {
  id: 'test-id',
  calendarId: 'calendar-1',
  title: 'Test Event',
  description: 'Test Description',
  externalId: 'ext-123',
  timezone: 'Europe/Berlin',
  startAt: '2024-01-01T10:00:00Z',
  endAt: '2024-01-01T11:00:00Z',
  creationTime: new Date(),
  deletionTime: null,
};

const mockExpandedEvent: ExpandedEventDto = {
  id: 'test-id',
  calendarId: 'calendar-1',
  title: 'Test Event',
  description: 'Test Description',
  externalId: 'ext-123',
  timezone: 'Europe/Berlin',
  startAt: '2024-01-01T10:00:00Z',
  endAt: '2024-01-01T11:00:00Z',
  isRecurring: false,
  recurringInstanceOf: null,
  isException: false,
  exceptionType: null,
};

const mockEventService = {
  create: vi.fn().mockResolvedValue(mockEventDto),
  findByCalendar: vi.fn().mockResolvedValue([[mockEventDto], 1]),
  findOne: vi.fn().mockResolvedValue(mockEventDto),
  update: vi.fn().mockResolvedValue(mockEventDto),
  remove: vi.fn().mockResolvedValue(undefined),
};

const mockEventExpanderService = {
  getExpandedEventsForCalendar: vi.fn().mockResolvedValue([mockExpandedEvent]),
};

describe('EventController', () => {
  let controller: EventController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventController],
      providers: [
        {
          provide: EventService,
          useValue: mockEventService,
        },
        {
          provide: EventExpanderService,
          useValue: mockEventExpanderService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useClass(MockAuthGuard)
      .overrideGuard(Roles)
      .useClass(MockRolesDecorator)
      .compile();

    controller = module.get<EventController>(EventController);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an event in calendar', async () => {
      const createDto: CreateEventDto = {
        title: 'Test Event',
        startAt: '2024-01-01T10:00:00Z',
      };
      const result = await controller.create('calendar-1', createDto);
      expect(mockEventService.create).toHaveBeenCalledWith({
        ...createDto,
        calendarId: 'calendar-1',
      });
      expect(result).toEqual(mockEventDto);
    });
  });

  describe('findAllByCalendar', () => {
    it('should return paginated events for calendar', async () => {
      const result = await controller.findAllByCalendar('calendar-1', 1, 25);
      expect(mockEventService.findByCalendar).toHaveBeenCalledWith('calendar-1', 1, 25);
      expect(result.data.length).toBe(1);
      expect(result.metadata.totalItems).toBe(1);
    });
  });

  describe('getInstances', () => {
    it('should return expanded events for calendar in time range', async () => {
      const from = '2024-01-01T00:00:00Z';
      const to = '2024-12-31T23:59:59Z';
      const result = await controller.getInstances('calendar-1', from, to);
      expect(mockEventExpanderService.getExpandedEventsForCalendar).toHaveBeenCalledWith(
        'calendar-1',
        new Date(from),
        new Date(to),
      );
      expect(result.length).toBe(1);
    });

    it('should throw error for invalid date format', async () => {
      await expect(controller.getInstances('calendar-1', 'invalid', 'invalid')).rejects.toThrow(
        'Invalid date format',
      );
    });
  });

  describe('findOne', () => {
    it('should return an event by ID for calendar', async () => {
      const result = await controller.findOne('calendar-1', 'test-id');
      expect(mockEventService.findOne).toHaveBeenCalledWith('test-id');
      expect(result).toEqual(mockEventDto);
    });

    it('should throw NotFoundException if event not in calendar', async () => {
      mockEventService.findOne.mockResolvedValueOnce({
        ...mockEventDto,
        calendarId: 'different-calendar',
      });
      await expect(controller.findOne('calendar-1', 'test-id')).rejects.toThrow(
        'Event with ID \'test-id\' not found in calendar \'calendar-1\'',
      );
    });
  });

  describe('update', () => {
    it('should update an event in calendar', async () => {
      const updateDto: Partial<CreateEventDto> = { title: 'Updated Event' };
      const result = await controller.update('calendar-1', 'test-id', updateDto);
      expect(mockEventService.findOne).toHaveBeenCalledWith('test-id');
      expect(mockEventService.update).toHaveBeenCalledWith('test-id', updateDto);
      expect(result).toEqual(mockEventDto);
    });

    it('should throw NotFoundException if event not in calendar', async () => {
      mockEventService.findOne.mockResolvedValueOnce({
        ...mockEventDto,
        calendarId: 'different-calendar',
      });
      await expect(controller.update('calendar-1', 'test-id', {})).rejects.toThrow(
        'Event with ID \'test-id\' not found in calendar \'calendar-1\'',
      );
    });
  });

  describe('remove', () => {
    it('should remove an event from calendar', async () => {
      await controller.remove('calendar-1', 'test-id');
      expect(mockEventService.findOne).toHaveBeenCalledWith('test-id');
      expect(mockEventService.remove).toHaveBeenCalledWith('test-id');
    });

    it('should throw NotFoundException if event not in calendar', async () => {
      mockEventService.findOne.mockResolvedValueOnce({
        ...mockEventDto,
        calendarId: 'different-calendar',
      });
      await expect(controller.remove('calendar-1', 'test-id')).rejects.toThrow(
        'Event with ID \'test-id\' not found in calendar \'calendar-1\'',
      );
    });
  });
});
