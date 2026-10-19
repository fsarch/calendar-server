import { Role } from '../constants/role.enum.js';
import { DATABASE_OPTIONS } from '../database/index.js';
import { CalendarServerModule } from './calendar-server.module.js';

export { CalendarServerModule };
export const entities = DATABASE_OPTIONS.entities;
export const migrations = DATABASE_OPTIONS.migrations;

/**
 * The frozen equivalent of this service's standalone `main.ts` builder
 * calls, as data - see `@fsarch/server`'s `ServiceMountDescriptor`. A
 * mono-service harness spreads this into `.addService({ id, ...descriptor })`;
 * the standalone `main.ts` keeps calling the builder methods directly (no
 * behavior change), just sourcing its values from here instead of
 * duplicating them.
 *
 * `uac` is newly added here (see commit message) - all controllers were
 * already annotated with `@Roles(...)` from `@fsarch/server/uac`, and
 * `config/config.yml` already carries a full `uac:` section, but
 * `main.ts` never called `.enableUac()`, so `RolesGuard` was never
 * registered and the `@Roles()` metadata was inert. Fixed as part of this
 * restructuring per explicit user confirmation.
 */
export const descriptor = {
  module: CalendarServerModule,
  entities,
  migrations,
  swagger: {
    title: 'Calendar Server API',
    description: 'Calendar and Event Management Microservice',
    version: '1.0',
  },
  auth: true,
  uac: { roles: Object.values(Role) },
  softDeletion: true,
};
