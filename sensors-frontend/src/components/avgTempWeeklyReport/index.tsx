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
import { Order, getComparator, stableSort } from "@/utils/tableSortingUtils";
import useGetWeeklyAvgFaceTemperature from "@/api/hooks/useGetWeeklyAvgFaceTemperature";
import { WeeklyAvgFaceTemperature } from "@/api/types/sensors";
import moment from 'moment-timezone';

const index = () => {
  const { data, error, isLoading, isFetching } = useGetWeeklyAvgFaceTemperature();

  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState<keyof WeeklyAvgFaceTemperature>("timestamp");

  const handleRequestSort = (property: keyof WeeklyAvgFaceTemperature) => {
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
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sortDirection={orderBy === "face" ? order : false}>
              <TableSortLabel
                active={orderBy === "face"}
                direction={orderBy === "face" ? order : "asc"}
                onClick={() => handleRequestSort("face")}
              >
                Face
              </TableSortLabel>
            </TableCell>
            <TableCell sortDirection={orderBy === "timestamp" ? order : false}>
              <TableSortLabel
                active={orderBy === "timestamp"}
                direction={orderBy === "timestamp" ? order : "asc"}
                onClick={() => handleRequestSort("timestamp")}
              >
                Date Time
              </TableSortLabel>
            </TableCell>
            <TableCell sortDirection={orderBy === "avgTemperature" ? order : false}>
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
                <TableRow key={index}>
                  <TableCell>{row.face}</TableCell>
                  <TableCell>{moment.utc(row.timestamp).tz('Asia/Jerusalem').format('MMMM Do YYYY, h:mm:ss a')}</TableCell>
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
