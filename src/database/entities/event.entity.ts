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
import { Calendar } from './calendar.entity.js';

@Entity({ name: 'events' })
export class Event {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'pk__events',
  })
  id: string;

  @Column({ type: 'uuid', nullable: false, name: 'calendar_id' })
  @Index()
  calendarId: string;

  @ManyToOne(() => Calendar, (calendar) => calendar.id)
  @JoinColumn({ name: 'calendar_id' })
  calendar: Calendar;

  @Column({ length: 4096, nullable: true })
  title?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 2048, nullable: true, name: 'external_id' })
  @Index({ unique: true, where: 'deletion_time IS NULL' })
  externalId?: string;

  @Column({ length: 128, nullable: true })
  timezone?: string;

  @Column({ type: 'timestamptz', nullable: false, name: 'start_at' })
  @Index()
  startAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'end_at' })
  @Index()
  endAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'creation_time' })
  @Index()
  creationTime: Date;

  @DeleteDateColumn({ name: 'deletion_time', nullable: true })
  @Index()
  deletionTime?: Date;
}
