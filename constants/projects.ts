export interface DetailedProject {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  fullDescription: string;
  category: "Web Applications" | "Mobile Applications" | "UI/UX" | "Academic Projects" | "AI Projects" | "Business Projects";
  categoryType: "WEB_APP" | "MOBILE_APP" | "ACADEMIC" | "AI_PROJECT" | "BUSINESS";
  featured: boolean;
  featuredImage?: string;
  gradient: string;
  techStack: string[];
  features: string[];
  screenshots: { title: string; subtitle: string; aspect: string; imagePath?: string }[];
  githubUrl?: string;
  liveUrl?: string;
  apkUrl?: string;
  status?: "Completed" | "In Progress" | "Archived";
  classification?: "Academic Project" | "Commercial Product" | "Personal Project";
  challenges: string[];
  solutions: string[];
  lessonsLearned: string[];
  futureImprovements?: string[];
  version?: string | null;
  androidVersion?: string | null;
  systemArchitecture?: string | null;
}

export const projectsData: DetailedProject[] = [
  // 1. HOSTEL MANAGEMENT SYSTEM (ACADEMIC PROJECT)
  {
    id: "hostel-management-system",
    slug: "hostel-management-system",
    title: "Hostel Management System",
    tagline: "Academic student hostel room allocation, gender eligibility & maintenance tracking system",
    description:
      "Academic software engineering project designed to eliminate room double-booking conflicts, enforce gender-designated room allocations, and provide online maintenance reporting.",
    fullDescription:
      "Developed as an academic software engineering project, the Hostel Management System addresses real-world student accommodation management challenges. It features room slot availability validation, strict gender-allocation eligibility rules, and an online maintenance reporting portal.",
    category: "Academic Projects",
    categoryType: "ACADEMIC",
    classification: "Academic Project",
    featured: false,
    status: "Completed",
    featuredImage: "/uploads/images/images_1786199559199_Screenshot_2026-08-08_143226.png",
    gradient: "from-purple-500/20 via-indigo-600/20 to-blue-500/20",
    techStack: ["Python", "MySQL", "HTML", "CSS", "Flask"],
    features: [
      "Room slot availability and capacity validation prior to booking confirmation",
      "Gender eligibility checks (preventing male/female room assignment conflicts)",
      "Online maintenance reporting workflow (submit request, admin review, staff assignment & resolution tracking)",
      "Student occupant profile and room assignment manager",
      "Fee payment record verification portal",
    ],
    screenshots: [
      { title: "Screenshot 2026-08-08 140604", subtitle: "System Interface Screen", aspect: "aspect-video", imagePath: "/uploads/images/images_1786199386021_Screenshot_2026-08-08_140604.png" },
      { title: "Screenshot 2026-08-08 140655", subtitle: "System Interface Screen", aspect: "aspect-video", imagePath: "/uploads/images/images_1786199459944_Screenshot_2026-08-08_140655.png" },
    ],
    githubUrl: "https://github.com/ayebonoclement",
    challenges: [
      "Preventing room double-booking and gender misallocations (e.g. male students accidentally booking female rooms or female students booking male rooms).",
      "Replacing face-to-face verbal maintenance reporting, which often led to delayed or forgotten repairs.",
    ],
    solutions: [
      "Enforced strict pre-confirmation database transaction locks and eligibility validation rules for room gender and capacity.",
      "Implemented an online maintenance reporting portal where student requests flow directly to the admin dashboard, enabling administrators to assign staff members and track resolution status.",
    ],
    lessonsLearned: [
      "Automated validation prevents human errors in administrative booking systems.",
      "Digital issue tracking drastically improves accountability compared to verbal complaints.",
    ],
    futureImprovements: [
      "Native Mobile Application: Developing a dedicated native Android mobile application for student occupants to check room status and submit maintenance requests.",
      "Agent / Referral Tracking System: Adding agent referral links so student bookings made via referral links are attributed to that agent for referral tracking.",
      "Paystack Payment Integration: Integrating Paystack online payment gateway for instant accommodation fee payments.",
    ],
  },

  // 2. COMPSSA MANAGEMENT SYSTEM (WEB APP - FEATURED)
  {
    id: "compssa-management-system",
    slug: "compssa-management-system",
    title: "COMPSSA Management System",
    tagline: "Academic management platform for Computer Science student association records & resources",
    description:
      "Digital student management portal designed to streamline student registration, course resources, and association communications.",
    fullDescription:
      "The COMPSSA Management System is a web portal built to digitize student records, course document distribution, and departmental announcements for Computer Science students.",
    category: "Web Applications",
    categoryType: "WEB_APP",
    classification: "Academic Project",
    featured: true,
    status: "Completed",
    featuredImage: "/uploads/images/images_1787143375651_Screenshot_2026-08-19_123616.png",
    gradient: "from-indigo-600/20 via-purple-600/20 to-pink-500/20",
    techStack: ["JavaScript", "React", "Node.js", "Express.js", "MySQL"],
    features: [
      "Student course enrollment & profile manager",
      "Department academic document distribution hub",
      "Role-based authorization for students and executives",
    ],
    screenshots: [
      { title: "student portal", subtitle: "System Interface Screen", aspect: "aspect-video", imagePath: "/uploads/images/images_1787143466261_student_portal.png" },
      { title: "HOD Portal", subtitle: "System Interface Screen", aspect: "aspect-video", imagePath: "/uploads/images/images_1787143721615_HOD_Portal.png" },
      { title: "lecturers portal", subtitle: "System Interface Screen", aspect: "aspect-video", imagePath: "/uploads/images/images_1787143731653_lecturers_portal.png" },
      { title: "programs", subtitle: "System Interface Screen", aspect: "aspect-video", imagePath: "/uploads/images/images_1787143776275_programs.png" },
    ],
    githubUrl: "https://github.com/ayebonoclement",
    challenges: ["Structuring authorization roles for student executives."],
    solutions: ["Built modular middleware routines in Express.js to enforce role checks."],
    lessonsLearned: ["Modular backend route handlers keep codebases clean and maintainable."],
  },

  // 3. HOTEL MANAGEMENT SYSTEM (WEB APP - COMMERCIAL PRODUCT CONCEPT)
  {
    id: "hotel-management-system",
    slug: "hotel-management-system",
    title: "Hotel Management System",
    tagline: "Hospitality management system and booking platform for hotel operators",
    description:
      "Personally developed as a potential software product for a hotel business to provide a complete web platform and reservation system for a hotel operator without a proper website.",
    fullDescription:
      "The Hotel Management System is a full-stack hospitality web solution personally engineered as a commercial product concept. Designed specifically for hotel operators lacking an online presence, it provides automated room reservations, guest billing invoices, and inventory control.",
    category: "Web Applications",
    categoryType: "WEB_APP",
    classification: "Commercial Product",
    featured: true,
    status: "Completed",
    featuredImage: "/uploads/images/images_1787177397873_homep.png",
    gradient: "from-amber-500/20 via-indigo-600/20 to-cyan-500/20",
    techStack: ["HTML", "CSS", "JavaScript", "React", "Next.js", "Node.js", "MySQL"],
    features: [
      "Room reservation & guest check-in/check-out matrix",
      "Automated guest billing invoice creation",
      "Administrative dashboard for room inventory management",
      "Revenue summary & occupancy tracking",
    ],
    screenshots: [
      { title: "guest", subtitle: "System Interface Screen", aspect: "aspect-video", imagePath: "/uploads/images/images_1787177414798_guest.png" },
      { title: "gallery", subtitle: "System Interface Screen", aspect: "aspect-video", imagePath: "/uploads/images/images_1787177424943_gallery.png" },
      { title: "services", subtitle: "System Interface Screen", aspect: "aspect-video", imagePath: "/uploads/images/images_1787177464174_services.png" },
      { title: "Screenshot 2026-08-19 161827", subtitle: "System Interface Screen", aspect: "aspect-video", imagePath: "/uploads/images/images_1787177479850_Screenshot_2026-08-19_161827.png" },
    ],
    githubUrl: "https://github.com/ayebonoclement",
    challenges: ["Managing room availability constraints and automated billing."],
    solutions: ["Implemented database transaction controls for guest reservations."],
    lessonsLearned: ["Custom web systems empower small hospitality businesses to establish an online presence."],
  },

  // 4. QUEUELESS ENTERPRISE PLATFORM (WEB APP - COMMERCIAL PRODUCT)
  {
    id: "queueless-system",
    slug: "queueless-system",
    title: "QueueLess — Enterprise Multi-Tenant Queue & Appointment Platform",
    tagline: "Cloud-native queue orchestration, digital ticket dispatching, multi-tenant branch architecture & real-time lobby TV displays",
    description:
      "Enterprise multi-tenant queue management and appointment booking platform engineered for commercial banks, specialist hospitals, diagnostic centers, and civic agencies (DVLA & Passports). Features real-time WebSocket dispatching, 1:1 service-bound QR standees, TV lobby screens with audio chimes, and conflict-free scheduling.",
    fullDescription:
      "QueueLess is a production-ready, full-stack enterprise queue management and appointment booking platform engineered to eliminate physical waiting lines in high-traffic commercial and public institutions. Designed from the ground up for multi-tenant scalability, QueueLess powers distinct operational environments across commercial retail banking (Apex Bank Ghana), healthcare outpatient clinics (St. Jude Specialist Hospital), and government civic agencies (Driver & Vehicle Licensing Authority).\n\nThe platform combines an Express 5 REST and WebSocket engine with a modern React 19 web portal, React Native mobile client, and a dedicated fullscreen TV lobby display. Service counters and waiting areas stay synchronized in real time via sub-millisecond Socket.io event broadcasting and browser-synthesized audio chimes. Customer onboarding is streamlined via the 1:1 Service-Bound QR Code architecture, allowing visitors to walk into a facility, scan a physical desk standee, and immediately receive a verified digital ticket without confusing service selection menus.",
    category: "Web Applications",
    categoryType: "WEB_APP",
    classification: "Commercial Product",
    featured: true,
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
  },


  // 5. POINT OF SALE (POS) SYSTEM (ANGULAR FRONTEND)
  {
    id: "point-of-sale-pos-system",
    slug: "point-of-sale-pos-system",
    title: "Point of Sale (POS) System",
    tagline: "Retail checkout user interface developed in Angular",
    description:
      "Point of Sale front-end user interface application developed with Angular for managing retail sales checkouts and inventory scanning. Operates as a client-side interface and currently does NOT utilize a database backend.",
    fullDescription:
      "Built as a software engineering project, the POS System provides a responsive client interface built in Angular for scanning item barcodes, building customer sales carts, and calculating receipt totals. Note: This project focuses on client-side state management and currently operates without a database backend.",
    category: "Academic Projects",
    categoryType: "ACADEMIC",
    classification: "Academic Project",
    featured: false,
    status: "Completed",
    featuredImage: "/uploads/images/images_1787146017506_home.png",
    gradient: "from-emerald-500/20 via-teal-600/20 to-cyan-500/20",
    techStack: ["Angular", "TypeScript", "HTML5", "CSS3"],
    features: [
      "Product item barcode checkout & cart calculator UI",
      "Client-side item management and receipt total calculations",
      "Daily sales summary interface",
    ],
    screenshots: [
      { title: "home", subtitle: "System Interface Screen", aspect: "aspect-video", imagePath: "/uploads/images/images_1787146622266_home.png" },
      { title: "Admin", subtitle: "System Interface Screen", aspect: "aspect-video", imagePath: "/uploads/images/images_1787146659666_Admin.png" },
      { title: "Report", subtitle: "System Interface Screen", aspect: "aspect-video", imagePath: "/uploads/images/images_1787146698676_Report.png" },
      { title: "Add or Edit", subtitle: "System Interface Screen", aspect: "aspect-video", imagePath: "/uploads/images/images_1787146729301_Add_or_Edit.png" },
    ],
    githubUrl: "https://github.com/ayebonoclement",
    challenges: ["Building responsive reactive UI components in Angular for fast checkout without relying on a database backend."],
    solutions: ["Utilized Angular reactive state management and forms for instant cart calculations."],
    lessonsLearned: ["Angular reactive forms excel at dynamic client-side calculations."],
  },

  // 6. SMART DATA USAGE (MOBILE APP)
  {
    id: "smart-data-usage",
    slug: "smart-data-usage",
    title: "Smart Data Usage",
    tagline: "Android mobile application for monitoring cellular internet data consumption",
    description:
      "Android mobile app designed to help users track mobile internet data consumption, set alerts, and manage usage limits.",
    fullDescription:
      "Smart Data Usage is a mobile application developed in Android Studio using Java. It tracks cellular and Wi-Fi data usage on Android devices and alerts users before limits are exceeded.",
    category: "Mobile Applications",
    categoryType: "MOBILE_APP",
    featured: true,
    status: "Completed",
    featuredImage: "/uploads/images/images_1786202280955_Screenshot_20260808_143649_One_UI_Home.jpg",
    gradient: "from-blue-500/20 via-indigo-600/20 to-purple-500/20",
    techStack: ["Android Studio", "Java", "Android SDK", "XML UI"],
    features: [
      "Real-time cellular and Wi-Fi data usage monitoring",
      "Daily and monthly data limit warning notifications",
      "App-by-app data consumption breakdown",
    ],
    screenshots: [
      { title: "Screenshot_20260808_143704_Smart Data Usage", subtitle: "System Interface Screen", aspect: "aspect-video", imagePath: "/uploads/images/images_1786202301906_Screenshot_20260808_143704_Smart_Data_Usage.jpg" },
      { title: "Screenshot_20260808_143721_Smart Data Usage", subtitle: "System Interface Screen", aspect: "aspect-video", imagePath: "/uploads/images/images_1786202310522_Screenshot_20260808_143721_Smart_Data_Usage.jpg" },
      { title: "Screenshot_20260808_143730_Smart Data Usage", subtitle: "System Interface Screen", aspect: "aspect-video", imagePath: "/uploads/images/images_1786202329795_Screenshot_20260808_143730_Smart_Data_Usage.jpg" },
      { title: "Screenshot_20260808_143746_Smart Data Usage", subtitle: "System Interface Screen", aspect: "aspect-video", imagePath: "/uploads/images/images_1786202344658_Screenshot_20260808_143746_Smart_Data_Usage.jpg" },
    ],
    githubUrl: "https://github.com/ayebonoclement",
    challenges: ["Fetching accurate network statistics across Android versions."],
    solutions: ["Utilized Android NetworkStatsManager API with fallback routines."],
    lessonsLearned: ["Android background services require careful power management."],
  },

  // 7. ANDROID CALCULATOR (MOBILE APP - IN PROGRESS)
  {
    id: "android-calculator",
    slug: "android-calculator",
    title: "Android Calculator",
    tagline: "Clean numeric utility calculator app built in Android Studio",
    description:
      "Utility Android calculator application supporting standard mathematical calculations and history tracking.",
    fullDescription:
      "Currently being developed in Android Studio to practice native UI layouts, touch event handling, and mathematical expression parsing.",
    category: "Mobile Applications",
    categoryType: "MOBILE_APP",
    featured: false,
    status: "In Progress",
    featuredImage: "/uploads/images/images_1786201335281_Screenshot_20260808_143649_One_UI_Home.jpg",
    gradient: "from-amber-500/20 via-orange-600/20 to-red-500/20",
    techStack: ["Android Studio", "Java", "XML UI"],
    features: [
      "Standard arithmetic calculations",
      "Calculation history log",
      "Responsive layout for phone viewports",
    ],
    screenshots: [
      { title: "Screenshot_20260808_143628_HST Calculator", subtitle: "System Interface Screen", aspect: "aspect-video", imagePath: "/uploads/images/images_1786201206664_Screenshot_20260808_143628_HST_Calculator.jpg" },
      { title: "Screenshot_20260808_143637_HST Calculator", subtitle: "System Interface Screen", aspect: "aspect-video", imagePath: "/uploads/images/images_1786201404874_Screenshot_20260808_143637_HST_Calculator.jpg" },
    ],
    githubUrl: "https://github.com/ayebonoclement",
    challenges: ["Handling operator precedence in complex mathematical expressions."],
    solutions: ["Implementing Dijkstra's Shunting-yard algorithm for expression evaluation."],
    lessonsLearned: ["Algorithms simplify complex UI calculation logic."],
  },

  // 8. DESKTOP AI ASSISTANT (AI PROJECT - IN PROGRESS)
  {
    id: "desktop-ai-assistant",
    slug: "desktop-ai-assistant",
    title: "Desktop AI Assistant",
    tagline: "Voice & text desktop automation assistant built in Python",
    description:
      "Python-based desktop automation tool designed to execute voice commands, open applications, and answer queries.",
    fullDescription:
      "An active AI development project built in Python. The assistant listens to voice commands, performs system file searches, opens applications, and retrieves information.",
    category: "AI Projects",
    categoryType: "AI_PROJECT",
    featured: false,
    status: "In Progress",
    gradient: "from-indigo-600/20 via-cyan-500/20 to-emerald-500/20",
    techStack: ["Python", "SpeechRecognition", "PyQt"],
    features: [
      "Voice command recognition & speech synthesis",
      "System application launcher & file search",
      "Weather and news retrieval via API calls",
    ],
    screenshots: [
      { title: "Assistant Interface", subtitle: "Voice prompt and response log", aspect: "aspect-video" },
    ],
    githubUrl: "https://github.com/ayebonoclement",
    challenges: ["Handling background microphone noise during speech recognition."],
    solutions: ["Applied ambient noise calibration in Python speech recognition modules."],
    lessonsLearned: ["Python libraries streamline audio signal processing."],
  },

  // 9. OBJECT DETECTOR (AI PROJECT - IN PROGRESS)
  {
    id: "object-detector",
    slug: "object-detector",
    title: "Object Detector",
    tagline: "Computer vision application for real-time video stream object recognition",
    description:
      "Python computer vision project utilizing OpenCV to identify objects in live camera streams.",
    fullDescription:
      "An active computer vision project built with Python and OpenCV to detect and annotate everyday objects in real-time camera video streams.",
    category: "AI Projects",
    categoryType: "AI_PROJECT",
    featured: false,
    status: "In Progress",
    gradient: "from-cyan-500/20 via-teal-600/20 to-emerald-500/20",
    techStack: ["Python", "OpenCV", "NumPy"],
    features: [
      "Live webcam feed object detection bounding boxes",
      "Pre-trained model object classification",
      "Real-time frame rate display",
    ],
    screenshots: [
      { title: "Camera Detection Feed", subtitle: "Bounding boxes on detected objects", aspect: "aspect-video" },
    ],
    githubUrl: "https://github.com/ayebonoclement",
    challenges: ["Maintaining smooth frame rates during real-time image processing."],
    solutions: ["Resized input video frames to lower resolution before processing."],
    lessonsLearned: ["Frame preprocessing boosts computer vision performance."],
  },

  // 10. HOLY STAR DATA (BUSINESS PROJECT - ARCHIVED)
  {
    id: "holy-star-data",
    slug: "holy-star-data",
    title: "Holy Star Data",
    tagline: "Archived digital services platform for mobile data & telecom packages",
    description:
      "Archived digital portal built to showcase mobile data bundle packages and customer inquiries.",
    fullDescription:
      "Holy Star Data was a digital business project designed to showcase mobile internet packages and handle customer service requests.",
    category: "Business Projects",
    categoryType: "BUSINESS",
    featured: false,
    status: "Archived",
    gradient: "from-gray-500/20 via-zinc-600/20 to-slate-500/20",
    techStack: ["HTML", "CSS", "JavaScript", "PHP", "MySQL"],
    features: [
      "Mobile data package catalog display",
      "Customer inquiry contact form",
      "Admin panel for pricing updates",
    ],
    screenshots: [
      { title: "Package Catalog", subtitle: "Data bundle pricing table", aspect: "aspect-video" },
    ],
    githubUrl: "https://github.com/ayebonoclement",
    challenges: ["Updating pricing tables dynamically across pages."],
    solutions: ["Stored package pricing centrally in a MySQL database table."],
    lessonsLearned: ["Database-driven content simplifies updates."],
  },
];
