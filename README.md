# ⏱ Arbeitszeit-Rechner

> A German work-hour tracking mobile app built with **React Native + Expo Router**, targeting iOS and Android.

Designed for everyday workers — nurses, physiotherapists, cleaners, and anyone who tracks shifts. Simple, accessible, and fast. All data is stored **locally on-device** via AsyncStorage (no backend required). Cloud sync and employer dashboard are planned for v2.

---

## 📱 Screens

| Dashboard | Aktivität | Berichte | Einstellungen |
|---|---|---|---|
| Live timer, weekly progress bar, stat cards, ArbZG warnings, recent entries | Time entries grouped by day, Schichten / Aufträge toggle, search | Date range reports with native date pickers, bar chart, project filter, PDF/CSV export | Profile editing, language, theme, pay settings, ArbZG info |

---

## ✨ Features

- **Live Timer** — start/stop with haptic feedback, shows elapsed HH:MM:SS
- **Manual Entry** — native date & time pickers (spinner on iOS, dialog on Android)
- **Weekly Progress** — progress bar with Mo–Fr day labels, respects time format setting
- **ArbZG Compliance** — advisory warnings for §3 (10h/day), §4 (break rules), §5 (11h rest)
- **Reports** — PDF and CSV export with native share sheet
- **Dark Mode** — full Light / Dark / Auto (system) theme with 3-option dropdown
- **Bilingual** — Deutsch 🇩🇪 and English 🇬🇧, switchable at runtime
- **Editable Profile** — name and email, shown as initials avatar across all screens
- **Pay Settings** — hourly rate, currency (€ / $ / £ / CHF), weekly target hours
- **Swipeable Deletion** — time entries and jobs can be deleted

---

### Run Development Build

Since this project uses custom native modules, you **cannot** use standard Expo Go. You must use a **Development Build**.

**Build & Run on Android Emulator:**
```bash
export JAVA_HOME=$(pwd)/.java17/jdk-17.0.14+7/Contents/Home
npx expo run:android
```

**Build & Run on iOS Simulator:**
```bash
npx expo run:ios
```

---

## 📦 Building the App (EAS)

### Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

### Preview build (internal testing)

```bash
# Android — produces a sideloadable .apk
eas build -p android --profile preview --local

# iOS — produces an ad-hoc .ipa
eas build -p ios --profile preview

# iOS — produces an ad-hoc .ipa (Local)
eas build -p ios --profile preview --local
```

### Production build (store submission)

```bash
# Android — produces a signed .aab for Google Play
eas build -p android --profile production

# iOS — produces a signed .ipa for App Store
eas build -p ios --profile production

# Both platforms at once
eas build --platform all --profile production

# For iOS signed local build:
eas build --profile production --platform ios --local

# For Android signed local build:
eas build --profile production --platform android --local
```


### Version bump before production

Update `app.json` before each release:

```json
{
  "expo": {
    "version": "1.1.0",
    "android": { "versionCode": 2 },
    "ios": { "buildNumber": "2" }
  }
}
```

---

## 🗂 Project Structure

```
arbeitszeit-rechner/
├── app/
│   ├── _layout.tsx              # Root layout: Inter fonts, SafeAreaProvider, SplashScreen
│   └── (tabs)/
│       ├── _layout.tsx          # 4-tab navigator with custom BottomTabBar
│       ├── index.tsx            # Dashboard — timer, weekly progress, stat cards, recent entries
│       ├── aktivitat.tsx        # Aktivität — Schichten & Aufträge toggle view
│       ├── berichte.tsx         # Berichte — analytics, date pickers, export
│       └── einstellungen.tsx    # Einstellungen — profile, language, theme, pay
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
│   ├── FAB.tsx                  # Floating action button, safe-area-aware positioning
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
│   ├── useTimeStore.ts          # Zustand: entries, projects, active timer (AsyncStorage)
│   └── useSettingsStore.ts      # Zustand: profile, theme, language, pay settings
│
└── utils/
    ├── formatTime.ts            # HH:MM:SS, formatDuration, German dates, earnings
    ├── germanLaborLaw.ts        # ArbZG §3/§4/§5 advisory checks
    └── exportHelpers.ts         # CSV + PDF generation + expo-sharing
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- iOS Simulator (Xcode) or Android Emulator (Android Studio), **or** [Expo Go](https://expo.dev/go) on a physical device

### Install

```bash
npm install --legacy-peer-deps
```

### Run

```bash
npx expo start --clear
```

| Key | Action |
|---|---|
| `i` | Open iOS Simulator |
| `a` | Open Android Emulator |
| Scan QR | Open in Expo Go on device |

---

## 📦 Key Dependencies

| Package | Purpose |
|---|---|
| `expo-router` | File-based navigation |
| `zustand` | State management |
| `@react-native-async-storage/async-storage` | On-device persistence |
| `@react-native-community/datetimepicker` | Native date & time pickers |
| `@expo-google-fonts/inter` | Inter 400/500/600/700 |
| `expo-haptics` | Haptic feedback on timer toggle |
| `expo-print` | PDF generation |
| `expo-sharing` | Native share sheet |
| `expo-file-system` | CSV file writing |
| `react-native-svg` | Bar charts in reports |
| `date-fns` | German locale date formatting |
| `react-native-safe-area-context` | Safe area insets |
| `@expo/vector-icons` | Ionicons |

---

## 🎨 Design System

### Light Mode
| Token | Value |
|---|---|
| Background | `#F7F9FB` |
| Surface | `#FFFFFF` |
| Action Blue | `#0058BE` |
| Outline | `#75777D` |

### Dark Mode
| Token | Value |
|---|---|
| Background | `#0F1117` |
| Surface | `#1A1D25` |
| Action Blue | `#4A90E2` |
| Outline | `#8A8D95` |

- **Font:** Inter (400, 500, 600, 700)
- **Card Radius:** 16px · **Input Radius:** 12px · **Chip Radius:** 9999px
- **Shadows:** L1 `0 2 4 rgba(0,0,0,0.04)` · L2 `0 8 16 rgba(0,0,0,0.08)`

---

## 🗄 Data Model

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
  client: string;
  hourlyRate: number;
  billable: boolean;
  color: string;           // hex, for chip tinting
}
```

### `useSettingsStore`

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

---

## 🇩🇪 German Labor Law (ArbZG)

Advisory-only checks — violations show a yellow warning banner on the Dashboard and never block saving.

| Section | Rule | Check |
|---|---|---|
| **§3** | Max 10 hours/day | Warns when `todayHours > 10` |
| **§4** | 30-min break after 6h; 45-min after 9h | Checks `pauseMinutes` vs `workingHours` |
| **§5** | Min 11-hour rest between shifts | Compares consecutive entry end/start times |

---

## 📤 Export

| Format | Implementation |
|---|---|
| **PDF** | `expo-print` → HTML → PDF → `expo-sharing` |
| **CSV** | German `;`-delimited via `expo-file-system` → shared |
| **Excel** | Planned — v1.1 |

---

## 🗺 Roadmap

| Version | Feature |
|---|---|
| **v1.1** | Excel export via `exceljs` |
| **v1.1** | Push notifications for ArbZG violations |
| **v2.0** | Firebase backend + user authentication |
| **v2.0** | Multi-device sync |
| **v2.0** | Employer web dashboard (Next.js) |

> 📄 See **[next-features.md](./next-features.md)** for the full v2.0 architecture, Firestore data model, employer dashboard feature list, and migration plan.

---

## 📄 License

Private — all rights reserved © Munichsoft
