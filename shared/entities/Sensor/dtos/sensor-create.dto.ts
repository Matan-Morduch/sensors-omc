import { IsEnum, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { DirectionEnum } from '../../../enums/directionEnum';

export class CreateSensorDto {
  @IsNumber()
  id: number;

  @IsEnum(DirectionEnum)
  face: DirectionEnum;
  
  @IsBoolean()
  @IsOptional()
  faulty: boolean;
}
