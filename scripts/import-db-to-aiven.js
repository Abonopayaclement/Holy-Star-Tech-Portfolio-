const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function importToDestination(targetDbUrl) {
  console.log('=====================================================');
  console.log('   HOLY STAR TECH - AIVEN DATABASE DATA IMPORTER     ');
  console.log('=====================================================');

  if (!targetDbUrl) {
    console.error('❌ Error: Target database URL not provided.');
    console.log('Usage: node scripts/import-db-to-aiven.js "<AIVEN_DATABASE_URL>"');
    process.exit(1);
  }

  // Find newest backup file
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    console.error('❌ Error: No backups directory found.');
    process.exit(1);
  }

  const files = fs.readdirSync(backupDir).filter(f => f.startsWith('backup_') && f.endsWith('.json'));
  if (files.length === 0) {
    console.error('❌ Error: No backup JSON files found in backups directory.');
    process.exit(1);
  }

  files.sort().reverse();
  const latestBackup = path.join(backupDir, files[0]);
  console.log(`📁 Loading data from latest backup: ${files[0]}`);

  const backupData = JSON.parse(fs.readFileSync(latestBackup, 'utf8'));
  const { data } = backupData;

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: targetDbUrl
      }
    }
  });

  try {
    console.log('Connecting to destination database and verifying schema...');
    
    // 1. Categories
    if (data.categories?.length) {
      console.log(`Importing ${data.categories.length} Project Categories...`);
      for (const cat of data.categories) {
        await prisma.projectCategory.upsert({
          where: { id: cat.id },
          update: cat,
          create: cat
        });
      }
      console.log('✅ Project Categories imported.');
    }

    // 2. Projects
    if (data.projects?.length) {
      console.log(`Importing ${data.projects.length} Projects...`);
      for (const p of data.projects) {
        await prisma.project.upsert({
          where: { id: p.id },
          update: p,
          create: p
        });
      }
      console.log('✅ Projects imported.');
    }

    // 3. Blog Posts
    if (data.blogPosts?.length) {
      console.log(`Importing ${data.blogPosts.length} Blog Posts...`);
      for (const b of data.blogPosts) {
        await prisma.blogPost.upsert({
          where: { id: b.id },
          update: b,
          create: b
        });
      }
      console.log('✅ Blog Posts imported.');
    }

    // 4. Users
    if (data.users?.length) {
      console.log(`Importing ${data.users.length} Users...`);
      for (const u of data.users) {
        await prisma.user.upsert({
          where: { id: u.id },
          update: u,
          create: u
        });
      }
      console.log('✅ Users imported.');
    }

    // 5. Accounts (Auth passwords)
    if (data.accounts?.length) {
      console.log(`Importing ${data.accounts.length} Auth Accounts...`);
      for (const a of data.accounts) {
        await prisma.account.upsert({
          where: { id: a.id },
          update: a,
          create: a
        });
      }
      console.log('✅ Auth Accounts imported.');
    }

    // 6. Skills
    if (data.skills?.length) {
      console.log(`Importing ${data.skills.length} Skills...`);
      for (const s of data.skills) {
        await prisma.skill.upsert({
          where: { id: s.id },
          update: s,
          create: s
        });
      }
      console.log('✅ Skills imported.');
    }

    // 7. Social Links
    if (data.socialLinks?.length) {
      console.log(`Importing ${data.socialLinks.length} Social Links...`);
      for (const sl of data.socialLinks) {
        await prisma.socialLink.upsert({
          where: { id: sl.id },
          update: sl,
          create: sl
        });
      }
      console.log('✅ Social Links imported.');
    }

    // 8. About Info
    if (data.aboutInfo?.length) {
      console.log(`Importing ${data.aboutInfo.length} About Info records...`);
      for (const ab of data.aboutInfo) {
        await prisma.aboutInfo.upsert({
          where: { id: ab.id },
          update: ab,
          create: ab
        });
      }
      console.log('✅ About Info imported.');
    }

    // 9. Resume Data
    if (data.resumeData?.length) {
      console.log(`Importing ${data.resumeData.length} Resume Data records...`);
      for (const r of data.resumeData) {
        await prisma.resumeData.upsert({
          where: { id: r.id },
          update: r,
          create: r
        });
      }
      console.log('✅ Resume Data imported.');
    }

    // 10. Contact Messages
    if (data.contactMessages?.length) {
      console.log(`Importing ${data.contactMessages.length} Contact Messages...`);
      for (const cm of data.contactMessages) {
        await prisma.contactMessage.upsert({
          where: { id: cm.id },
          update: cm,
          create: cm
        });
      }
      console.log('✅ Contact Messages imported.');
    }

    // 11. Comments
    if (data.comments?.length) {
      console.log(`Importing ${data.comments.length} Comments...`);
      for (const c of data.comments) {
        await prisma.comment.upsert({
          where: { id: c.id },
          update: c,
          create: c
        });
      }
      console.log('✅ Comments imported.');
    }

    // 12. Likes
    if (data.likes?.length) {
      console.log(`Importing ${data.likes.length} Likes...`);
      for (const l of data.likes) {
        await prisma.like.upsert({
          where: { id: l.id },
          update: l,
          create: l
        });
      }
      console.log('✅ Likes imported.');
    }

    // 13. Notifications
    if (data.notifications?.length) {
      console.log(`Importing ${data.notifications.length} Notifications...`);
      for (const n of data.notifications) {
        await prisma.notification.upsert({
          where: { id: n.id },
          update: n,
          create: n
        });
      }
      console.log('✅ Notifications imported.');
    }

    console.log('\n=====================================================');
    console.log('🎉 ALL DATA SUCCESSFULLY IMPORTED INTO DESTINATION DB!');
    console.log('=====================================================\n');

  } catch (err) {
    console.error('❌ Error during import:', err);
  } finally {
    await prisma.$disconnect();
  }
}

const targetUrl = process.argv[2] || process.env.AIVEN_DATABASE_URL || process.env.DATABASE_URL;
importToDestination(targetUrl);
