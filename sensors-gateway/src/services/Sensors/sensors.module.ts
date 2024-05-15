import { Module } from '@nestjs/common';
import { SensorsController } from './sensors.controller';
import { SensorsService } from './sensors.service';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Sensor } from 'shared/entities/Sensor/sensor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sensor])],
  controllers: [SensorsController],
  providers: [SensorsService],
})
export class SensorsModule {}
