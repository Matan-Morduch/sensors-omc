import { Controller, Post, Body, Get } from '@nestjs/common';
import { CreateSampleDto } from 'shared/entities/Sample/dtos/sample-create.dto';
import { SamplesService } from './samples.service';
import { KafkaService } from '../kafka/kafka.service';

@Controller('samples')
export class SamplesController {
  constructor(
    private readonly samplesService: SamplesService,
    private readonly kafkaService: KafkaService,
    ) {}

    @Post()
    createSample(@Body() data: CreateSampleDto) {
      if (!this.kafkaService.isConnected) {
        throw new Error('Kafka is not connected yet.');
      }
      this.samplesService.createSample(data);
    }
}
