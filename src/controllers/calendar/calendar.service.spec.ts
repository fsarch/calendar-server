import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Calendar } from '../../database/entities/calendar.entity.js';
import { CalendarService } from './calendar.service.js';
import { CreateCalendarDto } from '../../models/calendar/CreateCalendarDto.js';

const mockCalendar: Calendar = {
  id: 'test-id',
  name: 'Test Calendar',
  defaultTimezone: 'Europe/Berlin',
  externalId: 'ext-123',
  creationTime: new Date(),
  deletionTime: null,
};

const mockRepository = {
  create: vi.fn().mockReturnValue(mockCalendar),
  save: vi.fn().mockResolvedValue(mockCalendar),
  find: vi.fn().mockResolvedValue([mockCalendar]),
  findOne: vi.fn().mockResolvedValue(mockCalendar),
  findAndCount: vi.fn().mockResolvedValue([[mockCalendar], 1]),
  update: vi.fn().mockResolvedValue({ affected: 1, raw: {} }),
  softDelete: vi.fn().mockResolvedValue({ affected: 1, raw: {} }),
};

describe('CalendarService', () => {
  let service: CalendarService;
  let repository: Repository<Calendar>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        {
          provide: getRepositoryToken(Calendar),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
    repository = module.get<Repository<Calendar>>(getRepositoryToken(Calendar));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a calendar', async () => {
      const createDto: CreateCalendarDto = {
        name: 'Test Calendar',
        defaultTimezone: 'Europe/Berlin',
      };

      const result = await service.create(createDto);

      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalled();
      expect(result.id).toBe('test-id');
    });

    it('should throw ConflictException if externalId exists', async () => {
      mockRepository.findOne.mockResolvedValueOnce(mockCalendar);
      const createDto: CreateCalendarDto = {
        name: 'Test',
        defaultTimezone: 'Europe/Berlin',
        externalId: 'ext-123',
      };

      await expect(service.create(createDto)).rejects.toThrow();
    });
  });

  describe('findOne', () => {
    it('should find calendar by ID', async () => {
      const result = await service.findOne('test-id');
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 'test-id' } });
      expect(result.id).toBe('test-id');
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne('non-existent')).rejects.toThrow();
    });
  });

  describe('findAllPaginated', () => {
    it('should return paginated calendars', async () => {
      const [items, total] = await service.findAllPaginated(1, 25);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 25,
      });
      expect(items.length).toBe(1);
      expect(total).toBe(1);
    });
  });

  describe('update', () => {
    it('should update a calendar', async () => {
      const updateDto: Partial<CreateCalendarDto> = { name: 'Updated Calendar' };
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
    it('should soft delete a calendar', async () => {
      await service.remove('test-id');
      expect(repository.softDelete).toHaveBeenCalledWith('test-id');
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.softDelete.mockResolvedValueOnce({ affected: 0, raw: {} });
      await expect(service.remove('non-existent')).rejects.toThrow();
    });
  });
});
