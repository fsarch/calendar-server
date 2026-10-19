import { createServiceModule } from '@fsarch/server';
import { Calendar } from '../database/entities/calendar.entity.js';
import { Event } from '../database/entities/event.entity.js';
import { EventException } from '../database/entities/event_exception.entity.js';
import { EventSeries } from '../database/entities/event_series.entity.js';
import { CalendarController } from '../controllers/calendar/calendar.controller.js';
import { CalendarService } from '../controllers/calendar/calendar.service.js';
import { EventController } from '../controllers/event/event.controller.js';
import { EventExpanderService } from '../controllers/event/event-expander.service.js';
import { EventService } from '../controllers/event/event.service.js';
import { EventExceptionController } from '../controllers/event_exception/event_exception.controller.js';
import { EventExceptionService } from '../controllers/event_exception/event_exception.service.js';
import { EventSeriesController } from '../controllers/event_series/event_series.controller.js';
import { EventSeriesService } from '../controllers/event_series/event_series.service.js';

/**
 * The service's feature module, generated via `@fsarch/server`'s
 * `createServiceModule()` instead of the previous
 * `AppModule -> {CalendarModule, EventModule, EventSeriesModule,
 * EventExceptionModule}` tree, each doing its own unscoped
 * `TypeOrmModule.forFeature(...)`. Flattened for the same reason as
 * `frontier-api`/`metric-server`/`function-server`: a single
 * `TypeOrmModule.forFeature(entities, connectionName)` call inside
 * `createServiceModule()` only covers providers/controllers declared
 * directly in the generated module.
 *
 * `EventService`/`EventSeriesService` were each redundantly re-declared as
 * `providers` in multiple of the old per-resource modules (e.g.
 * `EventSeriesModule` listed `EventSeriesService` *and* `EventService`,
 * `EventExceptionModule` listed all three) - each old module got its own
 * separate DI-scoped instance of these stateless services. Flattened here
 * each service is declared exactly once, so all controllers now share one
 * instance - behaviorally equivalent, since none of these services hold
 * per-request or per-module state.
 */
export const CalendarServerModule = createServiceModule({
  entities: [Calendar, Event, EventSeries, EventException],
  controllers: [
    CalendarController,
    EventController,
    EventSeriesController,
    EventExceptionController,
  ],
  providers: [
    CalendarService,
    EventService,
    EventExpanderService,
    EventSeriesService,
    EventExceptionService,
  ],
});
