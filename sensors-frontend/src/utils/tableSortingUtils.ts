// sortingUtils.ts

export type Order = "asc" | "desc";

export interface Comparator<Data> {
  (a: Data, b: Data): number;
}

export function descendingComparator<Data>(a: Data, b: Data, orderBy: keyof Data): number {
  if (a[orderBy] < b[orderBy]) return -1;
  if (a[orderBy] > b[orderBy]) return 1;
  return 0;
}

export function getComparator<Data>(order: Order, orderBy: keyof Data): Comparator<Data> {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

export function stableSort<Data>(array: Data[], comparator: Comparator<Data>): Data[] {
    // Create an array of tuples, where each tuple contains an element and its index
    const stabilizedArray = array.map((element, index) => [element, index] as [Data, number]);
  
    // Sort the stabilized array using the comparator
    stabilizedArray.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) {
        return order; // If the comparator returns a non-zero value, use it for sorting
      }
      return a[1] - b[1]; // If the comparator returns 0, use the original index for sorting to maintain stability
    });
  
    // Extract and return the sorted elements
    return stabilizedArray.map((element) => element[0]);
  }