import { ApiProperty } from '@nestjs/swagger';

export class CalendarDto {
  @ApiProperty({ description: 'Einzigartige ID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Name des Kalenders' })
  name: string;

  @ApiProperty({ description: 'Standard-Zeitzone' })
  defaultTimezone: string;

  @ApiProperty({ description: 'Externe ID', nullable: true })
  externalId: string | null;

  @ApiProperty({ description: 'Erstellungszeitpunkt' })
  creationTime: Date;

  @ApiProperty({ description: 'Löschzeitpunkt', nullable: true })
  deletionTime: Date | null;
}
