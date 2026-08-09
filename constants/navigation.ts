export interface NavItem {
  title: string;
  href: string;
  description?: string;
  external?: boolean;
}

export const mainNav: NavItem[] = [
  { title: "Home", href: "/" },
  { title: "About", href: "/about" },
  { title: "Projects", href: "/projects" },
  { title: "Blog", href: "/blog" },
  { title: "Resume", href: "/resume" },
  { title: "Contact", href: "/contact" },
];

export const footerNav = {
  platform: [
    { title: "About", href: "/about" },
    { title: "Projects", href: "/projects" },
    { title: "Blog", href: "/blog" },
  ],
  explore: [
    { title: "Resume", href: "/resume" },
    { title: "What's New", href: "/whats-new" },
    { title: "Contact", href: "/contact" },
  ],
  legal: [
    { title: "Privacy Policy", href: "/privacy" },
    { title: "Terms of Service", href: "/terms" },
  ],
};
