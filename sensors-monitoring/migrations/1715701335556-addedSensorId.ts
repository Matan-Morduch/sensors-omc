import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedSensorId1715701335556 implements MigrationInterface {
    name = 'AddedSensorId1715701335556'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "samples" DROP CONSTRAINT "FK_a65b6073c18206e42a67ebbef24"`);
        await queryRunner.query(`ALTER TABLE "samples" ALTER COLUMN "sensor_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "samples" ADD CONSTRAINT "FK_a65b6073c18206e42a67ebbef24" FOREIGN KEY ("sensor_id") REFERENCES "sensors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "samples" DROP CONSTRAINT "FK_a65b6073c18206e42a67ebbef24"`);
        await queryRunner.query(`ALTER TABLE "samples" ALTER COLUMN "sensor_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "samples" ADD CONSTRAINT "FK_a65b6073c18206e42a67ebbef24" FOREIGN KEY ("sensor_id") REFERENCES "sensors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
