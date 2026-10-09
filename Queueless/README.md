# QueueLess — Enterprise Multi-Tenant Queue & Appointment Platform

QueueLess is a production-grade, multi-tenant queue management and appointment booking platform engineered for banks, specialist hospitals and diagnostic centers, government civic agencies (DVLA & Passports), and telecommunication customer experience centers.

---

## 🚀 Quick Access & Web Endpoints

| Application Surface | Local URL | Description |
| :--- | :--- | :--- |
| **Web Portal** | [http://localhost:3000](http://localhost:3000) | Main customer, staff, branch manager, and admin portal |
| **Customer Portal** | [http://localhost:3000/customer-portal](http://localhost:3000/customer-portal) | Virtual queue tickets, dynamic booking, and visit history |
| **Lobby TV Display** | [http://localhost:3000/display](http://localhost:3000/display) | Fullscreen TV waiting hall display with audio chimes |
| **REST API Server** | [http://localhost:5000](http://localhost:5000) | Express, Prisma ORM, and Socket.io server |
| **API Health Check** | [http://localhost:5000/health](http://localhost:5000/health) | System health & database connectivity check |

---

## 🔑 Platform Authentication & Security

> [!NOTE]
> **Confidential Credentials**: Test accounts and administrative credentials are kept in your local environment file (`QUEUELLESS_CREDENTIALS.local.md`) on your workstation and are never published to GitHub.
> Refer to your local `QUEUELLESS_CREDENTIALS.local.md` file for full administrative matrices and tenant logins.

---

## 📱 Service-Specific QR Code Architecture & QR Management

### 1. The 1:1 Service QR Guarantee
In QueueLess, **every QR code is permanently bound to exactly one specific service desk**.
- **Nexus Telecom Example**:
  - `QR Code A` $\rightarrow$ Smartphone Diagnosis & Repairs
  - `QR Code B` $\rightarrow$ SIM Registration & Swaps
  - `QR Code C` $\rightarrow$ Fiber Broadband Setup
- **No Ambiguous Service Selection**: Scanning a service QR code **never** prompts the customer: *"Which service do you want?"*. The app resolves the QR token directly into the target service desk and displays the service name, branch, estimated duration, and a prominent badge:
  `[ SCANNED VIA SERVICE QR CODE ]`.

### 2. Dual Join Flows
QueueLess cleanly supports two complementary customer entry methods that converge on the exact same queue engine:
1. **Flow A — In-Person QR Scan**:
   - Customer physically visits the branch and scans the official desk standee.
   - App resolves security token $\rightarrow$ opens the exact service $\rightarrow$ customer clicks **Join Live Queue**.
   - The verified `qrToken` is attached to the join request and audited as a verified on-site visit (`QR_JOIN_SUCCESS`).
2. **Flow B — Remote In-App Service Discovery**:
   - Customer opens QueueLess from anywhere, browses organizations, selects a branch, and chooses a service.
   - If the queue is open, customer clicks **Join Live Queue** (or **Book Appointment Instead**).
   - Joins the same unified queue with sequential ticket numbering and real-time wait-time estimation.

### 3. QR Management Dashboard (`/qr-management`)
Accessible to Branch Managers and Organization Admins:
- **Summary Cards**: Real database counts for Total Generated, Active QRs, Expired QRs, and Revoked QRs.
- **Service Breakdown Table**:
  `| Service Name | Active QR Code | Total QRs Generated | QR Coverage Status |`
- **Active QR Standees Gallery**: Visual high-contrast counter cards with instant **Print Standee**, **Download PNG**, **Copy Deep Link**, and **Revoke QR Code**.
- **QR Generator Modal**: Allows staff to generate new service standees with configurable validity windows (12 hours, 24 hours, 7 days, 30 days, or permanent). Features a prominent **QR Destination Confirmation Banner** preventing accidental misassignments.
- **Complete QR History Log**: Filterable by service and status (`ACTIVE`, `EXPIRED`, `REVOKED`) with full audit timestamps.

### 4. Decoupled Queue Status vs QR Status
- **Revoking or Expiring a QR Code**: Marks the physical standee token as inactive (`REVOKED` / `EXPIRED`). Scanning it displays a friendly error dialog with an instant option: **"Browse Services Manually"**.
- **Underlying Service Queue Remains Open**: Revoking a standee does **not** close the desk queue. In-app customers can continue joining manually, and existing tickets continue being served without disruption.
- **Queue Closure**: Controlled independently by staff via the Queue toggle. If a queue is `CLOSED`, customers are clearly informed: *"Queue Currently Closed: Existing customers are still being served. Please try again later."*

### 5. Login & Register Password Visibility UX
- Both **Web Portal** and **Customer Mobile App** include an interactive eye icon toggle (`Eye` / `EyeOff`) on all password and confirm-password fields.
- Allows customers and staff to verify credentials before submission while strictly preserving character values without exposing them in unmasked form by default.

---

## 🖥️ Feature Tour & Testing Guide

### 1. Clean Testing with Seeded Customer Accounts
1. Open the mobile app or web portal and sign in with a seeded customer account from your local `QUEUELLESS_CREDENTIALS.local.md`.
2. Observe 0 pre-joined tickets in the clean queue dashboard.
3. Test Flow A (QR Scan): Scan any service standee token from `/qr-management`. Observe instant navigation directly into that service with `[ SCANNED VIA SERVICE QR CODE ]`.
4. Click **Join Live Queue** $\rightarrow$ receive sequential ticket number (e.g., `T-001`).
5. In another window, log in as counter staff $\rightarrow$ see the ticket appear in real time $\rightarrow$ click **Call Next** $\rightarrow$ hear the Web Audio chime.

### 2. QR Code Revocation & Error Handling
1. Log in to the Web Portal as a Branch Manager and navigate to **QR Management** (`/qr-management`).
2. Locate the active QR standee for *Teller Services* and click **Revoke**.
3. Re-scan the revoked QR token on the mobile app or scanner:
   - Notice the friendly prompt: **"QR Code Revoked: This QR code has been closed by the organization."**
   - Click **"Browse Services Manually"** $\rightarrow$ smoothly redirected to the in-app service list.
   - Note that *Teller Services* queue remains OPEN and manual joining works seamlessly.

### 3. TV Waiting Hall Lobby Display
1. Navigate to [http://localhost:3000/display](http://localhost:3000/display).
2. Select any branch from the top-right branch selector (or use direct links like `/display/:branchId`).
3. High-contrast fullscreen view displays the active ticket number, counter service name, upcoming queue list, and automatic audio chime when tickets are called.

### 4. Dynamic Appointment Booking & Rescheduling
1. Log in as a customer account.
2. Go to **`Join Queue / Book Visit`**.
3. Select an organization (e.g. *St. Jude Specialist Hospital*), a branch, and a service.
4. Choose **`Schedule Fixed Appointment`**.
5. Pick a date to see dynamic 30-minute availability slots (past times and double-booked slots are automatically blocked).
6. Confirm booking $\rightarrow$ navigate to **`Appointments`** tab $\rightarrow$ click **`Reschedule`** to choose a new slot.

---

## 🛠️ Project Commands

```bash
# Run all backend unit tests (organization, user, queue, appointment services)
npm test -w apps/backend

# Build backend production bundle
npm run build -w apps/backend

# Build frontend production bundle
npm run build -w apps/web

# Re-seed test customer scenarios anytime
npx ts-node -w apps/backend src/seedCustomerScenarios.ts
```
