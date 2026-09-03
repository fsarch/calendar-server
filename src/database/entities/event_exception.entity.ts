import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EventSeries } from './event_series.entity.js';
import { Event } from './event.entity.js';

@Entity({ name: 'event_exceptions' })
export class EventException {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'pk__event_exceptions',
  })
  id: string;

  @Column({ length: 2048, nullable: true, name: 'external_id' })
  @Index({ unique: true, where: 'deletion_time IS NULL' })
  externalId?: string;

  @Column({ type: 'uuid', nullable: false, name: 'event_series_id' })
  @Index()
  eventSeriesId: string;

  @ManyToOne(() => EventSeries, (series) => series.id)
  @JoinColumn({ name: 'event_series_id' })
  eventSeries: EventSeries;

  @Column({ type: 'timestamptz', nullable: false, name: 'original_start' })
  @Index()
  originalStart: Date;

  @Column({ type: 'boolean', nullable: false, default: false, name: 'is_moved' })
  @Index()
  isMoved: boolean;

  @Column({ type: 'boolean', nullable: false, default: false, name: 'is_cancelled' })
  @Index()
  isCancelled: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'new_event_id' })
  @Index()
  newEventId?: string;

  @ManyToOne(() => Event, (event) => event.id)
  @JoinColumn({ name: 'new_event_id' })
  newEvent?: Event;

  @CreateDateColumn({ name: 'creation_time' })
  @Index()
  creationTime: Date;

  @DeleteDateColumn({ name: 'deletion_time', nullable: true })
  @Index()
  deletionTime?: Date;
}
