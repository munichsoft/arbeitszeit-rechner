# 🚀 Next Features — Arbeitszeit-Rechner

This document outlines the planned evolution of the app beyond the current local-only v1.x release.

---

## v1.1 — Quick Wins

| Feature | Details |
|---|---|
| **Excel Export** | Generate `.xlsx` via `exceljs` — professional payroll-ready sheets with formatting |
| **ArbZG Push Notifications** | Local notifications via `expo-notifications` when daily/weekly limits are approached |
| **Pause / Resume Timer** | Support multiple pause segments within a single shift |

---

## v2.0 — Backend & Multi-Device Sync

### Why a Backend?

Right now all data lives on-device. Moving to a backend enables:
- Access entries from any device
- Employer visibility into employee hours
- Automatic backups
- Team management

### Recommended Stack: Firebase

| Layer | Technology | Reason |
|---|---|---|
| Database | Cloud Firestore | Real-time sync, offline-first, generous free tier |
| Auth | Firebase Auth | Email, Google, Apple sign-in in one package |
| Storage | Cloud Storage | For future document/receipt attachments |
| Employer Web App | Next.js on Vercel | Server-side rendering, free hosting |

---

## System Architecture

```
┌──────────────────────┐        ┌─────────────────────┐
│   Employee App       │        │  Employer Dashboard  │
│   (React Native)     │        │  (Next.js Web App)   │
│                      │        │                      │
│  - Track own shifts  │        │  - View all employees│
│  - Start/stop timer  │        │  - Approve entries   │
│  - Export own report │        │  - Payroll export    │
└──────────┬───────────┘        └──────────┬───────────┘
           │                               │
           └──────────────┬────────────────┘
                          │
               ┌──────────▼──────────┐
               │   Firebase / GCP    │
               │                     │
               │  Firestore (data)   │
               │  Firebase Auth      │
               │  Security Rules     │
               └─────────────────────┘
```

### Firestore Data Model

```
/companies/{companyId}
  name: string
  inviteCode: string          ← 6-digit code employees use to join

/companies/{companyId}/employees/{uid}
  name: string
  email: string
  role: 'employee' | 'admin'
  joinedAt: timestamp

/companies/{companyId}/entries/{entryId}
  employeeId: string
  projectId: string
  startTime: timestamp
  endTime: timestamp | null
  pauseMinutes: number
  notes: string
  billable: boolean
  approved: boolean           ← employer can approve/reject

/companies/{companyId}/projects/{projectId}
  name: string
  client: string
  hourlyRate: number
  billable: boolean
  color: string
```

### Security Rules (Summary)

- Employees can **read/write only their own entries**
- Employers (role: `admin`) can **read all entries** in their company
- No user can read data from another company

---

## Employer Dashboard — Feature List

### Overview Screen
- How many employees are currently clocked in (live)
- Total hours worked this week across the team
- ArbZG compliance flags — who is approaching limits

### Employee Detail
- Full entry history per employee
- Hours breakdown by project/client
- Approve or reject individual entries

### Reports
- Export payroll CSV / Excel for any date range
- Per-employee or full-team
- Filter by project, billable status, date

### Settings
- Manage employees (invite, remove)
- Set company-wide hourly rates per project
- Configure ArbZG notification thresholds

---

## Migration Plan (Employee App)

The current Zustand store structure maps cleanly to Firestore — migration is additive, not a rewrite.

| Step | What changes |
|---|---|
| **1. Add Auth** | New login/signup screen before tabs. Store `uid` in settings store |
| **2. Company Join** | Onboarding flow: create company or enter 6-digit invite code |
| **3. Sync Entries** | Replace AsyncStorage writes with Firestore writes in `useTimeStore` actions |
| **4. Real-time reads** | `onSnapshot` listener replaces AsyncStorage hydration on app start |
| **5. Offline** | Firestore SDK handles offline cache automatically — no extra work |

The app stays **offline-first** — Firestore queues writes when offline and syncs when the connection returns.

---

## Employer Dashboard — Tech Stack

```
next-features/employer-dashboard/   (separate repo)
├── app/
│   ├── page.tsx              # Login
│   ├── dashboard/
│   │   ├── page.tsx          # Overview — live status
│   │   ├── employees/
│   │   │   └── [uid]/page.tsx  # Employee detail
│   │   └── reports/
│   │       └── page.tsx      # Export & analytics
│   └── settings/
│       └── page.tsx          # Company settings
├── lib/
│   ├── firebase.ts           # Firebase Admin SDK init
│   └── firestore.ts          # Data access helpers
└── components/               # Shared UI (shadcn/ui)
```

**Deployment:** Vercel (free tier sufficient for small teams)

---

## Timeline Estimate

| Phase | Scope | Estimate |
|---|---|---|
| v1.1 | Excel export + push notifications | 1–2 days |
| v2.0 Phase 1 | Firebase auth + data sync in mobile app | 3–5 days |
| v2.0 Phase 2 | Employer web dashboard (MVP) | 5–7 days |
| v2.0 Phase 3 | Approval flow, payroll export, ArbZG alerts | 3–4 days |
