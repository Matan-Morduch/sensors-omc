import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import ormConfig, { getConfig } from "shared/db/orm.config";
import { SensorsModule } from "./services/Sensors/sensors.module";
import { SamplesModule } from "./services/Samples/samples.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [ormConfig],
      expandVariables: true,
      envFilePath: process.env.NODE_ENV
        ? `${process.env.NODE_ENV}.env`
        : ".env",
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async () => {
        const config = getConfig('dist/sensors-monitoring/migrations/*.js');
        return config;
      },
      inject: [ConfigService],
    }),
    SensorsModule,
    SamplesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
