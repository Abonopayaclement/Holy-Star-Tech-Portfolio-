# QueueLess — Mobile & QR/Deep-Link Architecture (Phase 2)

**Version**: 2.0.0  
**Phase**: 2 (Customer Mobile App + QR / Deep-Link Architecture + Converged Walk-In Engine)  
**Status**: Implemented & Production Ready  

---

## 1. System Topology & Dual-Product Overview

QueueLess operates two dedicated front-end platforms serving distinct personas, both converging on a single hardened backend and database engine:

```
                            QUEUELESS PLATFORM
                                     │
                     ┌───────────────┴───────────────┐
                     │                               │
               CUSTOMER APP                    ORGANIZATION WEB
           (React Native / Expo)              (React 19 / Vite)
                     │                               │
                     │ (Customer Persona)            │ (Staff & Admin Personas)
                     ├── Discover Organizations      ├── Super Admin Platform Control
                     ├── Select Branch & Services    ├── Org Admin Management
                     ├── Digital Queue Ticketing     ├── Branch Manager Operations
                     ├── Live Queue Tracker          ├── Staff Counter Controls
                     ├── Interactive QR Scanner      ├── QR Code Generation & Printing
                     ├── Appointment Booking         └── Walk-in Ticket Creation
                     ├── In-App Alerts / Push              (Converged Engine)
                     └── Customer Profile                    │
                             │                               │
                             └───────────────┬───────────────┘
                                             │
                                             ▼
                                    QUEUELESS BACKEND
                                      (Node/Express)
                                             │
                                             ▼
                                    DATABASE ENGINE
                                     (MariaDB/MySQL)
```

---

## 2. Customer Mobile App Architecture (`apps/mobile`)

The customer mobile application is constructed using **Expo + React Native + TypeScript + Expo Router**.

### Directory Structure
```
apps/mobile/
├── app/
│   ├── _layout.tsx                     # Root safe-area, AuthProvider, and Stack navigator
│   ├── index.tsx                       # Splash & auth gatekeeper routing
│   │
│   ├── (auth)/                         # Unauthenticated customer onboarding
│   │   ├── _layout.tsx
│   │   ├── login.tsx                   # Customer sign in with fast demo autofill
│   │   ├── register.tsx                # Customer registration (strictly CUSTOMER role)
│   │   └── forgot-password.tsx         # Password recovery workflow
│   │
│   ├── (customer)/                     # Authenticated customer tab navigation
│   │   ├── _layout.tsx                 # Bottom tab bar with high-contrast active icons
│   │   ├── home.tsx                    # Customer Home: greeting, quick CTAs, active ticket, org discovery
│   │   ├── queue.tsx                   # Active ticket status & queue metrics
│   │   ├── appointments.tsx            # Upcoming and scheduled appointment bookings
│   │   ├── history.tsx                 # Chronological history of completed/cancelled tickets & visits
│   │   └── profile.tsx                 # Customer credentials, preferences, and secure sign-out
│   │
│   ├── organization/
│   │   └── [organizationId].tsx        # Institution profile and branch directory
│   ├── branch/
│   │   └── [branchId].tsx              # Branch location, hours, and catalog of services
│   ├── service/
│   │   └── [serviceId].tsx             # Service details, estimated wait times, and direct CTAs
│   ├── queue/
│   │   ├── join.tsx                    # Step-by-step queue selection & confirmation wizard
│   │   └── [ticketId].tsx              # Live Ticket Tracker with auto-updating state machine
│   ├── appointment/
│   │   ├── book.tsx                    # Date & slot selection with double-booking prevention
│   │   └── [appointmentId].tsx         # Appointment details, cancellation, and reschedule
│   │
│   └── scan.tsx                        # Device camera QR scanner with manual fallback
│
├── src/
│   ├── api/
│   │   ├── client.ts                   # Axios instance with EXPO_PUBLIC_API_URL and JWT interceptor
│   │   ├── authApi.ts                  # Customer auth endpoints (login, register, me)
│   │   ├── organizationApi.ts          # Discovery and QR resolution endpoints
│   │   ├── queueApi.ts                 # Join queue, live ticket, cancel ticket, history
│   │   └── appointmentApi.ts          # Available slots, booking, cancel, reschedule
│   ├── constants/
│   │   └── theme.ts                    # Colors, spacing, radii, state badge tokens
│   ├── hooks/
│   │   ├── useAuth.tsx                 # Session persistence via AsyncStorage
│   │   └── useQueueSocket.ts           # Socket.io room subscription with polling fallback
│   ├── services/
│   │   └── notificationService.ts      # Push notification tokens and proximity audio/haptic alerts
│   ├── types/
│   │   └── index.ts                    # TypeScript types matching backend schemas
│   └── utils/
│       ├── qrParser.ts                 # Multi-format QR code and deep-link parser
│       └── qrParser.test.ts            # Unit tests for QR parser
│
├── app.json                            # Expo scheme 'queueless' and camera permissions
├── package.json
└── tsconfig.json
```

---

## 3. Converged Queue Engine Architecture

All entry pathways feed directly into the same queue engine. **No parallel queue tables or duplicate logic exist.**

```
Mobile Customer App ───────────────┐
                                   │
QR Code Scan (Mobile / Web) ───────┼───► queueService.joinQueue() ───► MySQL QueueEntry
                                   │     - Concurrency transaction
Staff Desk Walk-In Ticket ─────────┘     - Sequential position lock
                                         - Structured ticket (e.g. A-014)
                                         - WebSocket broadcast
                                         - Enterprise audit log
```

### Walk-in Customer Handling
1. Receptionist or staff clicks `[ + Walk-in Ticket ]` in the Organization Web dashboard (`LiveQueue.tsx`).
2. Staff selects the branch service, enters optional customer name and phone number.
3. The backend (`POST /api/queues/walk-in`) assigns or links a customer profile with `role: CUSTOMER`.
4. Invokes the exact same `queueService.joinQueue(customer.id, queueId)`.
5. Emits `queue_updated` on room `queue_${queueId}` so all staff screens, customer mobile apps, and public displays update instantly in real time.

---

## 4. QR Code & Deep-Linking Architecture

### QR Code Formats
QueueLess generates two types of QR codes from the organization dashboard:

1. **Branch QR Standee**:
   - URL: `https://queueless.app/join/BRANCH_QR_CODE`
   - Custom Deep Link: `queueless://join/BRANCH_QR_CODE`
   - Scanned on mobile: Resolves branch details, lists all active branch services.
2. **Direct Service QR**:
   - URL: `https://queueless.app/join/SERVICE_UUID`
   - Custom Deep Link: `queueless://join/SERVICE_UUID`
   - Scanned on mobile: Directly navigates to the selected service with instant `[ Join Queue ]` CTA.

### QR Code Resolution Flow
```
User Scans QR Code
       │
       ▼
[qrParser.ts] ──► Extracts token (queueless://, https://, or raw)
       │
       ▼
[GET /api/organizations/resolve-qr/:token]
       │
       ├─► Matches Branch.qrCodeId or Branch.id ──► Returns { type: 'BRANCH', branch, services }
       │
       └─► Matches Service.id ──────────────────► Returns { type: 'SERVICE', service, branch, queueId }
```

### Fallback Landing Page (`/join/:token`)
If a customer scans a QR code using their phone's native camera without having the mobile app installed:
1. Opens `https://queueless.app/join/:token` on their mobile browser (`apps/web/src/pages/JoinRedirect.tsx`).
2. The page detects mobile browser and attempts to trigger `queueless://join/:token`.
3. If the app is not installed, displays a branded landing view showing the institution, branch, and service details with:
   - `[ Open in QueueLess App ]`
   - `[ Install Customer App ]`
   - `[ Continue on Mobile Web ]`

---

## 5. Live Queue Tracking & Real-Time Sync

### State Machine Lifecycle
The customer mobile app reflects the exact backend queue state machine:
```
WAITING ───► CALLING ───► SERVING ───► COMPLETED
   │            │
   ▼            ▼
CANCELLED    SKIPPED / ABSENT
```

### Real-Time Update Strategy
1. **Socket.io Connection**:
   - Customer app connects to server and joins room `queue_${queueId}`.
   - Listens for `queue_updated` events (`USER_JOINED`, `USER_CALLED`, `USER_SERVING`, `USER_COMPLETED`, `USER_CANCELLED`).
2. **Heartbeat Polling Fallback**:
   - Every 8 seconds, `useQueueSocket` verifies connection and executes a background heartbeat poll to guarantee zero desynchronization over cellular networks or background suspension.
3. **Customer Alerting**:
   - When status transitions from `WAITING` to `CALLING`, `notificationService.notifyTicketCalled` sounds a notification: *"You're Next! Ticket A-014 has been called. Please proceed to the service desk."*
   - When queue reaches 2 people ahead, proximity warning triggers to prepare the customer.

---

## 6. Security & Tenant Isolation

1. **Role Enforcement**:
   - Mobile authentication restricts registration strictly to `role: CUSTOMER`.
   - Administrative, staff, and branch manager endpoints reject `CUSTOMER` JWTs with `403 Forbidden`.
2. **IDOR & Data Boundary Protection**:
   - Customers can only access their own active tickets (`/api/queues/my-active`) and history (`/api/queues/my-history`) derived securely from the authenticated token's `req.user.id`.
   - Cancellation requests (`/api/queues/entry/:id/cancel`) verify that the requesting user owns the entry or has staff branch privileges.
3. **Public QR Non-Sensitivity**:
   - Public QR endpoints (`/api/organizations/resolve-qr/:code`) return only public branch metadata, operating hours, and active service names. Internal staff notes, manager IDs, and user records are strictly excluded.

---

## 7. Environment Configuration

### Mobile Configuration (`apps/mobile`)
Configured via `EXPO_PUBLIC_API_URL`:
- Local Dev (Android Emulator): `http://10.0.2.2:5000/api`
- Local Dev (iOS Simulator / Web): `http://localhost:5000/api`
- Production / Staging: `https://api.queueless.app/api`

### Web Configuration (`apps/web`)
Configured via `REACT_APP_API_URL`:
- Default: `http://localhost:5000/api`

---

## 8. Verification & Execution Checklist

- [x] Backend QR resolution endpoint (`GET /api/organizations/resolve-qr/:code`)
- [x] Staff Walk-in Ticket endpoint (`POST /api/queues/walk-in`)
- [x] Backend automated unit tests passing (`walkInAndQr.test.ts`)
- [x] Organization Web Walk-In Ticket Modal (`WalkInTicketModal.tsx`)
- [x] Organization Web QR Code Manager Modal (`QrCodeManagerModal.tsx`)
- [x] Deep-link web landing fallback page (`/join/:token` in `JoinRedirect.tsx`)
- [x] Dedicated Customer Mobile App directory (`apps/mobile`)
- [x] Customer Auth screens (Login, Register, Forgot Password)
- [x] Customer Home dashboard with active ticket and organization discovery
- [x] Live Queue Ticket tracker with real-time Socket.io and polling sync
- [x] Customer Appointment booking and management screens
- [x] Camera QR Scanner with manual code entry fallback
- [x] Mobile QR Parser with unit tests (`qrParser.test.ts`)
- [x] Production builds passing for Web and Backend
