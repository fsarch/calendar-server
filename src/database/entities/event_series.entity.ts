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
import { Event } from './event.entity.js';

@Entity({ name: 'event_series' })
export class EventSeries {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'pk__event_series',
  })
  id: string;

  @Column({ type: 'uuid', nullable: false, name: 'event_id' })
  @Index()
  eventId: string;

  @ManyToOne(() => Event, (event) => event.id)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ length: 2048, nullable: true, name: 'external_id' })
  @Index({ unique: true, where: 'deletion_time IS NULL' })
  externalId?: string;

  @Column({ length: 128, nullable: false })
  @Index()
  timezone: string;

  @Column({ type: 'text', nullable: false })
  @Index()
  rrule: string;

  @Column({ type: 'timestamptz', nullable: false, name: 'valid_from' })
  @Index()
  validFrom: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'valid_to' })
  @Index()
  validTo?: Date;

  @CreateDateColumn({ name: 'creation_time' })
  @Index()
  creationTime: Date;

  @DeleteDateColumn({ name: 'deletion_time', nullable: true })
  @Index()
  deletionTime?: Date;
}
