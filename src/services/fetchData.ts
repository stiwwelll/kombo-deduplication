import { mockEmployees } from "../constants/mockEmployees";
import { IncomingEmployeeData } from "../types/incoming_employee";

// Here I would add a logic to fetch the data based on a pointer (offset) to the next page as well as the batch size.
export const fetchDataFromService = async (
  _batchSize: number,
  _offset: number
): Promise<IncomingEmployeeData[]> => mockEmployees;

