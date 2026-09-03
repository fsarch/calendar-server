import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@fsarch/server/auth';
import { Roles } from '@fsarch/server/uac';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ApiOkPaginatedResponse, PaginationResultDto } from '@fsarch/server/pagination';
import { EventSeriesService } from './event_series.service.js';
import { CreateEventSeriesDto } from '../../models/event_series/CreateEventSeriesDto.js';
import { EventSeriesDto } from '../../models/event_series/EventSeriesDto.js';
import { EventDto } from '../../models/event/EventDto.js';
import { EventService } from '../event/event.service.js';
import { Role } from '../../constants/role.enum.js';

@ApiTags('Event Series')
@Controller('calendars/:calendarId/events/:eventId/series')
export class EventSeriesController {
  constructor(
    private readonly eventSeriesService: EventSeriesService,
    private readonly eventService: EventService,
  ) {}

  @Get()
  @UseGuards(AuthGuard)
  @Roles(Role.read_event_series)
  @ApiOperation({ summary: 'Liste aller Serien eines Events (paginiert)' })
  @ApiParam({ name: 'calendarId', type: String, format: 'uuid' })
  @ApiParam({ name: 'eventId', type: String, format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 25 })
  @ApiOkPaginatedResponse(EventSeriesDto)
  async findAllByEvent(
    @Param('calendarId') calendarId: string,
    @Param('eventId') eventId: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 25,
  ): Promise<PaginationResultDto<EventSeriesDto>> {
    // Validierung: Event gehört zu Kalender
    const event = await this.eventService.findOne(eventId);
    if (event.calendarId !== calendarId) {
      throw new NotFoundException(
        `Event with ID '${eventId}' not found in calendar '${calendarId}'`,
      );
    }

    const [items, total] = await this.eventSeriesService.findByEvent(eventId, page, pageSize);

    return {
      data: items,
      metadata: {
        currentPage: page,
        pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  @Post()
  @UseGuards(AuthGuard)
  @Roles(Role.create_event_series)
  @ApiOperation({ summary: 'Erstellt eine neue Serie für ein Event' })
  @ApiParam({ name: 'calendarId', type: String, format: 'uuid' })
  @ApiParam({ name: 'eventId', type: String, format: 'uuid' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('calendarId') calendarId: string,
    @Param('eventId') eventId: string,
    @Body() createDto: CreateEventSeriesDto,
  ): Promise<EventSeriesDto> {
    // Validierung: Event gehört zu Kalender
    const event = await this.eventService.findOne(eventId);
    if (event.calendarId !== calendarId) {
      throw new NotFoundException(
        `Event with ID '${eventId}' not found in calendar '${calendarId}'`,
      );
    }

    const validFrom = this.resolveValidFrom(event, createDto.validFrom);

    return this.eventSeriesService.create({ ...createDto, eventId, validFrom });
  }

  /**
   * validFrom dient der RRULE-Expansion als DTSTART und bestimmt damit die Uhrzeit
   * aller Wiederholungsinstanzen - es muss daher exakt dem startAt des Events
   * entsprechen (sonst laufen Haupttermin und Wiederholungen zeitlich auseinander).
   * Ohne Angabe wird startAt des Events übernommen.
   */
  private resolveValidFrom(event: EventDto, validFrom?: Date): Date {
    if (validFrom === undefined) {
      return event.startAt;
    }

    if (new Date(validFrom).getTime() !== new Date(event.startAt).getTime()) {
      throw new BadRequestException(
        `validFrom ('${new Date(validFrom).toISOString()}') must match the event's startAt ` +
          `('${new Date(event.startAt).toISOString()}'). Omit validFrom to use the event's startAt.`,
      );
    }

    return validFrom;
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @Roles(Role.read_event_series)
  @ApiOperation({ summary: 'Gibt eine Serie zurück' })
  @ApiParam({ name: 'calendarId', type: String, format: 'uuid' })
  @ApiParam({ name: 'eventId', type: String, format: 'uuid' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 404, description: 'Serie nicht gefunden' })
  async findOne(
    @Param('calendarId') calendarId: string,
    @Param('eventId') eventId: string,
    @Param('id') id: string,
  ): Promise<EventSeriesDto> {
    const series = await this.eventSeriesService.findOne(id);
    if (series.eventId !== eventId) {
      throw new NotFoundException(
        `Series with ID '${id}' not found for event '${eventId}'`,
      );
    }
    return series;
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @Roles(Role.write_event_series)
  @ApiOperation({ summary: 'Aktualisiert eine Serie' })
  @ApiParam({ name: 'calendarId', type: String, format: 'uuid' })
  @ApiParam({ name: 'eventId', type: String, format: 'uuid' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 404, description: 'Serie nicht gefunden' })
  async update(
    @Param('calendarId') calendarId: string,
    @Param('eventId') eventId: string,
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateEventSeriesDto>,
  ): Promise<EventSeriesDto> {
    const existing = await this.eventSeriesService.findOne(id);
    if (existing.eventId !== eventId) {
      throw new NotFoundException(
        `Series with ID '${id}' not found for event '${eventId}'`,
      );
    }

    if (updateDto.validFrom !== undefined) {
      const event = await this.eventService.findOne(eventId);
      this.resolveValidFrom(event, updateDto.validFrom);
    }

    return this.eventSeriesService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @Roles(Role.delete_event_series)
  @ApiOperation({ summary: 'Löscht eine Serie (Soft Delete)' })
  @ApiParam({ name: 'calendarId', type: String, format: 'uuid' })
  @ApiParam({ name: 'eventId', type: String, format: 'uuid' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Serie gelöscht' })
  @ApiResponse({ status: 404, description: 'Serie nicht gefunden' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('calendarId') calendarId: string,
    @Param('eventId') eventId: string,
    @Param('id') id: string,
  ): Promise<void> {
    const existing = await this.eventSeriesService.findOne(id);
    if (existing.eventId !== eventId) {
      throw new NotFoundException(
        `Series with ID '${id}' not found for event '${eventId}'`,
      );
    }
    return this.eventSeriesService.remove(id);
  }
}
