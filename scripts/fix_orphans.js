const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Checking for orphaned likes/comments...");
  const projects = await prisma.project.findMany({ select: { id: true } });
  const validProjectIds = new Set(projects.map(p => p.id));
  console.log(`Found ${validProjectIds.size} projects.`);

  const likes = await prisma.like.findMany({ where: { projectId: { not: null } } });
  let orphanLikes = 0;
  for (const like of likes) {
    if (like.projectId && !validProjectIds.has(like.projectId)) {
      await prisma.like.delete({ where: { id: like.id } });
      orphanLikes++;
    }
  }
  console.log(`Deleted ${orphanLikes} orphaned likes.`);

  const comments = await prisma.comment.findMany({ where: { projectId: { not: null } } });
  let orphanComments = 0;
  for (const comment of comments) {
    if (comment.projectId && !validProjectIds.has(comment.projectId)) {
      await prisma.comment.delete({ where: { id: comment.id } });
      orphanComments++;
    }
  }
  console.log(`Deleted ${orphanComments} orphaned comments.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
