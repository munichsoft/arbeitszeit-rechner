# AGENT.md — Arbeitszeit-Rechner

Essential context for AI agents. Read before making changes.

---

## Project Overview

German **work-hour tracking mobile app** (iOS + Android). Built with **React Native + Expo Router**. Targets nurses, physiotherapists, cleaners — anyone tracking shifts. **No backend** — all data stored locally via AsyncStorage.

**Stack:** TypeScript · React Native · Expo SDK 54 · Expo Router v6 · Zustand · AsyncStorage · expo-print · expo-sharing · react-native-svg · date-fns

**Bundle ID:** `com.arbeitszeitrechner.app` (iOS + Android)  
**EAS Project:** `bb0fa890-268a-4909-a164-b42e6ab9d6e0`

---

## Repository Layout

```
arbeitszeit-rechner/
├── app/
│   ├── _layout.tsx              # Root layout: Inter fonts, SafeAreaProvider, SplashScreen
│   └── (tabs)/
│       ├── _layout.tsx          # 4-tab navigator with custom BottomTabBar
│       ├── index.tsx            # Dashboard — timer, weekly progress, stat cards, recent entries
│       ├── aktivitat.tsx        # Aktivität — Schichten & Aufträge toggle view
│       ├── berichte.tsx         # Berichte — analytics, date pickers, export
│       └── einstellungen.tsx    # Einstellungen — profile, language, theme, pay settings
│
├── components/
│   ├── TimerDisplay.tsx         # Live HH:MM:SS counter with haptic start/stop
│   ├── TimeEntryCard.tsx        # Entry card: active indicator, earnings, swipe-to-delete
│   ├── WeeklyProgress.tsx       # Progress bar + Mo–Fr day labels (respects timeFormat)
│   ├── StatCard.tsx             # Stat card with optional SVG sparkline
│   ├── ProjectCard.tsx          # Project card: client, hours, billable badge, edit/delete
│   ├── EntryEditModal.tsx       # Full modal: native date/time pickers, project picker
│   ├── AddProjectModal.tsx      # New/edit project form with 6 color swatches
│   ├── EmptyState.tsx           # Empty state illustration + CTA
│   ├── FAB.tsx                  # Floating action button, safe-area-aware
│   └── BottomTabBar.tsx         # Custom tab bar with safe area insets
│
├── constants/
│   ├── colors.ts                # LightColors + DarkColors token maps
│   ├── typography.ts            # Inter type scale
│   └── spacing.ts               # 4px baseline grid, border radii, shadow levels
│
├── hooks/
│   ├── useThemeColors.ts        # Returns active palette (light/dark/system)
│   └── useTranslation.ts        # Returns translated strings for current language
│
├── store/
│   ├── useTimeStore.ts          # Zustand: entries, projects, active timer (persisted AsyncStorage)
│   └── useSettingsStore.ts      # Zustand: profile, theme, language, pay settings (persisted)
│
├── utils/
│   ├── formatTime.ts            # HH:MM:SS, formatDuration, German dates, earnings calc
│   ├── germanLaborLaw.ts        # ArbZG §3/§4/§5 advisory checks
│   └── exportHelpers.ts         # CSV + PDF generation + expo-sharing
│
├── app.json                     # Expo config (bundle IDs, splash, plugins)
├── eas.json                     # EAS build profiles (preview + production)
└── AGENT.md                     # This file
```

---

## State Management

### `useTimeStore` (Zustand + AsyncStorage)

```typescript
interface TimeEntry {
  id: string;
  projectId: string;
  startTime: string;       // ISO 8601
  endTime: string | null;  // null = currently running (active timer)
  pauseMinutes: number;
  notes: string;
  billable: boolean;
}

interface Project {
  id: string;
  name: string;
  client: string;
  hourlyRate: number;
  billable: boolean;
  color: string;           // hex, used for chip tinting
}
```

### `useSettingsStore` (Zustand + AsyncStorage)

```typescript
{
  userName: string;
  userEmail: string;
  language: 'de' | 'en';
  theme: 'light' | 'dark' | 'system';
  hourlyRate: number;
  currencySymbol: '€' | '$' | '£' | 'CHF';
  weeklyTargetHours: number;
  timeFormat: 'HH:MM' | 'decimal';
  pushNotifications: boolean;
}
```

**Critical:** Both stores persist to AsyncStorage. Mutating store shape requires a migration strategy — do NOT rename existing keys without handling legacy data.

---

## Design System

### Theme Tokens (`constants/colors.ts`)

| Token | Light | Dark |
|---|---|---|
| Background | `#F7F9FB` | `#0F1117` |
| Surface | `#FFFFFF` | `#1A1D25` |
| Action Blue | `#0058BE` | `#4A90E2` |
| Outline | `#75777D` | `#8A8D95` |

- **Font:** Inter (400/500/600/700) via `@expo-google-fonts/inter`
- **Card Radius:** 16px · **Input Radius:** 12px · **Chip Radius:** 9999px
- **Shadows:** L1 `0 2 4 rgba(0,0,0,0.04)` · L2 `0 8 16 rgba(0,0,0,0.08)`
- **Spacing:** 4px baseline grid (see `constants/spacing.ts`)

**Always use `useThemeColors()`** to read colors — never hardcode hex values in components.

---

## i18n / Localisation

`hooks/useTranslation.ts` returns all UI strings for the current language (`de` | `en`). Language is stored in `useSettingsStore`.

- Add new strings to **both** `de` and `en` branches.
- Never hardcode German/English strings in JSX — always go through `useTranslation`.

---

## German Labor Law (ArbZG)

`utils/germanLaborLaw.ts` — advisory-only checks, never block saving.

| Section | Rule | Trigger |
|---|---|---|
| **§3** | Max 10h/day | `todayHours > 10` |
| **§4** | 30-min break after 6h; 45-min after 9h | `pauseMinutes` vs `workingHours` |
| **§5** | Min 11h rest between shifts | consecutive entry end/start diff |

Violations show a yellow warning banner on the Dashboard. Do not add hard blocks.

---

## Export

| Format | Implementation |
|---|---|
| **PDF** | `expo-print` → HTML string → PDF → `expo-sharing` |
| **CSV** | German `;`-delimited, written via `expo-file-system` → `expo-sharing` |

Both exports are triggered from `berichte.tsx`. Logic lives in `utils/exportHelpers.ts`.

---

## Running Locally

> **Requires a Development Build** — custom native modules mean standard Expo Go won't work.

```bash
# Install deps
npm install --legacy-peer-deps

# Start Metro
npx expo start --clear

# Android emulator (needs JAVA 17)
export JAVA_HOME=$(pwd)/.java17/jdk-17.0.14+7/Contents/Home
npx expo run:android

# iOS simulator
npx expo run:ios
```

---

## Building (EAS)

```bash
# Preview (internal testing)
eas build -p android --profile preview   # → .apk
eas build -p ios --profile preview       # → .ipa

# Production (store submission)
eas build -p android --profile production  # → .aab
eas build -p ios --profile production      # → .ipa
```

Bump `version`, `versionCode`, and `buildNumber` in `app.json` before every production release.

---

## Key Design Rules

1. **No backend.** All persistence is AsyncStorage via Zustand. Do not introduce network calls without a documented v2 migration path.
2. **Theme via hook.** Always `useThemeColors()`. Never hardcode color values in components.
3. **Translations via hook.** Always `useTranslation()`. Never hardcode user-visible strings.
4. **ArbZG checks are advisory.** Warnings only — never block or auto-correct user data.
5. **Active timer = `endTime: null`.** Only one entry may have `endTime === null` at a time. Enforce in `useTimeStore`.
6. **Safe area required.** All screens must use `SafeAreaView` or equivalent. `FAB` and `BottomTabBar` must account for bottom insets.
7. **Native pickers.** Date/time input uses `@react-native-community/datetimepicker` (spinner on iOS, dialog on Android). Do not swap for custom JS pickers.

---

## Caveman Mode (Token Optimization)

**CRITICAL INSTRUCTION FOR AI AGENTS:**
This project uses the `caveman` plugin instructions (from https://github.com/juliusbrussee/caveman) to minimize token usage and improve readability.
When communicating with the user, you MUST adopt the "Caveman" style ("lite" or "full").
- Drop filler words, pleasantries, and unnecessary transition phrases ("I'd be happy to help", "Here is the code").
- Use short, telegraphic fragments.
- Keep technical accuracy 100% intact, but minimize the word count.
- Example: "Bug in auth middleware. Token expiry check use `<` not `<=`. Fix:" instead of "The issue you're experiencing is most likely caused by your authentication middleware..."
- Small mouth. Big brain. Save tokens.

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
