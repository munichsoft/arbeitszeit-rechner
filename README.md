# ⏱ Arbeitszeit-Rechner

> A German work-hour tracking mobile app built with **React Native + Expo Router**, targeting iOS and Android.

Matches the **Chronos Flow** design system — Inter typography, deep navy brand palette, and glassmorphism bottom navigation. All data is stored **locally on-device** via AsyncStorage (no backend required).

---

## 📱 Screenshots Reference

| Dashboard | Aktivität | Berichte | Einstellungen |
|---|---|---|---|
| Live timer, weekly progress, stat cards, recent entries | Time entries grouped by Heute/Gestern, Projekte & Kunden toggle | Leistungsberichte analytics + Export-Konfiguration | Profile, currency, notifications, data export |

---

## 🗂 Project Structure

```
arbeitszeit-rechner/
├── app/
│   ├── _layout.tsx              # Root layout: Inter fonts, SafeAreaProvider, SplashScreen
│   └── (tabs)/
│       ├── _layout.tsx          # 4-tab navigator with custom glassmorphism bar
│       ├── index.tsx            # Dashboard — timer + weekly progress + stat cards + recent entries
│       ├── aktivitat.tsx        # Aktivität — Zeiteinträge & Projekte & Kunden toggle view
│       ├── berichte.tsx         # Berichte — Leistungsberichte analytics + Export-Konfiguration
│       └── einstellungen.tsx    # Einstellungen — settings screen
│
├── components/
│   ├── TimerDisplay.tsx         # Live HH:MM:SS counter with haptic start/stop button
│   ├── TimeEntryCard.tsx        # Entry card: live timer, left-blue-border for active, earnings
│   ├── WeeklyProgress.tsx       # Progress bar + Mo–Fr day labels (active day in blue)
│   ├── StatCard.tsx             # Stat card with optional react-native-svg sparkline
│   ├── ProjectCard.tsx          # Project card: client label, hours, Abrechenbar badge, edit icon
│   ├── EntryEditModal.tsx       # Full-screen modal: date/time/break/project/notes/billable
│   ├── AddProjectModal.tsx      # New/edit project form with 6 color swatches
│   ├── FAB.tsx                  # Floating action button (blue #0058BE, glow shadow)
│   └── BottomTabBar.tsx         # Glassmorphism tab bar via expo-blur
│
├── constants/
│   ├── colors.ts                # Full Chronos Flow color token map
│   ├── typography.ts            # Inter type scale (timer/headline/body/label/numeric)
│   └── spacing.ts               # 4px baseline grid, border radii, shadow levels
│
├── store/
│   ├── useTimeStore.ts          # Zustand store: entries, projects, active timer (AsyncStorage)
│   └── useSettingsStore.ts      # Zustand store: hourly rate, currency, weekly target, etc.
│
└── utils/
    ├── formatTime.ts            # HH:MM:SS, German date strings, time ranges, earnings
    ├── germanLaborLaw.ts        # ArbZG §3/§4/§5 advisory checks
    └── exportHelpers.ts         # CSV + PDF generation + expo-sharing
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- iOS Simulator (Xcode) or Android Emulator (Android Studio), **or** the [Expo Go](https://expo.dev/go) app on a physical device

### Install dependencies

```bash
cd /Users/mehul/Downloads/arbeitszeit-rechner
npm install --legacy-peer-deps
```

### Start the dev server

```bash
npx expo start --clear
```

| Key | Action |
|---|---|
| `i` | Open iOS Simulator |
| `a` | Open Android Emulator |
| Scan QR | Open in Expo Go on a physical device |

---

## 📦 Dependencies

| Package | Purpose |
|---|---|
| `expo-router` | File-based navigation |
| `zustand` | Lightweight state management |
| `@react-native-async-storage/async-storage` | On-device persistence |
| `@expo-google-fonts/inter` | Inter 400/500/600/700 |
| `expo-blur` | Glassmorphism tab bar backdrop |
| `expo-haptics` | Haptic feedback on timer toggle |
| `expo-print` | PDF generation for export |
| `expo-sharing` | Native share sheet |
| `expo-file-system` | CSV file writing |
| `react-native-svg` | Sparkline charts in stat cards |
| `date-fns` | German locale date formatting |
| `react-native-safe-area-context` | Safe area insets |
| `react-native-screens` | Native screen optimization |
| `@expo/vector-icons` | Ionicons (outlined, 2px stroke) |

---

## 🎨 Design System — Chronos Flow

| Token | Value |
|---|---|
| Background | `#F7F9FB` |
| Surface (Cards) | `#FFFFFF` |
| Primary | `#091426` (Deep Navy) |
| Action Blue | `#0058BE` |
| Active Blue | `#2170E4` |
| Outline | `#75777D` |
| Card Border | `#E0E3E5` |
| Error / Stop | `#BA1A1A` |
| Font | Inter (400, 500, 600, 700) |
| Card Radius | 16px |
| Input Radius | 12px |
| Chip Radius | 9999px (pill) |
| Shadow L1 | `0 2 4 rgba(0,0,0,0.04)` |
| Shadow L2 | `0 8 16 rgba(0,0,0,0.08)` |

### Brand & Style
The design is **utilitarian yet premium** — focused on the "flow state" of work rather than the chore of tracking it. It uses high-contrast typography, a restrained palette, and glassmorphism navigation to ensure time-stamps and durations are the undisputed heroes of every screen.

---

## 🗄 State Management

All state is managed with **Zustand** and persisted to AsyncStorage automatically.

### `useTimeStore`

```typescript
interface TimeEntry {
  id: string;
  projectId: string;
  startTime: string;       // ISO 8601
  endTime: string | null;  // null = currently running
  pauseMinutes: number;
  notes: string;
  billable: boolean;
}

interface Project {
  id: string;
  name: string;
  client: string;          // displayed in CAPS
  hourlyRate: number;      // EUR
  billable: boolean;
  color: string;           // hex, for chip tinting
}
```

### `useSettingsStore`

```typescript
{
  userName: string;
  userEmail: string;
  hourlyRate: number;           // default 125
  currencySymbol: '€'|'$'|'£'|'CHF';
  weeklyTargetHours: number;    // default 40
  timeFormat: 'HH:MM'|'decimal';
  pushNotifications: boolean;
  weeklyEmailSummary: boolean;
}
```

---

## 🇩🇪 German Labor Law (ArbZG)

The app includes **advisory-only** checks for the *Arbeitszeitgesetz*. Violations appear as a yellow warning banner on the Dashboard — they never block saving entries.

| Section | Rule | Check |
|---|---|---|
| **§3** | Max 10 hours/day | Warns when `todayHours > 10` |
| **§4** | 30-min break after 6h; 45-min after 9h | Checks `pauseMinutes` vs `workingHours` |
| **§5** | Min 11-hour rest between shifts | Compares consecutive entry end/start times |

---

## 📤 Export

| Format | Implementation |
|---|---|
| **PDF-Bericht** | `expo-print` → HTML → PDF → `expo-sharing` native share sheet |
| **CSV-Rohdaten** | German CSV (`;`-delimited) written via `expo-file-system/legacy` → shared |
| **Excel-Tabelle** | Planned for v2 (requires `exceljs`) |

---

## 🔍 TypeScript

```bash
npx tsc --noEmit
# → 0 errors ✅
```

---

## ⚠️ Known Package Version Warnings

The scaffold was initialized with some packages ahead of Expo SDK 54's expected versions. The app runs correctly but Expo may warn at startup:

| Package | Installed | SDK 54 Expected |
|---|---|---|
| `@react-native-async-storage/async-storage` | 3.0.2 | 2.2.0 |
| `expo-file-system` | 55.x | ~19.x |
| `expo-font` | 55.x | ~14.x |
| `expo-haptics` | 55.x | ~15.x |
| `react-native-svg` | 15.15.4 | 15.12.1 |

To align to SDK 54 expected versions:
```bash
npx expo install --fix
```

---

## 🗺 Roadmap

- [ ] **v1.1** — Excel export via `exceljs`
- [ ] **v1.1** — Push notifications for ArbZG violations (`expo-notifications`)
- [ ] **v1.2** — Multiple timer sessions / pause support
- [ ] **v2.0** — Cloud sync (Supabase or Firebase)
- [ ] **v2.0** — Team / multi-user support

---

## 📄 License

Private — all rights reserved.
