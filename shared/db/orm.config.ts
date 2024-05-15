import { registerAs } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { Sample } from "../entities/Sample/sample.entity";
import { Sensor } from "../entities/Sensor/sensor.entity";
import { DataSourceOptions } from "typeorm";

export function getConfig(migartionsPath?: string): TypeOrmModuleOptions & DataSourceOptions {
  return {
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [Sensor, Sample],
    synchronize: false,
    migrationsRun: true,
    migrationsTableName: "typeorm_migrations",
    migrationsTransactionMode: "each",
    migrations: [migartionsPath ? migartionsPath : "dist/migrations/*.js"],
    dropSchema: Boolean(parseInt(process.env.DB_DROP_SCHEMA)),
  };
}

export default registerAs("orm.config", (): TypeOrmModuleOptions => {
  return getConfig();
});

export const connectionSource = new DataSource(getConfig());
