import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'calendars' })
export class Calendar {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'pk__calendars',
  })
  id: string;

  @Column({ length: 255, nullable: false })
  @Index()
  name: string;

  @Column({ length: 128, nullable: false, name: 'default_timezone' })
  @Index()
  defaultTimezone: string;

  @Column({ length: 2048, nullable: true, name: 'external_id' })
  @Index({ unique: true, where: 'deletion_time IS NULL' })
  externalId?: string;

  @CreateDateColumn({ name: 'creation_time' })
  @Index()
  creationTime: Date;

  @DeleteDateColumn({ name: 'deletion_time', nullable: true })
  @Index()
  deletionTime?: Date;
}
