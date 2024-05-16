import { Module } from "@nestjs/common";
import { SamplesService } from "./samples.service";
import { SamplesConsumer } from "./samples.consumer";
import { ConsumerService } from "../../Consumer.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Sample } from "shared/entities/Sample/sample.entity";
import { SensorsService } from "../Sensors/sensors.service";
import { Sensor } from "shared/entities/Sensor/sensor.entity";
import { ScheduleModule } from "@nestjs/schedule";
import { CacheModule } from "@nestjs/cache-manager";

@Module({
  imports: [
    TypeOrmModule.forFeature([Sample, Sensor]),
    ScheduleModule.forRoot(),
    CacheModule.register({ ttl: 0 }),
  ],
  providers: [SamplesService, SamplesConsumer, ConsumerService, SensorsService],
})
export class SamplesModule {}
