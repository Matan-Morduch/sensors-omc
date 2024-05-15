import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConsumerService } from "../../Consumer.service";
import { SensorsService } from "./sensors.service";
import { EachMessagePayload, Consumer } from "kafkajs";

interface PartitionBuffer {
  buffer: any[];
  bufferLocked: boolean;
}

type Topics = "sensors-create" | "sensors-delete";

@Injectable()
export class SensorsConsumer implements OnModuleInit {
  private buffers: Record<Topics, Map<number, PartitionBuffer>> = {
    "sensors-create": new Map(),
    "sensors-delete": new Map(),
  };

  constructor(
    private readonly consumerService: ConsumerService,
    private readonly sensorsService: SensorsService
  ) {}

  async onModuleInit() {
    await this.consumerService.consume(
      "sensors-group",
      {
        topics: ["sensors-create", "sensors-delete"],
        fromBeginning: true,
      },
      {
        eachMessage: this.handleEachMessage.bind(this),
        autoCommit: false,
      },
      8
    );
  }

  private async handleEachMessage(
    payload: EachMessagePayload,
    consumer: Consumer
  ) {
    const topic = payload.topic as Topics;
    const partitionBuffer = this.getPartitionBuffer(topic, payload.partition);

    if (partitionBuffer.bufferLocked) return;

    partitionBuffer.bufferLocked = true;
    partitionBuffer.buffer.push(...this.parseMessage(payload.message.value));

    try {
      await this.processBuffer(topic, payload.partition);
      await this.consumerService.commitOffsets(
        consumer,
        payload.topic,
        payload.partition,
        payload.message.offset
      );
    } catch (e) {
      if (e.code === "40P01") {
        console.log(`Deadlock detected. Skipping this commit.`);
      } else {
        throw e;
      }
    }

    partitionBuffer.bufferLocked = false;
    await payload.heartbeat();
  }

  private getPartitionBuffer(
    topic: Topics,
    partition: number
  ): PartitionBuffer {
    const currentBuffer = this.buffers[topic];
    if (!currentBuffer.has(partition)) {
      currentBuffer.set(partition, { buffer: [], bufferLocked: false });
    }
    return currentBuffer.get(partition);
  }

  private parseMessage(messageValue: Buffer): any[] {
    return JSON.parse(messageValue.toString());
  }

  private async processBuffer(topic: Topics, partition: number) {
    const partitionBuffer = this.buffers[topic].get(partition);

    if (topic === "sensors-create") {
      await this.sensorsService.bulkCreateOrUpdateSensors(partitionBuffer.buffer);
    } else if (topic === "sensors-delete") {
      await this.sensorsService.bulkDeleteSensors(partitionBuffer.buffer);
    }

    partitionBuffer.buffer = [];
  }
}
