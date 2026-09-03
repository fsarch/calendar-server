import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsUUID, IsTimeZone, IsObject } from 'class-validator';
import { IsDate } from '../../validation/date.validator.js';

export class CreateEventDto {
  @ApiProperty({ description: 'Titel', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(4096)
  title?: string;

  @ApiProperty({ description: 'Beschreibung', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Externe ID', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(2048)
  externalId?: string;

  @ApiProperty({ description: 'Zeitzone', required: false })
  @IsTimeZone()
  @IsOptional()
  @MaxLength(128)
  timezone?: string;

  @ApiProperty({ description: 'Startzeitpunkt', format: 'date-time' })
  @IsDate()
  startAt: Date;

  @ApiProperty({ description: 'Endzeitpunkt', format: 'date-time', required: false })
  @IsOptional()
  endAt?: Date;

  @ApiProperty({
    description: 'Beliebige zusätzliche Metadaten (JSON-Objekt)',
    required: false,
    type: Object,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
