import { fetchDataFromService } from "./services/fetchData";
import { syncBatch } from "./services/syncBatch";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();


const syncData = async (batchSize: number = 100, offset: number = 0) => {
  let batchData = await fetchDataFromService(batchSize, offset);

  // This is commented out because the service only returns 2 records for now
  // while (batchData.length > 0) {
    await syncBatch(prisma, batchData);
    offset += batchSize;
    batchData = await fetchDataFromService(batchSize, offset);
  // }

  console.log("Data sync completed.");
};

syncData().finally(async () => {
  await prisma.$disconnect();
});
