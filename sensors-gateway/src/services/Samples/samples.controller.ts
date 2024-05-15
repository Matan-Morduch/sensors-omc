import { Controller, Post, Body, Get } from '@nestjs/common';
import { CreateSampleDto } from 'shared/entities/Sample/dtos/sample-create.dto';
import { SamplesService } from './samples.service';

@Controller('samples')
export class SamplesController {
  constructor(
    private readonly samplesService: SamplesService,
  ) {}

    @Post()
    createSample(@Body() data: CreateSampleDto) {
      this.samplesService.createSample(data);
    }
}
