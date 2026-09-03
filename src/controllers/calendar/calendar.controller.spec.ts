import { Test, TestingModule } from '@nestjs/testing';
import { CalendarController } from './calendar.controller.js';
import { CalendarService } from './calendar.service.js';
import { CreateCalendarDto } from '../../models/calendar/CreateCalendarDto.js';
import { CalendarDto } from '../../models/calendar/CalendarDto.js';
import { Role } from '../../constants/role.enum.js';
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

const mockCalendarDto: CalendarDto = {
  id: 'test-id',
  name: 'Test Calendar',
  defaultTimezone: 'Europe/Berlin',
  externalId: 'ext-123',
  creationTime: new Date(),
  deletionTime: null,
};

const mockService = {
  create: vi.fn().mockResolvedValue(mockCalendarDto),
  findAllPaginated: vi.fn().mockResolvedValue([[mockCalendarDto], 1]),
  findOne: vi.fn().mockResolvedValue(mockCalendarDto),
  update: vi.fn().mockResolvedValue(mockCalendarDto),
  remove: vi.fn().mockResolvedValue(undefined),
};

describe('CalendarController', () => {
  let controller: CalendarController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalendarController],
      providers: [
        {
          provide: CalendarService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useClass(MockAuthGuard)
      .overrideGuard(Roles)
      .useClass(MockRolesDecorator)
      .compile();

    controller = module.get<CalendarController>(CalendarController);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a calendar', async () => {
      const createDto: CreateCalendarDto = {
        name: 'Test Calendar',
        defaultTimezone: 'Europe/Berlin',
      };
      const result = await controller.create(createDto);
      expect(mockService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockCalendarDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated calendars', async () => {
      const result = await controller.findAll(1, 25);
      expect(mockService.findAllPaginated).toHaveBeenCalledWith(1, 25);
      expect(result.data.length).toBe(1);
      expect(result.metadata.totalItems).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a calendar by ID', async () => {
      const result = await controller.findOne('test-id');
      expect(mockService.findOne).toHaveBeenCalledWith('test-id');
      expect(result).toEqual(mockCalendarDto);
    });
  });

  describe('update', () => {
    it('should update a calendar', async () => {
      const updateDto: Partial<CreateCalendarDto> = { name: 'Updated Calendar' };
      const result = await controller.update('test-id', updateDto);
      expect(mockService.update).toHaveBeenCalledWith('test-id', updateDto);
      expect(result).toEqual(mockCalendarDto);
    });
  });

  describe('remove', () => {
    it('should remove a calendar', async () => {
      await controller.remove('test-id');
      expect(mockService.remove).toHaveBeenCalledWith('test-id');
    });
  });
});
