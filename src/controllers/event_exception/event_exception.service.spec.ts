import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventException } from '../../database/entities/event_exception.entity.js';
import { EventExceptionService } from './event_exception.service.js';
import { CreateEventExceptionDto } from '../../models/event_exception/CreateEventExceptionDto.js';

const mockException: EventException = {
  id: 'test-id',
  externalId: 'ext-123',
  eventSeriesId: 'series-1',
  eventSeries: null,
  originalStart: '2024-01-01T00:00:00Z',
  isMoved: false,
  isCancelled: true,
  newEventId: null,
  newEvent: null,
  creationTime: new Date(),
  deletionTime: null,
};

const mockRepository = {
  create: vi.fn().mockReturnValue(mockException),
  save: vi.fn().mockResolvedValue(mockException),
  find: vi.fn().mockResolvedValue([mockException]),
  findOne: vi.fn().mockResolvedValue(mockException),
  findAndCount: vi.fn().mockResolvedValue([[mockException], 1]),
  update: vi.fn().mockResolvedValue({ affected: 1, raw: {} }),
  softDelete: vi.fn().mockResolvedValue({ affected: 1, raw: {} }),
};

describe('EventExceptionService', () => {
  let service: EventExceptionService;
  let repository: Repository<EventException>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventExceptionService,
        {
          provide: getRepositoryToken(EventException),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<EventExceptionService>(EventExceptionService);
    repository = module.get<Repository<EventException>>(getRepositoryToken(EventException));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an exception', async () => {
      const createDto: CreateEventExceptionDto & { eventSeriesId: string } = {
        eventSeriesId: 'series-1',
        externalId: 'ext-123',
        isMoved: false,
        isCancelled: true,
        newEventId: null,
      };

      const result = await service.create(createDto);

      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalled();
      expect(result.id).toBe('test-id');
    });
  });

  describe('findAllPaginated', () => {
    it('should return paginated exceptions', async () => {
      const [items, total] = await service.findAllPaginated(1, 25);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 25,
      });
      expect(items.length).toBe(1);
      expect(total).toBe(1);
    });
  });

  describe('findBySeries', () => {
    it('should return paginated exceptions for series', async () => {
      const [items, total] = await service.findBySeries('series-1', 1, 25);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { eventSeriesId: 'series-1' },
        skip: 0,
        take: 25,
      });
      expect(items.length).toBe(1);
      expect(total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should find exception by ID', async () => {
      const result = await service.findOne('test-id');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        relations: { eventSeries: true, newEvent: true },
      });
      expect(result.id).toBe('test-id');
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne('non-existent')).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update an exception', async () => {
      const updateDto: Partial<CreateEventExceptionDto> = { isCancelled: false };
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
    it('should soft delete an exception', async () => {
      await service.remove('test-id');
      expect(repository.softDelete).toHaveBeenCalledWith('test-id');
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.softDelete.mockResolvedValueOnce({ affected: 0, raw: {} });
      await expect(service.remove('non-existent')).rejects.toThrow();
    });
  });
});
