# QueueLess — Codebase Implementation Audit & Status Report

**Date**: September 2026  
**Auditor**: Senior Lead Full-Stack Architect  
**Project**: QueueLess (Enterprise Multi-Tenant Queue Management & Appointment Platform)

---

## 1. Executive Summary

QueueLess is structured as a multi-tenant web application aimed at public and private branch operations (banks, clinics, public service centers). 

The codebase currently represents an **early functional prototype / initial MVP slice** focused mostly on a single-staff member managing a branch queue. While core foundational technologies (Node.js/Express, React 19, Prisma ORM, Socket.io, Tailwind CSS) are appropriately selected, the platform currently suffers from **critical architectural gaps**:
1. **No Real Tenant Isolation**: Multi-tenancy is only modeled partially in the schema (`Organization` -> `Branch`), but data queries do not enforce tenant boundaries or verify ownership. A user or staff member can query/modify queues, branches, and appointments belonging to other organizations.
2. **Missing Roles**: Organization Owner/Admin (`ORG_ADMIN`) is missing from both the database enum and the types. Staff and Branch Managers are loosely coupled.
3. **Privilege Escalation Security Flaw**: `/api/auth/register` permits incoming payloads to specify arbitrary roles (`SUPER_ADMIN`), allowing any user to take full platform control.
4. **Queue Concurrency & Race Conditions**: Ticket positions are generated using naive `findFirst` + 1 without database transactions or locks. Under concurrent traffic, duplicate positions and collision will occur.
5. **Incomplete Queue State Machine**: Ticket progression only supports `WAITING -> CALLING -> COMPLETED`. There is no support for `START SERVING`, `CANCELLED`, `SKIPPED`, or `NO_SHOW`.
6. **No Double-Booking Guards**: Appointment booking does not check branch operating hours, service duration, or slot overlaps.
7. **Single-Perspective UI**: The frontend is built entirely as a "Staff Portal" for branch staff. Customer booking/ticketing experiences, Organization Admin portals, and Super Admin consoles are missing. Dashboard charts and activity feeds contain hardcoded mock statistics.

---

## A. Current Architecture

### Frontend Architecture
- **Framework**: React 19 SPA bootstrapped with `react-scripts` (5.0.1).
- **Routing**: `react-router-dom` (v7.17.0) with client-side protected route wrapping.
- **State Management & Data Fetching**: `@tanstack/react-query` (v5.101.0) for caching, query invalidation, and async mutations.
- **Styling**: Tailwind CSS (v3.4.17) with PostCSS and Lucide React icons.
- **Real-Time Client**: `socket.io-client` (v4.8.3) listening on queue room events (`queue_updated`).
- **Auth Client**: React Context (`AuthProvider` in `useAuth.tsx`) storing JWT in `localStorage`.

### Backend Architecture
- **Framework**: Express 5 (`5.2.1`) in TypeScript running via `ts-node-dev` in development and `tsc` for builds.
- **API Pattern**: Layered REST controllers (`/src/controllers`) delegating to services (`/src/services`) querying Prisma.
- **Real-Time Server**: `socket.io` (v4.8.3) attached to the Express HTTP server with room-based pub/sub (`queue_${queueId}`).
- **Authentication**: Stateless JSON Web Tokens (JWT) signed using `jsonwebtoken` and salted password hashing with `bcryptjs`.
- **Payment Processing**: Paystack integration skeleton in `paymentService.ts`.

### Database & ORM
- **Database**: MariaDB / MySQL accessed via `@prisma/adapter-mariadb` and `@prisma/client` 7.x.
- **Schema Location**: `apps/backend/prisma/schema.prisma`.

### Multi-Tenancy Design (Current State)
- Currently **logical / row-level** via foreign keys, but **severely incomplete**:
  - `Organization` has many `Branch`es.
  - `Branch` has many `Service`s, `Queue`s, `Appointment`s.
  - `User` has `staffBranchId` and `managedBranches`, but **no direct `organizationId` link**.
  - No tenant-scoping middleware exists. All controller queries accept IDs directly from URL params or request bodies without verifying that the requesting user's tenant owns that resource.

---

## B. Implemented Features Checklist

| Feature | Status | Notes |
| :--- | :---: | :--- |
| **Authentication & Profile** | | |
| User Registration | ⚠️ Broken | Insecure: permits `role: SUPER_ADMIN` in body. Second endpoint `/api/users/register` skips password hashing. |
| User Login (JWT) | ✅ Complete | Validates email/bcrypt password hash; returns 7-day JWT. |
| User Profile Management | 🟡 Partially implemented | Basic get/update profile exists; lacks tenant awareness and role guards. |
| **Multi-Tenancy & Organizations** | | |
| Create Organization | 🟡 Partially implemented | API exists restricted to `SUPER_ADMIN`; no UI; no Org Owner assignment. |
| View Organization List | 🟡 Partially implemented | Returns all organizations in database without tenant filtering. |
| Organization Admin Access | 🔴 Missing | No `ORG_ADMIN` role; no organization-level settings/management. |
| **Branch Management** | | |
| Create Branch | 🟡 Partially implemented | API exists (`POST /api/organizations/:orgId/branch`), but no UI. |
| View / Edit Branch Details | ✅ Complete | Settings page allows updating name, location, geofence radius. |
| Operating Hours Configuration | 🔴 Missing | Schema and API have no concept of branch hours or active schedules. |
| Staff Assignment to Branch | 🔴 Missing | No interface or endpoint to add/remove staff from a branch. |
| **Service Management** | | |
| Service Catalog & CRUD | 🔴 Missing | Services can only be seeded or created during initial branch creation. |
| Service Activation / Deactivation | 🔴 Missing | No `isActive` flag in schema or API. |
| **Queue Management** | | |
| Customer Join Queue | 🟡 Partially implemented | API exists (`POST /api/queues/join`); no Customer UI; prone to race conditions. |
| Ticket Assignment | 🟡 Partially implemented | Incremental integer position; lacks alphanumeric ticket format (e.g., A-101). |
| Call Next Customer | ✅ Complete | Sets status to `CALLING`; updates timestamp and emits socket event. |
| Start Serving / In Service | 🔴 Missing | State machine skips directly from `CALLING` to `COMPLETED`. |
| Complete Service | ✅ Complete | Marks entry `COMPLETED` and notifies socket room. |
| Skip / No Show / Cancel Ticket | 🔴 Missing | Not implemented in service or UI. |
| Centralized State Machine | 🔴 Missing | Statuses are updated as raw strings in individual service functions. |
| **Appointment System** | | |
| Book Appointment | 🟡 Partially implemented | Raw creation API; lacks conflict detection and slot verification. |
| Double-Booking Prevention | 🔴 Missing | No validation preventing concurrent or overlapping bookings. |
| View Branch Appointments | ✅ Complete | Staff can view appointments by date in the UI. |
| Confirm / Cancel Appointment | ✅ Complete | Status transitions functional in UI. |
| Reschedule Appointment | 🔴 Missing | Not implemented. |
| **Dashboards & Portals** | | |
| Staff Dashboard Overview | 🟡 Partially implemented | Stats and charts use hardcoded mock numbers and fake activity feed. |
| Customer Mobile/Web Dashboard | 🔴 Missing | Customer has no dedicated UI to view active ticket or position. |
| Admin / Analytics Dashboard | 🔴 Missing | No tenant admin dashboard or real metrics calculations. |

---

## C. Database Status (Prisma Models & Relationships)

### Existing Models in `schema.prisma`:
1. **`User`**:
   - Fields: `id`, `email`, `passwordHash`, `fullName`, `role` (enum), profile details, `staffBranchId`.
   - Relations: `queueEntries`, `appointments`, `payments`, `managedBranches` (BranchManager relation), `staffBranch` (StaffBranch relation).
   - **Gap**: Missing direct `organizationId` for Tenant Admins / Org Staff.
2. **`Organization`**:
   - Fields: `id`, `name`, `type`, `description`, `logo`, `createdAt`, `updatedAt`.
   - Relations: `branches`.
   - **Gap**: No relationship to `User` for organization-level owners/admins.
3. **`Branch`**:
   - Fields: `id`, `organizationId`, `name`, `location`, `latitude`, `longitude`, `geofenceRadius`, `qrCodeId`.
   - Relations: `organization`, `services`, `queues`, `appointments`, `managers` (User[]), `staff` (User[]).
   - **Gap**: Lacks `isActive`, operating hours, and contact details.
4. **`Service`**:
   - Fields: `id`, `branchId`, `name`, `description`, `duration`, `price`.
   - Relations: `branch`, `queues`, `appointments`.
   - **Gap**: Lacks `isActive` flag and organization-wide service templates.
5. **`Queue`**:
   - Fields: `id`, `branchId`, `serviceId`, `status` (OPEN/CLOSED).
   - Relations: `branch`, `service`, `entries` (`QueueEntry[]`).
6. **`QueueEntry`**:
   - Fields: `id`, `queueId`, `userId`, `position`, `status` (`WAITING`, `CALLING`, `COMPLETED`, `SKIPPED`, `ABSENT`), `joinedAt`, `calledAt`, `completedAt`.
   - Relations: `queue`, `user`.
   - **Gap**: Needs ticket number representation (e.g. `ticketNumber: String`), `servingAt` timestamp, and safe state machine.
7. **`Appointment`**:
   - Fields: `id`, `userId`, `branchId`, `serviceId`, `scheduledTime`, `status` (`PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`), `notes`.
   - Relations: `user`, `branch`, `service`.
8. **`Payment`**:
   - Paystack transaction tracking.

### Missing Core Models / Fields:
- **`AuditLog`**: Required for enterprise compliance, tracking all administrative and queue interventions.
- **`OperatingHours`**: For branch opening/closing schedules and slot generation.
- **`Notification`**: System notifications for ticket calls, reminders, and cancellations.

---

## D. Authentication & Authorization Review

1. **Authentication Flow**:
   - Handled via `POST /api/auth/login`. Client sends email and password. Server verifies `bcrypt` hash and generates a 7-day JWT containing `{ id, email, role }`.
2. **Authorization Enforcement**:
   - Express middleware `authenticate` verifies token.
   - `authorize(roles: string[])` checks if `req.user.role` is in the allowed array.
   - **Flaw**: Route authorization checks role strings, but does **not** check tenant or branch ownership. A `BRANCH_MANAGER` from Org A can modify branches belonging to Org B by sending a `PUT /api/organizations/branch/:branchId`.
3. **Tenant Isolation**:
   - Currently **non-existent at the query layer**. Any authenticated user who knows or guesses a UUID can access or alter foreign records.
4. **Privilege Escalation**:
   - Critical vulnerability in `authController.register`: `role: req.body.role || 'CUSTOMER'` allows client-controlled elevation to `SUPER_ADMIN`.

---

## E. Queue System Deep Dive

- **Ticket Generation**:
  ```typescript
  const lastEntry = await prisma.queueEntry.findFirst({
    where: { queueId },
    orderBy: { position: 'desc' },
  });
  const nextPosition = (lastEntry?.position || 0) + 1;
  ```
  - **Issue**: Highly vulnerable to concurrency race conditions. If two users join simultaneously, both read the same `lastEntry`, leading to duplicate positions.
  - Needs: Database transaction (`prisma.$transaction`) with serializable isolation or atomic sequence locking.
- **State Machine**:
  - Missing `SERVING` status.
  - Missing `SKIPPED` and `CANCELLED` actions for staff and customers.
  - Missing position recalculation / live wait-time estimations based on active counters.

---

## F. Appointment System Deep Dive

- **Booking Logic**:
  - Direct insert into `prisma.appointment.create`.
  - **Issue**: No check for overlapping appointments for the same service/branch/staff.
  - **Issue**: No validation against operating hours or past dates.
  - **Issue**: No cancellation rules or customer rescheduling mechanism.

---

## G. Production Readiness & Identified Bugs

1. **Security**:
   - Unauthenticated privilege escalation in user registration.
   - Complete absence of IDOR protection and cross-tenant boundary verification.
   - Unsanitized error messages returning stack traces or internal failures.
2. **Validation**:
   - No schema validation library (e.g., Zod) on API request bodies.
   - Missing input length and format constraints.
3. **UI / Aesthetics**:
   - Hardcoded statistics in Staff Dashboard (`appointments: 0`, `served: 0`, fake activity feed).
   - Missing Customer Portal view (join queue, live queue position tracker, book appointment).
   - Missing Admin Management UI (manage branches, services, staff).
4. **Database & Transactions**:
   - Lack of atomic transactions on critical queue transitions.
   - Lack of tenant indices for fast tenant-scoped queries.

---

# Phase 1 Implementation Plan

We now immediately proceed to implementing **Phase 1: Solid Foundation**:

1. **Multi-Tenancy & Permissions**:
   - Introduce `ORG_ADMIN` role and proper hierarchy (`SUPER_ADMIN`, `ORG_ADMIN`, `BRANCH_MANAGER`, `STAFF`, `CUSTOMER`).
   - Add `organizationId` to `User` and `Service`.
   - Create centralized tenant verification utilities (`validateTenantAccess`, `getTenantScope`).
   - Fix privilege escalation in `register` (lock role to `CUSTOMER` unless invoked by an authorized admin).
2. **Database Schema Enhancements**:
   - Safely update `Role` enum to include `ORG_ADMIN`.
   - Add `ticketNumber` (e.g., `A-001`), `servingAt` to `QueueEntry`.
   - Add `AuditLog` model to track operations.
   - Add `isActive` flags to `Branch` and `Service`.
3. **Queue Engine Hardening**:
   - Implement safe database transaction with concurrency lock for queue ticket creation.
   - Build formal queue state machine (`WAITING -> CALLED -> SERVING -> COMPLETED`, with `SKIPPED`, `CANCELLED`, `NO_SHOW`).
   - Implement staff actions: `CALL_NEXT`, `START_SERVING`, `COMPLETE`, `SKIP`, `CANCEL`.
4. **Appointment Hardening**:
   - Implement conflict detection (prevent double-booking same slot/service).
   - Add slot availability calculations.
5. **Real Database Metrics**:
   - Implement backend analytics service returning true counts for branches, queues, waiting customers, appointments, and activity logs.
6. **Frontend Dashboards & Portals**:
   - Fix `Dashboard.tsx` to display real database metrics and live activity.
   - Add full Customer Queue & Booking experience (customer can view ticket, position in real time).
   - Add Organization & Branch management views.
   - Ensure clean, responsive UI with robust loading, empty, and error states.

---

# Phase 2 Implementation & Status Report

**Status**: Completed  
**Milestone**: Customer Mobile App + QR / Deep-Link Architecture + Converged Walk-In Queue Engine

### 1. Dedicated Customer Mobile App (`apps/mobile`)
- **Technology**: React Native + Expo + TypeScript + Expo Router.
- **Role Isolation**: Strictly customer-facing (`role: CUSTOMER`). Customers cannot access organization admin/staff features.
- **Authentication**:
  - Customer login with credential validation & fast demo account autofill.
  - Customer registration (strictly locked to `CUSTOMER` role).
  - Password recovery guidance.
  - Session persistence via `@react-native-async-storage/async-storage`.
- **Navigation & Screens**:
  - Bottom tab navigation: Home, Queues, Appointments, History, Profile.
  - `home.tsx`: Greeting, quick actions (`[ Join Queue ]`, `[ Book Appointment ]`, `[ Scan QR Code ]`), active ticket card with people ahead & wait time, upcoming appointment summary, organization discovery.
  - `queue.tsx`: Live active tickets and queue status tracker.
  - `appointments.tsx`: Active and upcoming booked visits with reschedule and cancellation.
  - `history.tsx`: Complete chronological log of completed tickets and past appointments.
  - `profile.tsx`: Account credentials, customer ID, app version, and secure sign-out.
- **Discovery & Guided Flows**:
  - Organization profiles (`organization/[organizationId].tsx`).
  - Branch details & service catalogs (`branch/[branchId].tsx`).
  - Service details (`service/[serviceId].tsx`).
  - Step-by-step queue join wizard (`queue/join.tsx`).
  - Interactive live queue tracker (`queue/[ticketId].tsx`) with real-time Socket.io updates and heartbeat polling fallback.
  - Appointment booking wizard (`appointment/book.tsx`) with slot selection.
  - Appointment details and management (`appointment/[appointmentId].tsx`).

### 2. QR Code & Deep-Linking System
- **Deep Linking**: Configured scheme `queueless://join/:token` and production web URL `https://queueless.app/join/:token`.
- **Camera QR Scanner**: In-app QR scanner (`apps/mobile/app/scan.tsx`) with camera permissions handling and manual code entry fallback.
- **Multi-Format Parser**: `qrParser.ts` parses custom schemes, HTTPS URLs, and raw tokens, with comprehensive unit tests (`qrParser.test.ts`).
- **Web Fallback Landing**: Mobile web landing page (`/join/:token` in `apps/web/src/pages/JoinRedirect.tsx`) for users scanning with native camera without the mobile app installed, offering instant app launch, app install, or mobile web continue.
- **Public Backend Resolver**: `GET /api/organizations/resolve-qr/:code` safely resolves branch and service codes into navigation payloads without exposing sensitive staff data.

### 3. Converged Walk-In Queue Integration
- **Staff Walk-in Modal**: `WalkInTicketModal.tsx` in `apps/web/src/pages/LiveQueue.tsx`.
- **Same Queue Engine**: Backend `POST /api/queues/walk-in` assigns a customer profile and invokes the exact same `queueService.joinQueue()` transaction, ensuring identical sequential ticket numbers (e.g., `A-014`), wait-time calculations, and WebSocket room broadcasts.
- **Zero Parallel Systems**: Mobile customers, QR scans, and staff walk-in tickets all share the identical state machine and database models.

### 4. Organization Web QR Management
- **QR Code Manager Modal**: `QrCodeManagerModal.tsx` added to `apps/web/src/pages/LiveQueue.tsx`.
- Allows organization managers and staff to view, copy deep links, download PNG standees, and print official QR codes for the branch or individual services.

### 5. Automated Tests & Quality Checks
- **Backend Tests**: 6 test suites (39 tests) passing:
  - `queueService.test.ts`
  - `userService.test.ts`
  - `organizationService.test.ts`
  - `appointmentService.test.ts`
  - `walkInAndQr.test.ts`
  - `serviceQueueAndProfile.test.ts`
- **Mobile Tests**: `qrParser.test.ts` (4 tests passing)
- **Web Production Build**: `npm run build -w apps/web` compiling cleanly (0 errors).
- **Backend Production Build**: `npm run build -w apps/backend` compiling cleanly (0 errors).
- **Documentation**: Comprehensive architecture specifications published in `QUEUELESS_MOBILE_ARCHITECTURE.md` and `README.md`.

---

# Phase 3 Implementation & Status Report

**Status**: Completed  
**Milestone**: Service-Specific QR Mapping, Web QR Management Dashboard, Mobile Direct Scan Flow, Login Visibility UX, and Clean Customer Test Data

---

### 1. Architectural Foundation: 1:1 Service QR Mapping
- **Rule**: Every QR code generated on QueueLess is permanently bound to exactly **one specific service desk** (`serviceId` is strictly required).
- **No Service Picker Step**: When a customer scans a desk standee QR code, the app identifies the organization, branch, and exact service desk, routing them directly to `/service/:serviceId` with the token. The customer is **never** presented with a *"Which service do you want?"* selection screen.
- **Visual On-Site Confirmation**: The service screen prominently displays:
  `[ SCANNED VIA SERVICE QR CODE ]` with a stylized QR icon.

---

### 2. Decoupled Service Queue vs QR Code Lifecycles
- **Service Queue State** (`OPEN` / `CLOSED`): Controls whether the service desk is actively accepting new customers. Controlled via the Staff Queue Toggle.
- **QR Code State** (`ACTIVE` / `EXPIRED` / `REVOKED`): Controls whether the physical printed standee token is valid for on-site scanning.
- **Decoupling Guarantee**:
  - Revoking or expiring a QR code **never** closes the underlying service desk queue.
  - If a QR code is revoked, in-app customers can still join the queue manually, and currently waiting/serving customers are unaffected.
  - If the service queue is marked `CLOSED`, both QR scan and manual joins are prevented, with an informative notice: *"Queue Currently Closed: Existing customers are still being served. Please try again later."*

---

### 3. Backend Implementation & Real Database Tracking
All QR generation, retrieval, statistics, revocation, and validation use **real database records** with zero mock data:

1. **Prisma Schema Enhancement**:
   - `QRCode` model extended with `revokedBy String?` to track which staff member revoked a standee.
2. **Endpoints Implemented & Tested**:
   - `POST /api/organizations/branch/:branchId/qr`:
     - Requires `serviceId` and `branchId`.
     - Configurable expiration (`12_HOURS`, `24_HOURS`, `7_DAYS`, `30_DAYS`, or permanent).
     - Generates crypto-random token (`crypto.randomBytes(16).toString('hex')`).
     - Logs `QR_CREATED` to `AuditLog`.
   - `GET /api/organizations/branch/:branchId/qr-stats`:
     - Computes real DB counts: `totalGenerated`, `activeCount`, `expiredCount`, `revokedCount`.
     - Generates service breakdown array: `serviceBreakdown: [{ serviceId, serviceName, activeCount, totalCount, hasActiveQr }]`.
   - `GET /api/organizations/branch/:branchId/qr-list`:
     - Returns all QR codes for the branch with service and branch relations.
     - Dynamically checks expiration against `expiresAt`.
   - `POST /api/organizations/qr/:qrId/revoke`:
     - Sets `status: 'REVOKED'`, `revokedAt: new Date()`, `revokedBy: user.email`.
     - Logs `QR_REVOKED` to `AuditLog`.
   - `GET /api/organizations/resolve-qr/:code`:
     - Validates token against 11 security rules: existence, active branch, active org, revocation status, expiration window, and service binding.
     - Returns `{ type: 'SERVICE', qrCode: {...}, organization: {...}, branch: {...}, service: { ..., isQueueOpen } }`.
     - Logs `QR_SCANNED` and `QR_EXPIRED` to `AuditLog`.
   - `POST /api/queues/join` (with `qrToken`):
     - Validates `qrToken` if provided: verifies active status, non-expired, matches target service desk, and queue is OPEN.
     - Logs `QR_JOIN_SUCCESS` or `QR_JOIN_REJECTED` in `AuditLog`.

---

### 4. Web QR Management Dashboard (`apps/web/src/pages/QrManagement.tsx`)
Accessible via `/qr-management` in the web application:
- **Summary Metrics Cards**: High-contrast counters for Total Generated, Active QRs, Expired QRs, and Revoked QRs.
- **Service Breakdown Table**:
  `| Service Name | Active QR Code | Total QRs Generated | QR Coverage Status |`
  Includes quick buttons to generate replacement QRs for unrepresented services.
- **Active QR Standees Gallery**:
  - Live visual standee preview cards styled like official desk standees.
  - Interactive actions: **Preview High-Res Standee**, **Download PNG** (rendered client-side via HTML5 canvas), **Print Standee**, **Copy Deep Link**, and **Revoke QR Code**.
- **QR Generator Modal**:
  - Service selection dropdown populated from real branch services.
  - Configurable validity selector (`12 Hours`, `24 Hours`, `7 Days`, `30 Days`, `No Expiration`).
  - Prominent **QR Destination Confirmation Banner** showing exact target service desk.
- **Complete QR History**:
  - Search by token or service name.
  - Filter by Service and Status (`ALL`, `ACTIVE`, `EXPIRED`, `REVOKED`).
  - Detailed audit table showing creation timestamp, expiration, revocation metadata, and replacement generator shortcuts.

---

### 5. Mobile Scan & Direct Navigation Flow (`apps/mobile`)
- **Direct Service Routing** (`app/scan.tsx`):
  - On barcode scan or manual token entry, resolves token via `organizationApi.resolveQr(token)`.
  - Immediately navigates to `/service/:serviceId?qrToken=:token` — zero intermediate prompts.
- **Service Desk Screen** (`app/service/[serviceId].tsx`):
  - Displays `[ SCANNED VIA SERVICE QR CODE ]` badge when `qrToken` is present.
  - Passes `qrToken` to `queueApi.joinQueue(queueId, { qrToken })`.
  - Clearly explains queue closure if desk is closed.
- **Error Handling & Manual Fallback**:
  - If a QR is expired or revoked, shows a clear alert dialog (`QR Code Expired` / `QR Code Revoked`).
  - Provides a **"Browse Services Manually"** button that redirects customers smoothly to the in-app queue directory (`/queue/join`).

---

### 6. Login & Register Password Visibility UX
- Implemented on:
  - Web Login (`apps/web/src/pages/Login.tsx`)
  - Mobile Login (`apps/mobile/app/(auth)/login.tsx`)
  - Mobile Registration (`apps/mobile/app/(auth)/register.tsx`)
- Interactive `Eye` / `EyeOff` toggle button.
- Clean touch targets with `hitSlop` and accessible labeling.
- Passwords remain masked by default, and toggle strictly alters `type="password" <-> "text"` / `secureTextEntry={!showPassword}` without modifying input values.

---

### 7. Clean Customer Test Accounts
Per testing requirements, **all 10 customer accounts are seeded with 0 active tickets and 0 pre-joined queues**:

| Email | Full Name | City / Region | Phone | Password | Seeded Queue State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `customer@queueless.com` | Abena Osei | Accra, Greater Accra | `+233 24 100 0001` | `password123` | **Clean (0 Tickets)** |
| `customer1@queueless.com` | Kwame Mensah | Kumasi, Ashanti | `+233 20 100 0002` | `password123` | **Clean (0 Tickets)** |
| `customer2@queueless.com` | Fatima Al-Hassan | Tamale, Northern | `+233 26 100 0003` | `password123` | **Clean (0 Tickets)** |
| `customer3@queueless.com` | David Tetteh | Tema, Greater Accra | `+233 54 100 0004` | `password123` | **Clean (0 Tickets)** |
| `customer4@queueless.com` | Esi Annan | Takoradi, Western | `+233 50 100 0005` | `password123` | **Clean (0 Tickets)** |
| `customer5@queueless.com` | Emmanuel Sowah | Cape Coast, Central | `+233 27 100 0006` | `password123` | **Clean (0 Tickets)** |
| `customer6@queueless.com` | Akosua Agyemang | Sunyani, Bono | `+233 28 100 0007` | `password123` | **Clean (0 Tickets)** |
| `customer7@queueless.com` | Kofi Boateng | Koforidua, Eastern | `+233 55 100 0008` | `password123` | **Clean (0 Tickets)** |
| `customer8@queueless.com` | Zainab Musah | Ho, Volta | `+233 59 100 0009` | `password123` | **Clean (0 Tickets)** |
| `customer9@queueless.com` | Yaw Ofori | Bolgatanga, Upper East | `+233 23 100 0010` | `password123` | **Clean (0 Tickets)** |

---

### 8. Verification & Quality Metrics
- **Backend Tests**: 6 test suites passing (39 tests total):
  - `serviceQueueAndProfile.test.ts`: Added tests for `getBranchQrStats`, QR validation in `joinQueue`, expired token rejection, and revoked token error messages.
- **Mobile TypeScript & Tests**:
  - `npx tsc --noEmit -p apps/mobile/tsconfig.json`: **0 errors**.
  - `npm test -w apps/mobile`: **4 tests passing** (`qrParser.test.ts`).
- **Web Production Build**:
  - `npm run build -w apps/web`: **Compiled successfully with 0 errors**.
- **Backend Production Build**:
  - `npm run build -w apps/backend`: **Compiled successfully with 0 errors**.
