import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventSeries } from '../../database/entities/event_series.entity.js';
import { Event } from '../../database/entities/event.entity.js';
import { EventSeriesController } from './event_series.controller.js';
import { EventSeriesService } from './event_series.service.js';
import { EventService } from '../event/event.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([EventSeries, Event])],
  controllers: [EventSeriesController],
  providers: [EventSeriesService, EventService],
  exports: [EventSeriesService],
})
export class EventSeriesModule {}
