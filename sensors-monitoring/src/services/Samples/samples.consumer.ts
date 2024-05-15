import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConsumerService } from "../../Consumer.service";
import { SamplesService } from "./samples.service";
import { SensorsService } from "../Sensors/sensors.service";
import { Consumer, EachMessagePayload } from "kafkajs";
import { CreateSensorDto } from "shared/entities/Sensor/dtos/sensor-create.dto";

interface PartitionBuffer {
  buffer: any[];
  bufferLocked: boolean;
}

@Injectable()
export class SamplesConsumer implements OnModuleInit {
  private buffers = new Map<number, PartitionBuffer>();
  private thrownWarningForSensorsIds = new Set<number>();
  private readonly logger = new Logger(SamplesConsumer.name);

  constructor(
    private readonly samplesService: SamplesService,
    private readonly sensorsService: SensorsService,
    private readonly consumerService: ConsumerService
  ) {}

  async onModuleInit() {
    await this.consumerService.consume(
      "samples-group",
      {
        topics: ["sensors-samples"],
        fromBeginning: true,
      },
      {
        eachMessage: this.handleEachMessage.bind(this),
        autoCommit: false,
      },
      14
    );
  }

  private async handleEachMessage(
    payload: EachMessagePayload,
    consumer: Consumer
  ) {
    const partitionBuffer = this.getPartitionBuffer(payload.partition);
    if (partitionBuffer.bufferLocked) return;

    partitionBuffer.bufferLocked = true;
    partitionBuffer.buffer.push(...this.parseMessage(payload.message.value));
    try {
      await this.processBuffer(payload.partition);
      await this.consumerService.commitOffsets(
        consumer,
        payload.topic,
        payload.partition,
        payload.message.offset
      );
    } catch (e) {
      if (e.code === "40P01") {
        console.log(`Deadlock detected. Skipping this commit.`);
      } else {
        throw e;
      }
    }

    partitionBuffer.bufferLocked = false;
    await payload.heartbeat();
  }

  private getPartitionBuffer(partition: number): PartitionBuffer {
    if (!this.buffers.has(partition)) {
      this.buffers.set(partition, { buffer: [], bufferLocked: false });
    }
    return this.buffers.get(partition);
  }

  private parseMessage(messageValue: Buffer): any[] {
    return JSON.parse(messageValue.toString());
  }

  private async processBuffer(partition: number): Promise<void> {
    const partitionBuffer = this.buffers.get(partition);
    const sensorsToCreateOrUpdate = new Map<number, CreateSensorDto>();

    const sensorIds = new Set(
      partitionBuffer.buffer.map((sample) => sample.id)
    );

    const existingSensors = await this.sensorsService.findSensorsByIds(
      Array.from(sensorIds)
    );

    const existingSensorsMap = new Map(
      existingSensors.map((sensor) => [sensor.id, sensor])
    );

    await Promise.all(
      partitionBuffer.buffer.map((sample) =>
        this.handleSample(sample, existingSensorsMap, sensorsToCreateOrUpdate)
      )
    );

    await this.saveData(sensorsToCreateOrUpdate, partitionBuffer.buffer);
    partitionBuffer.buffer = [];
  }

  private async handleSample(
    sample: any,
    existingSensorsMap: Map<number, any>,
    sensorsToCreateOrUpdate: Map<number, any>
  ): Promise<void> {
    const timeStamp = new Date(sample.timestamp * 1000);
    if (isNaN(timeStamp.getTime())) {
      this.logger.warn(
        `Invalid timestamp for sample ID ${sample.id}: ${sample.timestamp}`
      );
      return;
    }
    sample.timestamp = timeStamp;

    const thresholdTemperature =
      await this.samplesService.getAverageFaceHourlyTemperature(sample.face);
    const faulty = thresholdTemperature
      ? sample.temperature > thresholdTemperature
      : false;

    const existingSensor = existingSensorsMap.get(sample.id);
    const shouldWarn = this.shouldWarnForFaultySensor(
      sample.id,
      existingSensor,
      faulty
    );

    if (shouldWarn) {
      this.warnForFaultySensor(sample.id);
    }

    // If faulty = false but the sensor is faulty i don't want to update it to be not faulty.
    if (!existingSensor || !existingSensor.faulty) {
      sensorsToCreateOrUpdate.set(sample.id, {
        id: sample.id,
        face: sample.face,
        faulty: faulty,
      });
    } else {
      sensorsToCreateOrUpdate.set(sample.id, {
        id: sample.id,
        face: sample.face,
      });
    }
  }

  private shouldWarnForFaultySensor(
    sensorId: number,
    existingSensor: any,
    faulty: boolean
  ): boolean {
    return (
      faulty &&
      !this.thrownWarningForSensorsIds.has(sensorId) &&
      (!existingSensor || !existingSensor.faulty)
    );
  }

  private warnForFaultySensor(sensorId: number) {
    this.thrownWarningForSensorsIds.add(sensorId);
    console.log(
      `\x1b[1;31mSensor with id: ${sensorId} is malfunctioning!\x1b[0m`
    );
  }

  private async saveData(
    sensorsToCreateOrUpdate: Map<number, any>,
    buffer: any[]
  ): Promise<void> {
    const allSensors = [...sensorsToCreateOrUpdate.values()];
    if (allSensors.length > 0) {
      await this.sensorsService.bulkCreateOrUpdateSensors(allSensors);
    }
    await this.samplesService.bulkCreate(buffer);
  }
}
