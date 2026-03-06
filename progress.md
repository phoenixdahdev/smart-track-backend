# SmartTrack Health - Progress Tracker

> Last updated: 2026-03-06

## Legend

- [ ] Not started
- [~] In progress
- [x] Complete
- [!] Blocked (see notes)

---

## Phase 0: Project Foundation

**Status: Complete (19/20 — CI/CD deferred)**

| Task                                            | Status | Notes                                                                                       |
| ----------------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| Initialize NestJS project                       | [x]    | NestJS 11, pnpm, TypeScript                                                                 |
| ESLint + Prettier config                        | [x]    | Flat config, single quotes, trailing commas                                                 |
| TypeScript config                               | [x]    | Path aliases, strictNullChecks, decorators                                                  |
| PostgreSQL connection (TypeORM)                 | [x]    | DatabaseModule, data-source.ts, AbstractModelAction + DAL pattern                           |
| Environment config module                       | [x]    | @nestjs/config (global) + .env.example                                                      |
| Database migrations infrastructure              | [x]    | TypeORM CLI scripts (generate, run, revert)                                                 |
| Flat architecture setup                         | [x]    | controllers/, services/, dals/, entities/, decorators/, guards/, interceptors/, exceptions/ |
| Response interceptor                            | [x]    | Standard envelope, camelToSnake, PHI field stripping                                        |
| Exception filter                                | [x]    | AllExceptionsFilter — PHI-safe error responses                                              |
| Guards (JWT + Roles)                            | [x]    | JwtAuthGuard, RolesGuard with @Public/@Roles decorators                                     |
| Decorators                                      | [x]    | @CurrentUser, @Roles, @Public, @PrivateFields, @SkipResponseInterceptor                     |
| Enums + state machines                          | [x]    | PlatformRole, AgencyRole, ServiceRecordStatus, ClaimStatus + transitions                    |
| Base entities                                   | [x]    | BaseEntity (UUID+timestamps), TenantBaseEntity (adds org_id)                                |
| Utils                                           | [x]    | camelToSnake, pagination, responseFormatter, validateTransition                             |
| Security middleware (CORS, helmet, compression) | [x]    | main.ts bootstrap                                                                           |
| Swagger/OpenAPI                                 | [x]    | /api/docs                                                                                   |
| ValidationPipe                                  | [x]    | Global with whitelist + transform                                                           |
| Test infrastructure + specs                     | [x]    | 84 tests, 11 suites — guards, interceptors, filters, decorators, utils, enums               |
| CI/CD pipeline                                  | [ ]    | Deferred                                                                                    |
| Project documentation                           | [x]    | CLAUDE.md, plan.md, agent.md, progress.md                                                   |
| Complete entity layer                           | [x]    | 47 entities, 22 enums, 47 DALs — all phases                                                 |

**Decisions Made:**

- ORM: TypeORM (flat DAL pattern, not NestJS modules)
- Auth: Local JWT (HS256) + Google OAuth ID token (replaced Auth0 JWKS)
- Architecture: Flat (single AppModule, registries in base.service.ts + base.controller.ts)

---

## Phase 1: Authentication & Multi-Tenancy

**Status: Complete (11/11)**

| Task                         | Status | Notes                                                                |
| ---------------------------- | ------ | -------------------------------------------------------------------- |
| Auth module (JWT + refresh)  | [x]    | Local HS256 JWT, bcrypt passwords, Google OAuth ID token signin      |
| Signup / Signin routes       | [x]    | POST signup, POST signin, POST signin/google, POST refresh           |
| MFA support (TOTP + FIDO2)   | [x]    | mfa_enabled/mfa_type on UserEntity for display, enforcement deferred |
| Organizations table          | [x]    | Entity + DAL created                                                 |
| RLS policies                 | [x]    | Migration for 29 tenant tables, append-only audit_logs               |
| Tenant context middleware    | [x]    | TenantContextInterceptor — SET LOCAL app.current_org_id per request  |
| RBAC guard decorators        | [x]    | @Roles(), @Permissions() + PermissionsGuard                          |
| Sub-permissions model        | [x]    | SubPermissionsService + PermissionsGuard (APP_GUARD)                 |
| Session management           | [x]    | AuthService.getSession(), session_timeout on AuthenticatedUser       |
| Audit log module             | [x]    | AuditLogService — agency + platform, PHI stripped, never throws      |
| Encryption service (AES-256) | [x]    | AES-256-GCM, random IV, iv:authTag:ciphertext format                 |

---

## Phase 2: Core Entity Layer

**Status: Not Started (entities ready)**

| Task                          | Status | Notes                                                  |
| ----------------------------- | ------ | ------------------------------------------------------ |
| Users module                  | [ ]    | Entity + DAL created                                   |
| Organizations module          | [ ]    | Entity + DAL created                                   |
| Programs module               | [ ]    | Entity + DAL created                                   |
| Sites module                  | [ ]    | Entity + DAL created                                   |
| Individuals module            | [ ]    | Entity + DAL created (PHI fields ready for encryption) |
| Staff assignments module      | [ ]    | Entity + DAL created                                   |
| Console-scoped API routing    | [ ]    | /api/v1/{console}/...                                  |
| Permission matrix enforcement | [ ]    |                                                        |
| Seed data / dev fixtures      | [ ]    |                                                        |

---

## Phase 3: Service Documentation

**Status: Not Started (entities ready)**

| Task                        | Status | Notes                                     |
| --------------------------- | ------ | ----------------------------------------- |
| Service records module      | [ ]    | Entity + DAL created, state machine ready |
| Daily notes module          | [ ]    | Entity + DAL created                      |
| ISP goals module            | [ ]    | Entity + DAL created                      |
| ISP data points module      | [ ]    | Entity + DAL created                      |
| Incident reporting module   | [ ]    | Entity + DAL created                      |
| BTP module (Clinician)      | [ ]    | Entity + DAL created (behavior_plans)     |
| MAR module                  | [ ]    | Entity + DAL created                      |
| Supervisor review queue     | [ ]    | Core approval workflow                    |
| Immutability enforcement    | [ ]    | Approved records locked                   |
| Correction request workflow | [ ]    | Entity + DAL created                      |

---

## Phase 4: EVV (Electronic Visit Verification)

**Status: Not Started (entities ready)**

| Task                           | Status | Notes                                |
| ------------------------------ | ------ | ------------------------------------ |
| Clock-in / clock-out endpoints | [ ]    | evv_punches entity + DAL created     |
| GPS capture + validation       | [ ]    |                                      |
| Shift association              | [ ]    |                                      |
| Missed punch detection         | [ ]    | evv_corrections entity + DAL created |
| Double clock-in prevention     | [ ]    |                                      |
| Shift overlap detection        | [ ]    |                                      |
| EVV → service record linkage   | [ ]    |                                      |

---

## Phase 5: Scheduling

**Status: Not Started (entities ready)**

| Task                    | Status | Notes                           |
| ----------------------- | ------ | ------------------------------- |
| Schedule creation       | [ ]    | shifts entity + DAL created     |
| Shift assignment        | [ ]    |                                 |
| Staff schedule view     | [ ]    |                                 |
| Accept/reject workflow  | [ ]    | ShiftStatus state machine ready |
| Conflict detection      | [ ]    |                                 |
| Schedule-to-EVV linkage | [ ]    |                                 |

---

## Phase 6: Billing & Claims Engine

**Status: Not Started (entities ready)**

| Task                                      | Status | Notes                                     |
| ----------------------------------------- | ------ | ----------------------------------------- |
| Billing queue (approved unbilled records) | [ ]    |                                           |
| Service authorization management          | [ ]    | Entity + DAL created (three-bucket model) |
| Authorization threshold alerts            | [ ]    |                                           |
| Payer configuration module                | [ ]    | Entity + DAL created                      |
| Rate tables module                        | [ ]    | Entity + DAL created                      |
| Service codes module                      | [ ]    | Entity + DAL created (linked to global)   |
| Claim generation (service record → claim) | [ ]    | claims entity + DAL created               |
| Claim type determination (837P vs 837I)   | [ ]    | ClaimType enum ready                      |
| 7-step mapping logic                      | [ ]    |                                           |
| Pre-submission validation (13 checks)     | [ ]    |                                           |
| EDI 837 generation                        | [ ]    | x12-parser / node-x12                     |
| Clearinghouse integration                 | [ ]    | Provider TBD                              |
| Claim submission tracking                 | [ ]    | Entity + DAL created                      |
| 277 status response processing            | [ ]    |                                           |
| Claim status lifecycle                    | [ ]    | ClaimStatus + transitions ready           |
| Denial handling workflow                  | [ ]    |                                           |

---

## Phase 7: Payment Reconciliation

**Status: Not Started (entities ready)**

| Task                          | Status | Notes                            |
| ----------------------------- | ------ | -------------------------------- |
| 835 ERA file ingestion        | [ ]    | remittances entity + DAL created |
| ERA parsing                   | [ ]    |                                  |
| 4-priority matching algorithm | [ ]    | MatchingMethod enum ready        |
| Payment posting module        | [ ]    | Entity + DAL created             |
| Adjustment processing         | [ ]    | Entity + DAL created             |
| EFT reconciliation            | [ ]    |                                  |
| AR aging reports              | [ ]    |                                  |
| Financial dashboard endpoints | [ ]    |                                  |

---

## Phase 8: SuperAdmin Console API

**Status: Not Started (entities ready)**

| Task                             | Status | Notes                                                       |
| -------------------------------- | ------ | ----------------------------------------------------------- |
| Operator management              | [ ]    | Entity + DAL created                                        |
| Agency signup pipeline (7-stage) | [ ]    | Entity + DAL created, ApplicationStatus state machine ready |
| Application review queue         | [ ]    | application_documents + application_notes entities ready    |
| Risk scoring                     | [ ]    | NPI, EIN, BAA validation                                    |
| Tenant provisioning automation   | [ ]    | 12-step process                                             |
| Onboarding checklists            | [ ]    | Entity + DAL created                                        |
| Agency management                | [ ]    | org_contacts + signed_agreements entities ready             |
| Global service code library      | [ ]    | Entity + DAL created                                        |
| Global payer configuration       | [ ]    | Entity + DAL created                                        |
| Subscription plan management     | [ ]    | plan_definitions + subscriptions + invoices entities ready  |
| Feature flags + module toggles   | [ ]    | org_modules + org_feature_flags entities ready              |
| Platform health monitoring       | [ ]    |                                                             |
| Break-glass access protocol      | [ ]    | Entity + DAL created                                        |
| Platform audit log               | [ ]    | Entity + DAL created                                        |

---

## Phase 9: Notification Engine

**Status: Not Started (entities ready)**

| Task                        | Status | Notes                                                            |
| --------------------------- | ------ | ---------------------------------------------------------------- |
| Notification service        | [ ]    | notifications + notification_preferences entities + DALs created |
| Auth threshold alerts       | [ ]    |                                                                  |
| Claim status notifications  | [ ]    |                                                                  |
| Supervisor review reminders | [ ]    |                                                                  |
| Shift notifications         | [ ]    |                                                                  |
| Onboarding status updates   | [ ]    |                                                                  |
| Break-glass notifications   | [ ]    |                                                                  |

---

## Phase 10: Guardian Portal API

**Status: Not Started**

| Task                        | Status | Notes             |
| --------------------------- | ------ | ----------------- |
| ISP summaries endpoint      | [ ]    | Read-only         |
| Progress reports endpoint   | [ ]    | Read-only         |
| Incident summaries endpoint | [ ]    | Redacted          |
| Scheduled services endpoint | [ ]    | Read-only         |
| Guardian authentication     | [ ]    | Limited-scope JWT |

---

## Phase 11: Reporting & Analytics

**Status: Not Started**

| Task                             | Status | Notes |
| -------------------------------- | ------ | ----- |
| Billing reconciliation reports   | [ ]    |       |
| AR aging reports                 | [ ]    |       |
| Claims lifecycle analytics       | [ ]    |       |
| Documentation compliance reports | [ ]    |       |
| EVV compliance reports           | [ ]    |       |
| Staff utilization reports        | [ ]    |       |
| Authorization usage reports      | [ ]    |       |
| Platform analytics (SuperAdmin)  | [ ]    |       |
| Export (CSV, PDF)                | [ ]    |       |

---

## Phase 12: Hardening & Compliance

**Status: Not Started**

| Task                       | Status | Notes          |
| -------------------------- | ------ | -------------- |
| OWASP security audit       | [ ]    |                |
| HIPAA compliance review    | [ ]    |                |
| Penetration testing prep   | [ ]    |                |
| Performance / load testing | [ ]    |                |
| DB query optimization      | [ ]    |                |
| Rate limiting tuning       | [ ]    |                |
| Error handling audit       | [ ]    | No PHI leakage |
| Audit log completeness     | [ ]    |                |
| Encryption verification    | [ ]    |                |
| Disaster recovery testing  | [ ]    |                |

---

## Summary

| Phase                      | Progress   | Key Blocker                              |
| -------------------------- | ---------- | ---------------------------------------- |
| 0 - Foundation             | 20/21      | CI/CD pipeline remaining                 |
| 1 - Auth & Multi-Tenancy   | 11/11      | Complete — local JWT + Google OAuth       |
| 2 - Core Entities          | 0/9        | Entities ready, services/controllers TBD |
| 3 - Service Documentation  | 0/10       | Entities ready, services/controllers TBD |
| 4 - EVV                    | 0/7        | Entities ready                           |
| 5 - Scheduling             | 0/6        | Entities ready                           |
| 6 - Billing & Claims       | 0/16       | Entities ready                           |
| 7 - Payment Reconciliation | 0/8        | Entities ready                           |
| 8 - SuperAdmin Console     | 0/14       | Entities ready                           |
| 9 - Notifications          | 0/7        | Entities ready                           |
| 10 - Guardian Portal       | 0/5        | Phase 3 completion                       |
| 11 - Reporting             | 0/9        | Phases 6-8                               |
| 12 - Hardening             | 0/10       | All phases                               |
| **Total**                  | **31/123** |                                          |

**Entity Layer Complete:** 47 entities, 22 new enums (+3 role additions), 47 DALs — all registered in imports.ts and base.service.ts. Build passes, 187 tests green across 22 suites.

**Auth Rewrite (2026-03-06):** Replaced Auth0 JWKS (RS256) with local JWT (HS256) + bcrypt password auth + Google OAuth ID token signin. Added `password` column to users table (nullable for OAuth-only users). Removed `jwks-rsa` dependency, added `bcrypt` + `google-auth-library`. @PrivateFields(['password', 'otp_code', 'reset_token']) strips sensitive fields from responses.

**Auth Enhancements (2026-03-06):** org_id made optional at signup (users create orgs post-signup). UserEntity changed from TenantBaseEntity to BaseEntity with nullable org_id. Added: OrganizationController/Service (create/get/update orgs, assigns AGENCY_OWNER role), EmailService (Resend SDK for OTP + password reset emails), email verification (OTP 6-digit, 10-min expiry), forgot-password/reset-password (SHA256-hashed tokens, 1-hour expiry), GET /auth/me. 11 auth routes total: signup, verify-email, resend-otp, signin, signin/google, me, session, forgot-password, reset-password, signout, refresh. All DTOs have @ApiProperty Swagger decorators. Migration: auth-enhancements (dropped auth0_sub, nullable org_id, email_verified, otp, reset_token fields).
