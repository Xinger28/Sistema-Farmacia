import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ENV } from './env';

const adapter = new PrismaPg({ connectionString: ENV.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export default prisma;
