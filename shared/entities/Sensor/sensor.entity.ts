// sensor.entity.ts
import { DirectionEnum } from "../../enums/directionEnum";
import { Entity, Column, PrimaryColumn, OneToMany } from "typeorm";
import { Sample } from "../Sample/sample.entity";

@Entity({ name: "sensors" })
export class Sensor {
  @PrimaryColumn()
  id: number;

  @Column({ type: "enum", enum: DirectionEnum })
  face: string;

  @Column({ default: false })
  faulty: boolean;

  @Column({
    name: "last_updated",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  lastUpdated: Date;

  @OneToMany(() => Sample, (sample) => sample.sensor)
  samples: Sample[];
}
