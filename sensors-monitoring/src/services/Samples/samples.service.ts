import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Sample } from "shared/entities/Sample/sample.entity";
import { DirectionEnum } from "shared/enums/directionEnum";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

@Injectable()
export class SamplesService {
  constructor(
    @InjectRepository(Sample)
    private readonly samplesRepository: Repository<Sample>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache
  ) {}

  async getLatestAvgTemperatureByFace(
    face: DirectionEnum
  ): Promise<number | null> {
    const query = `
      SELECT avg_temperature
      FROM public.samples_hourly_avg
      WHERE face = $1
      ORDER BY bucket DESC
      LIMIT 1
    `;
    const result = await this.samplesRepository.query(query, [face]);
    return result.length > 0 ? result[0].avg_temperature : null;
  }

  async bulkCreate(samplesData: any[]): Promise<void> {
    const samples = samplesData.map((sampleData) => {
      const sample = new Sample();
      sample.face = sampleData.face;
      sample.timestamp = sampleData.timestamp;
      sample.temperature = sampleData.temperature;
      sample.sensorId = sampleData.id; // Set the sensorId directly

      return sample;
    });
    // Construct a custom query for bulk insert with ON CONFLICT DO NOTHING
    const queryRunner =
      this.samplesRepository.manager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Insert in chunks to avoid parameter overflow
      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(Sample)
        .values(samples)
        .execute();
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error("Error during bulk insert:", err);
    } finally {
      await queryRunner.release();
    }
  }

  async getAverageFaceHourlyTemperature(face: DirectionEnum): Promise<number> {
    const cacheKey = `average_temperature_${face}`;
    const cachedAverage = await this.cacheManager.get<number>(cacheKey);
    if (cachedAverage) {
      return cachedAverage;
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const query = this.samplesRepository
      .createQueryBuilder("sample")
      .select("AVG(sample.temperature)", "averageTemperature")
      .where("sample.timestamp > :oneHourAgo", { oneHourAgo })
      .andWhere("sample.face = :face", { face });

    const result = await query.getRawOne();
    let averageTemperature: number;
    if (result.averageTemperature) {
      averageTemperature = parseFloat(result.averageTemperature);
    } else {
      averageTemperature = await this.getLatestAvgTemperatureByFace(face);
    }

    await this.cacheManager.set(cacheKey, averageTemperature, 60 * 1000);
    return averageTemperature;
  }
}
