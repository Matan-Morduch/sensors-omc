import { faultySensorsValidatorName } from "@/api/hooks/useGetFaultySensors";
import { weeklyAvgFaceTemperatureValidatorName } from "@/api/hooks/useGetWeeklyAvgFaceTemperature";
import Button from "@mui/material/Button";
import { useQueryClient } from "react-query";

const Header = () => {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries(weeklyAvgFaceTemperatureValidatorName);
    queryClient.invalidateQueries(faultySensorsValidatorName);
  };

  return (
    <div className="header">
      <h1>Sensors Monitoring</h1>
      <Button onClick={handleRefresh} variant="contained" className="header__refresh-button">
        Refresh Data
      </Button>
    </div>
  );
};

export default Header;
