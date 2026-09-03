import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../../database/entities/event.entity.js';
import { EventSeries } from '../../database/entities/event_series.entity.js';
import { EventException } from '../../database/entities/event_exception.entity.js';
import { EventController } from './event.controller.js';
import { EventService } from './event.service.js';
import { EventExpanderService } from './event-expander.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Event, EventSeries, EventException])],
  controllers: [EventController],
  providers: [EventService, EventExpanderService],
  exports: [EventService, EventExpanderService],
})
export class EventModule {}
