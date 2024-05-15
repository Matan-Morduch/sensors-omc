import { Injectable } from "@nestjs/common";
import { Sensor } from "shared/entities/Sensor/sensor.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";

@Injectable()
export class SensorsService {
  constructor(
    @InjectRepository(Sensor)
    private readonly sensorsRepository: Repository<Sensor>
  ) {}

  onModuleInit() {
    this.checkAndDeleteOutdatedSensors(); // Run immediately on service start
  }

  async bulkCreateOrUpdateSensors(
    createBatch: { id: number; face: string; faulty?: boolean }[],
    maxRetries = 2,
    retryDelay = 2000
  ) {
    // Create a Map to store unique sensors, prioritizing faulty sensors and setting lastUpdated
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

    const sensorIds = uniqueBatch.map((sensor) => sensor.id);
    const existingSensors = await this.sensorsRepository.findByIds(sensorIds);

    const finalBatch = uniqueBatch.map((sensor) => {
      const existingSensor = existingSensors.find((es) => es.id === sensor.id);
      if (existingSensor && existingSensor.faulty) {
        // Preserve the existing faulty value if it's true
        sensor.faulty = true;
      }
      return sensor;
    });
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const queryRunner =
        this.sensorsRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into(Sensor)
          .values(finalBatch)
          .orUpdate(["face", "faulty", "last_updated"], ["id"]) // This is equivalent to ON CONFLICT (id) DO UPDATE SET face = EXCLUDED.face, faulty = EXCLUDED.faulty
          .execute();
        await queryRunner.commitTransaction();
        return;
      } catch (err) {
        await queryRunner.rollbackTransaction();
        if (err.code === "40P01") {
          await new Promise((res) => setTimeout(res, retryDelay)); // Delay before retry
        } else {
          console.error("Error during bulk insert:", err);
        }
      } finally {
        await queryRunner.release();
      }
    }
    throw new Error("Maxed tries for queryRunner deadlock");
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
