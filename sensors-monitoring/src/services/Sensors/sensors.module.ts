import { Module } from "@nestjs/common";
import { SensorsService } from "./sensors.service";
import { SensorsConsumer } from "./sensors.consumer";
import { ConsumerService } from "../../Consumer.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Sensor } from "shared/entities/Sensor/sensor.entity";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [
    TypeOrmModule.forFeature([Sensor]),
    ScheduleModule.forRoot()
  ],
  providers: [SensorsService, SensorsConsumer, ConsumerService],
})
export class SensorsModule {}
