import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../../database/entities/event.entity.js';
import { EventSeries } from '../../database/entities/event_series.entity.js';
import { EventException } from '../../database/entities/event_exception.entity.js';
import { EventExpanderService, ExpandedEvent } from './event-expander.service.js';
import { EventService } from './event.service.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockEvent: Event = {
  id: 'event-1',
  calendarId: 'calendar-1',
  title: 'Test Event',
  description: 'Test Description',
  externalId: 'ext-123',
  timezone: 'Europe/Berlin',
  startAt: new Date('2024-01-01T10:00:00Z'),
  endAt: new Date('2024-01-01T11:00:00Z'),
  metadata: { source: 'import' },
  creationTime: new Date(),
  deletionTime: null,
  calendar: null,
};

const mockSeries: EventSeries = {
  id: 'series-1',
  eventId: 'event-1',
  event: mockEvent,
  externalId: 'series-ext-123',
  timezone: 'Europe/Berlin',
  rrule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR',
  validFrom: new Date('2024-01-01T00:00:00Z'),
  validTo: null,
  creationTime: new Date(),
  deletionTime: null,
};

const mockException: EventException = {
  id: 'exception-1',
  externalId: 'exception-ext-123',
  eventSeriesId: 'series-1',
  eventSeries: mockSeries,
  originalStart: new Date('2024-01-01T10:00:00Z'),
  isMoved: false,
  isCancelled: true,
  newEventId: null,
  newEvent: null,
  creationTime: new Date(),
  deletionTime: null,
};

const mockEventRepository = {
  find: vi.fn().mockResolvedValue([mockEvent]),
};

const mockSeriesRepository = {
  find: vi.fn().mockResolvedValue([mockSeries]),
};

const mockExceptionRepository = {
  find: vi.fn().mockResolvedValue([mockException]),
};

const mockEventService = {
  findOne: vi.fn().mockResolvedValue(mockEvent),
};

describe('EventExpanderService', () => {
  let service: EventExpanderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventExpanderService,
        {
          provide: getRepositoryToken(Event),
          useValue: mockEventRepository,
        },
        {
          provide: getRepositoryToken(EventSeries),
          useValue: mockSeriesRepository,
        },
        {
          provide: getRepositoryToken(EventException),
          useValue: mockExceptionRepository,
        },
        {
          provide: EventService,
          useValue: mockEventService,
        },
      ],
    }).compile();

    service = module.get<EventExpanderService>(EventExpanderService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getExpandedEventsForCalendar', () => {
    it('should return events for calendar in time range', async () => {
      const from = new Date('2024-01-01T00:00:00Z');
      const to = new Date('2024-01-31T23:59:59Z');

      // Mock für directEvents
      mockEventRepository.find.mockResolvedValueOnce([mockEvent]);
      // Mock für series
      mockSeriesRepository.find.mockResolvedValueOnce([mockSeries]);
      // Mock für exceptions
      mockExceptionRepository.find.mockResolvedValueOnce([mockException]);

      const result = await service.getExpandedEventsForCalendar('calendar-1', from, to);

      expect(mockEventRepository.find).toHaveBeenCalled();
      expect(mockSeriesRepository.find).toHaveBeenCalled();
      expect(mockExceptionRepository.find).toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should not list the series master event twice (direct + first occurrence)', async () => {
      const from = new Date('2024-01-01T00:00:00Z');
      const to = new Date('2024-01-01T23:59:59Z');

      // Master-Event liegt genau auf validFrom der Serie (wie von EventSeriesController
      // erzwungen) -> erste RRule-Instanz faellt auf denselben Zeitpunkt wie das direkte Event.
      const seriesAtEventStart: EventSeries = { ...mockSeries, validFrom: mockEvent.startAt };
      mockEventRepository.find.mockResolvedValueOnce([mockEvent]);
      mockSeriesRepository.find.mockResolvedValueOnce([seriesAtEventStart]);
      mockExceptionRepository.find.mockResolvedValueOnce([]);

      const result = await service.getExpandedEventsForCalendar('calendar-1', from, to);

      const atStart = result.filter((e) => e.startAt.getTime() === mockEvent.startAt.getTime());
      expect(atStart.length).toBe(1);
      expect(atStart[0].isRecurring).toBe(true);
    });

    it('should filter direct events outside time range', async () => {
      const from = new Date('2024-02-01T00:00:00Z');
      const to = new Date('2024-02-28T23:59:59Z');

      // Event ist im Januar, also außerhalb des Bereichs
      mockEventRepository.find.mockResolvedValueOnce([mockEvent]);
      mockSeriesRepository.find.mockResolvedValueOnce([]);
      mockExceptionRepository.find.mockResolvedValueOnce([]);

      const result = await service.getExpandedEventsForCalendar('calendar-1', from, to);

      // Das Event sollte gefiltert werden
      expect(result.length).toBe(0);
    });
  });

  describe('expandSeries', () => {
    it('should expand series into instances', () => {
      const from = new Date('2024-01-01T00:00:00Z');
      const to = new Date('2024-01-07T23:59:59Z');

      const result = service['expandSeries'](mockSeries, from, to);

      expect(Array.isArray(result)).toBe(true);
      // Sollte mehrere Instanzen für MO,WE,FR in der Woche generieren
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].isRecurring).toBe(true);
      expect(result[0].recurringInstanceOf).toBe('event-1');
    });

    it('should carry the master event metadata onto each instance', () => {
      const from = new Date('2024-01-01T00:00:00Z');
      const to = new Date('2024-01-07T23:59:59Z');

      const result = service['expandSeries'](mockSeries, from, to);

      expect(result.length).toBeGreaterThan(0);
      expect(result.every((e) => e.metadata === mockEvent.metadata)).toBe(true);
    });

    it('should keep instances on the correct local weekday when the local time is near the UTC day boundary', () => {
      // Lokale Zeit Europe/Berlin: Montag 2024-01-01 00:30 (CET, UTC+1) -> UTC-Instant:
      // Sonntag 2023-12-31 23:30Z. Ohne Timezone-Korrektur wuerde rrule den UTC-Wochentag
      // (Sonntag) fuer BYDAY=MO,WE,FR heranziehen und die ganze Serie faelschlich auf
      // Di/Do/Sa verschieben statt Mo/Mi/Fr.
      const midnightSeries: EventSeries = {
        ...mockSeries,
        timezone: 'Europe/Berlin',
        validFrom: new Date('2023-12-31T23:30:00Z'),
        event: { ...mockEvent, startAt: new Date('2023-12-31T23:30:00Z'), endAt: null },
      };

      const from = new Date('2023-12-25T00:00:00Z');
      const to = new Date('2024-01-06T23:59:59Z');

      const result = service['expandSeries'](midnightSeries, from, to);

      const berlinWeekdays = result.map(
        (e) => new Date(e.startAt).toLocaleString('en-US', { timeZone: 'Europe/Berlin', weekday: 'short' }),
      );
      expect(berlinWeekdays).toEqual(['Mon', 'Wed', 'Fri']);
      expect(result[0].startAt.toISOString()).toBe('2023-12-31T23:30:00.000Z');
    });

    it('should calculate endAt based on original event duration', () => {
      const from = new Date('2024-01-01T00:00:00Z');
      const to = new Date('2024-01-01T23:59:59Z');

      const result = service['expandSeries'](mockSeries, from, to);

      expect(result.length).toBeGreaterThan(0);
      // duration = 1 Stunde (11:00 - 10:00)
      if (result.length > 0 && result[0].endAt) {
        const durationMs = result[0].endAt.getTime() - result[0].startAt.getTime();
        expect(durationMs).toBe(3600000); // 1 Stunde in ms
      }
    });
  });

  describe('applyExceptions', () => {
    it('should remove cancelled instances', () => {
      const events: ExpandedEvent[] = [
        {
          id: 'event-1-1700000000000',
          calendarId: 'calendar-1',
          startAt: new Date('2024-01-01T10:00:00Z'),
          isRecurring: true,
          recurringInstanceOf: 'event-1',
          isException: false,
        },
      ];

      const exceptions = [
        {
          ...mockException,
          originalStart: new Date('2024-01-01T10:00:00Z'),
          isCancelled: true,
        },
      ] as EventException[];

      const result = service['applyExceptions'](events, exceptions);

      // Die Instanz sollte entfernt sein
      expect(result.length).toBe(0);
    });

    it('should replace moved instances', () => {
      const events: ExpandedEvent[] = [
        {
          id: 'event-1-1700000000000',
          calendarId: 'calendar-1',
          startAt: new Date('2024-01-01T10:00:00Z'),
          isRecurring: true,
          recurringInstanceOf: 'event-1',
          isException: false,
        },
      ];

      const newEvent = {
        ...mockEvent,
        id: 'new-event-1',
        title: 'Moved Event',
      };

      const exceptions = [
        {
          ...mockException,
          originalStart: new Date('2024-01-01T10:00:00Z'),
          isCancelled: false,
          isMoved: true,
          newEventId: 'new-event-1',
          newEvent,
        },
      ] as EventException[];

      mockEventService.findOne = vi.fn().mockResolvedValue(newEvent);

      const result = service['applyExceptions'](events, exceptions);

      expect(result.length).toBe(1);
      expect(result[0].isException).toBe(true);
      expect(result[0].exceptionType).toBe('moved');
      expect(result[0].id).toBe('new-event-1');
    });
  });
});
