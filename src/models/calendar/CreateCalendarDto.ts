import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsTimeZone } from 'class-validator';

export class CreateCalendarDto {
  @ApiProperty({ description: 'Name des Kalenders', example: 'Arbeitskalender' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Standard-Zeitzone', example: 'Europe/Berlin' })
  @IsString()
  @IsTimeZone()
  @MaxLength(128)
  defaultTimezone: string;

  @ApiProperty({ description: 'Externe ID', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(2048)
  externalId?: string;
}
