import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsDateString, IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEventExceptionDto {
  @ApiProperty({ description: 'Externe ID', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(2048)
  externalId?: string;

  @ApiProperty({ description: 'Ist verschoben', default: false })
  @IsBoolean()
  isMoved: boolean;

  @ApiProperty({ description: 'Ist storniert', default: false })
  @IsBoolean()
  isCancelled: boolean;

  @ApiProperty({ description: 'Neue Event-ID (falls verschoben)', format: 'uuid', required: false })
  @IsUUID()
  @IsOptional()
  newEventId?: string;
}
