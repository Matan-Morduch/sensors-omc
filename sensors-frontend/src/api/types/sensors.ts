import { face } from "@/types/global";

export interface FaultySensors {
  sensorId: string;
  avgTemperature: string;
}

export interface WeeklyAvgFaceTemperature {
  face: face;
  timestamp: Date;
  avgTemperature: string;
}