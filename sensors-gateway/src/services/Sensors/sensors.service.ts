import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
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
import * as moment from "moment-timezone";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";

@Injectable()
export class SensorsService implements OnModuleInit {
  private createBatch: SensorCreateEvent[] = [];
  private deleteBatch: SensorDeleteEvent[] = [];
  private readonly maxBatchSize: number = 500;
  private readonly batchTimer: number = 1000;

  private lastWeekAvgTempLock: Promise<any[]> | null = null;
  private faultySensorsLock: Promise<any[]> | null = null;

  constructor(
    @Inject("KAFKA_SERVICE") private readonly kafkaClient: ClientKafka,
    private readonly kafkaService: KafkaService,
    private readonly entityManager: EntityManager,
    @InjectRepository(Sensor)
    private readonly sensorsRepository: Repository<Sensor>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache
  ) {}

  async onModuleInit() {
    this.kafkaService.addPartitions("sensors-create", 8);
    this.kafkaService.addPartitions("sensors-delete", 8);
    this.startBatchTimer();
    this.scheduleNextLastWeekAvgTemperatureCacheRefresh();
    this.scheduleNextFaultySensorsCacheRefresh();
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

  private async scheduleNextLastWeekAvgTemperatureCacheRefresh() {
    await this.refreshLastWeekAvgTemperatureCache();
    setTimeout(() => this.scheduleNextLastWeekAvgTemperatureCacheRefresh(), 1000);
  }

  private async scheduleNextFaultySensorsCacheRefresh() {
    await this.refreshFaultySensorsCache();
    setTimeout(() => this.scheduleNextFaultySensorsCacheRefresh(), 1000);
  }

  async refreshLastWeekAvgTemperatureCache() {
    await this.calculateAndCacheLastWeekAvgTemperature();
  }

  async refreshFaultySensorsCache() {
    await this.calculateAndCacheFaultySensors();
  }

  async getLastWeekAvgSensorsTemperature(): Promise<any[]> {
    const cacheKey = `weekly_avg_face_temperature`;
    const cachedValue = await this.cacheManager.get<any[]>(cacheKey);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    if (!this.lastWeekAvgTempLock) {
      this.lastWeekAvgTempLock = this.calculateAndCacheLastWeekAvgTemperature();
    }

    try {
      const result = await this.lastWeekAvgTempLock;
      return result;
    } finally {
      this.lastWeekAvgTempLock = null;
    }
  }

  async getFaultySensors(): Promise<any[]> {
    const cacheKey = "faulty-sensors";
    const cachedValue = await this.cacheManager.get<any[]>(cacheKey);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    if (!this.faultySensorsLock) {
      this.faultySensorsLock = this.calculateAndCacheFaultySensors();
    }

    try {
      const result = await this.faultySensorsLock;
      return result;
    } finally {
      this.faultySensorsLock = null;
    }
  }

  private async calculateAndCacheLastWeekAvgTemperature(): Promise<any[]> {
    const cacheKey = `weekly_avg_face_temperature`;
    const israelMoment = moment().tz("Asia/Jerusalem");

    // Round to the nearest hour
    israelMoment.minutes(0).seconds(0).milliseconds(0);

    const oneWeekAgo = israelMoment.clone().subtract(7, "days");

    const query = `
      SELECT face, bucket AS timestamp, ROUND(CAST(avg_temperature AS numeric), 2) AS "avgTemperature"
      FROM samples_hourly_avg
      WHERE bucket >= $1
    `;
    const result = await this.entityManager.query(query, [
      oneWeekAgo.toISOString(),
    ]);

    if (result.length === 0) {
      return result;
    }

    const timeEntries = [];
    const { earliest: resultEarliest, latest: resultLatest } =
      findEarliestAndLatest(result);
    const latest = moment.max(moment(resultLatest), israelMoment);
    const earliest = moment.max(moment(resultEarliest), oneWeekAgo);
    const resultMap = new Map<string, number>();

    for (const entry of result) {
      const key = `${entry.timestamp}-${entry.face}`;
      resultMap.set(key, entry.avgTemperature);
    }

    for (
      let current = earliest.clone();
      current.isSameOrBefore(latest);
      current.add(1, "hour")
    ) {
      for (const face of Object.values(DirectionEnum)) {
        const key = `${current.format("YYYY-MM-DDTHH:mm:ss")}-${face}`;
        const avgTemperature = resultMap.get(key) ?? 0;

        timeEntries.push({
          timestamp: current.clone().toDate(), // Convert to Date object
          face: face as DirectionEnum,
          avgTemperature: avgTemperature,
        });
      }
    }

    await this.cacheManager.set(cacheKey, timeEntries);
    return timeEntries;
  }

  private async calculateAndCacheFaultySensors(): Promise<any[]> {
    const cacheKey = "faulty-sensors";
    const result = await this.sensorsRepository
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

    await this.cacheManager.set(cacheKey, result);
    return result;
  }
}
