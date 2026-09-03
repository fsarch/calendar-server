import { ApiProperty } from '@nestjs/swagger';

export class EventDto {
  @ApiProperty({ description: 'Einzigartige ID', format: 'uuid' })
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

  @ApiProperty({ description: 'Erstellungszeitpunkt' })
  creationTime: Date;

  @ApiProperty({ description: 'Löschzeitpunkt', nullable: true })
  deletionTime: Date | null;
}
