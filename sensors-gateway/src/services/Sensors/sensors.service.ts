import { Inject, Injectable } from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import { CreateSensorDto } from "shared/entities/Sensor/dtos/sensor-create.dto";
import { SensorCreateEvent } from "./events/sensor-create.event";
import { SensorDeleteEvent } from "./events/sensor-delete.event";
import { EntityManager, Repository } from "typeorm";
import { KafkaService } from "../kafka/kafka.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Sensor } from "shared/entities/Sensor/sensor.entity";
import { findEarliestAndLatest } from "shared/utils/utils";
import { DirectionEnum } from "shared/enums/directionEnum";

@Injectable()
export class SensorsService {
  private createBatch: SensorCreateEvent[] = [];
  private deleteBatch: SensorDeleteEvent[] = [];
  private readonly maxBatchSize: number = 500;
  private readonly batchTimer: number = 1000;

  constructor(
    @Inject("KAFKA_SERVICE") private readonly kafkaClient: ClientKafka,
    private readonly kafkaService: KafkaService,
    private readonly entityManager: EntityManager,
    @InjectRepository(Sensor)
    private readonly sensorsRepository: Repository<Sensor>
  ) {}

  async onModuleInit() {
    this.kafkaService.addPartitions("sensors-create", 8);
    this.kafkaService.addPartitions("sensors-delete", 8);
    this.startBatchTimer();
  }

  createSensor({ face, id, faulty }: CreateSensorDto) {
    const event = new SensorCreateEvent(id, face, faulty);

    this.createBatch.push(event);
    if (this.createBatch.length >= this.maxBatchSize) {
      this.sendBatch("sensors-create", this.createBatch);
    }
  }

  deleteSensor(id: number) {
    const event = new SensorDeleteEvent(id);
    this.deleteBatch.push(event);
    if (this.deleteBatch.length >= this.maxBatchSize) {
      this.sendBatch("sensors-delete", this.deleteBatch);
    }
  }

  private sendBatch<T>(topic: string, batch: T[]) {
    if (batch.length > 0) {
      const batchToSend = [...batch];
      batch.splice(0, batch.length);
      this.kafkaClient.emit(topic, batchToSend).subscribe({
        next: () => {},
        error: (error) => {
          batch.push(...batchToSend);
        },
      });
    }
  }

  private startBatchTimer() {
    setInterval(() => {
      this.sendBatch("sensors-delete", this.deleteBatch);
      this.sendBatch("sensors-create", this.createBatch);
    }, this.batchTimer);
  }

  async getLastWeekAvgSensorsTemperature(): Promise<any[]> {
    const now = new Date();
    now.setMinutes(0, 0, 0);

    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const query = `
    SELECT face, bucket AS timestamp, ROUND(CAST(avg_temperature AS numeric), 2) AS "avgTemperature"
    FROM samples_hourly_avg
    WHERE bucket >= $1
  `;
    const result = await this.entityManager.query(query, [oneWeekAgo]);

    if (result.length === 0) {
      return result;
    }

    const timeEntries = [];

    const { earliest: resultEarliest, latest: resultLatest } =
      findEarliestAndLatest(result);

    const latest = new Date(Math.max(resultLatest.getTime(), now.getTime()));

    const earliest = new Date(
      Math.max(resultEarliest.getTime(), oneWeekAgo.getTime())
    );

    const resultMap = new Map<string, number>();
    for (const entry of result) {
      const key = `${entry.timestamp}-${entry.face}`;
      resultMap.set(key, entry.avgTemperature);
    }

    for (
      let current = new Date(earliest);
      current <= latest;
      current.setHours(current.getHours() + 1)
    ) {
      for (const face of Object.values(DirectionEnum)) {
        const key = `${current}-${face}`;
        const avgTemperature = resultMap.get(key) ?? 0;

        timeEntries.push({
          timestamp: new Date(current), // Use a new Date instance to avoid mutation
          face: face as DirectionEnum,
          avgTemperature: avgTemperature,
        });
      }
    }

    return timeEntries;
  }

  async getFaultySensors(): Promise<any[]> {
    return this.sensorsRepository
      .createQueryBuilder("sensor")
      .leftJoinAndSelect("sensor.samples", "sample")
      .select("sensor.id", "sensorId")
      .addSelect(
        "ROUND(CAST(AVG(sample.temperature) AS numeric), 2)",
        "avgTemperature"
      )
      .where("sensor.faulty = :faulty", { faulty: true })
      .groupBy("sensor.id")
      .orderBy("sensor.id")
      .getRawMany();
  }
}
