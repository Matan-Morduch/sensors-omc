import { IsEnum, IsNumber } from 'class-validator';
import { DirectionEnum } from '../../../enums/directionEnum';
import IsUnixTimestamp from '../../validators/isUnixTimestamp';

export class CreateSampleDto {
  @IsNumber()
  id: number;

  @IsEnum(DirectionEnum)
  face: DirectionEnum;
  
  @IsUnixTimestamp({ message: 'Invalid Unix timestamp' })
  timestamp: number;

  @IsNumber()
  temperature: number;
}
