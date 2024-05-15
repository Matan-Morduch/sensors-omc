import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from "typeorm";
import { Sensor } from "../Sensor/sensor.entity";
import { DirectionEnum } from "../../enums/directionEnum";

@Entity({ name: "samples" })
export class Sample {
  @PrimaryGeneratedColumn()
  id: number;

  @PrimaryColumn({ type: "timestamp" })
  timestamp: Date;

  @Column({ type: "enum", enum: DirectionEnum })
  face: string;

  @Column({ type: "double precision" })
  temperature: number;

  @Column({ name: "sensor_id" }) // This maps the sensorId column directly
  sensorId: number;

  @ManyToOne(() => Sensor, (sensor) => sensor.samples, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sensor_id" }) // This maps the sensorId column to the Sensor entity
  sensor: Sensor;
  
}
