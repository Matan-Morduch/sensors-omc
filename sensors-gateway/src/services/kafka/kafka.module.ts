// kafka.module.ts
import { Module, Global } from "@nestjs/common";
import { ClientProvider, ClientsModule, Transport } from "@nestjs/microservices";
import { KafkaService } from "./kafka.service";

@Global() // Makes this module global
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: "KAFKA_SERVICE",
        useFactory: async () => {
          const options = {
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: "sensor-app",
                brokers: [process.env.KAFKA_BROKER],
              },
              producer: {
                allowAutoTopicCreation: true,
                idempotent: true,
              },
              consumer: {
                groupId: "sensor-data-group",
              },
            },
          };
          return options as ClientProvider;
        },
      },
    ]),
  ],
  providers: [KafkaService],
  exports: [ClientsModule, KafkaService], // Export the ClientsModule
})
export class KafkaModule {}
