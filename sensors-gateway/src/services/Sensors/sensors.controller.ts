import { Controller, Post, Body, Delete, Param, ParseIntPipe, Get } from '@nestjs/common';
import { SensorsService } from './sensors.service';
import { CreateSensorDto } from 'shared/entities/Sensor/dtos/sensor-create.dto';

@Controller('sensors')
export class SensorsController {
  constructor(
    private readonly sensorsService: SensorsService,
    
  ) {}

    @Post()
    createSample(@Body() data: CreateSensorDto) {
      this.sensorsService.createSensor(data);
    }

    @Delete(':id')
    deleteSample(@Param('id', ParseIntPipe) id: number) {
      this.sensorsService.deleteSensor(id);
    }

    @Get('/weekly-avg-face-temperature')
    async getLastWeekAvgSensorsTemperature() {
      return await this.sensorsService.getLastWeekAvgSensorsTemperature();
    }

    @Get('/faulty')
    async getFaultySensors() {
      return await this.sensorsService.getFaultySensors();
    }
}
