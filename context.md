```markdown
# DC-Krishna Residency — Project Context

## 1. Overview & Goal
A mobile-first residential society management app built with the MERN stack + Expo (TypeScript) exclusively for the **Krishna wing** (`A` and `B` series plots).
- **Core Features:**
  1. **Plots Directory:** Track Krishna wing plot/house numbers, resident/owner details, occupancy status, vehicles, and contact info.
  2. **Meetings & Event Invites:** Publish society meetings/events with native calendar & time selection, toggle plot-level RSVPs, and schedule local phone reminders.
  3. **Maintenance & Donation Receipts:** Record payments, generate formatted HTML-to-PDF receipts (`RCP-YYYY-NNN`), and share directly via WhatsApp/system share sheet.
  4. **Two-Tier Authentication (Krishna Plot Login + Committee Admin PIN):**
     - **Resident Plot Login:** Only registered Krishna wing plots (`A1–A50`, `B1–B130`) can claim an account (verified via the last 4 digits of the registered owner/tenant mobile number) and log in using their Plot No and personal password.
     - **Committee Admin PIN:** Committee members unlock administrative write actions (`+ Add Plot`, `+ Create Event`, `+ New Receipt`, password resets) via a shared Committee PIN.
- **Upcoming V2 Roadmap (In Progress):**
  - **Frontend Plot Login UI:** Wiring `AuthContext.tsx` and the Login / Claim Plot screen to `/api/auth/check-plot`, `/setup-password`, and `/login`.
  - **Polls:** One-vote-per-plot society polls enforced via the logged-in resident's `plotNo`.
  - **Private Complaint Box:** Resident-submitted complaints visible strictly to the submitting plot and Committee Admins.

---

## 2. Tech Stack & Services
- **Frontend:** React Native, Expo SDK 58 (`expo-router`), TypeScript (`moduleResolution: "bundler"`)
  - **Key Packages:** `expo-print`, `expo-sharing`, `expo-file-system`, `expo-notifications`, `expo-updates`, `expo-constants`, `@expo/vector-icons`, `@react-native-community/datetimepicker`
- **Backend:** Node.js, Express.js, Mongoose (uses built-in Node `crypto` for `scrypt` password hashing and HMAC session tokens—zero extra auth dependencies)
- **Database:** MongoDB Atlas
- **Hosting & Builds:**
  - **Live Backend API:** `https://dc-krishna.onrender.com/api` (Render free tier; initial request after 15m idle takes ~30–50s to wake up)
  - **Expo Account / Project:** `@dc-krishna/dc-krishna`
  - **Android Package:** `com.dckrishna.societyapp`
  - **OTA Update Channel:** `preview`

---

## 3. Repository Structure
```text
DC-Krishna/
├── CONTEXT.md
├── backend/
│   ├── server.js               # Express entry point & route mounting (/plots, /events, /receipts, /auth)
│   ├── middleware/
│   │   ├── adminAuth.js        # Validates x-admin-pin header against process.env.ADMIN_PIN
│   │   └── residentAuth.js     # Verifies Authorization: Bearer <token> & attaches req.resident.plotNo
│   ├── models/
│   │   ├── Plot.js             # Plot schema (includes passwordHash + pre-save plotNo normalization)
│   │   ├── Event.js            # Meeting/event & RSVP schema
│   │   └── Receipt.js          # Maintenance/donation receipt schema
│   ├── routes/
│   │   ├── auth.js             # /verify-pin, /check-plot, /setup-password, /login, /reset-plot-password
│   │   ├── plots.js            # GET /api/plots (open), POST/PUT/DELETE (requireAdmin)
│   │   ├── events.js           # GET /api/events & PATCH /:id/rsvp (open), POST/PUT/DELETE (requireAdmin)
│   │   └── receipts.js         # GET /api/receipts (open), POST (requireAdmin)
│   └── utils/
│       └── plotHelper.js       # normalizePlotNo() ("b-075" -> "B75") & isValidKrishnaFormat() (A/B series)
└── society-app/
    ├── .env                    # Local env: EXPO_PUBLIC_API_URL=[https://dc-krishna.onrender.com/api](https://dc-krishna.onrender.com/api)
    ├── app.json                # Expo config, plugins, runtimeVersion, projectId
    ├── eas.json                # EAS Build (preview -> APK) & OTA channels
    ├── tsconfig.json           # Uses "moduleResolution": "bundler" for RN 0.88 types
    └── src/
        ├── theme.ts            # Centralized design tokens (colors, spacing, radius, sharedStyles)
        ├── config/
        │   └── api.ts          # Exports API_BASE_URL (with Render fallback for EAS OTA builds)
        ├── app/
        │   ├── _layout.tsx     # AuthProvider wrapper, bottom tabs & header Resident/Admin PIN toggle
        │   ├── index.tsx       # Plots screen (centered Add Plot modal, admin-gated)
        │   ├── events.tsx      # Meetings & Invites screen (native DateTimePicker, admin-gated create)
        │   └── receipts.tsx    # Receipts generation & history screen (admin-gated create)
        ├── components/
        │   └── AppInput.tsx    # Reusable TextInput wrapper (dark text & visible placeholders on Android)
        ├── context/
        │   └── AuthContext.tsx # Global isAdmin, adminPin, unlockAdmin(), lockAdmin() state
        └── services/
            ├── pdfReceipt.ts   # Base64 HTML-to-PDF generation + cache write + share sheet
            └── reminders.ts    # Local scheduled notifications with Expo Go safe fallback

```

---

## 4. Feature Ownership (Vertical Slices)

* **Plots, Receipts, Auth & Theme Infrastructure (Priyansh):**
* `backend/models/Plot.js`, `backend/routes/plots.js`, `society-app/src/app/index.tsx`
* `backend/models/Receipt.js`, `backend/routes/receipts.js`, `society-app/src/app/receipts.tsx`, `society-app/src/services/pdfReceipt.ts`
* `backend/routes/auth.js`, `backend/middleware/adminAuth.js`, `backend/middleware/residentAuth.js`, `backend/utils/plotHelper.js`
* `society-app/src/theme.ts`, `society-app/src/config/api.ts`, `society-app/src/context/AuthContext.tsx`, `society-app/src/components/AppInput.tsx`


* **Meetings & Event Invites (Dhruval):**
* `backend/models/Event.js`, `backend/routes/events.js`, `society-app/src/app/events.tsx`, `society-app/src/services/reminders.ts`


* **Shared Files (Coordinate before editing):**
* `society-app/src/app/_layout.tsx`, `backend/server.js`, `society-app/app.json`, `society-app/eas.json`, `society-app/tsconfig.json`



---

## 5. Authentication & Admin Gating

* **How to Gate Admin Actions in Any Screen:**
1. Call `const { isAdmin, adminPin } = useAuth();` **inside** the screen component body (never at the top level of the file).
2. Hide write buttons behind `{isAdmin && (...)}`.
3. Include `'x-admin-pin': adminPin` in the `headers` object of admin `POST` / `PUT` / `DELETE` `fetch` requests.


* **Krishna Plot Authentication (`backend/routes/auth.js`):**
* Plot numbers are normalized via `normalizePlotNo()` (`"b-113"` / `"B 113"` → `"B113"`) and restricted to Krishna wing (`A1–A50`, `B1–B130`).
* First-time setup (`POST /api/auth/setup-password`) verifies the last 4 digits of the registered owner/tenant mobile number before hashing the personal password with `crypto.scryptSync`.
* Protected resident endpoints use `requireResident` (`Authorization: Bearer <token>`), exposing `req.resident.plotNo`.


* **Backend Configuration:** `ADMIN_PIN` (and optional `JWT_SECRET`) must be set in both local `backend/.env` and Render's **Environment Variables** dashboard.

---

## 6. Technical Quirks & Conventions

* **Styling & Design Tokens (`theme.ts`):** Always use `StyleSheet` with `colors`, `spacing`, `radius`, and `sharedStyles` from `src/theme.ts` (avoid Tailwind/NativeWind and avoid hardcoding hex colors in screens).
* **API URLs (`config/api.ts`):** Import `API_BASE_URL` from `src/config/api.ts` instead of reading `process.env.EXPO_PUBLIC_API_URL` directly in screens, ensuring OTA builds always resolve to `https://dc-krishna.onrender.com/api`.
* **Android Input Legibility (`AppInput.tsx`):** Always use `<AppInput>` instead of raw `<TextInput>` so placeholder text and typed input remain clearly legible on Android in both light and dark system themes.
* **Centered Modals:** Wrap popup modals in `<KeyboardAvoidingView style={styles.modalOverlay}>` → `<View style={styles.modalBox}>` → `<ScrollView>` (do not nest duplicate `modalOverlay` views).
* **Mongoose 8+ Hooks (`Plot.js`):** Synchronous `pre("save")` hooks must **not** accept or invoke `next()`; mutate `this` directly inside `function () { ... }`.
* **Native Date & Time Picker (`events.tsx`):** Uses `@react-native-community/datetimepicker` with `minimumDate={new Date()}`. Because this adds native Android code, a fresh EAS APK build (`eas build -p android --profile preview`) is required before pushing future OTA updates to standalone APKs.
* **PDF Generation (`pdfReceipt.ts`):** Uses `Print.printToFileAsync({ html, base64: true })` and writes via `expo-file-system/legacy` to `FileSystem.cacheDirectory` so sharing works identically in both Expo Go and standalone APKs.
* **Notifications (`reminders.ts`):** Custom Android notification channels are skipped inside Expo Go (`Constants.appOwnership === 'expo'`) to avoid `NullPointerException`, and enabled automatically in standalone EAS APK builds.
* **Environment Variables:** `society-app/.env` and `backend/.env` are gitignored. Every collaborator must maintain local `.env` files with `EXPO_PUBLIC_API_URL=https://dc-krishna.onrender.com/api` (frontend) and `ADMIN_PIN=<pin>` (backend).

---

## 7. Common Commands

* **Run backend locally:**
```bash
cd backend && node server.js

```


* **Run app locally (Expo Go):**
```bash
cd society-app && npx expo start

```


* **Push live JS/UI updates to installed APKs (OTA):**
```bash
cd society-app && npx eas-cli update --branch preview --platform android --message "Describe change"

```


* **Build a new Android APK (needed when adding native packages like datetimepicker or editing app.json):**
```bash
cd society-app && npx eas-cli build -p android --profile preview

```



```

Save this to `CONTEXT.md`, then commit and push:
```bash
git add CONTEXT.md
git commit -m "docs: update CONTEXT.md with theme tokens and Krishna plot auth"
git push origin main

```