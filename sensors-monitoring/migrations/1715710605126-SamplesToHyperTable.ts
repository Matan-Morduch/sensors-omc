import { MigrationInterface, QueryRunner } from "typeorm";

export class SamplesToHyperTable1715710605126 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `SELECT create_hypertable('public.samples', 'timestamp');`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SELECT drop_hypertable('public.samples');`);
  }
}
