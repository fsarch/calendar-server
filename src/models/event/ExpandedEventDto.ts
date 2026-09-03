import { ApiProperty } from '@nestjs/swagger';

export type ExceptionType = 'cancelled' | 'moved' | null;

export class ExpandedEventDto {
  @ApiProperty({ description: 'Einzigartige ID (bei Serien: eventId-timestamp)' })
  id: string;

  @ApiProperty({ description: 'Kalender-ID', format: 'uuid' })
  calendarId: string;

  @ApiProperty({ description: 'Titel', nullable: true })
  title: string | null;

  @ApiProperty({ description: 'Beschreibung', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Externe ID', nullable: true })
  externalId: string | null;

  @ApiProperty({ description: 'Zeitzone', nullable: true })
  timezone: string | null;

  @ApiProperty({ description: 'Startzeitpunkt', format: 'date-time' })
  startAt: Date;

  @ApiProperty({ description: 'Endzeitpunkt', format: 'date-time', nullable: true })
  endAt: Date | null;

  @ApiProperty({
    description: 'Beliebige zusätzliche Metadaten (JSON-Objekt)',
    nullable: true,
    type: Object,
  })
  metadata: Record<string, unknown> | null;

  @ApiProperty({ description: 'Ist wiederkehrendes Event' })
  isRecurring: boolean;

  @ApiProperty({ description: 'Original Event ID (bei Serien)', nullable: true })
  recurringInstanceOf: string | null;

  @ApiProperty({ description: 'Ist eine Exception' })
  isException: boolean;

  @ApiProperty({ description: 'Typ der Exception', enum: ['cancelled', 'moved', null] })
  exceptionType: ExceptionType;
}
