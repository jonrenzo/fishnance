<USER_REQUEST>
read and analyze this implementation plan:
# Fishnance Web — Complete Implementation Plan

## What We're Building

A pixel-faithful web port of **Fishnance**, a personal finance tracker originally built with
Expo/React Native for the Philippine market. The web version must look identical to the mobile app
on a phone browser (360–430 px wide) and be deployable to Vercel. No authentication — single-user
personal app. All data is stored server-side in a hosted SQLite database (Turso).

---

## 1. Tech Stack

| Concern | Choice | Version |
|---------|--------|---------|
| Framework | Next.js (App Router) | 15.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| ORM | Drizzle ORM | 0.38.x |
| Database | Turso (libSQL / hosted SQLite) | latest |
| Icons | Lucide React | latest |
| Date utils | date-fns | 4.x |
| Fuzzy search | fuse.js | 7.x |
| Deployment | Vercel | — |
| Font | Plus Jakarta Sans (Google Fonts) | — |

---

## 2. Project Setup

```bash
npx create-next-app@latest fishnance-web --typescript --tailwind --app --src-dir --no-eslint --import-alias "@/*"
cd fishnance-web
npm install drizzle-orm @libsql/client drizzle-kit
npm install lucide-react date-fns fuse.js
npm install @libsql/client
```

Create `.env.local`:
```
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
```

---

## 3. Design System (Tailwind config / CSS variables)

All colors used throughout the app. Put these in `globals.css` as CSS variables AND configure
`tailwind.config.ts` to extend with these tokens.

```css
/* globals.css */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');

:root {
  --teal:       #0D9DA8;
  --teal-light: #15C2CF;
  --teal-dark:  #0A7A84;
  --coral:      #F97B5A;
  --income:     #22C55E;
  --expense:    #EF4444;
  --warning:    #EAB308;
  --bg:         #F6FAFA;
  --surface:    #FFFFFF;
  --card:       #FFFFFF;
  --border:     #E8F4F5;
  --border-mid: #C8E6E8;
  --text:       #0F2426;
  --muted
<truncated 45214 bytes>
 as `150050`
  - Display: divide by 100 and format with 2 decimal places
- **Balance calculation** — always computed from transactions, never stored.
  - Income + incoming transfers = credits
  - Expenses + outgoing transfers = debits
  - Balance = credits − debits

---

## 19. Key Behavioral Differences from Mobile App

| Mobile | Web |
|--------|-----|
| expo-router file routing | Next.js App Router |
| SQLite local (expo-sqlite) | Turso remote SQLite |
| expo-image-picker for avatar | `<input type="file" accept="image/*">` |
| expo-file-system for export | Blob + URL.createObjectURL download |
| DocumentPicker for import | `<input type="file" accept=".json">` |
| Alert.alert() for confirms | `window.confirm()` or custom modal |
| useFocusEffect for refresh | `revalidatePath` + RSC re-render |
| react-native Image | HTML `<img>` |
| SF Symbols (iOS only) | Lucide React |
| SafeAreaView | CSS `padding: env(safe-area-inset-*)` |
| Modal from react-native | Custom bottom-sheet div |
| ScrollView horizontal | `overflow-x-auto flex` |
| StyleSheet | Tailwind CSS classes |

---

## 20. File Import Notes for the AI

When implementing, these are the files that need Fuse.js fuzzy search:
- `src/lib/bankLogos.ts` imports from `fuse.js`

Files that should be Server Components (no `'use client'`):
- `src/app/page.tsx` — reads data, passes to client children
- `src/app/accounts/page.tsx`
- `src/app/plan/page.tsx`
- `src/app/settings/page.tsx`
- `src/app/account/[id]/page.tsx`

Files that must be Client Components (`'use client'`):
- `src/components/BottomNav.tsx` — uses `usePathname`
- `src/components/SegmentedToggle.tsx` — interactive
- `src/components/Modal.tsx` — interactive
- `src/components/BrandLogo.tsx` — manages image error state
- All form pages (`/account/new`, `/account/[id]/edit`, `/add`, `/onboarding`, `/coach`)
- Any page that calls Server A
<truncated 1982 bytes>

NOTE: The output was truncated because it was too long. Use a more targeted query or a smaller range to get the information you need.