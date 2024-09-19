import { calculateHash } from "./calculateHash";
import { IncomingEmployeeData } from "../types/incoming_employee";

import { Employee, PrismaClient } from "@prisma/client";


export const syncBatch = async (prisma: PrismaClient, batch: IncomingEmployeeData[]) => {
  const remoteIds = batch.map((data) => data.remote_id);

  // Fetch all existing employees that match the remote IDs in the current batch
  const existingEmployees = await prisma.employee.findMany({
    where: {
      remote_id: { in: remoteIds },
    },
  });

  const creates = [];
  const updates = [];

  try {
    for (const newData of batch) {
      const relevantDataFields = (({ remote_id, first_name, last_name }) => ({
        remote_id,
        first_name,
        last_name,
      }))(newData);
      const newHash = calculateHash(relevantDataFields);

      const currentUser = existingEmployees.find(
        (employee: Employee) => employee.remote_id === newData.remote_id
      );

      if (!currentUser) {
        creates.push(relevantDataFields);
      } else {
        const existingDataHash = calculateHash({
          remote_id: currentUser.remote_id,
          first_name: currentUser.first_name,
          last_name: currentUser.last_name,
        });

        if (newHash !== existingDataHash) {
          updates.push(
            prisma.employee.update({
              where: { id: currentUser.id },
              data: relevantDataFields,
            })
          );
        } else {
          console.log(
            `Data with remote_id ${relevantDataFields.remote_id} is up to date.`
          );
        }
      }
    }
    
    creates.length && await prisma.employee.createMany({ data: creates });
    updates.length && await prisma.$transaction([...updates]);

    console.log(
      `Processed batch with ${creates.length} creates and ${updates.length} updates.`
    );
  } catch (error) {
    console.error("Error syncing batch: ", error);
  }
};
