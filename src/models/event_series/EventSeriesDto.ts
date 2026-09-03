import { ApiProperty } from '@nestjs/swagger';

export class EventSeriesDto {
  @ApiProperty({ description: 'Einzigartige ID', format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Event-ID', format: 'uuid' })
  eventId!: string;

  @ApiProperty({ description: 'Externe ID', nullable: true })
  externalId: string | null = null;

  @ApiProperty({ description: 'Zeitzone' })
  timezone!: string;

  @ApiProperty({ description: 'RRULE' })
  rrule!: string;

  @ApiProperty({ description: 'Gültig ab', format: 'date-time' })
  validFrom!: Date;

  @ApiProperty({ description: 'Gültig bis', format: 'date-time', nullable: true })
  validTo: Date | null = null;

  @ApiProperty({ description: 'Erstellungszeitpunkt' })
  creationTime!: Date;

  @ApiProperty({ description: 'Löschzeitpunkt', nullable: true })
  deletionTime: Date | null = null;
}
