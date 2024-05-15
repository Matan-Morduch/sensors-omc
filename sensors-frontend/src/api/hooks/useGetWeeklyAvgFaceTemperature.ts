import { useQuery } from "react-query";
import { WeeklyAvgFaceTemperature } from "../types/sensors";
import { fetchWeeklyAvgFaceTemperature } from "../queries/sensors";

export const weeklyAvgFaceTemperatureValidatorName = "weeklyAvgFaceTemperature";

const useGetWeeklyAvgFaceTemperature = () => {
  return useQuery<WeeklyAvgFaceTemperature[], Error>(
    weeklyAvgFaceTemperatureValidatorName,
    fetchWeeklyAvgFaceTemperature,
    {
      staleTime: 60000,
      refetchInterval: 60000,
    }
  );
};

export default useGetWeeklyAvgFaceTemperature;
