import { Module } from '@nestjs/common';
import { SamplesService } from './samples.service';
import { SamplesController } from './samples.controller';
import { ClientsModule } from '@nestjs/microservices';

@Module({
  imports: [ClientsModule],
  controllers: [SamplesController],
  providers: [SamplesService],
})
export class SamplesModule {}
