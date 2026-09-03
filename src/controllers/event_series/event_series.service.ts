import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { EventSeries } from '../../database/entities/event_series.entity.js';
import { CreateEventSeriesDto } from '../../models/event_series/CreateEventSeriesDto.js';
import { EventSeriesDto } from '../../models/event_series/EventSeriesDto.js';

@Injectable()
export class EventSeriesService {
  constructor(
    @InjectRepository(EventSeries)
    private readonly eventSeriesRepository: Repository<EventSeries>,
  ) {}

  async create(createDto: CreateEventSeriesDto & { eventId: string }): Promise<EventSeriesDto> {
    const series = this.eventSeriesRepository.create(createDto);
    const saved = await this.eventSeriesRepository.save(series);
    return this.mapToDto(saved);
  }

  async findAllPaginated(page: number = 1, pageSize: number = 25): Promise<[EventSeriesDto[], number]> {
    const skip = (page - 1) * pageSize;
    const [series, total] = await this.eventSeriesRepository.findAndCount({
      skip,
      take: pageSize,
    });
    return [series.map(this.mapToDto), total];
  }

  async findByEvent(eventId: string, page: number = 1, pageSize: number = 25): Promise<[EventSeriesDto[], number]> {
    const skip = (page - 1) * pageSize;
    const [series, total] = await this.eventSeriesRepository.findAndCount({
      where: { eventId } as FindOptionsWhere<EventSeries>,
      skip,
      take: pageSize,
    });
    return [series.map(this.mapToDto), total];
  }

  async findOne(id: string): Promise<EventSeriesDto> {
    const series = await this.eventSeriesRepository.findOne({
      where: { id } as FindOptionsWhere<EventSeries>,
      relations: { event: true },
    });

    if (!series) {
      throw new NotFoundException(`EventSeries with ID '${id}' not found`);
    }

    return this.mapToDto(series);
  }

  async update(id: string, updateDto: Partial<CreateEventSeriesDto>): Promise<EventSeriesDto> {
    await this.eventSeriesRepository.update(id, updateDto);
    const updated = await this.eventSeriesRepository.findOne({
      where: { id } as FindOptionsWhere<EventSeries>,
    });

    if (!updated) {
      throw new NotFoundException(`EventSeries with ID '${id}' not found`);
    }

    return this.mapToDto(updated);
  }

  async remove(id: string): Promise<void> {
    const result = await this.eventSeriesRepository.softDelete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`EventSeries with ID '${id}' not found`);
    }
  }

  private mapToDto(series: EventSeries): EventSeriesDto {
    return {
      id: series.id,
      eventId: series.eventId,
      externalId: series.externalId ?? null,
      timezone: series.timezone,
      rrule: series.rrule,
      validFrom: series.validFrom,
      validTo: series.validTo ?? null,
      creationTime: series.creationTime,
      deletionTime: series.deletionTime ?? null,
    };
  }
}
