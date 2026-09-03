import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, IsNull } from 'typeorm';
import { Event } from '../../database/entities/event.entity.js';
import { EventSeries } from '../../database/entities/event_series.entity.js';
import { CreateEventDto } from '../../models/event/CreateEventDto.js';
import { EventDto } from '../../models/event/EventDto.js';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(EventSeries)
    private readonly eventSeriesRepository: Repository<EventSeries>,
  ) {}

  async create(createDto: CreateEventDto & { calendarId: string }): Promise<EventDto> {
    const event = this.eventRepository.create(createDto);
    const saved = await this.eventRepository.save(event);
    return this.mapToDto(saved);
  }

  async findAllPaginated(
    page: number = 1,
    pageSize: number = 25,
    calendarId?: string,
  ): Promise<[EventDto[], number]> {
    const skip = (page - 1) * pageSize;
    const where: FindOptionsWhere<Event> = calendarId ? { calendarId } : {};

    const [events, total] = await this.eventRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { startAt: 'ASC' },
    });
    return [events.map(this.mapToDto), total];
  }

  async findByCalendar(
    calendarId: string,
    page: number = 1,
    pageSize: number = 25,
  ): Promise<[EventDto[], number]> {
    const skip = (page - 1) * pageSize;
    const [events, total] = await this.eventRepository.findAndCount({
      where: { calendarId } as FindOptionsWhere<Event>,
      skip,
      take: pageSize,
      order: { startAt: 'ASC' },
    });
    return [events.map(this.mapToDto), total];
  }

  async findOne(id: string): Promise<EventDto> {
    const event = await this.eventRepository.findOne({
      where: { id } as FindOptionsWhere<Event>,
      relations: { calendar: true },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID '${id}' not found`);
    }

    return this.mapToDto(event);
  }

  async update(id: string, updateDto: Partial<CreateEventDto>): Promise<EventDto> {
    await this.eventRepository.update(id, updateDto);
    const updated = await this.eventRepository.findOne({
      where: { id } as FindOptionsWhere<Event>,
    });

    if (!updated) {
      throw new NotFoundException(`Event with ID '${id}' not found`);
    }

    // validFrom einer Serie dient als DTSTART der RRULE-Expansion und muss deshalb
    // exakt dem startAt des zugehörigen (Master-)Events entsprechen (siehe
    // EventSeriesController.resolveValidFrom). Ändert sich startAt hier, muss die
    // validFrom aller Serien dieses Events synchron mitgezogen werden, sonst laufen
    // Haupttermin und Wiederholungen zeitlich auseinander.
    if (updateDto.startAt !== undefined) {
      await this.eventSeriesRepository.update(
        { eventId: id, deletionTime: IsNull() } as FindOptionsWhere<EventSeries>,
        { validFrom: updateDto.startAt },
      );
    }

    return this.mapToDto(updated);
  }

  async remove(id: string): Promise<void> {
    const result = await this.eventRepository.softDelete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Event with ID '${id}' not found`);
    }
  }

  private mapToDto(event: Event): EventDto {
    return {
      id: event.id,
      calendarId: event.calendarId,
      title: event.title ?? null,
      description: event.description ?? null,
      externalId: event.externalId ?? null,
      timezone: event.timezone ?? null,
      startAt: event.startAt,
      endAt: event.endAt ?? null,
      metadata: event.metadata ?? null,
      creationTime: event.creationTime,
      deletionTime: event.deletionTime ?? null,
    };
  }
}
