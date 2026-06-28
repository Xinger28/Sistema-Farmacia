import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const rawUrl = process.env['DATABASE_URL'] || '';
const dbUrl = rawUrl.includes('sslmode') ? rawUrl : rawUrl + '?sslmode=require';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: dbUrl,
  },
});
