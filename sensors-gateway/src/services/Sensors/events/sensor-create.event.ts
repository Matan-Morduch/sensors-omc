import { DirectionEnum } from 'shared/enums/directionEnum';

export class SensorCreateEvent {
  constructor(
    public readonly id: number,
    public readonly face: DirectionEnum,
    public readonly faulty: boolean
  ) {}

  toString() {
    return JSON.stringify({
      id: this.id,
      face: this.face,
      faulty: this.faulty,
    });
  }
}
