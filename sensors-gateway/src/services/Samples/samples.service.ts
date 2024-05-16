import { Inject, Injectable } from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import { CreateSampleDto } from "shared/entities/Sample/dtos/sample-create.dto";
import { SampleCreateEvent } from "./events/sample-create.event";
import { KafkaService } from "../kafka/kafka.service";

@Injectable()
export class SamplesService {
  private batch: SampleCreateEvent[] = [];
  private readonly maxBatchSize: number = 500;
  private readonly batchTimer: number = 1000;

  constructor(
    @Inject("KAFKA_SERVICE") private readonly kafkaClient: ClientKafka,
    private readonly kafkaService: KafkaService,
  ) {}

  async onModuleInit() {
    this.startBatchTimer();
    this.kafkaService.addPartitions("sensors-samples", 8);
  }

  createSample(sampleData: CreateSampleDto) {
    const event = new SampleCreateEvent(
      sampleData.id,
      sampleData.face,
      sampleData.timestamp,
      sampleData.temperature
    );
    this.batch.push(event);
    if (this.batch.length >= this.maxBatchSize) {
      this.sendBatch();
    }
  }

  private sendBatch() {
    if (this.batch.length > 0) {
      this.kafkaClient.emit("sensors-samples", this.batch);
      this.batch = []; // Clear the batch after sending
    }
  }

  private startBatchTimer() {
    setInterval(() => {
      this.sendBatch(); // Send any accumulated messages in the batch
    }, this.batchTimer);
  }
}
