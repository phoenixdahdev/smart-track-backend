# SmartTrack Health - Development Plan

## 1. Project Overview

SmartTrack Health is an enterprise HIPAA-compliant care documentation and billing platform for IDD (Intellectual and Developmental Disabilities) service providers. It handles the full claims and reconciliation workflow — from service documentation through EDI claim submission to payment reconciliation — while enforcing strict multi-tenant isolation, role-based access, and regulatory compliance.

**SmartTrack does NOT process payments.** Money moves directly from payers to agency bank accounts via standard EFT. SmartTrack manages the billing workflow: claim generation, submission, tracking, and reconciliation.

---

## 2. Architecture Overview

### 2.1 Multi-Console Architecture (7 Consoles)

Each console is a fully isolated application context — separate route namespaces, no shared navigation or state.

| Console         | Route Namespace | Primary Users                         |
| --------------- | --------------- | ------------------------------------- |
| SuperAdmin      | `/superadmin/*` | SmartTrack platform operators         |
| Admin/Provider  | `/admin/*`      | Agency owners, administrators         |
| Supervisor      | `/supervisor/*` | Program supervisors, managers         |
| Staff/DSP       | `/staff/*`      | Direct Support Professionals          |
| Clinician       | `/clinical/*`   | Clinical staff (BTP, assessments)     |
| Billing         | `/billing/*`    | Billing specialists, finance managers |
| Guardian Portal | `/portal/*`     | Individuals, guardians (read-only)    |

### 2.2 Role System (Canonical - from Vol 01)

**Platform-Level Roles** (SuperAdmin Console only):

- Platform Owner
- Platform Admin
- Onboarding Specialist
- Support Engineer
- Billing Operator
- Compliance Auditor

**Agency-Level Roles** (Agency consoles):

- Admin/Provider → `/admin/*`
- Supervisor/Manager → `/supervisor/*`
- DSP (Direct Support Professional) → `/staff/*`
- Clinical Staff → `/clinical/*`
- Billing Specialist → `/billing/*`
- Finance Manager → `/billing/*` (elevated)
- Individual/Guardian → `/portal/*`

### 2.3 Core Architectural Principles

1. **Console Isolation** — No cross-console navigation or shared state
2. **Zero Data Bleed** — Row-Level Security (RLS) enforces tenant isolation at DB layer; `org_id` on every PHI table
3. **Approval-Gated Billing** — Claims only from supervisor-APPROVED service records, enforced at DB layer
4. **Immutable Records** — Service records become immutable once approved; append-only corrections
5. **Full Audit Trail** — Append-only audit logs for every PHI access and mutation
6. **Encryption Everywhere** — AES-256 field-level encryption for PHI; no PHI in URLs, logs, or error messages

### 2.4 Tech Stack

| Layer           | Technology                                  |
| --------------- | ------------------------------------------- |
| Backend API     | NestJS 11 (TypeScript)                      |
| Database        | PostgreSQL (with RLS)                       |
| ORM             | TypeORM (AbstractModelAction + DAL pattern) |
| Auth            | Local JWT (HS256) + bcrypt + Google OAuth   |
| File Storage    | AWS S3 (HIPAA BAA)                          |
| Encryption      | AES-256 (field-level for PHI)               |
| EDI Processing  | x12-parser / node-x12                       |
| Package Manager | pnpm                                        |
| Testing         | Jest + Supertest                            |
| Linting         | ESLint (flat config) + Prettier             |
| Frontend        | React + TypeScript (separate repo/phase)    |

---

## 3. Data Model - Core Entities

### 3.1 Platform-Level Tables (SuperAdmin)

- `smarttrack_operators` — Platform staff accounts
- `signup_applications` — Agency signup pipeline
- `application_documents` — Uploaded verification docs
- `organizations` — Tenant registry
- `subscriptions` — Agency subscription records
- `invoices` — Subscription billing
- `org_modules` — Per-tenant module toggles
- `org_feature_flags` — Per-tenant feature flags
- `onboarding_checklists` — Onboarding task tracking
- `break_glass_sessions` — Emergency access audit
- `platform_audit_log` — Platform-level audit trail
- `global_service_codes` — Master service code library
- `global_payers` — Master payer registry
- `plan_definitions` — Subscription tier definitions

### 3.2 Agency-Level Tables (Per-Tenant, RLS-Protected)

- `users` — Agency staff with role + sub_permissions JSON
- `programs` — Service programs within agency
- `sites` — Physical locations
- `individuals` — Clients receiving services
- `staff_assignments` — Staff-to-individual assignments
- `service_records` — Core documentation (state machine: DRAFT → PENDING_REVIEW → APPROVED/REJECTED)
- `daily_notes` — Service documentation entries
- `isp_goals` — Individual Service Plan goals
- `isp_data_points` — Goal tracking data
- `incidents` — Incident reports
- `behavior_plans` — Behavior Treatment Plans (BTP)
- `mar_entries` — Medication Administration Records
- `service_authorizations` — Payer authorization tracking (units_authorized, units_used, units_pending)
- `claims` — Billing claims (state machine)
- `claim_lines` — Individual claim line items
- `claim_submissions` — EDI submission records
- `remittances` — 835 ERA payment data
- `payment_posts` — Payment posting records
- `adjustments` — Claim adjustments
- `payer_config` — Agency-level payer configuration
- `service_codes` — Agency service codes (linked to global)
- `rate_tables` — Payer-specific rate tables
- `audit_logs` — Agency-level audit trail

---

## 4. Key Workflows

### 4.1 The Golden Thread (Core Data Flow)

```
DSP creates service record → submits for review →
Supervisor reviews → approves/rejects →
Billing pulls APPROVED records → maps to claim →
Pre-submission validation → EDI generation (837P/837I) →
Submit to payer/clearinghouse →
Track claim status (277 responses) →
Receive ERA (835) → reconcile payments → post to AR
```

### 4.2 Service Record State Machine

```
DRAFT → PENDING_REVIEW → APPROVED (immutable)
                       → REJECTED (with reason, can resubmit)
```

### 4.3 Claims Lifecycle

```
DRAFT → SUBMITTED → ACCEPTED_277 → PENDING → PAID
                  → REJECTED_277                → DENIED
                                                → PARTIAL_PAYMENT
                                                → ADJUSTED
                                                → VOID
                                                → APPEALED
```

### 4.4 Agency Onboarding Pipeline

```
PENDING_REVIEW → UNDER_REVIEW → DOCS_REQUESTED → APPROVED → PROVISIONING → ONBOARDING → ACTIVE
                               → DOCS_RECEIVED ↗
                → REJECTED
```

### 4.5 Authorization Management (Three-Bucket Model)

```
units_authorized = total units approved by payer
units_used = units already billed
units_pending = units in draft/submitted claims
units_remaining = units_authorized - units_used - units_pending
```

Threshold alerts at configurable percentages (e.g., 75%, 90%, 100%).

---

## 5. Security Requirements

### 5.1 RBAC at 3 Layers

1. **UI** — Route guards prevent rendering unauthorized consoles
2. **API** — JWT middleware + role/permission checks on every endpoint
3. **Database** — PostgreSQL RLS policies filter by `org_id` (and optionally `user_id`)

### 5.2 HIPAA Compliance

- Field-level AES-256 encryption for all PHI columns
- No PHI in URLs, query parameters, logs, or error responses
- Append-only audit logs (who accessed what, when, from where)
- Session timeouts per role (see below)
- MFA enforcement (mfa_enabled/mfa_type stored on user; enforcement deferred to frontend/middleware)
- Automatic session termination on role change

### 5.3 Session Security by Role

| Role               | Session Timeout | MFA Required     |
| ------------------ | --------------- | ---------------- |
| Platform Owner     | 15 min          | Hardware (FIDO2) |
| Platform Admin     | 15 min          | Hardware (FIDO2) |
| Admin/Provider     | 30 min          | Yes (TOTP)       |
| Supervisor         | 30 min          | Yes (TOTP)       |
| Billing Specialist | 20 min          | Yes (TOTP)       |
| DSP                | 60 min          | Optional         |
| Clinician          | 30 min          | Yes (TOTP)       |
| Guardian           | 60 min          | Optional         |

### 5.4 Break-Glass Access Protocol

For support engineers needing emergency tenant access:

1. Request with justification → 2. Approval by Platform Admin → 3. Time-limited read-only access granted → 4. All actions logged → 5. Agency notified → 6. Session auto-expires

### 5.5 API Security

- Return 404 (not 403) for out-of-scope resources to prevent enumeration
- Rate limiting on auth endpoints
- Request signing for EDI submissions
- All financial values in integer cents (never floating point)

---

## 6. Implementation Phases

### Phase 0: Project Foundation (Weeks 1-2)

- [x] Initialize NestJS project
- [ ] Configure strict TypeScript (`strict: true`)
- [ ] Set up PostgreSQL connection (TypeORM)
- [ ] Configure environment management (.env, config module)
- [ ] Set up database migrations infrastructure
- [ ] Set up logging framework (structured, PHI-safe)
- [ ] Configure CORS, helmet, rate limiting
- [ ] Set up test infrastructure (unit + e2e)
- [ ] CI/CD pipeline (lint, test, build)
- [ ] Project documentation (CLAUDE.md, README)

### Phase 1: Authentication & Multi-Tenancy (Weeks 3-5) ✅

- [x] Auth module (local JWT HS256 + bcrypt passwords + refresh tokens)
- [x] Google OAuth ID token signin (google-auth-library OAuth2Client.verifyIdToken)
- [x] MFA support (mfa_enabled/mfa_type on UserEntity, enforcement deferred)
- [x] Organizations table + tenant registry
- [x] Row-Level Security (RLS) policies
- [x] Tenant context middleware (extract org_id from JWT, set RLS)
- [x] Role definitions + RBAC guard decorators
- [x] Sub-permissions model (JSON on user record)
- [x] Session management (timeouts per role)
- [x] Audit log module (append-only)
- [x] Field-level encryption service (AES-256)

### Phase 2: Core Entity Layer (Weeks 6-8)

- [x] Users module (CRUD, role assignment, sub-permissions)
- [x] Organizations module (agency profile, config)
- [x] Programs module
- [x] Sites module
- [x] Individuals module (PHI — encrypted fields)
- [x] Staff assignments module
- [x] Console-scoped API routing (`/api/v1/{console}/...`)
- [x] Permission matrix enforcement (action-by-role checks)
- [x] Seed data / fixtures for development

### Phase 3: Service Documentation (Weeks 9-12)

- [ ] Service records module (state machine: DRAFT → PENDING_REVIEW → APPROVED/REJECTED)
- [ ] Daily notes module
- [ ] ISP goals module
- [ ] ISP data points module
- [ ] Incident reporting module
- [ ] Behavior Treatment Plans (BTP) module (Clinician console)
- [ ] MAR (Medication Administration Records) module
- [ ] Supervisor review queue + approval workflow
- [ ] Immutability enforcement (approved records locked)
- [ ] Correction request workflow (append-only amendments)

### Phase 4: EVV (Electronic Visit Verification) (Weeks 13-14)

- [ ] EVV clock-in/clock-out endpoints
- [ ] GPS capture + validation
- [ ] Shift association
- [ ] Missed punch detection + correction workflow
- [ ] Double clock-in prevention
- [ ] Shift overlap detection
- [ ] EVV data linked to service records

### Phase 5: Scheduling (Weeks 15-16)

- [ ] Schedule creation (admin/supervisor)
- [ ] Shift assignment to staff
- [ ] Staff schedule view (my shifts)
- [ ] Shift accept/reject workflow
- [ ] Schedule conflict detection
- [ ] Schedule-to-EVV linkage

### Phase 6: Billing & Claims Engine (Weeks 17-22)

- [ ] Billing queue (pull approved, unbilled service records)
- [ ] Service authorization management (three-bucket model)
- [ ] Authorization threshold alerts
- [ ] Payer configuration module (agency-level)
- [ ] Rate tables module
- [ ] Service codes module (linked to global library)
- [ ] Claim generation (map service records → claims + lines)
- [ ] Claim type determination (837P Professional vs 837I Institutional)
- [ ] 7-step mapping logic implementation
- [ ] Pre-submission validation engine (13 checks with error codes)
- [ ] EDI 837 generation (x12-parser/node-x12)
- [ ] Clearinghouse integration (V1: clearinghouse; future: direct EDI)
- [ ] Claim submission tracking
- [ ] 277 status response processing
- [ ] Claim status lifecycle management
- [ ] Denial handling workflow
- [ ] Common denial code handling (CO-4, CO-11, CO-16, CO-18, CO-50, CO-97, CO-170)

### Phase 7: Payment Reconciliation (Weeks 23-25)

- [ ] 835 ERA file ingestion
- [ ] ERA parsing (segment extraction)
- [ ] 4-priority matching algorithm (claim_id → CLP reference → service date + member → manual)
- [ ] Payment posting module
- [ ] Adjustment processing
- [ ] EFT reconciliation
- [ ] AR aging reports
- [ ] Financial dashboard data endpoints

### Phase 8: SuperAdmin Console API (Weeks 26-29)

- [ ] SmartTrack operator management
- [ ] Agency signup pipeline (7-stage state machine)
- [ ] Application review queue with SLA indicators
- [ ] Risk scoring (NPI validation, EIN format, BAA status)
- [ ] Tenant provisioning automation (12-step process)
- [ ] Onboarding checklists
- [ ] Agency management (directory, detail, status actions)
- [ ] Global service code library management
- [ ] Global payer configuration
- [ ] Subscription plan management
- [ ] Feature flags + module toggles per tenant
- [ ] Platform health monitoring endpoints
- [ ] Break-glass access protocol
- [ ] Platform audit log

### Phase 9: Notification Engine (Weeks 30-31)

- [ ] Notification service (email, in-app, SMS)
- [ ] Authorization threshold alerts
- [ ] Claim status change notifications
- [ ] Supervisor review reminders
- [ ] Shift assignment notifications
- [ ] Agency onboarding status updates
- [ ] Break-glass access notifications to agencies

### Phase 10: Guardian Portal API (Week 32)

- [ ] Read-only ISP summaries endpoint
- [ ] Progress reports endpoint
- [ ] Incident summaries endpoint (redacted as appropriate)
- [ ] Scheduled services view endpoint
- [ ] Guardian authentication (limited scope JWT)

### Phase 11: Reporting & Analytics (Weeks 33-35)

- [ ] Billing reconciliation reports
- [ ] AR aging reports
- [ ] Claims lifecycle analytics
- [ ] Service documentation compliance reports
- [ ] EVV compliance reports
- [ ] Staff utilization reports
- [ ] Authorization usage reports
- [ ] Platform-level analytics (SuperAdmin)
- [ ] Export functionality (CSV, PDF)

### Phase 12: Hardening & Compliance (Weeks 36-38)

- [ ] Security audit (OWASP top 10)
- [ ] HIPAA compliance review
- [ ] Penetration testing preparation
- [ ] Performance testing / load testing
- [ ] Database query optimization
- [ ] API rate limiting tuning
- [ ] Error handling audit (no PHI leakage)
- [ ] Audit log completeness verification
- [ ] Encryption verification (at rest + in transit)
- [ ] Disaster recovery testing

---

## 7. Subscription Tiers

| Tier         | Price     | Target                                        |
| ------------ | --------- | --------------------------------------------- |
| Starter      | $299/mo   | Small agencies, basic documentation + billing |
| Growth       | $699/mo   | Mid-size, full EVV + scheduling + claims      |
| Professional | $1,499/mo | Large agencies, all modules + analytics       |
| Enterprise   | Custom    | Multi-state, custom integrations, SLA         |

Module availability per tier drives feature flag configuration.

---

## 8. Open Questions / Decisions Needed

> These items need resolution before or during implementation. Flagged here to avoid assumptions.

1. ~~**ORM Choice**~~: **TypeORM** (decided)
2. ~~**Auth Provider**~~: **Local JWT (HS256) + bcrypt + Google OAuth** (decided — replaced Auth0)
3. **Database Schema Strategy**: Separate schema per tenant (full isolation) vs shared schema with RLS? SuperAdmin spec suggests separate schema; this has operational complexity.
4. **Deployment Target**: AWS (ECS/EKS)? Which region? Impacts HIPAA BAA setup.
5. **Frontend Repository**: Same monorepo or separate repo? The Next.js snippets suggest Next.js for frontend.
6. **Clearinghouse Provider**: Which clearinghouse for V1 EDI submissions? (e.g., Availity, Change Healthcare, Trizetto)
7. **Email/SMS Provider**: For notifications — SES, SendGrid, Twilio?
8. **File Storage Encryption**: S3 SSE-KMS with per-tenant keys as spec suggests, or shared key?
9. **Subscription Billing**: Stripe integration for agency subscription payments?
10. **Which console to build first after foundation?** Recommendation: Staff/DSP (service documentation) + Supervisor (review/approval) since they feed the Golden Thread.

---

## 9. Definition of Done (Per Feature)

From Developer Spec — every feature must meet ALL criteria:

1. RLS-tested with multiple tenant contexts
2. Role-permission matrix enforced
3. Audit log entries verified
4. PHI encrypted at field level where applicable
5. No PHI in logs/URLs/errors
6. E2E test passing with realistic data
7. Postman collection updated (`docs/smarttrack-health-api.postman_collection.json`) with all new endpoints

---

## 10. Key Development Rules

1. **Money in cents** — All financial calculations use integer arithmetic (cents), never floating point
2. **404 not 403** — Out-of-scope resources return 404 to prevent enumeration
3. **Append-only audit** — Never update or delete audit log entries
4. **Immutable approved records** — Once a service record is APPROVED, it cannot be modified
5. **Claims from approved only** — Enforced at DB layer, not just application layer
6. **No PHI leakage** — PHI must never appear in URLs, query params, logs, or error messages
7. **RLS everywhere** — Every query against tenant data must pass through RLS; no escape hatches
8. **Console isolation** — API endpoints are namespaced per console; cross-console access is forbidden
