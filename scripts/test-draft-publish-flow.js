const { PrismaClient } = require("@prisma/client");

const targetDbUrl = process.argv[2] || process.env.DATABASE_URL;
const prisma = targetDbUrl
  ? new PrismaClient({ datasources: { db: { url: targetDbUrl } } })
  : new PrismaClient();

async function runTests() {
  console.log("=====================================================");
  console.log("   HOLY STAR TECH: DRAFT & PUBLISH FLOW AUDIT TEST   ");
  console.log("=====================================================\n");

  const timestamp = Date.now();
  const testBlogSlug = `test-draft-blog-${timestamp}`;
  const testProjSlug = `test-draft-proj-${timestamp}`;

  try {
    // ----------------------------------------------------
    // TEST 1: BLOG DRAFT CREATION (WITHOUT IMAGE)
    // ----------------------------------------------------
    console.log("1. Testing Blog Draft Creation (Without Image)...");
    const draftBlog1 = await prisma.blogPost.create({
      data: {
        title: "Test Draft Article No Image",
        slug: testBlogSlug + "-no-img",
        excerpt: "Short draft excerpt for testing without image.",
        content: "Draft article content with detailed explanation and findings.",
        category: "Web Development",
        readTime: "3 min read",
        published: false,
        images: [],
      },
    });
    console.log(`✅ Draft Blog Created (ID: ${draftBlog1.id}, Published: ${draftBlog1.published})`);

    // Verify it is NOT returned in public query
    const publicBlogs1 = await prisma.blogPost.findMany({ where: { published: true } });
    const isPublic1 = publicBlogs1.some((b) => b.id === draftBlog1.id);
    if (isPublic1) throw new Error("FAIL: Draft blog appeared in public queries!");
    console.log("✅ Verified: Draft blog is NOT visible publicly.");

    // Verify it IS returned in draft query
    const draftBlogs1 = await prisma.blogPost.findMany({ where: { published: false } });
    const isDraft1 = draftBlogs1.some((b) => b.id === draftBlog1.id);
    if (!isDraft1) throw new Error("FAIL: Draft blog not found in admin drafts query!");
    console.log("✅ Verified: Draft blog appears in Admin Drafts query.");

    // ----------------------------------------------------
    // TEST 2: BLOG DRAFT CREATION (WITH IMAGE / BASE64)
    // ----------------------------------------------------
    console.log("\n2. Testing Blog Draft Creation (With Image)...");
    const testDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const draftBlog2 = await prisma.blogPost.create({
      data: {
        title: "Test Draft Article With Image",
        slug: testBlogSlug,
        excerpt: "Short draft excerpt for testing with image.",
        content: `Draft article content with attached image.\n\n![Hero](${testDataUrl})`,
        category: "Mobile Development",
        readTime: "4 min read",
        published: false,
        images: [testDataUrl],
      },
    });
    console.log(`✅ Draft Blog with Image Created (ID: ${draftBlog2.id})`);

    // ----------------------------------------------------
    // TEST 3: EDIT BLOG DRAFT (MODIFY TITLE, CONTENT & IMAGE)
    // ----------------------------------------------------
    console.log("\n3. Testing Editing Existing Draft...");
    const updatedBlog = await prisma.blogPost.update({
      where: { id: draftBlog2.id },
      data: {
        title: "Test Draft Article With Image (Updated Title)",
        excerpt: "Updated excerpt text that persists.",
        content: `Updated draft article content.\n\n![Hero](${testDataUrl})`,
        category: "Architecture",
      },
    });
    console.log(`✅ Draft Updated (Title: "${updatedBlog.title}", Category: "${updatedBlog.category}")`);

    // ----------------------------------------------------
    // TEST 4: PUBLISH BLOG DRAFT (DRAFT -> PUBLISHED)
    // ----------------------------------------------------
    console.log("\n4. Testing Publishing Blog Draft...");
    const publishedBlog = await prisma.blogPost.update({
      where: { id: draftBlog2.id },
      data: {
        published: true,
        publishedAt: new Date(),
      },
    });
    console.log(`✅ Draft Published (Published: ${publishedBlog.published})`);

    // Verify it is NOW in public query
    const publicBlogs2 = await prisma.blogPost.findMany({ where: { published: true } });
    const isPublic2 = publicBlogs2.some((b) => b.id === draftBlog2.id);
    if (!isPublic2) throw new Error("FAIL: Published blog does not appear in public query!");
    console.log("✅ Verified: Published blog is NOW visible publicly!");

    // Verify count did NOT duplicate
    const totalMatching = await prisma.blogPost.count({ where: { slug: testBlogSlug } });
    if (totalMatching !== 1) throw new Error(`FAIL: Duplicate records found! Count = ${totalMatching}`);
    console.log("✅ Verified: No duplicate record created on publish (single ID reused).");

    // Clean up test blogs
    await prisma.blogPost.deleteMany({
      where: { id: { in: [draftBlog1.id, draftBlog2.id] } },
    });
    console.log("✅ Cleaned up test blogs.");

    // ----------------------------------------------------
    // TEST 5: PROJECT DRAFT CREATION & WORKFLOW
    // ----------------------------------------------------
    console.log("\n5. Testing Project Draft Creation & Workflow...");
    const draftProj = await prisma.project.create({
      data: {
        title: "Test Draft Project",
        slug: testProjSlug,
        tagline: "Test Project Tagline for Draft Testing",
        description: "Short description of the test project draft.",
        fullDescription: "Comprehensive full architectural description of the test project.",
        categoryType: "WEB_APP",
        featured: false,
        published: false,
        featuredImage: testDataUrl,
        gradient: "from-amber-500/20 via-indigo-600/20 to-cyan-500/20",
        techStack: ["Next.js", "TypeScript", "Prisma"],
        features: ["Draft Mode", "Publish Workflow"],
        screenshots: [{ title: "Dashboard", subtitle: "Main Screen", aspect: "aspect-video", imagePath: testDataUrl }],
        status: "In Development",
        classification: "Personal Project",
      },
    });
    console.log(`✅ Draft Project Created (ID: ${draftProj.id}, Published: ${draftProj.published})`);

    // Verify draft project not in public projects
    const publicProjs1 = await prisma.project.findMany({ where: { published: true } });
    const isProjPublic1 = publicProjs1.some((p) => p.id === draftProj.id);
    if (isProjPublic1) throw new Error("FAIL: Draft project appeared in public projects!");
    console.log("✅ Verified: Draft project is NOT visible in public projects query.");

    // Verify it IS in draft projects
    const draftProjs1 = await prisma.project.findMany({ where: { published: false } });
    const isProjDraft1 = draftProjs1.some((p) => p.id === draftProj.id);
    if (!isProjDraft1) throw new Error("FAIL: Draft project not found in admin drafts query!");
    console.log("✅ Verified: Draft project appears in Admin Drafts query.");

    // Publish project draft
    console.log("\n6. Testing Publishing Project Draft...");
    const publishedProj = await prisma.project.update({
      where: { id: draftProj.id },
      data: { published: true },
    });
    console.log(`✅ Project Published (Published: ${publishedProj.published})`);

    // Verify it is NOW in public query
    const publicProjs2 = await prisma.project.findMany({ where: { published: true } });
    const isProjPublic2 = publicProjs2.some((p) => p.id === draftProj.id);
    if (!isProjPublic2) throw new Error("FAIL: Published project does not appear in public query!");
    console.log("✅ Verified: Published project is NOW visible publicly!");

    // Clean up test project
    await prisma.project.delete({ where: { id: draftProj.id } });
    console.log("✅ Cleaned up test project.");

    console.log("\n=====================================================");
    console.log("🎉 ALL 6 DRAFT & PUBLISH INTEGRATION TESTS PASSED!");
    console.log("=====================================================");
  } catch (err) {
    console.error("❌ Test Failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
