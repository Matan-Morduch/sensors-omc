import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexesToSensors1715806106905 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX idx_sensor_faulty ON sensors(faulty);`
    );
    await queryRunner.query(
      `CREATE INDEX idx_sensor_last_updated ON sensors(last_updated);`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_sensor_faulty;`);
    await queryRunner.query(`DROP INDEX idx_sensor_last_updated;`);
  }
}
