import {
  MiddlewareConsumer,
  Module,
  NestModule,
  ValidationPipe,
} from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_PIPE } from "@nestjs/core";
import { SamplesModule } from "./services/Samples/samples.module";
import { KafkaModule } from "./services/kafka/kafka.module";
import { SensorsModule } from "./services/Sensors/sensors.module";
import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import ormConfig from "shared/db/orm.config";
import { TypeOrmModule } from "@nestjs/typeorm";

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
      useFactory: ormConfig,
    }),
    PrometheusModule.register(),
    KafkaModule,
    SamplesModule,
    SensorsModule,
  ],
  exports: [],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
      }),
    },
  ],
})
export class AppModule {}
