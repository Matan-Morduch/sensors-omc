import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  CircularProgress,
} from "@mui/material";
import { getComparator, stableSort } from "@/utils/tableSortingUtils";
import useGetFaultySensors from "@/api/hooks/useGetFaultySensors";
import { FaultySensors } from "@/api/types/sensors";

type Order = "asc" | "desc";
const index = () => {
  const { data, error, isLoading, isFetching } = useGetFaultySensors();
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState<keyof FaultySensors>("sensorId");

  const handleRequestSort = (property: keyof FaultySensors) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  if (isLoading || isFetching) {
    return <CircularProgress className="div-middle"/>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <TableContainer component={Paper} className="scrollable-table">
      <Table>
        <TableHead>
        <TableRow>
            <TableCell sortDirection={orderBy === "sensorId" ? order : false}>
              <TableSortLabel
                active={orderBy === "sensorId"}
                direction={orderBy === "sensorId" ? order : "asc"}
                onClick={() => handleRequestSort("sensorId")}
              >
                ID
              </TableSortLabel>
            </TableCell>
            <TableCell
              sortDirection={orderBy === "avgTemperature" ? order : false}
            >
              <TableSortLabel
                active={orderBy === "avgTemperature"}
                direction={orderBy === "avgTemperature" ? order : "asc"}
                onClick={() => handleRequestSort("avgTemperature")}
              >
                Avg Temp (Hourly)
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data &&
            stableSort(data, getComparator(order, orderBy)).map(
              (row, index) => (
                <TableRow key={`faultySensorsTable-${row.sensorId}-${index}`}>
                  <TableCell>{row.sensorId}</TableCell>
                  <TableCell>{row.avgTemperature}</TableCell>
                </TableRow>
              )
            )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default index;
