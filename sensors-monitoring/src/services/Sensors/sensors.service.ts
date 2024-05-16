import { Inject, Injectable } from "@nestjs/common";
import { Sensor } from "shared/entities/Sensor/sensor.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

@Injectable()
export class SensorsService {
  constructor(
    @InjectRepository(Sensor)
    private readonly sensorsRepository: Repository<Sensor>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache
  ) {}

  onModuleInit() {
    this.checkAndDeleteOutdatedSensors(); // Run immediately on service start
  }

  async bulkCreateOrUpdateSensors(
    createBatch: { id: number; face: string; faulty?: boolean }[],
    batchSize = 100,
    maxRetries = 2,
    retryDelay = 2000
  ) {
    const uniqueBatchMap = new Map<
      number,
      { id: number; face: string; faulty?: boolean; lastUpdated: Date }
    >();

    for (const sensor of createBatch) {
      const existingSensor = uniqueBatchMap.get(sensor.id);
      if (!existingSensor || sensor.faulty) {
        uniqueBatchMap.set(sensor.id, { ...sensor, lastUpdated: new Date() });
      }
    }
    const uniqueBatch = Array.from(uniqueBatchMap.values());
    for (let i = 0; i < uniqueBatch.length; i += batchSize) {
      const batch = uniqueBatch.slice(i, i + batchSize);
      await this.processBatch(batch, maxRetries, retryDelay);
    }
  }

  private async processBatch(
    batch: { id: number; face: string; faulty?: boolean }[],
    maxRetries: number,
    retryDelay: number
  ) {
    const sensorIds = batch.map((sensor) => sensor.id);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const queryRunner =
        this.sensorsRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        // Acquire advisory lock
        const lockKey = this.generateLockKey(sensorIds);
        await queryRunner.query(`SELECT pg_advisory_lock(${lockKey});`);

        const existingFaultySensors = await this.findFaultySensors();
        const faultySensorsMap = new Map(
          existingFaultySensors.map((sensor) => [sensor.id, sensor])
        );

        const newlyMarkedFaultySensors = [];

        const finalBatch = batch.map((sensor) => {
          const existingSensor = faultySensorsMap.get(sensor.id);
          if (sensor.faulty && (!existingSensor || !existingSensor.faulty)) {
            newlyMarkedFaultySensors.push(sensor.id);
          }
          if (existingSensor && existingSensor.faulty) {
            sensor.faulty = true;
          }
          return sensor;
        });

        await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into(Sensor)
          .values(finalBatch)
          .orUpdate(["face", "faulty", "last_updated"], ["id"])
          .execute();
        await queryRunner.commitTransaction();

        // Invalidate cache if any sensor was newly marked as faulty
        if (newlyMarkedFaultySensors.length > 0) {
          await this.cacheManager.del("faulty_sensors");
        }
        return;
      } catch (err) {
        await queryRunner.rollbackTransaction();
        if (err.code === "40P01") {
          await new Promise((res) => setTimeout(res, retryDelay));
        } else {
          console.error("Error during bulk insert:", err);
        }
      } finally {
        // Release advisory lock
        const lockKey = this.generateLockKey(sensorIds);
        await queryRunner.query(`SELECT pg_advisory_unlock(${lockKey});`);

        await queryRunner.release();
      }
    }
    throw new Error("Maxed tries for queryRunner deadlock");
  }

  private generateLockKey(sensorIds: number[]): number {
    // Generate a unique lock key based on sensor IDs
    return sensorIds.reduce((acc, id) => acc + id, 0);
  }

  async bulkDeleteSensors(deleteBatch: { id: number }[]) {
    const ids = deleteBatch.map((sensor) => sensor.id);
    const queryRunner =
      this.sensorsRepository.manager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(Sensor)
        .whereInIds(ids)
        .execute();

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error("Error during bulk delete:", err);
    } finally {
      await queryRunner.release();
    }
  }

  async findSensorsByIds(ids: number[]): Promise<Sensor[]> {
    return this.sensorsRepository.findBy({ id: In(ids) });
  }

  async findFaultySensors(): Promise<Sensor[]> {
    const cacheKey = `faulty_sensors`;
    const cachedFaultySensors = await this.cacheManager.get<Sensor[]>(cacheKey);
    if (cachedFaultySensors) {
      return cachedFaultySensors;
    }
    const faultySensors = await this.sensorsRepository.find({
      where: { faulty: true },
    });
    await this.cacheManager.set(cacheKey, faultySensors);
    return faultySensors;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkAndDeleteOutdatedSensors() {
    console.log("Checking for outdated sensors...");
    const deleteResult = await this.sensorsRepository
      .createQueryBuilder()
      .delete()
      .from(Sensor)
      .where("last_updated < NOW() - INTERVAL '24 HOURS'")
      .execute();

    console.log(`Deleted ${deleteResult.affected} outdated sensors.`);
  }
}
