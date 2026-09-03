import { Module } from '@nestjs/common';
import { CalendarModule } from './controllers/calendar/calendar.module.js';
import { EventModule } from './controllers/event/event.module.js';
import { EventSeriesModule } from './controllers/event_series/event_series.module.js';
import { EventExceptionModule } from './controllers/event_exception/event_exception.module.js';

@Module({
  imports: [CalendarModule, EventModule, EventSeriesModule, EventExceptionModule],
})
export class AppModule {}
