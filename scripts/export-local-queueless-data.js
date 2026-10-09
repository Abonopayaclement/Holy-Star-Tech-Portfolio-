const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function exportLocalQueueless() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'mysql://root:@localhost:3306/queueless',
      },
    },
  });

  try {
    const tables = [
      'Organization',
      'Branch',
      'Service',
      'Queue',
      'QueueEntry',
      'queueless_ticket',
      'ServiceCounter',
      'LobbyDisplay',
      'Appointment',
      'AppointmentCategory',
      'Kiosk',
      'QRCode',
      'User'
    ];

    const exportData = {};

    for (const t of tables) {
      try {
        const rows = await prisma.$queryRawUnsafe(`SELECT * FROM \`${t}\``);
        exportData[t] = rows;
        console.log(`✅ Exported ${rows.length} rows from ${t}`);
      } catch (e) {
        console.log(`⚠️ Note for ${t}: ${e.message}`);
      }
    }

    const outPath = path.join(__dirname, '..', 'backups', 'queueless_local_full_export.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(exportData, null, 2));
    console.log(`🎉 Complete local QueueLess data saved to: ${outPath}`);
  } catch (err) {
    console.error('Fatal export error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

exportLocalQueueless();
