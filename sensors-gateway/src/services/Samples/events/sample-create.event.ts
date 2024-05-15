import { DirectionEnum } from 'shared/enums/directionEnum';

export class SampleCreateEvent {
  constructor(
    public readonly id: number,
    public readonly face: DirectionEnum,
    public readonly timestamp: number,
    public readonly temperature: number
  ) {}

  toString() {
    return JSON.stringify({
      id: this.id,
      face: this.face,
      timestamp: this.timestamp,
      temperature: this.temperature,
    });
  }
}
