import axiosInstance from '../axiosConfig';
import { FaultySensors, WeeklyAvgFaceTemperature } from '../types/sensors';

export const fetchFaultySensors = async (): Promise<FaultySensors[]> => {
  const response = await axiosInstance.get('/sensors/faulty');
  return response.data;
};

export const fetchWeeklyAvgFaceTemperature = async (): Promise<WeeklyAvgFaceTemperature[]> => {
    const response = await axiosInstance.get('/sensors/weekly-avg-face-temperature');
    return response.data;
  };
  