import { IconType } from "react-icons";
import {
  FaGithub,
  FaLinkedin,
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaTwitter,
  FaYoutube,
  FaWhatsapp,
} from "react-icons/fa";

export interface SocialPlatformConfig {
  id: string;
  name: string;
  url: string;
  icon: IconType;
  placeholder: string;
  color: string;
  enabled?: boolean;
}

export const socialPlatforms: Record<string, SocialPlatformConfig> = {
  github: {
    id: "github",
    name: "GitHub",
    url: process.env.NEXT_PUBLIC_SOCIAL_GITHUB || "https://github.com",
    icon: FaGithub,
    placeholder: "https://github.com/your-handle",
    color: "hover:text-neutral-200 hover:border-neutral-700",
    enabled: true,
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    url: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN || "https://linkedin.com",
    icon: FaLinkedin,
    placeholder: "https://linkedin.com/in/your-handle",
    color: "hover:text-blue-400 hover:border-blue-500/40",
    enabled: true,
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    url: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || "https://facebook.com",
    icon: FaFacebook,
    placeholder: "https://facebook.com/your-handle",
    color: "hover:text-blue-500 hover:border-blue-600/40",
    enabled: true,
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    url: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || "https://instagram.com",
    icon: FaInstagram,
    placeholder: "https://instagram.com/your-handle",
    color: "hover:text-pink-500 hover:border-pink-500/40",
    enabled: true,
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    url: process.env.NEXT_PUBLIC_SOCIAL_TIKTOK || "https://tiktok.com",
    icon: FaTiktok,
    placeholder: "https://tiktok.com/@your-handle",
    color: "hover:text-cyan-400 hover:border-cyan-400/40",
    enabled: true,
  },
  x: {
    id: "x",
    name: "X (Twitter)",
    url: process.env.NEXT_PUBLIC_SOCIAL_X || "https://x.com",
    icon: FaTwitter,
    placeholder: "https://x.com/your-handle",
    color: "hover:text-sky-400 hover:border-sky-400/40",
    enabled: true,
  },
  youtube: {
    id: "youtube",
    name: "YouTube",
    url: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE || "https://youtube.com",
    icon: FaYoutube,
    placeholder: "https://youtube.com/@your-channel",
    color: "hover:text-red-500 hover:border-red-500/40",
    enabled: false,
  },
  whatsapp: {
    id: "whatsapp",
    name: "WhatsApp",
    url: process.env.NEXT_PUBLIC_SOCIAL_WHATSAPP || "https://wa.me/",
    icon: FaWhatsapp,
    placeholder: "https://wa.me/233000000000",
    color: "hover:text-emerald-400 hover:border-emerald-500/40",
    enabled: true,
  },
};

export const socialLinksList = Object.values(socialPlatforms).filter(
  (platform) => platform.enabled !== false
);
