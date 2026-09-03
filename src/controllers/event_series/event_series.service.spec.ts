import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventSeries } from '../../database/entities/event_series.entity.js';
import { EventSeriesService } from './event_series.service.js';
import { CreateEventSeriesDto } from '../../models/event_series/CreateEventSeriesDto.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockSeries: EventSeries = {
  id: 'test-id',
  eventId: 'event-1',
  event: null,
  externalId: 'ext-123',
  timezone: 'Europe/Berlin',
  rrule: 'FREQ=WEEKLY;BYDAY=MO',
  validFrom: '2024-01-01T00:00:00Z',
  validTo: null,
  creationTime: new Date(),
  deletionTime: null,
};

const mockRepository = {
  create: vi.fn().mockReturnValue(mockSeries),
  save: vi.fn().mockResolvedValue(mockSeries),
  find: vi.fn().mockResolvedValue([mockSeries]),
  findOne: vi.fn().mockResolvedValue(mockSeries),
  findAndCount: vi.fn().mockResolvedValue([[mockSeries], 1]),
  update: vi.fn().mockResolvedValue({ affected: 1, raw: {} }),
  softDelete: vi.fn().mockResolvedValue({ affected: 1, raw: {} }),
};

describe('EventSeriesService', () => {
  let service: EventSeriesService;
  let repository: Repository<EventSeries>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventSeriesService,
        {
          provide: getRepositoryToken(EventSeries),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<EventSeriesService>(EventSeriesService);
    repository = module.get<Repository<EventSeries>>(getRepositoryToken(EventSeries));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a series', async () => {
      const createDto: CreateEventSeriesDto & { eventId: string } = {
        eventId: 'event-1',
        timezone: 'Europe/Berlin',
        rrule: 'FREQ=WEEKLY;BYDAY=MO',
        validFrom: '2024-01-01T00:00:00Z',
      };

      const result = await service.create(createDto);

      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalled();
      expect(result.id).toBe('test-id');
    });
  });

  describe('findOne', () => {
    it('should find series by ID', async () => {
      const result = await service.findOne('test-id');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        relations: { event: true },
      });
      expect(result.id).toBe('test-id');
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne('non-existent')).rejects.toThrow();
    });
  });

  describe('findByEvent', () => {
    it('should return paginated series for event', async () => {
      const [items, total] = await service.findByEvent('event-1', 1, 25);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { eventId: 'event-1' },
        skip: 0,
        take: 25,
      });
      expect(items.length).toBe(1);
      expect(total).toBe(1);
    });
  });

  describe('update', () => {
    it('should update a series', async () => {
      const updateDto: Partial<CreateEventSeriesDto> = { rrule: 'FREQ=DAILY' };
      const result = await service.update('test-id', updateDto);
      expect(repository.update).toHaveBeenCalledWith('test-id', updateDto);
      expect(result.id).toBe('test-id');
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.update('non-existent', {})).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('should soft delete a series', async () => {
      await service.remove('test-id');
      expect(repository.softDelete).toHaveBeenCalledWith('test-id');
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.softDelete.mockResolvedValueOnce({ affected: 0, raw: {} });
      await expect(service.remove('non-existent')).rejects.toThrow();
    });
  });
});
