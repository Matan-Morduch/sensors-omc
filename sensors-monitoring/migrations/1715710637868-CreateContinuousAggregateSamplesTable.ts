import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateContinuousAggregateSamplesTable1715710637868
  implements MigrationInterface
{
  public readonly transaction = false;
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE MATERIALIZED VIEW samples_hourly_avg
          WITH (timescaledb.continuous)
          AS
          SELECT time_bucket('1 hour', timestamp) AS bucket,
                 face,
                 AVG(temperature) AS avg_temperature
          FROM samples
          GROUP BY bucket, face;
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP MATERIALIZED VIEW IF EXISTS samples_hourly_avg;`
    );
  }
}
