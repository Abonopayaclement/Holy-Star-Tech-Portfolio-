const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectImages() {
  console.log('=== INSPECTING DATABASE PROJECT & BLOG IMAGES ===');
  try {
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        featuredImage: true,
        screenshots: true
      }
    });

    console.log(`Found ${projects.length} projects in database:`);
    projects.forEach(p => {
      console.log(`\nProject: "${p.title}" (slug: ${p.slug})`);
      console.log(` - featuredImage: ${p.featuredImage}`);
      console.log(` - screenshots:`, JSON.stringify(p.screenshots));
    });

    const blogs = await prisma.blogPost.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        images: true
      }
    });

    console.log(`\nFound ${blogs.length} blog posts in database:`);
    blogs.forEach(b => {
      console.log(`\nBlog: "${b.title}" (slug: ${b.slug})`);
      console.log(` - images:`, JSON.stringify(b.images));
    });

  } catch (err) {
    console.error('Error querying images:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

inspectImages();
