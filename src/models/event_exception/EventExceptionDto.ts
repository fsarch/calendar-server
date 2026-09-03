import { ApiProperty } from '@nestjs/swagger';

export class EventExceptionDto {
  @ApiProperty({ description: 'Einzigartige ID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Externe ID', nullable: true })
  externalId: string | null;

  @ApiProperty({ description: 'Event-Series-ID', format: 'uuid' })
  eventSeriesId: string;

  @ApiProperty({ description: 'Originaler Startzeitpunkt', format: 'date-time' })
  originalStart: Date;

  @ApiProperty({ description: 'Ist verschoben' })
  isMoved: boolean;

  @ApiProperty({ description: 'Ist storniert' })
  isCancelled: boolean;

  @ApiProperty({ description: 'Neue Event-ID', format: 'uuid', nullable: true })
  newEventId: string | null;

  @ApiProperty({ description: 'Erstellungszeitpunkt' })
  creationTime: Date;

  @ApiProperty({ description: 'Löschzeitpunkt', nullable: true })
  deletionTime: Date | null;
}
