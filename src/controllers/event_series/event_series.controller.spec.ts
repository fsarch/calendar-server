import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EventSeriesController } from './event_series.controller.js';
import { EventSeriesService } from './event_series.service.js';
import { EventService } from '../event/event.service.js';
import { CreateEventSeriesDto } from '../../models/event_series/CreateEventSeriesDto.js';
import { EventSeriesDto } from '../../models/event_series/EventSeriesDto.js';
import { EventDto } from '../../models/event/EventDto.js';
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

const mockSeriesDto: EventSeriesDto = {
  id: 'test-id',
  eventId: 'event-1',
  externalId: 'ext-123',
  timezone: 'Europe/Berlin',
  rrule: 'FREQ=WEEKLY;BYDAY=MO',
  validFrom: '2024-01-01T00:00:00Z',
  validTo: null,
  creationTime: new Date(),
  deletionTime: null,
};

const mockEventDto: EventDto = {
  id: 'event-1',
  calendarId: 'calendar-1',
  title: 'Test Event',
  description: null,
  externalId: null,
  timezone: null,
  startAt: new Date('2024-01-01T00:00:00Z'),
  endAt: null,
  creationTime: new Date(),
  deletionTime: null,
};

const mockSeriesService = {
  create: vi.fn().mockResolvedValue(mockSeriesDto),
  findByEvent: vi.fn().mockResolvedValue([[mockSeriesDto], 1]),
  findOne: vi.fn().mockResolvedValue(mockSeriesDto),
  update: vi.fn().mockResolvedValue(mockSeriesDto),
  remove: vi.fn().mockResolvedValue(undefined),
};

const mockEventService = {
  findOne: vi.fn().mockResolvedValue(mockEventDto),
};

describe('EventSeriesController', () => {
  let controller: EventSeriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventSeriesController],
      providers: [
        {
          provide: EventSeriesService,
          useValue: mockSeriesService,
        },
        {
          provide: EventService,
          useValue: mockEventService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useClass(MockAuthGuard)
      .overrideGuard(Roles)
      .useClass(MockRolesDecorator)
      .compile();

    controller = module.get<EventSeriesController>(EventSeriesController);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllByEvent', () => {
    it('should return paginated series for event in calendar', async () => {
      const result = await controller.findAllByEvent('calendar-1', 'event-1', 1, 25);
      expect(mockEventService.findOne).toHaveBeenCalledWith('event-1');
      expect(mockSeriesService.findByEvent).toHaveBeenCalledWith('event-1', 1, 25);
      expect(result.data.length).toBe(1);
      expect(result.metadata.totalItems).toBe(1);
    });

    it('should throw NotFoundException if event not in calendar', async () => {
      mockEventService.findOne.mockResolvedValueOnce({
        ...mockEventDto,
        calendarId: 'different-calendar',
      });
      await expect(
        controller.findAllByEvent('calendar-1', 'event-1', 1, 25),
      ).rejects.toThrow("Event with ID 'event-1' not found in calendar 'calendar-1'");
    });
  });

  describe('create', () => {
    it('should create a series for event in calendar', async () => {
      const createDto: CreateEventSeriesDto = {
        timezone: 'Europe/Berlin',
        rrule: 'FREQ=WEEKLY;BYDAY=MO',
        validFrom: '2024-01-01T00:00:00Z',
      };
      const result = await controller.create('calendar-1', 'event-1', createDto);
      expect(mockEventService.findOne).toHaveBeenCalledWith('event-1');
      expect(mockSeriesService.create).toHaveBeenCalledWith({
        ...createDto,
        eventId: 'event-1',
      });
      expect(result).toEqual(mockSeriesDto);
    });

    it('should throw NotFoundException if event not in calendar', async () => {
      mockEventService.findOne.mockResolvedValueOnce({
        ...mockEventDto,
        calendarId: 'different-calendar',
      });
      const createDto: CreateEventSeriesDto = {
        timezone: 'Europe/Berlin',
        rrule: 'FREQ=WEEKLY;BYDAY=MO',
        validFrom: '2024-01-01T00:00:00Z',
      };
      await expect(
        controller.create('calendar-1', 'event-1', createDto),
      ).rejects.toThrow("Event with ID 'event-1' not found in calendar 'calendar-1'");
    });

    it('should derive validFrom from the event startAt when omitted', async () => {
      const createDto: CreateEventSeriesDto = {
        timezone: 'Europe/Berlin',
        rrule: 'FREQ=WEEKLY;BYDAY=MO',
      };
      await controller.create('calendar-1', 'event-1', createDto);
      expect(mockSeriesService.create).toHaveBeenCalledWith({
        ...createDto,
        eventId: 'event-1',
        validFrom: mockEventDto.startAt,
      });
    });

    it('should throw BadRequestException if validFrom does not match the event startAt', async () => {
      const createDto: CreateEventSeriesDto = {
        timezone: 'Europe/Berlin',
        rrule: 'FREQ=WEEKLY;BYDAY=MO',
        validFrom: '2025-01-01T00:00:00Z',
      };
      await expect(
        controller.create('calendar-1', 'event-1', createDto),
      ).rejects.toThrow(BadRequestException);
      expect(mockSeriesService.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a series by ID for event in calendar', async () => {
      const result = await controller.findOne('calendar-1', 'event-1', 'test-id');
      expect(mockSeriesService.findOne).toHaveBeenCalledWith('test-id');
      expect(result).toEqual(mockSeriesDto);
    });

    it('should throw NotFoundException if series not for event', async () => {
      mockSeriesService.findOne.mockResolvedValueOnce({
        ...mockSeriesDto,
        eventId: 'different-event',
      });
      await expect(
        controller.findOne('calendar-1', 'event-1', 'test-id'),
      ).rejects.toThrow("Series with ID 'test-id' not found for event 'event-1'");
    });
  });

  describe('update', () => {
    it('should update a series for event in calendar', async () => {
      const updateDto: Partial<CreateEventSeriesDto> = { rrule: 'FREQ=DAILY' };
      const result = await controller.update('calendar-1', 'event-1', 'test-id', updateDto);
      expect(mockSeriesService.findOne).toHaveBeenCalledWith('test-id');
      expect(mockSeriesService.update).toHaveBeenCalledWith('test-id', updateDto);
      expect(result).toEqual(mockSeriesDto);
    });

    it('should throw NotFoundException if series not for event', async () => {
      mockSeriesService.findOne.mockResolvedValueOnce({
        ...mockSeriesDto,
        eventId: 'different-event',
      });
      await expect(
        controller.update('calendar-1', 'event-1', 'test-id', {}),
      ).rejects.toThrow("Series with ID 'test-id' not found for event 'event-1'");
    });

    it('should throw BadRequestException if validFrom does not match the event startAt', async () => {
      const updateDto: Partial<CreateEventSeriesDto> = { validFrom: '2025-01-01T00:00:00Z' };
      await expect(
        controller.update('calendar-1', 'event-1', 'test-id', updateDto),
      ).rejects.toThrow(BadRequestException);
      expect(mockSeriesService.update).not.toHaveBeenCalled();
    });

    it('should allow updating validFrom when it matches the event startAt', async () => {
      const updateDto: Partial<CreateEventSeriesDto> = { validFrom: mockEventDto.startAt };
      await controller.update('calendar-1', 'event-1', 'test-id', updateDto);
      expect(mockSeriesService.update).toHaveBeenCalledWith('test-id', updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a series from event in calendar', async () => {
      await controller.remove('calendar-1', 'event-1', 'test-id');
      expect(mockSeriesService.findOne).toHaveBeenCalledWith('test-id');
      expect(mockSeriesService.remove).toHaveBeenCalledWith('test-id');
    });

    it('should throw NotFoundException if series not for event', async () => {
      mockSeriesService.findOne.mockResolvedValueOnce({
        ...mockSeriesDto,
        eventId: 'different-event',
      });
      await expect(
        controller.remove('calendar-1', 'event-1', 'test-id'),
      ).rejects.toThrow("Series with ID 'test-id' not found for event 'event-1'");
    });
  });
});
