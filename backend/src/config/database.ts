import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Evitar duplicar ?sslmode si la URL ya lo trae
const rawUrl = process.env.DATABASE_URL || '';
const connectionString = rawUrl.includes('sslmode')
  ? rawUrl
  : rawUrl + '?sslmode=require';

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export default prisma;
