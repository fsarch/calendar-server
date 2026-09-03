# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run start:dev          # run with ts-node against src/main.ts (no build step)
npm run build               # fsarch-server build (see @fsarch/server CLI)
npm run start:prod          # node dist/main.js
npm run lint                 # eslint src --ext .ts
npm run format                # prettier --write "src/**/*.ts"
npm test                      # vitest run (all *.spec.ts under src/)
npm run test:watch            # vitest watch mode
npm run test:coverage         # vitest run --coverage
npx vitest run src/controllers/event/event.service.spec.ts   # single test file
npx vitest run -t "should create a calendar"                 # single test by name

npm run typeorm -- migration:show -d src/database/...   # invoke typeorm CLI (ts-node/esm loader)
npm run migration:create --name=AddSomething   # creates ./src/database/migrations/AddSomething
npm run migration:run
npm run migration:revert
```

There is no README.md; this file and the `@fsarch/server` package README
(`node_modules/@fsarch/server/README.md`) are the primary docs.

## Architecture

This is a NestJS microservice (`calendar-server`) for managing calendars, events, recurring
event series, and exceptions to those series. It runs on Postgres via TypeORM and is built on
top of a shared internal framework package, **`@fsarch/server`**.

### `@fsarch/server` conventions

Framework building blocks are imported from subpaths, not ad-hoc reimplemented:

- `@fsarch/server/auth` → `AuthGuard`, `Public`, `UserData`
- `@fsarch/server/uac` → `@Roles(...)` decorator for permission checks
- `@fsarch/server/pagination` → `ApiOkPaginatedResponse`, `PaginationResultDto`

Every mutating/reading controller endpoint pairs `@UseGuards(AuthGuard)` with `@Roles(Role.xxx)`
(see `src/constants/role.enum.ts` for the full permission set, one
`read_/write_/create_/delete_/manage_` group per resource, plus the `*` wildcard). Note that
`src/main.ts` currently bootstraps with plain `NestFactory.create` + manual Swagger/CORS/
ValidationPipe setup rather than the `FsArchAppBuilder` fluent API shown in the framework's
README — keep this in mind when comparing new code against that README's Quick Start.

Runtime config lives in `config/config.yml`, read by `@fsarch/server`'s config loader (auth
type: `static` | `jwt-jwk` | `oidc`; UAC static user→permissions map; database connection incl.
type `sqlite` | `postgres` | `cockroachdb`; soft-deletion cron settings). `src/app.module.ts`
additionally wires `TypeOrmModule.forRoot` directly from `DB_*` env vars merged with
`DATABASE_OPTIONS` from `src/database/index.ts` — the two configuration paths (`config.yml` vs.
env vars) coexist, so check both when tracing how the DB connection is actually established.

### Domain model & module layout

Each resource gets a self-contained NestJS module under `src/controllers/<resource>/`
(controller + service [+ extra services] + module, each with a co-located `.spec.ts`):

- `calendar` — top-level container (`name`, `defaultTimezone`, unique `externalId`)
- `event` — a single occurrence *or* the "master" event of a recurring series
  (`startAt`/`endAt`, belongs to a `calendar`)
- `event_series` — recurrence rule attached to a master `event` (`rrule` string, `timezone`,
  `validFrom`/`validTo`)
- `event_exception` — a single deviation from a series occurrence, keyed by
  `eventSeriesId` + `originalStart`; either `isCancelled` (drop the occurrence) or `isMoved`
  (replace it with a pointer to a separate `newEvent`)

Entities live in `src/database/entities/`; request/response shapes are separate DTOs in
`src/models/<resource>/` (e.g. `CreateEventDto` vs. `EventDto`) validated with `class-validator`,
including two custom decorators in `src/validation/`: `@IsValidRRule()` (parses via `rrule`'s
`RRule.fromString`) and `@IsDate()`. All entities use TypeORM `@DeleteDateColumn` — deletes are
soft deletes (`deletionTime`), and unique indexes on `externalId` are scoped with
`WHERE deletion_time IS NULL` so soft-deleted rows don't collide with new ones.

Controllers follow a nested-resource URL shape, e.g. `EventController` is mounted at
`calendars/:calendarId/events` and every handler re-checks that the looked-up entity's
`calendarId` matches the URL param, throwing `NotFoundException` on mismatch rather than trusting
the path alone.

### Recurrence expansion

`EventExpanderService` (`src/controllers/event/event-expander.service.ts`) is the core domain
logic: given a calendar + `[from, to]` range, it combines non-recurring `Event` rows with RRULE-
expanded occurrences from `EventSeries`, then applies `EventException` overrides (cancel or move)
by matching on `recurringInstanceOf` (the master event id) + occurrence `startAt`. It does its
own RRULE string parsing/mapping into `rrule`'s `RRule` constructor rather than relying solely on
`RRule.fromString`; if you touch RRULE handling, keep `parseRRuleString`/`parseFrequency`/
`parseWeekday` and the `IsValidRRule` validator (which *does* use `RRule.fromString`) consistent
with each other.

### Testing

Vitest (`vitest.config.ts`) with `globals: true`, `environment: node`. Every service/controller
spec mocks its TypeORM repository via `getRepositoryToken` + a plain object of `vi.fn()` stubs
(see `calendar.service.spec.ts` for the pattern) — no real database is used in unit tests.
