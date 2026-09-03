import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventException } from '../../database/entities/event_exception.entity.js';
import { EventSeries } from '../../database/entities/event_series.entity.js';
import { Event } from '../../database/entities/event.entity.js';
import { EventExceptionController } from './event_exception.controller.js';
import { EventExceptionService } from './event_exception.service.js';
import { EventSeriesService } from '../event_series/event_series.service.js';
import { EventService } from '../event/event.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([EventException, EventSeries, Event])],
  controllers: [EventExceptionController],
  providers: [EventExceptionService, EventSeriesService, EventService],
  exports: [EventExceptionService],
})
export class EventExceptionModule {}
