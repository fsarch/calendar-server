import { EntitySchema } from 'typeorm';

import { Calendar } from './entities/calendar.entity.js';
import { Event } from './entities/event.entity.js';
import { EventSeries } from './entities/event_series.entity.js';
import { EventException } from './entities/event_exception.entity.js';
import { InitialSchema1786084303162 } from './migrations/InitialSchema1786084303162.js';

export const DATABASE_OPTIONS = {
  entities: [Calendar, Event, EventSeries, EventException] as (Function | EntitySchema)[],
  migrations: [InitialSchema1786084303162] as any[],
  synchronize: process.env.NODE_ENV === 'development',
};
