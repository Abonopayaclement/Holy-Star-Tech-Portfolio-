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

## 🔑 All Platform Logins & Credentials

> [!IMPORTANT]
> **Default Password**: Unless noted otherwise, the password for **all** Organization Admins, Branch Managers, Counter Staff, and Customers is:
> `password123`

### 1. Global Platform Super Admin

| Email | Password | Role | Description |
| :--- | :--- | :--- | :--- |
| `admin@queueless.com` | `admin123` | `SUPER_ADMIN` | Global platform administration, tenant provisioning, system audit |

---

### 2. Multi-Tenant Organizations & Staff Accounts

#### 🏦 1. Apex Bank Ghana (Banking & Financial Services)
*Retail & Commercial Banking with branches in Airport City & Osu.*

| Email | Password | Role | Branch / Title | Description / Focus |
| :--- | :--- | :--- | :--- | :--- |
| `owner@queueless.com` | `password123` | `ORG_ADMIN` | Apex Bank HQ | Managing Director / Apex Organization Admin |
| `manager@queueless.com` | `password123` | `BRANCH_MANAGER` | Airport City Branch | Branch Manager (One Airport Square) |
| `staff@queueless.com` | `password123` | `STAFF` | Airport City Branch | Senior Cash & Teller Staff |
| `osu.manager@queueless.com` | `password123` | `BRANCH_MANAGER` | Osu Oxford St Branch | Branch Manager (Oxford Street) |
| `osu.staff@queueless.com` | `password123` | `STAFF` | Osu Oxford St Branch | Customer Service & Card Desk |

---

#### 🏥 2. St. Jude Specialist Hospital & Diagnostic Center (Healthcare)
*Outpatient clinic, specialist consultations, well-baby clinic, and diagnostic lab.*

| Email | Password | Role | Branch / Title | Description / Focus |
| :--- | :--- | :--- | :--- | :--- |
| `clinic.admin@queueless.com` | `password123` | `ORG_ADMIN` | St. Jude HQ | Medical Director / Clinic Org Admin |
| `clinic.manager@queueless.com` | `password123` | `BRANCH_MANAGER` | Ridge Medical Pavilion | Head of Clinic (Castle Road, Ridge) |
| `clinic.staff@queueless.com` | `password123` | `STAFF` | Ridge Medical Pavilion | Triage Desk & OPD Nurse |
| `legon.manager@queueless.com` | `password123` | `BRANCH_MANAGER` | East Legon Polyclinic | Polyclinic Lead (Lagos Avenue) |
| `pharmacy.staff@queueless.com` | `password123` | `STAFF` | East Legon Polyclinic | Chief Dispenser & Diagnostic Intake |

---

#### 🚗 3. Driver & Vehicle Licensing Authority (DVLA) (Civic & Government)
*National vehicle roadworthiness inspection, driver licensing, and haulage permits.*

| Email | Password | Role | Branch / Title | Description / Focus |
| :--- | :--- | :--- | :--- | :--- |
| `gov.admin@queueless.com` | `password123` | `ORG_ADMIN` | DVLA National HQ | Director General / Government Org Admin |
| `gov.manager@queueless.com` | `password123` | `BRANCH_MANAGER` | 37 Liberation Rd Center | Regional Supervisor (37 Military Area) |
| `gov.staff@queueless.com` | `password123` | `STAFF` | 37 Liberation Rd Center | Driver Licensing Officer |
| `tema.manager@queueless.com` | `password123` | `BRANCH_MANAGER` | Tema Industrial Center | Harbour Station Lead (Community 1) |
| `tema.staff@queueless.com` | `password123` | `STAFF` | Tema Industrial Center | Vehicle Roadworthiness & Truck Inspector |

---

### 3. Customer Test Accounts (Clean Slates for Verification)

> [!NOTE]
> **Testing Policy (Item 24 & 25)**: All 10 customer accounts have been seeded with **0 active tickets and 0 pre-joined queues (Clean Slate)**. This ensures that live queue joining, QR scanning, ticket progression, and appointment booking can be tested cleanly without interference from automated test entries.

| Email | Full Name | Location | Phone Number | Password | Account Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`customer@queueless.com`** | Abena Osei | Accra, Greater Accra | `+233 24 100 0001` | `password123` | Active Customer (Clean Queue) |
| **`customer1@queueless.com`** | Kwame Mensah | Kumasi, Ashanti | `+233 20 100 0002` | `password123` | Active Customer (Clean Queue) |
| **`customer2@queueless.com`** | Fatima Al-Hassan | Tamale, Northern | `+233 26 100 0003` | `password123` | Active Customer (Clean Queue) |
| **`customer3@queueless.com`** | David Tetteh | Tema, Greater Accra | `+233 54 100 0004` | `password123` | Active Customer (Clean Queue) |
| **`customer4@queueless.com`** | Esi Annan | Takoradi, Western | `+233 50 100 0005` | `password123` | Active Customer (Clean Queue) |
| **`customer5@queueless.com`** | Emmanuel Sowah | Cape Coast, Central | `+233 27 100 0006` | `password123` | Active Customer (Clean Queue) |
| **`customer6@queueless.com`** | Akosua Agyemang | Sunyani, Bono | `+233 28 100 0007` | `password123` | Active Customer (Clean Queue) |
| **`customer7@queueless.com`** | Kofi Boateng | Koforidua, Eastern | `+233 55 100 0008` | `password123` | Active Customer (Clean Queue) |
| **`customer8@queueless.com`** | Zainab Musah | Ho, Volta | `+233 59 100 0009` | `password123` | Active Customer (Clean Queue) |
| **`customer9@queueless.com`** | Yaw Ofori | Bolgatanga, Upper East | `+233 23 100 0010` | `password123` | Active Customer (Clean Queue) |

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

### 1. Clean Testing with the 10 Seeded Customer Accounts
1. Open the mobile app or web portal and sign in with `customer@queueless.com` / `password123`.
2. Observe 0 pre-joined tickets in the clean queue dashboard.
3. Test Flow A (QR Scan): Scan any service standee token from `/qr-management`. Observe instant navigation directly into that service with `[ SCANNED VIA SERVICE QR CODE ]`.
4. Click **Join Live Queue** $\rightarrow$ receive sequential ticket number (e.g., `T-001`).
5. In another window, log in as counter staff (`staff@queueless.com` / `password123`) $\rightarrow$ see the ticket appear in real time $\rightarrow$ click **Call Next** $\rightarrow$ hear the Web Audio chime.

### 2. QR Code Revocation & Error Handling
1. Log in to the Web Portal as `manager@queueless.com` / `password123` and navigate to **QR Management** (`/qr-management`).
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
1. Log in as customer `customer5@queueless.com` (`password123`).
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
