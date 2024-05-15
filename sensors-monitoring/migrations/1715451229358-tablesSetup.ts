import { MigrationInterface, QueryRunner } from "typeorm";

export class TablesSetup1715451229358 implements MigrationInterface {
  name = "TablesSetup1715451229358";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "direction_enum" AS ENUM('north', 'east', 'south', 'west')`
    );

    await queryRunner.query(`CREATE TABLE "samples" (
            "id" SERIAL NOT NULL, 
            "timestamp" TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
            "face" "direction_enum" NOT NULL, 
            "temperature" double precision NOT NULL, 
            "sensor_id" integer, 
            CONSTRAINT "PK_d68b5b3bd25a6851b033fb63444" PRIMARY KEY ("id", "timestamp")
        )`);

    await queryRunner.query(`CREATE TABLE "sensors" (
            "id" integer NOT NULL, 
            "face" "direction_enum" NOT NULL, 
            "faulty" boolean NOT NULL DEFAULT false, 
            "last_updated" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(), 
            CONSTRAINT "PK_b8bd5fcfd700e39e96bcd9ba6b7" PRIMARY KEY ("id")
        )`);

    await queryRunner.query(`ALTER TABLE "samples" 
            ADD CONSTRAINT "FK_a65b6073c18206e42a67ebbef24" 
            FOREIGN KEY ("sensor_id") 
            REFERENCES "sensors"("id") 
            ON DELETE SET NULL 
            ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "samples" DROP CONSTRAINT "FK_a65b6073c18206e42a67ebbef24"`
    );
    await queryRunner.query(`DROP TABLE "samples"`);
    await queryRunner.query(`DROP TABLE "sensors"`);
    await queryRunner.query(`DROP TYPE "direction_enum"`);
  }
}
