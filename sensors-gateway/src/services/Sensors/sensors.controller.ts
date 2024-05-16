import {
  Controller,
  Post,
  Body,
  Delete,
  Param,
  ParseIntPipe,
  Get,
} from "@nestjs/common";
import { SensorsService } from "./sensors.service";
import { CreateSensorDto } from "shared/entities/Sensor/dtos/sensor-create.dto";
import { KafkaService } from "../kafka/kafka.service";

@Controller("sensors")
export class SensorsController {
  constructor(
    private readonly sensorsService: SensorsService,
    private readonly kafkaService: KafkaService,

  ) {}

  @Post()
  createSample(@Body() data: CreateSensorDto) {
    if (!this.kafkaService.isConnected) {
      throw new Error('Kafka is not connected yet.');
    }
    this.sensorsService.createSensor(data);
  }

  @Delete(":id")
  deleteSample(@Param("id", ParseIntPipe) id: number) {
    if (!this.kafkaService.isConnected) {
      throw new Error('Kafka is not connected yet.');
    }
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
