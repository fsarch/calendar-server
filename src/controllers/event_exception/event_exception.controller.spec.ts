import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventExceptionController } from './event_exception.controller.js';
import { EventExceptionService } from './event_exception.service.js';
import { EventSeriesService } from '../event_series/event_series.service.js';
import { EventService } from '../event/event.service.js';
import { CreateEventExceptionDto } from '../../models/event_exception/CreateEventExceptionDto.js';
import { EventExceptionDto } from '../../models/event_exception/EventExceptionDto.js';
import { EventSeriesDto } from '../../models/event_series/EventSeriesDto.js';
import { EventDto } from '../../models/event/EventDto.js';
import { AuthGuard } from '@fsarch/server/auth';
import { Roles } from '@fsarch/server/uac';

const mockExceptionDto: EventExceptionDto = {
  id: 'exception-1',
  externalId: 'ext-123',
  eventSeriesId: 'series-1',
  originalStart: '2024-01-01T00:00:00Z',
  isMoved: false,
  isCancelled: true,
  newEventId: null,
  creationTime: new Date(),
  deletionTime: null,
};

const mockSeriesDto: EventSeriesDto = {
  id: 'series-1',
  eventId: 'event-1',
  externalId: 'ext-series-123',
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
  startAt: new Date(),
  endAt: null,
  creationTime: new Date(),
  deletionTime: null,
};

const mockExceptionService = {
  create: vi.fn().mockResolvedValue(mockExceptionDto),
  findBySeries: vi.fn().mockResolvedValue([[mockExceptionDto], 1]),
  findOne: vi.fn().mockResolvedValue(mockExceptionDto),
  update: vi.fn().mockResolvedValue(mockExceptionDto),
  remove: vi.fn().mockResolvedValue(undefined),
};

const mockSeriesService = {
  findOne: vi.fn().mockResolvedValue(mockSeriesDto),
};

const mockEventService = {
  findOne: vi.fn().mockResolvedValue(mockEventDto),
};

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

describe('EventExceptionController', () => {
  let controller: EventExceptionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventExceptionController],
      providers: [
        {
          provide: EventExceptionService,
          useValue: mockExceptionService,
        },
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

    controller = module.get<EventExceptionController>(EventExceptionController);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllBySeries', () => {
    it('should return paginated exceptions for series in event in calendar', async () => {
      const result = await controller.findAllBySeries('calendar-1', 'event-1', 'series-1', 1, 25);
      expect(mockEventService.findOne).toHaveBeenCalledWith('event-1');
      expect(mockSeriesService.findOne).toHaveBeenCalledWith('series-1');
      expect(mockExceptionService.findBySeries).toHaveBeenCalledWith('series-1', 1, 25);
      expect(result.data.length).toBe(1);
      expect(result.metadata.totalItems).toBe(1);
    });

    it('should throw NotFoundException if event not in calendar', async () => {
      mockEventService.findOne.mockResolvedValueOnce({
        ...mockEventDto,
        calendarId: 'different-calendar',
      });
      await expect(
        controller.findAllBySeries('calendar-1', 'event-1', 'series-1', 1, 25),
      ).rejects.toThrow("Event with ID 'event-1' not found in calendar 'calendar-1'");
    });

    it('should throw NotFoundException if series not for event', async () => {
      mockSeriesService.findOne.mockResolvedValueOnce({
        ...mockSeriesDto,
        eventId: 'different-event',
      });
      await expect(
        controller.findAllBySeries('calendar-1', 'event-1', 'series-1', 1, 25),
      ).rejects.toThrow("Series with ID 'series-1' not found for event 'event-1'");
    });
  });

  describe('create', () => {
    it('should create an exception for series in event in calendar', async () => {
      const createDto: CreateEventExceptionDto = {
        externalId: 'new-ext-123',
        isMoved: true,
        isCancelled: false,
        newEventId: 'new-event-1',
      };
      const result = await controller.create('calendar-1', 'event-1', 'series-1', createDto);
      expect(mockEventService.findOne).toHaveBeenCalledWith('event-1');
      expect(mockSeriesService.findOne).toHaveBeenCalledWith('series-1');
      expect(mockExceptionService.create).toHaveBeenCalledWith({
        ...createDto,
        eventSeriesId: 'series-1',
      });
      expect(result).toEqual(mockExceptionDto);
    });

    it('should throw NotFoundException if event not in calendar', async () => {
      mockEventService.findOne.mockResolvedValueOnce({
        ...mockEventDto,
        calendarId: 'different-calendar',
      });
      const createDto: CreateEventExceptionDto = {
        isMoved: false,
        isCancelled: true,
      };
      await expect(
        controller.create('calendar-1', 'event-1', 'series-1', createDto),
      ).rejects.toThrow("Event with ID 'event-1' not found in calendar 'calendar-1'");
    });

    it('should throw NotFoundException if series not for event', async () => {
      mockSeriesService.findOne.mockResolvedValueOnce({
        ...mockSeriesDto,
        eventId: 'different-event',
      });
      const createDto: CreateEventExceptionDto = {
        isMoved: false,
        isCancelled: true,
      };
      await expect(
        controller.create('calendar-1', 'event-1', 'series-1', createDto),
      ).rejects.toThrow("Series with ID 'series-1' not found for event 'event-1'");
    });
  });

  describe('findOne', () => {
    it('should return an exception by ID for series in event', async () => {
      const result = await controller.findOne('calendar-1', 'event-1', 'series-1', 'exception-1');
      expect(mockExceptionService.findOne).toHaveBeenCalledWith('exception-1');
      expect(result).toEqual(mockExceptionDto);
    });

    it('should throw NotFoundException if exception not for series', async () => {
      mockExceptionService.findOne.mockResolvedValueOnce({
        ...mockExceptionDto,
        eventSeriesId: 'different-series',
      });
      await expect(
        controller.findOne('calendar-1', 'event-1', 'series-1', 'exception-1'),
      ).rejects.toThrow("Exception with ID 'exception-1' not found for series 'series-1'");
    });
  });

  describe('update', () => {
    it('should update an exception for series in event', async () => {
      const updateDto: Partial<CreateEventExceptionDto> = { isCancelled: false };
      const result = await controller.update('calendar-1', 'event-1', 'series-1', 'exception-1', updateDto);
      expect(mockExceptionService.findOne).toHaveBeenCalledWith('exception-1');
      expect(mockExceptionService.update).toHaveBeenCalledWith('exception-1', updateDto);
      expect(result).toEqual(mockExceptionDto);
    });

    it('should throw NotFoundException if exception not for series', async () => {
      mockExceptionService.findOne.mockResolvedValueOnce({
        ...mockExceptionDto,
        eventSeriesId: 'different-series',
      });
      await expect(
        controller.update('calendar-1', 'event-1', 'series-1', 'exception-1', {}),
      ).rejects.toThrow("Exception with ID 'exception-1' not found for series 'series-1'");
    });
  });

  describe('remove', () => {
    it('should remove an exception from series in event', async () => {
      await controller.remove('calendar-1', 'event-1', 'series-1', 'exception-1');
      expect(mockExceptionService.findOne).toHaveBeenCalledWith('exception-1');
      expect(mockExceptionService.remove).toHaveBeenCalledWith('exception-1');
    });

    it('should throw NotFoundException if exception not for series', async () => {
      mockExceptionService.findOne.mockResolvedValueOnce({
        ...mockExceptionDto,
        eventSeriesId: 'different-series',
      });
      await expect(
        controller.remove('calendar-1', 'event-1', 'series-1', 'exception-1'),
      ).rejects.toThrow("Exception with ID 'exception-1' not found for series 'series-1'");
    });
  });
});
