import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsUUID, IsTimeZone, IsOptional } from 'class-validator';
import { IsValidRRule } from '../../validation/rrule.validator.js';
import { IsDate } from '../../validation/date.validator.js';

export class CreateEventSeriesDto {
  @ApiProperty({ description: 'Event-ID', format: 'uuid', required: false })
  @IsUUID()
  @IsOptional()
  eventId?: string;

  @ApiProperty({ description: 'Externe ID', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(2048)
  externalId?: string;

  @ApiProperty({ description: 'Zeitzone' })
  @IsTimeZone()
  @MaxLength(128)
  timezone: string;

  @ApiProperty({ description: 'RRULE (RFC 5545)', example: 'FREQ=WEEKLY;BYDAY=MO,WE,FR' })
  @IsString()
  @IsNotEmpty()
  @IsValidRRule()
  rrule: string;

  @ApiProperty({
    description:
      'Gültig ab (Anker fuer die RRULE-Berechnung). Muss mit dem startAt des zugehörigen ' +
      'Events übereinstimmen - ohne Angabe wird startAt des Events übernommen.',
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @IsDate()
  validFrom?: Date;

  @ApiProperty({ description: 'Gültig bis', format: 'date-time', required: false })
  @IsOptional()
  @IsDate()
  validTo?: Date;
}
