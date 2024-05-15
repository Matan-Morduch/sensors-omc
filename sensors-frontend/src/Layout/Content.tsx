import FaultySensorsTable from "@/components/faultySensors";
import AvgTempWeeklyReportTable from "@/components/avgTempWeeklyReport";

const Content = () => {
  return (
    <div className="content">
      <div className="content__faulty-sensors">
        <h2>Faulty Sensors</h2>
        <FaultySensorsTable />
      </div>

      <div className="content__avg-temp-weekly-report">
        <h2>
          Avg Temp per Face Weekly Report
        </h2>
        <AvgTempWeeklyReportTable />
      </div>
    </div>
  );
};

export default Content;
