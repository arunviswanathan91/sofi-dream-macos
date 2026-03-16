# ✦ Sofi Dream App

Premium Android mobile app for Sofie's custom embroidery and handmade goods business.

Built with **Expo (React Native) + TypeScript + Firebase Firestore**.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Download fonts
```bash
bash scripts/download-fonts.sh
```

This downloads Playfair Display, DM Sans, and DM Mono from Google Fonts into `assets/fonts/`.

### 3. Set up Firebase

Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com) and:
1. Enable **Firestore Database** (in production mode)
2. Enable **Storage**
3. Download `google-services.json` → place in project root
4. Create `.env.local` with your config:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=sofi-dream.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=sofi-dream
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=sofi-dream.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Run the app
```bash
npx expo start --android
```

---

## 📦 Build APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS (first time)
eas build:configure

# Build APK (direct install)
eas build --platform android --profile preview

# Build AAB (Play Store)
eas build --platform android --profile production
```

---

## 📁 Project Structure

```
sofi-dream/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Dashboard
│   │   ├── orders.tsx         # Orders List
│   │   ├── track.tsx          # Craft Tracking
│   │   └── settings.tsx       # Settings
│   ├── order/
│   │   ├── new.tsx            # Add Order
│   │   ├── [id].tsx           # Order Detail
│   │   └── edit/[id].tsx      # Edit Order
│   ├── customers/[id].tsx     # Customer Profile
│   ├── reports/index.tsx      # Reports Screen
│   ├── notifications.tsx      # Notification Settings
│   └── _layout.tsx            # Root layout
├── components/
│   ├── CountdownTimer.tsx     # Live countdown with urgency colors
│   ├── OrderCard.tsx          # Order list item card
│   ├── StatusBadge.tsx        # Order status pill
│   ├── TagChip.tsx            # Tag/category chip
│   ├── EarningsChart.tsx      # Revenue charts
│   ├── InvoicePreview.tsx     # Invoice generator
│   ├── StatTile.tsx           # Dashboard stat tile
│   ├── SectionHeader.tsx      # Section header with action
│   └── FAB.tsx                # Floating action button
├── hooks/
│   ├── useOrders.ts           # Firestore CRUD for orders
│   ├── useCountdown.ts        # Live countdown timer
│   ├── useNotifications.ts    # Push notification management
│   ├── useReports.ts          # Analytics & report generation
│   ├── useCategories.ts       # Craft category management
│   └── useCustomers.ts        # Customer rolodex
├── lib/
│   ├── firebase.ts            # Firebase setup + offline persistence
│   ├── notifications.ts       # Expo Notifications helpers
│   ├── reports.ts             # Report + invoice HTML generators
│   └── theme.ts               # Design system tokens
├── types/
│   └── index.ts               # TypeScript types
└── assets/
    └── fonts/                 # Custom fonts (run download-fonts.sh)
```

---

## 🎨 Design System

| Token | Value | Use |
|-------|-------|-----|
| `--cream` | `#FAF7F2` | Backgrounds |
| `--rose` | `#C97B5A` | Primary accent, CTAs |
| `--gold` | `#D4A853` | Highlights, Request status |
| `--sage` | `#8BAF8D` | Success, Delivered |
| `--sky` | `#A3C4D4` | Shipped state |
| `--bark` | `#3D2B1F` | Headers, primary text |
| `--coral` | `#E07B6A` | Urgent/warning |

---

## 🔔 Notification Types

1. **Due Soon Alert** — configurable days before due date
2. **Ship It Reminder** — X days after accepting
3. **Daily Digest** — morning summary (configurable time)
4. **Weekly Summary** — weekly revenue recap
5. **Payment Reminder** — unpaid orders X days after delivery

---

## ✅ Features

- [x] Full order lifecycle: Request → Accepted → Shipped → Delivered
- [x] Live countdown timers with urgency color coding
- [x] Push notifications with full user configurability
- [x] Craft category system with revenue tracking
- [x] Customer rolodex auto-built from order history
- [x] PDF invoice generation + sharing
- [x] Weekly/monthly PDF reports
- [x] Revenue charts (line + bar)
- [x] Offline-first (Firebase IndexedDB persistence)
- [x] Photo attachments (camera/gallery)
- [x] Search, filter, and sort orders
- [x] Settings: business profile, theme, currency

---

*Built for Sofie. Crafted with love. ✦*
