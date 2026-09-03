import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Creates the full schema for calendars, events, event series (recurrence) and event
 * exceptions, matching the entities in src/database/entities/. This is the single squashed
 * migration for the project (previously split across InitialSchema/AddPrimaryKeyDefaults/
 * AddEventMetadata - merged back into one now that the app hasn't shipped yet, so there was no
 * reason to keep three steps for what is, from here on, one starting point).
 *
 * Written by hand with the TypeORM schema-builder API (Table/TableColumn/TableIndex/
 * TableForeignKey) instead of raw SQL, since there is no reachable database in this
 * environment to run `migration:generate` against.
 *
 * `id` columns get `default: 'uuid_generate_v4()'` directly (rather than via a later ALTER):
 * TypeORM only generates a UUID value in application code for `@PrimaryGeneratedColumn('uuid')`
 * columns when the driver reports it can't generate UUIDs itself
 * (`driver.isUUIDGenerationSupported()`). The Postgres driver always reports `true` there and
 * instead emits a bare `DEFAULT` for the column on INSERT, expecting the database to fill it in -
 * see `InsertQueryBuilder` in typeorm. Without a database default, every insert fails with
 * `null value in column "id"`. TypeORM itself ensures the "uuid-ossp" extension is present on
 * every connect (visible as `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"` in the query log at
 * boot), so `uuid_generate_v4()` - the function `PostgresDriver.uuidGenerator` uses by default -
 * is already available.
 */
export class InitialSchema1786084303162 implements MigrationInterface {
  name = 'InitialSchema1786084303162';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'calendars',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            primaryKeyConstraintName: 'pk__calendars',
            default: 'uuid_generate_v4()',
          },
          { name: 'name', type: 'varchar', length: '255', isNullable: false },
          { name: 'default_timezone', type: 'varchar', length: '128', isNullable: false },
          { name: 'external_id', type: 'varchar', length: '2048', isNullable: true },
          { name: 'creation_time', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'deletion_time', type: 'timestamp', isNullable: true },
        ],
        indices: [
          new TableIndex({ name: 'IDX_calendars_name', columnNames: ['name'] }),
          new TableIndex({
            name: 'IDX_calendars_default_timezone',
            columnNames: ['default_timezone'],
          }),
          new TableIndex({
            name: 'UQ_calendars_external_id',
            columnNames: ['external_id'],
            isUnique: true,
            where: 'deletion_time IS NULL',
          }),
          new TableIndex({ name: 'IDX_calendars_creation_time', columnNames: ['creation_time'] }),
          new TableIndex({ name: 'IDX_calendars_deletion_time', columnNames: ['deletion_time'] }),
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'events',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            primaryKeyConstraintName: 'pk__events',
            default: 'uuid_generate_v4()',
          },
          { name: 'calendar_id', type: 'uuid', isNullable: false },
          { name: 'title', type: 'varchar', length: '4096', isNullable: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'external_id', type: 'varchar', length: '2048', isNullable: true },
          { name: 'timezone', type: 'varchar', length: '128', isNullable: true },
          { name: 'start_at', type: 'timestamptz', isNullable: false },
          { name: 'end_at', type: 'timestamptz', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'creation_time', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'deletion_time', type: 'timestamp', isNullable: true },
        ],
        indices: [
          new TableIndex({ name: 'IDX_events_calendar_id', columnNames: ['calendar_id'] }),
          new TableIndex({
            name: 'UQ_events_external_id',
            columnNames: ['external_id'],
            isUnique: true,
            where: 'deletion_time IS NULL',
          }),
          new TableIndex({ name: 'IDX_events_start_at', columnNames: ['start_at'] }),
          new TableIndex({ name: 'IDX_events_end_at', columnNames: ['end_at'] }),
          new TableIndex({ name: 'IDX_events_creation_time', columnNames: ['creation_time'] }),
          new TableIndex({ name: 'IDX_events_deletion_time', columnNames: ['deletion_time'] }),
        ],
        foreignKeys: [
          {
            name: 'FK_events_calendar_id',
            columnNames: ['calendar_id'],
            referencedTableName: 'calendars',
            referencedColumnNames: ['id'],
          },
        ],
      }),
      true,
      true,
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'event_series',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            primaryKeyConstraintName: 'pk__event_series',
            default: 'uuid_generate_v4()',
          },
          { name: 'event_id', type: 'uuid', isNullable: false },
          { name: 'external_id', type: 'varchar', length: '2048', isNullable: true },
          { name: 'timezone', type: 'varchar', length: '128', isNullable: false },
          { name: 'rrule', type: 'text', isNullable: false },
          { name: 'valid_from', type: 'timestamptz', isNullable: false },
          { name: 'valid_to', type: 'timestamptz', isNullable: true },
          { name: 'creation_time', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'deletion_time', type: 'timestamp', isNullable: true },
        ],
        indices: [
          new TableIndex({ name: 'IDX_event_series_event_id', columnNames: ['event_id'] }),
          new TableIndex({
            name: 'UQ_event_series_external_id',
            columnNames: ['external_id'],
            isUnique: true,
            where: 'deletion_time IS NULL',
          }),
          new TableIndex({ name: 'IDX_event_series_timezone', columnNames: ['timezone'] }),
          new TableIndex({ name: 'IDX_event_series_rrule', columnNames: ['rrule'] }),
          new TableIndex({ name: 'IDX_event_series_valid_from', columnNames: ['valid_from'] }),
          new TableIndex({ name: 'IDX_event_series_valid_to', columnNames: ['valid_to'] }),
          new TableIndex({
            name: 'IDX_event_series_creation_time',
            columnNames: ['creation_time'],
          }),
          new TableIndex({
            name: 'IDX_event_series_deletion_time',
            columnNames: ['deletion_time'],
          }),
        ],
        foreignKeys: [
          {
            name: 'FK_event_series_event_id',
            columnNames: ['event_id'],
            referencedTableName: 'events',
            referencedColumnNames: ['id'],
          },
        ],
      }),
      true,
      true,
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'event_exceptions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            primaryKeyConstraintName: 'pk__event_exceptions',
            default: 'uuid_generate_v4()',
          },
          { name: 'external_id', type: 'varchar', length: '2048', isNullable: true },
          { name: 'event_series_id', type: 'uuid', isNullable: false },
          { name: 'original_start', type: 'timestamptz', isNullable: false },
          { name: 'is_moved', type: 'boolean', isNullable: false, default: false },
          { name: 'is_cancelled', type: 'boolean', isNullable: false, default: false },
          { name: 'new_event_id', type: 'uuid', isNullable: true },
          { name: 'creation_time', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'deletion_time', type: 'timestamp', isNullable: true },
        ],
        indices: [
          new TableIndex({
            name: 'UQ_event_exceptions_external_id',
            columnNames: ['external_id'],
            isUnique: true,
            where: 'deletion_time IS NULL',
          }),
          new TableIndex({
            name: 'IDX_event_exceptions_event_series_id',
            columnNames: ['event_series_id'],
          }),
          new TableIndex({
            name: 'IDX_event_exceptions_original_start',
            columnNames: ['original_start'],
          }),
          new TableIndex({ name: 'IDX_event_exceptions_is_moved', columnNames: ['is_moved'] }),
          new TableIndex({
            name: 'IDX_event_exceptions_is_cancelled',
            columnNames: ['is_cancelled'],
          }),
          new TableIndex({
            name: 'IDX_event_exceptions_new_event_id',
            columnNames: ['new_event_id'],
          }),
          new TableIndex({
            name: 'IDX_event_exceptions_creation_time',
            columnNames: ['creation_time'],
          }),
          new TableIndex({
            name: 'IDX_event_exceptions_deletion_time',
            columnNames: ['deletion_time'],
          }),
        ],
        foreignKeys: [
          {
            name: 'FK_event_exceptions_event_series_id',
            columnNames: ['event_series_id'],
            referencedTableName: 'event_series',
            referencedColumnNames: ['id'],
          },
          {
            name: 'FK_event_exceptions_new_event_id',
            columnNames: ['new_event_id'],
            referencedTableName: 'events',
            referencedColumnNames: ['id'],
          },
        ],
      }),
      true,
      true,
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('event_exceptions', true);
    await queryRunner.dropTable('event_series', true);
    await queryRunner.dropTable('events', true);
    await queryRunner.dropTable('calendars', true);
  }
}
