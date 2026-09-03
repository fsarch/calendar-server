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
} from '@nestjs/common';
import { AuthGuard } from '@fsarch/server/auth';
import { Roles } from '@fsarch/server/uac';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ApiOkPaginatedResponse, PaginationResultDto } from '@fsarch/server/pagination';
import { EventService } from './event.service.js';
import { EventExpanderService, ExpandedEvent } from './event-expander.service.js';
import { CreateEventDto } from '../../models/event/CreateEventDto.js';
import { EventDto } from '../../models/event/EventDto.js';
import { ExpandedEventDto } from '../../models/event/ExpandedEventDto.js';
import { Role } from '../../constants/role.enum.js';

@ApiTags('Events')
@Controller('calendars/:calendarId/events')
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly eventExpanderService: EventExpanderService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  @Roles(Role.create_event)
  @ApiOperation({ summary: 'Erstellt ein neues Event im Kalender' })
  @ApiResponse({ status: 201, description: 'Event erstellt' })
  @ApiParam({ name: 'calendarId', type: String, format: 'uuid' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('calendarId') calendarId: string,
    @Body() createDto: CreateEventDto,
  ): Promise<EventDto> {
    return this.eventService.create({ ...createDto, calendarId });
  }

  @Get()
  @UseGuards(AuthGuard)
  @Roles(Role.read_event)
  @ApiOperation({ summary: 'Liste aller Events des Kalenders (paginiert)' })
  @ApiParam({ name: 'calendarId', type: String, format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 25 })
  @ApiOkPaginatedResponse(EventDto)
  async findAllByCalendar(
    @Param('calendarId') calendarId: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 25,
  ): Promise<PaginationResultDto<EventDto>> {
    const [items, total] = await this.eventService.findByCalendar(calendarId, page, pageSize);

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

  @Get('instances')
  @UseGuards(AuthGuard)
  @Roles(Role.read_event)
  @ApiOperation({
    summary:
      'Gibt alle Event-Instanzen des Kalenders in einem Zeitraum zurueck (inkl. Serien und Exceptions)',
    description:
      'Expandiert wiederkehrende Events via RRULE und beruecksichtigt Exceptions (storniert/verschoben)',
  })
  @ApiParam({ name: 'calendarId', type: String, format: 'uuid' })
  @ApiQuery({
    name: 'from',
    required: true,
    type: String,
    format: 'date-time',
    description: 'Start des Zeitraums (ISO 8601)',
  })
  @ApiQuery({
    name: 'to',
    required: true,
    type: String,
    format: 'date-time',
    description: 'Ende des Zeitraums (ISO 8601)',
  })
  @ApiResponse({ status: 200, description: 'Liste der Event-Instanzen', type: [ExpandedEventDto] })
  async getInstances(
    @Param('calendarId') calendarId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ): Promise<ExpandedEvent[]> {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new Error('Invalid date format. Use ISO 8601 (e.g., 2024-01-01T00:00:00Z)');
    }

    return this.eventExpanderService.getExpandedEventsForCalendar(calendarId, fromDate, toDate);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @Roles(Role.read_event)
  @ApiOperation({ summary: 'Gibt ein Event des Kalenders zurueck' })
  @ApiParam({ name: 'calendarId', type: String, format: 'uuid' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 404, description: 'Event nicht gefunden' })
  async findOne(
    @Param('calendarId') calendarId: string,
    @Param('id') id: string,
  ): Promise<EventDto> {
    const event = await this.eventService.findOne(id);
    if (event.calendarId !== calendarId) {
      throw new NotFoundException(
        `Event with ID '${id}' not found in calendar '${calendarId}'`,
      );
    }
    return event;
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @Roles(Role.write_event)
  @ApiOperation({ summary: 'Aktualisiert ein Event des Kalenders' })
  @ApiParam({ name: 'calendarId', type: String, format: 'uuid' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 404, description: 'Event nicht gefunden' })
  async update(
    @Param('calendarId') calendarId: string,
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateEventDto>,
  ): Promise<EventDto> {
    const existing = await this.eventService.findOne(id);
    if (existing.calendarId !== calendarId) {
      throw new NotFoundException(
        `Event with ID '${id}' not found in calendar '${calendarId}'`,
      );
    }
    return this.eventService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @Roles(Role.delete_event)
  @ApiOperation({ summary: 'Loescht ein Event des Kalenders (Soft Delete)' })
  @ApiParam({ name: 'calendarId', type: String, format: 'uuid' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Event geloescht' })
  @ApiResponse({ status: 404, description: 'Event nicht gefunden' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('calendarId') calendarId: string,
    @Param('id') id: string,
  ): Promise<void> {
    const existing = await this.eventService.findOne(id);
    if (existing.calendarId !== calendarId) {
      throw new NotFoundException(
        `Event with ID '${id}' not found in calendar '${calendarId}'`,
      );
    }
    return this.eventService.remove(id);
  }
}
