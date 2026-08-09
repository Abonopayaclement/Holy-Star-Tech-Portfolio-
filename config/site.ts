export const siteConfig = {
  name: "Holy Star Tech",
  author: "Abonopaya Clement Ayebono",
  title: "Holy Star Tech | Software Engineering & Web Development",
  description:
    "Official personal brand platform of Abonopaya Clement Ayebono. Software Engineer, Full-Stack Web Developer, and Mobile Application Developer based in Bolgatanga, Upper East Region, Ghana.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: "/logo.png",
  links: {
    github: "https://github.com/ayebonoclement",
    linkedin: "https://linkedin.com/in/ayebonoclement",
    twitter: "https://x.com/holystartech",
    email: "mailto:abonopayaclementayebono@gmail.com",
  },
  keywords: [
    "Holy Star Tech",
    "Abonopaya Clement Ayebono",
    "Software Engineer",
    "Full-Stack Web Developer",
    "Mobile Application Developer",
    "Bolgatanga Ghana",
    "Upper East Region Ghana",
    "Kumasi Technical University",
    "Bolgatanga Technical Institute",
    "React",
    "Next.js",
    "Node.js",
    "Android Studio",
  ],
};

export type SiteConfig = typeof siteConfig;
