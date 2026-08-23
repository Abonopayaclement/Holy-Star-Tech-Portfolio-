const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportDatabase() {
  console.log('=====================================================');
  console.log('  HOLY STAR TECH - DATABASE BACKUP & EXPORT UTILITY  ');
  console.log('=====================================================');
  
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupJsonPath = path.join(backupDir, `backup_${timestamp}.json`);
  const backupSqlPath = path.join(backupDir, `backup_${timestamp}.sql`);

  try {
    console.log('Reading all tables from source database...');

    const [
      users,
      accounts,
      sessions,
      verifications,
      categories,
      projects,
      blogPosts,
      contactMessages,
      aboutInfo,
      skills,
      resumeData,
      socialLinks,
      likes,
      comments,
      notifications,
      visitorLogs
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.account.findMany(),
      prisma.session.findMany(),
      prisma.verification.findMany(),
      prisma.projectCategory.findMany(),
      prisma.project.findMany(),
      prisma.blogPost.findMany(),
      prisma.contactMessage.findMany(),
      prisma.aboutInfo.findMany(),
      prisma.skill.findMany(),
      prisma.resumeData.findMany(),
      prisma.socialLink.findMany(),
      prisma.like.findMany(),
      prisma.comment.findMany(),
      prisma.notification.findMany(),
      prisma.visitorLog.findMany()
    ]);

    const backupData = {
      exportedAt: new Date().toISOString(),
      counts: {
        users: users.length,
        accounts: accounts.length,
        sessions: sessions.length,
        verifications: verifications.length,
        categories: categories.length,
        projects: projects.length,
        blogPosts: blogPosts.length,
        contactMessages: contactMessages.length,
        aboutInfo: aboutInfo.length,
        skills: skills.length,
        resumeData: resumeData.length,
        socialLinks: socialLinks.length,
        likes: likes.length,
        comments: comments.length,
        notifications: notifications.length,
        visitorLogs: visitorLogs.length
      },
      data: {
        users,
        accounts,
        sessions,
        verifications,
        categories,
        projects,
        blogPosts,
        contactMessages,
        aboutInfo,
        skills,
        resumeData,
        socialLinks,
        likes,
        comments,
        notifications,
        visitorLogs
      }
    };

    fs.writeFileSync(backupJsonPath, JSON.stringify(backupData, null, 2), 'utf8');
    console.log(`✅ JSON Data Backup written to: ${backupJsonPath}`);

    // Generate SQL Insert statements as standard SQL backup
    let sqlContent = `-- Holy Star Tech MySQL Database Backup\n-- Exported At: ${new Date().toISOString()}\n\nSET FOREIGN_KEY_CHECKS = 0;\n\n`;

    function sqlEscape(val) {
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'boolean') return val ? '1' : '0';
      if (typeof val === 'number') return String(val);
      if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
      if (typeof val === 'object') return `'${JSON.stringify(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
      return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    }

    function generateInserts(tableName, records) {
      if (!records || records.length === 0) return '';
      let res = `-- Table: ${tableName} (${records.length} rows)\n`;
      const cols = Object.keys(records[0]);
      records.forEach(r => {
        const vals = cols.map(c => sqlEscape(r[c])).join(', ');
        res += `INSERT INTO \`${tableName}\` (\`${cols.join('`, `')}\`) VALUES (${vals});\n`;
      });
      return res + '\n';
    }

    sqlContent += generateInserts('user', users);
    sqlContent += generateInserts('account', accounts);
    sqlContent += generateInserts('session', sessions);
    sqlContent += generateInserts('verification', verifications);
    sqlContent += generateInserts('ProjectCategory', categories);
    sqlContent += generateInserts('Project', projects);
    sqlContent += generateInserts('BlogPost', blogPosts);
    sqlContent += generateInserts('ContactMessage', contactMessages);
    sqlContent += generateInserts('AboutInfo', aboutInfo);
    sqlContent += generateInserts('Skill', skills);
    sqlContent += generateInserts('ResumeData', resumeData);
    sqlContent += generateInserts('SocialLink', socialLinks);
    sqlContent += generateInserts('like', likes);
    sqlContent += generateInserts('comment', comments);
    sqlContent += generateInserts('notification', notifications);
    sqlContent += generateInserts('VisitorLog', visitorLogs);
    sqlContent += `SET FOREIGN_KEY_CHECKS = 1;\n`;

    fs.writeFileSync(backupSqlPath, sqlContent, 'utf8');
    console.log(`✅ SQL Backup written to: ${backupSqlPath}`);

    console.log('\n--- BACKUP SUMMARY ---');
    console.log(` • Projects: ${projects.length}`);
    console.log(` • Blog Posts: ${blogPosts.length}`);
    console.log(` • Users / Accounts: ${users.length} user(s), ${accounts.length} account(s)`);
    console.log(` • Comments: ${comments.length}`);
    console.log(` • Likes: ${likes.length}`);
    console.log(` • Social Links: ${socialLinks.length}`);
    console.log(` • Skills: ${skills.length}`);
    console.log(` • Contact Messages: ${contactMessages.length}`);
    console.log('=====================================================\n');

  } catch (err) {
    console.error('❌ Error during backup:', err);
  } finally {
    await prisma.$disconnect();
  }
}

exportDatabase();
