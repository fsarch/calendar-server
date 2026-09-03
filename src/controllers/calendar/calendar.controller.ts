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
} from '@nestjs/common';
import { AuthGuard } from '@fsarch/server/auth';
import { Roles } from '@fsarch/server/uac';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ApiOkPaginatedResponse, PaginationResultDto } from '@fsarch/server/pagination';
import { CalendarService } from './calendar.service.js';
import { CreateCalendarDto } from '../../models/calendar/CreateCalendarDto.js';
import { CalendarDto } from '../../models/calendar/CalendarDto.js';
import { Role } from '../../constants/role.enum.js';

@ApiTags('Calendars')
@Controller('calendars')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  @UseGuards(AuthGuard)
  @Roles(Role.create_calendar)
  @ApiOperation({ summary: 'Erstellt einen neuen Kalender' })
  @ApiResponse({ status: 201, description: 'Kalender erstellt' })
  @ApiResponse({ status: 409, description: 'Externe ID existiert bereits' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateCalendarDto): Promise<CalendarDto> {
    return this.calendarService.create(createDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  @Roles(Role.read_calendar)
  @ApiOperation({ summary: 'Liste aller Kalender (paginiert)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 25 })
  @ApiOkPaginatedResponse(CalendarDto)
  async findAll(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 25,
  ): Promise<PaginationResultDto<CalendarDto>> {
    const [items, total] = await this.calendarService.findAllPaginated(page, pageSize);

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

  @Get(':id')
  @UseGuards(AuthGuard)
  @Roles(Role.read_calendar)
  @ApiOperation({ summary: 'Gibt einen Kalender zurueck' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 404, description: 'Kalender nicht gefunden' })
  async findOne(@Param('id') id: string): Promise<CalendarDto> {
    return this.calendarService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @Roles(Role.write_calendar)
  @ApiOperation({ summary: 'Aktualisiert einen Kalender' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 404, description: 'Kalender nicht gefunden' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateCalendarDto>,
  ): Promise<CalendarDto> {
    return this.calendarService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @Roles(Role.delete_calendar)
  @ApiOperation({ summary: 'Loescht einen Kalender (Soft Delete)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Kalender geloescht' })
  @ApiResponse({ status: 404, description: 'Kalender nicht gefunden' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.calendarService.remove(id);
  }
}
