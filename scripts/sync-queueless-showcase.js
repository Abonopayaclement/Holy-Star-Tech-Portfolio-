const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const queuelessData = {
  title: "QueueLess — Enterprise Multi-Tenant Queue & Appointment Platform",
  slug: "queueless-system",
  tagline: "Cloud-native queue orchestration, digital ticket dispatching, multi-tenant branch architecture & real-time lobby TV displays",
  description:
    "Enterprise multi-tenant queue management and appointment booking platform engineered for commercial banks, specialist hospitals, diagnostic centers, and civic agencies (DVLA & Passports). Features real-time WebSocket dispatching, 1:1 service-bound QR standees, TV lobby screens with audio chimes, and conflict-free scheduling.",
  fullDescription:
    "QueueLess is a production-ready, full-stack enterprise queue management and appointment booking platform engineered to eliminate physical waiting lines in high-traffic commercial and public institutions. Designed from the ground up for multi-tenant scalability, QueueLess powers distinct operational environments across commercial retail banking (Apex Bank Ghana), healthcare outpatient clinics (St. Jude Specialist Hospital), and government civic agencies (Driver & Vehicle Licensing Authority).\n\nThe platform combines an Express 5 REST and WebSocket engine with a modern React 19 web portal, React Native mobile client, and a dedicated fullscreen TV lobby display. Service counters and waiting areas stay synchronized in real time via sub-millisecond Socket.io event broadcasting and browser-synthesized audio chimes. Customer onboarding is streamlined via the 1:1 Service-Bound QR Code architecture, allowing visitors to walk into a facility, scan a physical desk standee, and immediately receive a verified digital ticket without confusing service selection menus.",
  categoryType: "WEB_APP",
  classification: "Commercial Product",
  featured: true,
  published: true,
  status: "Completed",
  version: "1.0.0",
  featuredImage: "/uploads/images/queueless_hero_dashboard.jpg",
  gradient: "from-cyan-500/20 via-blue-600/20 to-indigo-600/20",
  liveUrl: "https://holystartech.me/queueless",
  githubUrl: "https://github.com/ayebonoclement",
  techStack: [
    "React 19",
    "TypeScript",
    "Node.js",
    "Express.js 5",
    "Prisma ORM",
    "Aiven MySQL",
    "Socket.io",
    "Tailwind CSS",
    "TanStack Query",
    "React Native",
    "Expo",
    "Lucide Icons",
    "Web Audio API",
  ],
  features: [
    "Multi-Tenant Isolation: Strict row-level data boundaries across independent organizations (Apex Bank, St. Jude Hospital, DVLA) with dedicated roles (SUPER_ADMIN, ORG_ADMIN, BRANCH_MANAGER, STAFF, CUSTOMER).",
    "1:1 Service-Bound QR Standees: Permanent desk-specific physical tokens with zero-ambiguity direct queue routing, dynamic expiration windows, and instant revocation guards.",
    "Real-Time WebSocket Progression: Synchronous sub-millisecond queue state transitions (WAITING -> CALLING -> SERVING -> COMPLETED) across all customer devices and staff counters.",
    "High-Contrast TV Waiting Hall Display: Dedicated fullscreen airport-style departure board (/display) with live counter routing and automated harmonic chime synthesis.",
    "Dynamic Conflict-Free Appointments: Automated 30-minute slot allocation engine with operating hours enforcement, double-booking prevention, and customer self-rescheduling.",
    "Service Desk QR Management Hub: Complete administrative console (/qr-management) for generating, printing, and auditing high-contrast counter standees with live scan telemetry.",
    "Clean Customer Testing State: 10 pre-configured test customer profiles seeded with 0 active tickets, enabling repeatable verification of live joins, QR scans, and ticket transitions.",
    "Enterprise Security & Database Safety: Table-mapped models (queueless_user, queueless_skill) co-existing seamlessly alongside Holy Star Tech on Aiven Cloud MySQL with bcrypt hashing and JWT auth.",
  ],
  screenshots: [
    {
      title: "Staff Counter & Queue Dispatcher",
      subtitle: "Real-time teller calling workspace with live ticket progression, customer details, and Web Audio chimes",
      aspect: "aspect-video",
      imagePath: "/uploads/images/queueless_hero_dashboard.jpg",
    },
    {
      title: "High-Contrast TV Lobby Display",
      subtitle: "Dedicated airport-style waiting hall screen with live counter callouts and automated chime notifications",
      aspect: "aspect-video",
      imagePath: "/uploads/images/queueless_tv_display.jpg",
    },
    {
      title: "Customer Mobile & Web Queue Pass",
      subtitle: "Live ticket position tracking, estimated wait countdown, and dynamic slot rescheduling",
      aspect: "aspect-video",
      imagePath: "/uploads/images/queueless_customer_portal.jpg",
    },
    {
      title: "Service QR Standee Management Hub",
      subtitle: "Dynamic QR standee generation, validity expiration controls, and real-time scan metrics",
      aspect: "aspect-video",
      imagePath: "/uploads/images/queueless_qr_management.jpg",
    },
  ],
  challenges: [
    "Eliminating concurrent ticket collision and race conditions when dozens of customers scan QR standees simultaneously at peak branch hours.",
    "Safely co-locating QueueLess enterprise schema alongside Holy Star Tech's production database without table name collisions (e.g., User and Skill).",
    "Architecting instant, synchronized audio-visual feedback across multiple staff counters and high-traffic TV displays with zero perceptible lag.",
    "Ensuring physical QR standees map deterministically to a single service desk without customer confusion or error-prone branch selection steps.",
  ],
  solutions: [
    "Engineered atomic Prisma database transactions with sequential ticket sequence locks (date-keyed counters per service) to guarantee gapless, collision-free numbering.",
    "Implemented explicit Prisma table mappings (@@map(\"queueless_user\") and @@map(\"queueless_skill\")), enabling safe multi-project tenancy within a single Aiven MySQL database cluster.",
    "Integrated Socket.io pub/sub rooms per branch and service with Web Audio API chime synthesis, achieving sub-50ms reactive screen updates.",
    "Created the 1:1 Service QR Guarantee architecture where every physical QR token is permanently bound to an immutable service desk, bypassing ambiguous selection screens.",
  ],
  lessonsLearned: [
    "Decoupling physical QR token status (active/expired/revoked) from underlying queue states ensures physical standee maintenance never interrupts ongoing counter operations.",
    "Explicit schema table mapping (@@map) is essential when sharing managed cloud databases across independent production micro-services.",
    "Combining Web Audio chimes with high-contrast TV lobby displays dramatically reduces customer anxiety and missed ticket calls in crowded physical branches.",
  ],
  futureImprovements: [
    "AI-Powered Wait Time Forecasting: Machine learning models training on historical transaction durations, staff velocity, and seasonal foot-traffic peaks.",
    "WhatsApp & SMS Omnichannel Callbacks: Proactive messaging alerting customers when their position reaches 5 and 2 ahead of them.",
    "Self-Service Kiosk Hardware Integration: Thermal printer driver integration and touch-kiosk firmware for physical ticket dispensing.",
    "Paystack Payment Verification for Premium Services: Automated escrow collection for paid consultation bookings and VIP fast-track appointments.",
  ],
  systemArchitecture:
    "Client Layer: React 19 SPA (Web Portal, Customer Desk, Lobby TV) + React Native Expo (Mobile App).\nAPI Gateway: Express 5 in TypeScript with JWT role-based security guards & Socket.io WebSocket pub/sub.\nDatabase Layer: Aiven Cloud MySQL with Prisma ORM 7.x, using isolated table mappings (queueless_user, queueless_skill) alongside Holy Star Tech.\nInfrastructure: Vercel Reverse Proxy (https://holystartech.me/queueless) routing seamlessly to dedicated cloud instances.",
};

async function syncShowcase() {
  console.log("=== SYNCING QUEUELESS SHOWCASE IN DATABASE ===");
  try {
    const existing = await prisma.project.findUnique({
      where: { slug: "queueless-system" },
    });

    if (existing) {
      const updated = await prisma.project.update({
        where: { id: existing.id },
        data: queuelessData,
      });
      console.log(`✅ Successfully updated QueueLess project (ID: ${updated.id}) in database.`);
    } else {
      const created = await prisma.project.create({
        data: queuelessData,
      });
      console.log(`✅ Successfully created QueueLess project (ID: ${created.id}) in database.`);
    }
  } catch (error) {
    console.error("❌ Error syncing QueueLess project:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

syncShowcase();
