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
import { EventExceptionService } from './event_exception.service.js';
import { CreateEventExceptionDto } from '../../models/event_exception/CreateEventExceptionDto.js';
import { EventExceptionDto } from '../../models/event_exception/EventExceptionDto.js';
import { EventSeriesService } from '../event_series/event_series.service.js';
import { EventService } from '../event/event.service.js';
import { Role } from '../../constants/role.enum.js';

@ApiTags('Event Exceptions')
@Controller('calendars/:calendarId/events/:eventId/series/:seriesId/exceptions')
export class EventExceptionController {
  constructor(
    private readonly eventExceptionService: EventExceptionService,
    private readonly eventSeriesService: EventSeriesService,
    private readonly eventService: EventService,
  ) {}

  @Get()
  @UseGuards(AuthGuard)
  @Roles(Role.read_event_exception)
  @ApiOperation({ summary: 'Liste aller Exceptions einer Serie (paginiert)' })
  @ApiParam({ name: 'calendarId', type: String, format: 'uuid' })
  @ApiParam({ name: 'eventId', type: String, format: 'uuid' })
  @ApiParam({ name: 'seriesId', type: String, format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 25 })
  @ApiOkPaginatedResponse(EventExceptionDto)
  async findAllBySeries(
    @Param('calendarId') calendarId: string,
    @Param('eventId') eventId: string,
    @Param('seriesId') seriesId: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 25,
  ): Promise<PaginationResultDto<EventExceptionDto>> {
    // Validierung: Event -> Calendar, Series -> Event
    const event = await this.eventService.findOne(eventId);
    if (event.calendarId !== calendarId) {
      throw new NotFoundException(
        `Event with ID '${eventId}' not found in calendar '${calendarId}'`,
      );
    }

    const series = await this.eventSeriesService.findOne(seriesId);
    if (series.eventId !== eventId) {
      throw new NotFoundException(
        `Series with ID '${seriesId}' not found for event '${eventId}'`,
      );
    }

    const [items, total] = await this.eventExceptionService.findBySeries(
      seriesId,
      page,
      pageSize,
    );

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
  @Roles(Role.create_event_exception)
  @ApiOperation({ summary: 'Erstellt eine neue Exception für eine Serie' })
  @ApiParam({ name: 'calendarId', type: String, format: 'uuid' })
  @ApiParam({ name: 'eventId', type: String, format: 'uuid' })
  @ApiParam({ name: 'seriesId', type: String, format: 'uuid' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('calendarId') calendarId: string,
    @Param('eventId') eventId: string,
    @Param('seriesId') seriesId: string,
    @Body() createDto: CreateEventExceptionDto,
  ): Promise<EventExceptionDto> {
    // Validierung: Event -> Calendar, Series -> Event
    const event = await this.eventService.findOne(eventId);
    if (event.calendarId !== calendarId) {
      throw new NotFoundException(
        `Event with ID '${eventId}' not found in calendar '${calendarId}'`,
      );
    }

    const series = await this.eventSeriesService.findOne(seriesId);
    if (series.eventId !== eventId) {
      throw new NotFoundException(
        `Series with ID '${seriesId}' not found for event '${eventId}'`,
      );
    }

    return this.eventExceptionService.create({ ...createDto, eventSeriesId: seriesId });
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @Roles(Role.read_event_exception)
  @ApiOperation({ summary: 'Gibt eine Exception zurück' })
  @ApiParam({ name: 'calendarId', type: String, format: 'uuid' })
  @ApiParam({ name: 'eventId', type: String, format: 'uuid' })
  @ApiParam({ name: 'seriesId', type: String, format: 'uuid' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 404, description: 'Exception nicht gefunden' })
  async findOne(
    @Param('calendarId') calendarId: string,
    @Param('eventId') eventId: string,
    @Param('seriesId') seriesId: string,
    @Param('id') id: string,
  ): Promise<EventExceptionDto> {
    const exception = await this.eventExceptionService.findOne(id);
    if (exception.eventSeriesId !== seriesId) {
      throw new NotFoundException(
        `Exception with ID '${id}' not found for series '${seriesId}'`,
      );
    }
    return exception;
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @Roles(Role.write_event_exception)
  @ApiOperation({ summary: 'Aktualisiert eine Exception' })
  @ApiParam({ name: 'calendarId', type: String, format: 'uuid' })
  @ApiParam({ name: 'eventId', type: String, format: 'uuid' })
  @ApiParam({ name: 'seriesId', type: String, format: 'uuid' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 404, description: 'Exception nicht gefunden' })
  async update(
    @Param('calendarId') calendarId: string,
    @Param('eventId') eventId: string,
    @Param('seriesId') seriesId: string,
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateEventExceptionDto>,
  ): Promise<EventExceptionDto> {
    const existing = await this.eventExceptionService.findOne(id);
    if (existing.eventSeriesId !== seriesId) {
      throw new NotFoundException(
        `Exception with ID '${id}' not found for series '${seriesId}'`,
      );
    }
    return this.eventExceptionService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @Roles(Role.delete_event_exception)
  @ApiOperation({ summary: 'Löscht eine Exception (Soft Delete)' })
  @ApiParam({ name: 'calendarId', type: String, format: 'uuid' })
  @ApiParam({ name: 'eventId', type: String, format: 'uuid' })
  @ApiParam({ name: 'seriesId', type: String, format: 'uuid' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Exception gelöscht' })
  @ApiResponse({ status: 404, description: 'Exception nicht gefunden' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('calendarId') calendarId: string,
    @Param('eventId') eventId: string,
    @Param('seriesId') seriesId: string,
    @Param('id') id: string,
  ): Promise<void> {
    const existing = await this.eventExceptionService.findOne(id);
    if (existing.eventSeriesId !== seriesId) {
      throw new NotFoundException(
        `Exception with ID '${id}' not found for series '${seriesId}'`,
      );
    }
    return this.eventExceptionService.remove(id);
  }
}
