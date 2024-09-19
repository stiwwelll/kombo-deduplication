import crypto from "crypto";
import { IncomingEmployeeData } from "../types/incoming_employee";

export const calculateHash = (data: Partial<IncomingEmployeeData>) => {
  return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
};
