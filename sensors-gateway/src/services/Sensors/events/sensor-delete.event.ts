export class SensorDeleteEvent {
  constructor(
    public readonly id: number,
  ) {}

  toString() {
    return JSON.stringify({
      id: this.id,
    });
  }
}
