const { PrismaClient } = require("@prisma/client");

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.__softBioPrisma || new PrismaClient();

globalForPrisma.__softBioPrisma = prisma;

module.exports = { prisma };
