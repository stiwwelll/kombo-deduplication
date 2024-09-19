import { syncBatch } from "../services/syncBatch";
import { calculateHash } from "../services/calculateHash";
import { PrismaClient } from "@prisma/client";
import { IncomingEmployeeData } from "../types/incoming_employee";

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    employee: {
      findMany: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  })),
}));

jest.mock("../services/calculateHash");

describe("syncBatch", () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  it("should create new employees if they don't exist", async () => {
    const batch: IncomingEmployeeData[] = [
      {
        remote_id: "1",
        first_name: "John",
        last_name: "Doe",
        employee_number: "E001",
      },
      {
        remote_id: "2",
        first_name: "Jane",
        last_name: "Doe",
        employee_number: "E002",
      },
    ];

    (prisma.employee.findMany as jest.Mock).mockResolvedValueOnce([]);
    (calculateHash as jest.Mock)
      .mockReturnValueOnce("hash1")
      .mockReturnValueOnce("hash2");

    await syncBatch(prisma, batch);

    expect(prisma.employee.createMany).toHaveBeenCalledTimes(1);
    expect(prisma.employee.update).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          data: { remote_id: "1", first_name: "John", last_name: "Doe" },
        }),
        expect.objectContaining({
          data: { remote_id: "2", first_name: "Jane", last_name: "Doe" },
        }),
      ])
    );
  });

  it("should update existing employees if data has changed", async () => {
    const batch: IncomingEmployeeData[] = [
      {
        remote_id: "1",
        first_name: "John",
        last_name: "Doe",
        employee_number: "E001",
      },
    ];

    const existingEmployees = [
      { id: 1, remote_id: "1", first_name: "John", last_name: "Smith" },
    ];

    (prisma.employee.findMany as jest.Mock).mockResolvedValueOnce(
      existingEmployees
    );
    (calculateHash as jest.Mock)
      .mockReturnValueOnce("newHash")
      .mockReturnValueOnce("oldHash");

    (prisma.employee.update as jest.Mock).mockResolvedValueOnce({
      id: 1,
      remote_id: "1",
      first_name: "John",
      last_name: "Doe",
    });

    await syncBatch(prisma, batch);

    expect(prisma.employee.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { remote_id: "1", first_name: "John", last_name: "Doe" },
    });
    expect(prisma.employee.createMany).not.toHaveBeenCalled();
  });

  it("should skip updates if data has not changed", async () => {
    const batch: IncomingEmployeeData[] = [
      {
        remote_id: "1",
        first_name: "John",
        last_name: "Doe",
        employee_number: "E001",
      },
    ];

    const existingEmployees = [
      { id: 1, remote_id: "1", first_name: "John", last_name: "Doe" },
    ];

    (prisma.employee.findMany as jest.Mock).mockResolvedValueOnce(
      existingEmployees
    );
    (calculateHash as jest.Mock)
      .mockReturnValueOnce("sameHash")
      .mockReturnValueOnce("sameHash");

    await syncBatch(prisma, batch);

    expect(prisma.employee.update).not.toHaveBeenCalled();
    expect(prisma.employee.createMany).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("should handle errors gracefully", async () => {
    const batch: IncomingEmployeeData[] = [
      {
        remote_id: "1",
        first_name: "John",
        last_name: "Doe",
        employee_number: "E001",
      },
    ];

    (prisma.employee.findMany as jest.Mock).mockResolvedValueOnce([]);
    (prisma.employee.createMany as jest.Mock).mockImplementationOnce(() => {
      throw new Error("Database error");
    });

    console.error = jest.fn();

    await syncBatch(prisma, batch);

    expect(console.error).toHaveBeenCalledWith(
      "Error syncing batch: ",
      expect.any(Error)
    );
  });

  it("should log if no new data to sync", async () => {
    const batch: IncomingEmployeeData[] = [
      {
        remote_id: "1",
        first_name: "John",
        last_name: "Doe",
        employee_number: "E001",
      },
    ];

    const existingEmployees = [
      { id: 1, remote_id: "1", first_name: "John", last_name: "Doe" },
    ];

    (prisma.employee.findMany as jest.Mock).mockResolvedValueOnce(
      existingEmployees
    );
    (calculateHash as jest.Mock)
      .mockReturnValueOnce("sameHash")
      .mockReturnValueOnce("sameHash");

    console.log = jest.fn();

    await syncBatch(prisma, batch);

    expect(console.log).toHaveBeenCalledWith(
      "Data with remote_id 1 is up to date."
    );
  });
});
