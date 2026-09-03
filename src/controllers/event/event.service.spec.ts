import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Event } from '../../database/entities/event.entity.js';
import { EventSeries } from '../../database/entities/event_series.entity.js';
import { EventService } from './event.service.js';
import { CreateEventDto } from '../../models/event/CreateEventDto.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockEvent: Event = {
  id: 'test-id',
  calendarId: 'calendar-1',
  title: 'Test Event',
  description: 'Test Description',
  externalId: 'ext-123',
  timezone: 'Europe/Berlin',
  startAt: '2024-01-01T10:00:00Z',
  endAt: '2024-01-01T11:00:00Z',
  metadata: { source: 'import', tags: ['a', 'b'] },
  creationTime: new Date(),
  deletionTime: null,
  calendar: null,
};

const mockRepository = {
  create: vi.fn().mockReturnValue(mockEvent),
  save: vi.fn().mockResolvedValue(mockEvent),
  find: vi.fn().mockResolvedValue([mockEvent]),
  findOne: vi.fn().mockResolvedValue(mockEvent),
  findAndCount: vi.fn().mockResolvedValue([[mockEvent], 1]),
  update: vi.fn().mockResolvedValue({ affected: 1, raw: {} }),
  softDelete: vi.fn().mockResolvedValue({ affected: 1, raw: {} }),
};

const mockEventSeriesRepository = {
  update: vi.fn().mockResolvedValue({ affected: 1, raw: {} }),
};

describe('EventService', () => {
  let service: EventService;
  let repository: Repository<Event>;
  let eventSeriesRepository: Repository<EventSeries>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: getRepositoryToken(Event),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(EventSeries),
          useValue: mockEventSeriesRepository,
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
    repository = module.get<Repository<Event>>(getRepositoryToken(Event));
    eventSeriesRepository = module.get<Repository<EventSeries>>(getRepositoryToken(EventSeries));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an event', async () => {
      const createDto: CreateEventDto & { calendarId: string } = {
        calendarId: 'calendar-1',
        title: 'Test Event',
        startAt: '2024-01-01T10:00:00Z',
      };

      const result = await service.create(createDto);

      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalled();
      expect(result.id).toBe('test-id');
    });
  });

  describe('findOne', () => {
    it('should find event by ID', async () => {
      const result = await service.findOne('test-id');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        relations: { calendar: true },
      });
      expect(result.id).toBe('test-id');
    });

    it('should include metadata in the mapped DTO', async () => {
      const result = await service.findOne('test-id');
      expect(result.metadata).toEqual({ source: 'import', tags: ['a', 'b'] });
    });

    it('should map a missing metadata column to null', async () => {
      mockRepository.findOne.mockResolvedValueOnce({ ...mockEvent, metadata: undefined });
      const result = await service.findOne('test-id');
      expect(result.metadata).toBeNull();
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne('non-existent')).rejects.toThrow();
    });
  });

  describe('findByCalendar', () => {
    it('should return paginated events for calendar', async () => {
      const [items, total] = await service.findByCalendar('calendar-1', 1, 25);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { calendarId: 'calendar-1' },
        skip: 0,
        take: 25,
        order: { startAt: 'ASC' },
      });
      expect(items.length).toBe(1);
      expect(total).toBe(1);
    });
  });

  describe('update', () => {
    it('should update an event', async () => {
      const updateDto: Partial<CreateEventDto> = { title: 'Updated Event' };
      const result = await service.update('test-id', updateDto);
      expect(repository.update).toHaveBeenCalledWith('test-id', updateDto);
      expect(result.id).toBe('test-id');
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.update('non-existent', {})).rejects.toThrow();
    });

    it('should not touch series when startAt is not part of the update', async () => {
      const updateDto: Partial<CreateEventDto> = { title: 'Updated Event' };
      await service.update('test-id', updateDto);
      expect(eventSeriesRepository.update).not.toHaveBeenCalled();
    });

    it("should shift the series' validFrom along with the event's startAt", async () => {
      const newStartAt = new Date('2024-02-01T10:00:00Z');
      const updateDto: Partial<CreateEventDto> = { startAt: newStartAt };

      await service.update('test-id', updateDto);

      expect(eventSeriesRepository.update).toHaveBeenCalledWith(
        { eventId: 'test-id', deletionTime: IsNull() },
        { validFrom: newStartAt },
      );
    });
  });

  describe('remove', () => {
    it('should soft delete an event', async () => {
      await service.remove('test-id');
      expect(repository.softDelete).toHaveBeenCalledWith('test-id');
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.softDelete.mockResolvedValueOnce({ affected: 0, raw: {} });
      await expect(service.remove('non-existent')).rejects.toThrow();
    });
  });
});
