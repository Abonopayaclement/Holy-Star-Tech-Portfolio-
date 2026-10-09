import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const dbUrl = process.env.QUEUELLESS_DATABASE_URL || process.env.DATABASE_URL || 'mysql://root:@localhost:3306/queueless';

let prisma: PrismaClient;

if (dbUrl.startsWith('prisma://') || dbUrl.startsWith('prisma+postgres://')) {
  prisma = new PrismaClient({
    accelerateUrl: dbUrl,
  });
} else {
  const url = new URL(dbUrl);
  const adapter = new PrismaMariaDb({
    host: url.hostname || 'localhost',
    port: url.port ? Number(url.port) : 3306,
    user: url.username || 'root',
    password: url.password || '',
    database: url.pathname.replace(/^\//, '') || 'queueless',
  });

  prisma = new PrismaClient({ adapter });
}

export default prisma;
