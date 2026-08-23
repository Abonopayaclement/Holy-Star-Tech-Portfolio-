
# Holy Star Tech

Official enterprise personal brand platform, portfolio, developer journal, and technical showcase owned and engineered by **Abonopaya Clement Ayebono**.

---

## Technical Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui primitives, Framer Motion
- **Form Handling & Validation**: React Hook Form, Zod, `@hookform/resolvers`
- **Toast Notifications & Icons**: Sonner, Lucide React, React Icons (`react-icons`)
- **Database ORM**: Prisma ORM (Configured for MySQL / Local XAMPP)
- **Authentication**: Better Auth
- **Quality & Formatting**: ESLint, Prettier, Husky, Lint-Staged

---

## Project Structure

```
holy-star-tech/
├── app/
│   ├── (public)/          # Publicly accessible routes (Hero, About, Projects, Blog, etc.)
│   ├── (admin)/           # Admin dashboard route group
│   ├── (auth)/            # Authentication route group
│   ├── api/               # API route handlers
│   ├── layout.tsx         # Root Layout
│   ├── loading.tsx        # Global Loading state UI
│   ├── error.tsx          # Global Error boundary
│   └── not-found.tsx      # Custom 404 page
├── components/
│   ├── layout/            # Navbar, Footer, Drawers
│   ├── shared/            # ThemeToggle, Logo, Reusable branding
│   └── ui/                # Atomic UI components
├── config/                # Site configuration, SEO metadata, author profile
├── constants/             # Navigation links, static constants
├── features/              # Feature-sliced modules
├── hooks/                 # Custom React hooks (useMounted, etc.)
├── lib/                   # Third-party adapters (Prisma, Better Auth, utils)
├── providers/             # React context providers (ThemeProvider, ToasterProvider)
├── services/              # Business logic & data service layer
├── styles/                # Global CSS & Tailwind design tokens
├── types/                 # TypeScript interfaces
├── prisma/                # Prisma schema configured for MySQL
├── public/                # Static public assets
└── middleware.ts          # Edge middleware handler
```

---

## Local Development Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. **Prisma Schema Verification**:
   ```bash
   npx prisma validate
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.
