import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import {
  Consumer,
  ConsumerRunConfig,
  ConsumerSubscribeTopics,
  EachMessagePayload,
  Kafka,
  logLevel,
} from "kafkajs";

type ExtendedConsumerRunConfig = Omit<ConsumerRunConfig, "eachMessage"> & {
  eachMessage: (
    payload: EachMessagePayload,
    consumer: Consumer
  ) => Promise<void>;
};

const customLogger = ({ namespace, level, label, log }) => {
  const { message, ...extra } = log;
  console.log(`[${level}] ${namespace} - ${label}: ${message}`, extra);
};

@Injectable()
export class ConsumerService implements OnApplicationShutdown {
  private readonly kafka = new Kafka({
    brokers: [process.env.KAFKA_BROKER],
    logLevel: logLevel.WARN, // Set log level to DEBUG
    logCreator: () => customLogger,
  });

  private readonly consumers: Consumer[] = [];

  async consume(
    groupId: string,
    topics: ConsumerSubscribeTopics,
    config: ExtendedConsumerRunConfig,
    consumerCount: number = 1,
    autoCommit: boolean = true
  ) {
    for (let i = 0; i < consumerCount; i++) {
      const consumer = this.kafka.consumer({
        groupId: `${groupId}`,
        sessionTimeout: 60000 * 5, 
        heartbeatInterval: 30000,
        
      });
      await consumer.connect();
      await consumer.subscribe(topics);
      this.consumers.push(consumer);
    }

    await Promise.all(
      this.consumers.map((consumer) =>
        consumer.run({
          ...config,
          eachMessage: async (payload: EachMessagePayload) => {
            await config.eachMessage(payload, consumer);
          },
          autoCommit,
        })
      )
    );
  }

  async commitOffsets(
    consumer: Consumer,
    topic: string,
    partition: number,
    offset: string
  ) {
    await consumer.commitOffsets([
      { topic, partition, offset: (BigInt(offset) + BigInt(1)).toString() },
    ]);
  }

  async onApplicationShutdown() {
    await Promise.all(this.consumers.map((consumer) => consumer.disconnect()));
  }
}
