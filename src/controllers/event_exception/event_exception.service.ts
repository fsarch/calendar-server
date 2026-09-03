import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { EventException } from '../../database/entities/event_exception.entity.js';
import { CreateEventExceptionDto } from '../../models/event_exception/CreateEventExceptionDto.js';
import { EventExceptionDto } from '../../models/event_exception/EventExceptionDto.js';

@Injectable()
export class EventExceptionService {
  constructor(
    @InjectRepository(EventException)
    private readonly eventExceptionRepository: Repository<EventException>,
  ) {}

  async create(
    createDto: CreateEventExceptionDto & { eventSeriesId: string },
  ): Promise<EventExceptionDto> {
    const exception = this.eventExceptionRepository.create(createDto);
    const saved = await this.eventExceptionRepository.save(exception);
    return this.mapToDto(saved);
  }

  async findAllPaginated(
    page: number = 1,
    pageSize: number = 25,
  ): Promise<[EventExceptionDto[], number]> {
    const skip = (page - 1) * pageSize;
    const [exceptions, total] = await this.eventExceptionRepository.findAndCount({
      skip,
      take: pageSize,
    });
    return [exceptions.map(this.mapToDto), total];
  }

  async findBySeries(
    seriesId: string,
    page: number = 1,
    pageSize: number = 25,
  ): Promise<[EventExceptionDto[], number]> {
    const skip = (page - 1) * pageSize;
    const [exceptions, total] = await this.eventExceptionRepository.findAndCount({
      where: { eventSeriesId: seriesId } as FindOptionsWhere<EventException>,
      skip,
      take: pageSize,
    });
    return [exceptions.map(this.mapToDto), total];
  }

  async findOne(id: string): Promise<EventExceptionDto> {
    const exception = await this.eventExceptionRepository.findOne({
      where: { id } as FindOptionsWhere<EventException>,
      relations: { eventSeries: true, newEvent: true },
    });

    if (!exception) {
      throw new NotFoundException(`EventException with ID '${id}' not found`);
    }

    return this.mapToDto(exception);
  }

  async update(
    id: string,
    updateDto: Partial<CreateEventExceptionDto>,
  ): Promise<EventExceptionDto> {
    await this.eventExceptionRepository.update(id, updateDto);
    const updated = await this.eventExceptionRepository.findOne({
      where: { id } as FindOptionsWhere<EventException>,
    });

    if (!updated) {
      throw new NotFoundException(`EventException with ID '${id}' not found`);
    }

    return this.mapToDto(updated);
  }

  async remove(id: string): Promise<void> {
    const result = await this.eventExceptionRepository.softDelete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`EventException with ID '${id}' not found`);
    }
  }

  private mapToDto(exception: EventException): EventExceptionDto {
    return {
      id: exception.id,
      externalId: exception.externalId ?? null,
      eventSeriesId: exception.eventSeriesId,
      originalStart: exception.originalStart,
      isMoved: exception.isMoved,
      isCancelled: exception.isCancelled,
      newEventId: exception.newEventId ?? null,
      creationTime: exception.creationTime,
      deletionTime: exception.deletionTime ?? null,
    };
  }
}
