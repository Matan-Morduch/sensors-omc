import { Module } from '@nestjs/common';
import { SamplesService } from './samples.service';
import { SamplesController } from './samples.controller';
import { ClientsModule } from '@nestjs/microservices';
import { KafkaService } from '../kafka/kafka.service';

@Module({
  imports: [ClientsModule],
  controllers: [SamplesController],
  providers: [SamplesService, KafkaService],
})
export class SamplesModule {}
