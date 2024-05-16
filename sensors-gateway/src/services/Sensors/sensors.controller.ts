import {
  Controller,
  Post,
  Body,
  Delete,
  Param,
  ParseIntPipe,
  Get,
  Inject,
} from "@nestjs/common";
import { SensorsService } from "./sensors.service";
import { CreateSensorDto } from "shared/entities/Sensor/dtos/sensor-create.dto";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";

@Controller("sensors")
export class SensorsController {
  constructor(
    private readonly sensorsService: SensorsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  @Post()
  createSample(@Body() data: CreateSensorDto) {
    this.sensorsService.createSensor(data);
  }

  @Delete(":id")
  deleteSample(@Param("id", ParseIntPipe) id: number) {
    this.sensorsService.deleteSensor(id);
  }

  @Get("/weekly-avg-face-temperature")
  async getLastWeekAvgSensorsTemperature() {
    return this.sensorsService.getLastWeekAvgSensorsTemperature();
  }

  @Get("/faulty")
  async getFaultySensors() {
    return this.sensorsService.getFaultySensors();
  }
}
