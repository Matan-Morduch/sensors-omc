import { useQuery } from "react-query";
import { FaultySensors } from "../types/sensors";
import { fetchFaultySensors } from "../queries/sensors";

export const faultySensorsValidatorName = "faultySensors";

const useGetFaultySensors = () => {
  return useQuery<FaultySensors[], Error>(faultySensorsValidatorName, fetchFaultySensors, {
    staleTime: 60000,
    refetchInterval: 60000,
  });
};

export default useGetFaultySensors;
