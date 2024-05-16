// kafka-admin.service.ts
import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Admin, Kafka } from "kafkajs";

@Injectable()
export class KafkaService implements OnModuleDestroy {
  private kafka: Kafka;
  private admin: Admin;
  public isConnected: boolean = false;
  private retryInterval: number = 2000;

  constructor() {
    this.kafka = new Kafka({
      clientId: "sensor-app",
      brokers: [process.env.KAFKA_BROKER],
    });
    this.admin = this.kafka.admin();
    this.connectWithRetry();
  }

  private async connectWithRetry() {
    while (true) {
      try {
        await this.admin.connect();
        console.log('Connected to Kafka');
        this.isConnected = true;
        break;
      } catch (error) {
        console.error('Failed to connect to Kafka, retrying in 2 seconds...', error);
        await this.sleep(this.retryInterval);
      }
    }
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async ensureTopicExists(
    topic: string,
    numPartitions: number,
    replicationFactor: number = 1
  ): Promise<void> {
    const topics = await this.admin.listTopics();
    if (!topics.includes(topic)) {
      await this.admin.createTopics({
        topics: [
          {
            topic,
            numPartitions,
            replicationFactor,
          },
        ],
      });
      console.log(
        `Topic ${topic} created with ${numPartitions} partitions and replication factor of ${replicationFactor}.`
      );
    }
  }

  async addPartitions(topic: string, numPartitions: number): Promise<void> {
    try {
      // Ensure the topic exists and is ready to accept more partitions
      await this.ensureTopicExists(topic, numPartitions);
      // Only try to add partitions if the requested count is higher than current
      const topicDescription = await this.admin.fetchTopicMetadata({
        topics: [topic],
      });
      const currentPartitions = topicDescription.topics[0].partitions.length;
      if (numPartitions > currentPartitions) {
        await this.admin.createPartitions({
          topicPartitions: [
            {
              topic,
              count: numPartitions,
            },
          ],
        });
        console.log(
          `Added partitions to ${topic}, now total partitions are ${numPartitions}.`
        );
      } else {
        console.log(
          `No additional partitions needed for ${topic}. Current: ${currentPartitions}, Requested: ${numPartitions}.`
        );
      }
    } catch (error) {
      console.error(`Error managing partitions for topic ${topic}:`, error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.admin.disconnect();
  }
}
