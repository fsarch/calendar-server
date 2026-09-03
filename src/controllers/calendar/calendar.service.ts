import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Calendar } from '../../database/entities/calendar.entity.js';
import { CreateCalendarDto } from '../../models/calendar/CreateCalendarDto.js';
import { CalendarDto } from '../../models/calendar/CalendarDto.js';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(Calendar)
    private readonly calendarRepository: Repository<Calendar>,
  ) {}

  async create(createDto: CreateCalendarDto): Promise<CalendarDto> {
    // Check if externalId already exists
    if (createDto.externalId) {
      const existing = await this.calendarRepository.findOne({
        where: { externalId: createDto.externalId } as FindOptionsWhere<Calendar>,
      });

      if (existing) {
        throw new ConflictException(
          `Calendar with externalId '${createDto.externalId}' already exists`,
        );
      }
    }

    const calendar = this.calendarRepository.create(createDto);
    const saved = await this.calendarRepository.save(calendar);
    return this.mapToDto(saved);
  }

  async findAllPaginated(page: number = 1, pageSize: number = 25): Promise<[CalendarDto[], number]> {
    const skip = (page - 1) * pageSize;
    const [calendars, total] = await this.calendarRepository.findAndCount({
      skip,
      take: pageSize,
    });
    return [calendars.map(this.mapToDto), total];
  }

  async findOne(id: string): Promise<CalendarDto> {
    const calendar = await this.calendarRepository.findOne({
      where: { id } as FindOptionsWhere<Calendar>,
    });

    if (!calendar) {
      throw new NotFoundException(`Calendar with ID '${id}' not found`);
    }

    return this.mapToDto(calendar);
  }

  async findByExternalId(externalId: string): Promise<CalendarDto> {
    const calendar = await this.calendarRepository.findOne({
      where: { externalId } as FindOptionsWhere<Calendar>,
    });

    if (!calendar) {
      throw new NotFoundException(`Calendar with externalId '${externalId}' not found`);
    }

    return this.mapToDto(calendar);
  }

  async update(id: string, updateDto: Partial<CreateCalendarDto>): Promise<CalendarDto> {
    await this.calendarRepository.update(id, updateDto);
    const updated = await this.calendarRepository.findOne({
      where: { id } as FindOptionsWhere<Calendar>,
    });

    if (!updated) {
      throw new NotFoundException(`Calendar with ID '${id}' not found`);
    }

    return this.mapToDto(updated);
  }

  async remove(id: string): Promise<void> {
    const result = await this.calendarRepository.softDelete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Calendar with ID '${id}' not found`);
    }
  }

  private mapToDto(calendar: Calendar): CalendarDto {
    return {
      id: calendar.id,
      name: calendar.name,
      defaultTimezone: calendar.defaultTimezone,
      externalId: calendar.externalId ?? null,
      creationTime: calendar.creationTime,
      deletionTime: calendar.deletionTime ?? null,
    };
  }
}
