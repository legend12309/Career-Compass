# Career Compass — Universal Career & Resume Platform (Milestone 1 Plan)

Career Compass is an inclusive, AI-powered career guidance and resume platform built for **everyone**: school students (Class 9–12), undergraduate and postgraduate students across all disciplines, vocational/diploma learners, freshers, working professionals, career switchers, and people returning after a career break.

### User Review & Critical Decisions

> [!IMPORTANT]
> Based on your confirmed choices:
> - **Confirmed Decision 1 (Milestone Scope)**: Execute **First Action (Environment Capability Report)** + **MILESTONE 1 (Foundation)** now, verify every "Done When" item with concrete evidence, and stop and wait for `"next"` before Milestone 2.
> - **Confirmed Decision 2 (Universal Language & Seed Data)**: All UI text is centralized in `src/i18n/en.ts` at a clear Grade-8 reading level across diverse domains (healthcare, commerce, law, arts, design, trades, education, science, and technology). Words like *"BCA"*, *"placement"*, *"semester"*, and *"campus"* are completely excluded from the UI. The pre-seeded Demo User focuses on Full-Stack Development while showcasing field-diverse examples across the platform.
> - **Confirmed Decision 3 (Country & Currency)**: Default to **India (`INR`)** with a global country and currency selector (`INR`, `USD`, `EUR`, `GBP`, `AUD`, `CAD`, `SGD`).
> - **Confirmed Decision 4 (Session-Scoped Service Layer)**: Every function in `src/services/db.ts` derives the current user directly from the active session in `src/services/auth.ts`—never accepting a `userId` parameter from UI components—guaranteeing strict multi-user isolation and a 1:1 drop-in path to Express + MongoDB + JWT.

---

### 1. Overview & Core Concept

- **What Milestone 1 Delivers**:
  1. **Environment Capability Assessment (First Action)**: Clear 3-line architectural justification selecting the built-in Express server (`server.ts`) for secret-protected Gemini API calls (`process.env.GEMINI_API_KEY`) paired with session-scoped `services/auth.ts` and `services/db.ts` abstractions for zero-friction migration to MongoDB + JWT.
  2. **Centralized `src/i18n/en.ts` & Design System**: Light and Dark mode support (`@custom-variant dark`), high-contrast slate/indigo palette, accessible tap targets, and plain Grade-8 English copy.
  3. **Zod-Validated Models & Session Auth (`src/services/auth.ts`)**:
     - Roles: `"user"` and `"admin"`.
     - Registration with trimmed/lowercased email, duplicate check, privacy notice, and Web Crypto SHA-256 password hashing (`// TODO: mocked client hash — replace with server-side bcrypt + JWT in Express/MongoDB`).
     - Deactivated account lockout on both login and active session refresh.
  4. **3-Step Onboarding Wizard (`/onboarding`)**:
     - Step 1: Current Stage (`school`, `undergraduate`, `postgraduate`, `diploma/vocational`, `fresher`, `working`, `switching careers`, `returning after a break`, `self-taught`) & Country/Currency.
     - Step 2: Education Level, Field of Study / Industry (covering Healthcare, Commerce, Arts, Law, Trades, Education, Science, Technology, etc.), and Years of Experience.
     - Step 3: Interests & Career Goal. Skippable at any step with a gentle Dashboard nudge if incomplete.
  5. **Profile & Privacy Controls (`/profile`)**:
     - Validated profile editor (never asking for age, gender, religion, caste, marital status, nationality, or photo).
     - **"Export my data (JSON)"**: Downloads a complete, structured JSON archive of all user records across every module.
     - **"Delete my account and data"**: Confirmation modal that permanently purges the user's account and all associated records across every collection, then logs out cleanly.
  6. **Dashboard Shell (`/dashboard`), Admin Guard (`/admin`), and Friendly 404 (`*`)**:
     - Dashboard hub displaying real-time profile completion %, onboarding nudge, next best step card, and summary tiles.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  - `Landing (/)` → `Register (/register)` (with privacy note) → `Onboarding Wizard (/onboarding)` (3 steps, first login only) → `Dashboard (/dashboard)` → `Profile & Privacy (/profile)` (edit, export JSON, or delete account).
  - Returning users or Demo User (`demo@careercompass.org`) skip `/onboarding` if already onboarded and land directly on `/dashboard`.
  - Demo Admin (`admin@careercompass.org`) lands on `/admin` and is guarded by role checks in both UI routes and service functions.
- **Visual Identity & Theme**:
  - *Light & Dark Mode*: Toggleable in the top navigation bar, persisted to storage, using Tailwind v4 `@custom-variant dark (&:where(.dark, .dark *));`.
  - *Typography*: `Plus Jakarta Sans` for headings, `Public Sans` for readable prose, and `tabular-nums` for all numeric indicators.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Zero `userId` Arguments in `services/db.ts`**
  - *Chosen Approach*: `services/db.ts` calls `requireSessionUser()` internally from `services/auth.ts` to identify the caller.
  - *Why*: Eliminates Insecure Direct Object Reference (IDOR) vulnerabilities where UI code could accidentally or maliciously pass another user's ID.
- **Decision 2: Zod Schemas for Forms & AI Contracts (`src/types/ai.ts`)**
  - *Chosen Approach*: Define all 4 universal AI schemas (Career Ideas with `best-fit`/`adjacent`/`stretch` categories, universal Resume Review, Mock Interview with `viva` option, and Roadmap with `budget` & `hoursPerWeek`) alongside `zod` validators upfront.
  - *Why*: Ensures Milestone 1 types and validation foundation are 100% aligned with Milestone 2 and 3 tools.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    App Shell (Light/Dark + i18n/en.ts)                  │
│   /  │ /login │ /register │ /onboarding │ /dashboard │ /profile │ /admin│
└───┬────────┬─────────┬───────────┬────────────┬────────────┬────────┬───┘
    │        │         │           │            │            │        │
    ▼        ▼         ▼           ▼            ▼            ▼        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│             Session-Inferred Service Layer (Zod Validated)              │
│ • services/auth.ts: register, login, logout, getSessionUser, hashPass   │
│ • services/db.ts:   getMyProfile, saveMyProfile, exportMyData,          │
│                     deleteMyAccountAndData (reads session user only)    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Prototype Storage + Express Server Proxy (server.ts -> /api/ai/*)      │
└─────────────────────────────────────────────────────────────────────────┘
```
