"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --------------------------------------------------------
// ABOUT ME & PROFILE MANAGEMENT
// --------------------------------------------------------

export async function getProfileData() {
  try {
    let profile = await (prisma as any).aboutInfo.findFirst();
    if (!profile) {
      profile = await (prisma as any).aboutInfo.create({
        data: {
          authorName: "Abonopaya Clement Ayebono",
          headline: "Software Engineer | Full-Stack & Mobile Developer",
          bio: "HND Computer Science student at Kumasi Technical University with a Computer Hardware background from Bolgatanga Technical Institute. Passionate about software engineering, web development, Android mobile app development, and continuous learning.",
          philosophy: "Building practical software solutions, continuous learning, and clean code principles.",
          location: "Bolgatanga, Upper East Region, Ghana",
          email: "abonopayaclementayebono@gmail.com",
        },
      });
    }
    return profile;
  } catch (error) {
    console.error("Failed to fetch profile data:", error);
    return {
      authorName: "Abonopaya Clement Ayebono",
      headline: "Software Engineer | Full-Stack & Mobile Developer",
      bio: "HND Computer Science student at Kumasi Technical University with a Computer Hardware background from Bolgatanga Technical Institute. Passionate about software engineering, web development, Android mobile app development, and continuous learning.",
      philosophy: "Building practical software solutions, continuous learning, and clean code principles.",
      location: "Bolgatanga, Upper East Region, Ghana",
      email: "abonopayaclementayebono@gmail.com",
    };
  }
}

export async function updateProfileData(data: {
  authorName: string;
  headline: string;
  bio: string;
  philosophy?: string;
  location: string;
  email: string;
  phone?: string;
  whatsApp?: string;
  profilePhoto?: string;
  careerObjective?: string;
}) {
  try {
    const existing = await (prisma as any).aboutInfo.findFirst();
    if (existing) {
      await (prisma as any).aboutInfo.update({
        where: { id: existing.id },
        data: {
          authorName: data.authorName,
          headline: data.headline,
          bio: data.bio,
          philosophy: data.philosophy || "",
          location: data.location,
          email: data.email,
        },
      });
    } else {
      await (prisma as any).aboutInfo.create({
        data: {
          authorName: data.authorName,
          headline: data.headline,
          bio: data.bio,
          philosophy: data.philosophy || "",
          location: data.location,
          email: data.email,
        },
      });
    }

    revalidatePath("/about");
    revalidatePath("/contact");
    revalidatePath("/private");
    revalidatePath("/private/profile");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update profile data:", error);
    return { success: false, error: error.message || "Failed to save profile." };
  }
}

// --------------------------------------------------------
// RESUME & CV MANAGEMENT
// --------------------------------------------------------

export async function getResumeData() {
  try {
    let resume = await (prisma as any).resumeData.findFirst();
    if (!resume) {
      resume = await (prisma as any).resumeData.create({
        data: {
          cvFileUrl: "/resume.pdf",
          summary: "Results-driven Software Engineer with extensive experience in Next.js, React, Node.js, and Cloud Infrastructure.",
          experienceJson: [
            {
              role: "Lead Software Architect",
              company: "Holy Star Tech",
              period: "2023 - Present",
              description: "Architecting high-throughput full-stack web and mobile platforms with Next.js and MySQL.",
            },
          ],
          educationJson: [
            {
              degree: "B.Sc. Computer Science",
              institution: "University of Ghana",
              period: "2019 - 2023",
              description: "Focused on Software Engineering, Distributed Databases, and Data Structures.",
            },
          ],
          certsJson: [
            {
              title: "AWS Certified Solutions Architect",
              issuer: "Amazon Web Services",
              year: "2024",
            },
          ],
        },
      });
    }
    return resume;
  } catch (error) {
    console.error("Failed to fetch resume data:", error);
    return {
      cvFileUrl: "/resume.pdf",
      summary: "Results-driven Software Engineer.",
      experienceJson: [],
      educationJson: [],
      certsJson: [],
    };
  }
}

export async function updateResumeData(data: {
  cvFileUrl?: string;
  summary?: string;
  experienceJson?: any[];
  educationJson?: any[];
  certsJson?: any[];
}) {
  try {
    const existing = await (prisma as any).resumeData.findFirst();
    if (existing) {
      await (prisma as any).resumeData.update({
        where: { id: existing.id },
        data: {
          cvFileUrl: data.cvFileUrl ?? existing.cvFileUrl,
          summary: data.summary ?? existing.summary,
          experienceJson: data.experienceJson ?? existing.experienceJson,
          educationJson: data.educationJson ?? existing.educationJson,
          certsJson: data.certsJson ?? existing.certsJson,
        },
      });
    } else {
      await (prisma as any).resumeData.create({
        data: {
          cvFileUrl: data.cvFileUrl || "/resume.pdf",
          summary: data.summary || "Full-stack Software Engineer",
          experienceJson: data.experienceJson || [],
          educationJson: data.educationJson || [],
          certsJson: data.certsJson || [],
        },
      });
    }

    revalidatePath("/about");
    revalidatePath("/resume");
    revalidatePath("/private");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update resume data:", error);
    return { success: false, error: error.message || "Failed to update resume." };
  }
}

// --------------------------------------------------------
// SKILLS MANAGEMENT
// --------------------------------------------------------

export async function getSkillsData() {
  try {
    const skills = await (prisma as any).skill.findMany({
      orderBy: { order: "asc" },
    });

    if (skills.length === 0) {
      const defaultSkills = [
        // Programming Languages
        { name: "Python", category: "Programming Languages", proficiency: 88, order: 1 },
        { name: "Java", category: "Programming Languages", proficiency: 85, order: 2 },
        { name: "JavaScript", category: "Programming Languages", proficiency: 90, order: 3 },

        // Frontend
        { name: "HTML", category: "Frontend", proficiency: 95, order: 4 },
        { name: "CSS", category: "Frontend", proficiency: 90, order: 5 },
        { name: "React (Learning)", category: "Frontend", proficiency: 80, order: 6 },
        { name: "Next.js (Learning)", category: "Frontend", proficiency: 78, order: 7 },

        // Backend
        { name: "Node.js (Learning)", category: "Backend", proficiency: 80, order: 8 },
        { name: "Express.js (Learning)", category: "Backend", proficiency: 80, order: 9 },

        // Database
        { name: "MySQL", category: "Database", proficiency: 88, order: 10 },
        { name: "PostgreSQL (Learning)", category: "Database", proficiency: 75, order: 11 },

        // Mobile Development
        { name: "Android Studio", category: "Mobile Development", proficiency: 85, order: 12 },

        // Computer Skills
        { name: "Computer Hardware Troubleshooting", category: "Computer Skills", proficiency: 95, order: 13 },
        { name: "Software Installation", category: "Computer Skills", proficiency: 98, order: 14 },
        { name: "Microsoft Office", category: "Computer Skills", proficiency: 95, order: 15 },

        // Development Tools
        { name: "Visual Studio Code", category: "Development Tools", proficiency: 95, order: 16 },
        { name: "Git", category: "Development Tools", proficiency: 88, order: 17 },
        { name: "GitHub", category: "Development Tools", proficiency: 90, order: 18 },
        { name: "XAMPP", category: "Development Tools", proficiency: 92, order: 19 },
      ];

      await (prisma as any).skill.createMany({ data: defaultSkills, skipDuplicates: true });
      return await (prisma as any).skill.findMany({ orderBy: { order: "asc" } });
    }

    return skills;
  } catch (error) {
    console.error("Failed to fetch skills:", error);
    return [];
  }
}

export async function addSkill(skill: {
  name: string;
  category: string;
  proficiency?: number;
  order?: number;
}) {
  try {
    const count = await (prisma as any).skill.count();
    const created = await (prisma as any).skill.create({
      data: {
        name: skill.name,
        category: skill.category,
        proficiency: skill.proficiency || 90,
        order: skill.order || count + 1,
      },
    });

    revalidatePath("/about");
    revalidatePath("/private");

    return { success: true, skill: created };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to add skill." };
  }
}

export async function updateSkill(id: string, skill: {
  name: string;
  category: string;
  proficiency: number;
}) {
  try {
    await (prisma as any).skill.update({
      where: { id },
      data: skill,
    });

    revalidatePath("/about");
    revalidatePath("/private");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update skill." };
  }
}

export async function deleteSkill(id: string) {
  try {
    await (prisma as any).skill.delete({ where: { id } });

    revalidatePath("/about");
    revalidatePath("/private");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete skill." };
  }
}

// --------------------------------------------------------
// SOCIAL MEDIA CENTRAL MANAGEMENT
// --------------------------------------------------------

export async function getSocialLinksData() {
  try {
    const links = await (prisma as any).socialLink.findMany({
      orderBy: { order: "asc" },
    });

    const platforms = ["github", "linkedin", "facebook", "instagram", "tiktok", "twitter"];
    
    const missingPlatforms = platforms.filter(
      (plat) => !links.some((l: any) => l.platform === plat)
    );

    if (missingPlatforms.length > 0) {
      const toCreate = missingPlatforms.map((plat) => {
        let defaultUrl = "#";
        if (plat === "github") defaultUrl = "https://github.com/ayebonoclement";
        if (plat === "linkedin") defaultUrl = "https://linkedin.com/in/ayebonoclement";
        return { platform: plat, url: defaultUrl, order: platforms.indexOf(plat) + 1 };
      });

      await (prisma as any).socialLink.createMany({ data: toCreate, skipDuplicates: true });
      return await (prisma as any).socialLink.findMany({ orderBy: { order: "asc" } });
    }
  } catch (error) {
    console.error("Failed to fetch social links:", error);
    return [];
  }
}

export async function updateSocialLinksData(linksMap: Record<string, string>) {
  try {
    for (const [platform, url] of Object.entries(linksMap)) {
      if (platform === "youtube") continue; // Exclude YouTube explicitly

      const existing = await (prisma as any).socialLink.findUnique({
        where: { platform },
      });

      if (existing) {
        await (prisma as any).socialLink.update({
          where: { platform },
          data: { url: url.trim() },
        });
      } else {
        await (prisma as any).socialLink.create({
          data: { platform, url: url.trim() },
        });
      }
    }

    revalidatePath("/");
    revalidatePath("/about");
    revalidatePath("/contact");
    revalidatePath("/private");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update social links:", error);
    return { success: false, error: error.message || "Failed to update social links." };
  }
}
