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
  screenshots: { title: string; subtitle: string; aspect: string }[];
  githubUrl?: string;
  liveUrl?: string;
  apkUrl?: string;
  status?: "Completed" | "In Progress" | "Archived";
  classification?: "Academic Project" | "Commercial Product" | "Personal Project";
  challenges: string[];
  solutions: string[];
  lessonsLearned: string[];
  futureImprovements?: string[];
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
      { title: "Room Allocation Matrix", subtitle: "Hostel room capacity & gender eligibility verification", aspect: "aspect-video" },
      { title: "Maintenance Request Hub", subtitle: "Online student issue reporting & tracking panel", aspect: "aspect-video" },
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
    gradient: "from-indigo-600/20 via-purple-600/20 to-pink-500/20",
    techStack: ["JavaScript", "React", "Node.js", "Express.js", "MySQL"],
    features: [
      "Student course enrollment & profile manager",
      "Department academic document distribution hub",
      "Role-based authorization for students and executives",
    ],
    screenshots: [
      { title: "Student Dashboard Mockup", subtitle: "Course manager and community portal", aspect: "aspect-video" },
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
    gradient: "from-amber-500/20 via-indigo-600/20 to-cyan-500/20",
    techStack: ["HTML", "CSS", "JavaScript", "React", "Next.js", "Node.js", "MySQL"],
    features: [
      "Room reservation & guest check-in/check-out matrix",
      "Automated guest billing invoice creation",
      "Administrative dashboard for room inventory management",
      "Revenue summary & occupancy tracking",
    ],
    screenshots: [
      { title: "Dashboard Overview", subtitle: "Real-time occupancy metrics", aspect: "aspect-video" },
      { title: "Reservation Matrix", subtitle: "Room availability calendar", aspect: "aspect-video" },
    ],
    githubUrl: "https://github.com/ayebonoclement",
    challenges: ["Managing room availability constraints and automated billing."],
    solutions: ["Implemented database transaction controls for guest reservations."],
    lessonsLearned: ["Custom web systems empower small hospitality businesses to establish an online presence."],
  },

  // 4. QUEUELESS SYSTEM (WEB APP - IN PROGRESS)
  {
    id: "queueless-system",
    slug: "queueless-system",
    title: "QueueLess System",
    tagline: "Smart virtual queue management system for waiting rooms and service counters",
    description:
      "Web-based virtual queue management platform designed to eliminate physical waiting lines and issue digital ticket numbers.",
    fullDescription:
      "QueueLess System is an active project aimed at optimizing waiting line management for service counters and campus departments through digital ticketing.",
    category: "Web Applications",
    categoryType: "WEB_APP",
    classification: "Personal Project",
    featured: false,
    status: "In Progress",
    gradient: "from-cyan-500/20 via-blue-600/20 to-indigo-600/20",
    techStack: ["HTML", "CSS", "JavaScript", "Node.js", "Express.js", "MySQL"],
    features: [
      "Digital ticket generation and queue position tracking",
      "Real-time queue display screen for service counters",
      "SMS or web notifications for upcoming turns",
    ],
    screenshots: [
      { title: "Queue Counter Display", subtitle: "Live ticket calling screen", aspect: "aspect-video" },
    ],
    githubUrl: "https://github.com/ayebonoclement",
    challenges: ["Updating waiting screen positions instantaneously."],
    solutions: ["Utilizing lightweight polling API endpoints."],
    lessonsLearned: ["Simple REST polling provides reliable live updates for local displays."],
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
    gradient: "from-emerald-500/20 via-teal-600/20 to-cyan-500/20",
    techStack: ["Angular", "TypeScript", "HTML5", "CSS3"],
    features: [
      "Product item barcode checkout & cart calculator UI",
      "Client-side item management and receipt total calculations",
      "Daily sales summary interface",
    ],
    screenshots: [
      { title: "Sales Checkout Screen", subtitle: "Angular checkout interface & receipt calculator", aspect: "aspect-video" },
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
    gradient: "from-blue-500/20 via-indigo-600/20 to-purple-500/20",
    techStack: ["Android Studio", "Java", "Android SDK", "XML UI"],
    features: [
      "Real-time cellular and Wi-Fi data usage monitoring",
      "Daily and monthly data limit warning notifications",
      "App-by-app data consumption breakdown",
    ],
    screenshots: [
      { title: "Data Meter Screen", subtitle: "Visual gauge of data consumed", aspect: "aspect-video" },
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
    gradient: "from-amber-500/20 via-orange-600/20 to-red-500/20",
    techStack: ["Android Studio", "Java", "XML UI"],
    features: [
      "Standard arithmetic calculations",
      "Calculation history log",
      "Responsive layout for phone viewports",
    ],
    screenshots: [
      { title: "Calculator Interface", subtitle: "Clean numeric keypad layout", aspect: "aspect-video" },
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
