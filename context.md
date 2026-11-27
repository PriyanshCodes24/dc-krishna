```markdown
# DC-Krishna Residency — Project Context

## 1. Overview & Goal
A mobile-first residential society management app built with the MERN stack + Expo (TypeScript).
- **Core V1 Features:**
  1. **Plots Directory:** Track plot/house numbers, resident/owner details, occupancy status, and contact info.
  2. **Meetings & Event Invites:** Publish society meetings/events with native calendar & time selection, toggle plot-level RSVPs, and schedule local phone reminders.
  3. **Maintenance & Donation Receipts:** Record payments, generate formatted HTML-to-PDF receipts (`RCP-YYYY-NNN`), and share directly via WhatsApp/system share sheet.
  4. **Role-Based Access (Resident vs. Committee Admin):** App opens in read-only Resident mode by default (allowing browsing and event RSVPs with zero signup friction); committee members unlock write actions (`+ Add Plot`, `+ Create Event`, `+ New Receipt`) via a shared Committee PIN.

---

## 2. Tech Stack & Services
- **Frontend:** React Native, Expo SDK 58 (`expo-router`), TypeScript (`moduleResolution: "bundler"`)
  - **Key Packages:** `expo-print`, `expo-sharing`, `expo-file-system`, `expo-notifications`, `expo-updates`, `expo-constants`, `@expo/vector-icons`, `@react-native-community/datetimepicker`
- **Backend:** Node.js, Express.js, Mongoose
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
│   ├── server.js               # Express entry point, route mounting & POST /api/auth/verify-pin
│   ├── middleware/
│   │   └── adminAuth.js        # Validates x-admin-pin header against process.env.ADMIN_PIN
│   ├── models/
│   │   ├── Plot.js             # Plot/house schema
│   │   ├── Event.js            # Meeting/event & RSVP schema
│   │   └── Receipt.js          # Maintenance/donation receipt schema
│   └── routes/
│       ├── plots.js            # GET /api/plots (open), POST/PUT/DELETE (requireAdmin)
│       ├── events.js           # GET /api/events & PATCH /:id/rsvp (open), POST/PUT/DELETE (requireAdmin)
│       └── receipts.js         # GET /api/receipts (open), POST (requireAdmin)
└── society-app/
    ├── .env                    # Local env: EXPO_PUBLIC_API_URL=[https://dc-krishna.onrender.com/api](https://dc-krishna.onrender.com/api)
    ├── app.json                # Expo config, plugins, runtimeVersion, projectId
    ├── eas.json                # EAS Build (preview -> APK) & OTA channels
    ├── tsconfig.json           # Uses "moduleResolution": "bundler" for RN 0.88 types
    └── src/
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

* **Plots, Receipts & Auth Infrastructure (Priyansh):**
* `backend/models/Plot.js`, `backend/routes/plots.js`, `society-app/src/app/index.tsx`
* `backend/models/Receipt.js`, `backend/routes/receipts.js`, `society-app/src/app/receipts.tsx`, `society-app/src/services/pdfReceipt.ts`
* `backend/middleware/adminAuth.js`, `society-app/src/context/AuthContext.tsx`, `society-app/src/components/AppInput.tsx`


* **Meetings & Event Invites (Dhruval):**
* `backend/models/Event.js`, `backend/routes/events.js`, `society-app/src/app/events.tsx`, `society-app/src/services/reminders.ts`


* **Shared Files (Coordinate before editing):**
* `society-app/src/app/_layout.tsx`, `backend/server.js`, `society-app/app.json`, `society-app/eas.json`, `society-app/tsconfig.json`



---

## 5. Authentication & Admin Gating (`AuthContext` + `adminAuth.js`)

* **How to Gate Admin Actions in Any Screen:**
1. Call `const { isAdmin, adminPin } = useAuth();` **inside** the screen component body (never at the top level of the file).
2. Hide write buttons behind `{isAdmin && (...)}`.
3. Include `'x-admin-pin': adminPin` in the `headers` object of admin `POST` / `PUT` / `DELETE` `fetch` requests.


* **Backend Configuration:** `ADMIN_PIN` must be set in both local `backend/.env` and Render's **Environment Variables** dashboard.

---

## 6. Technical Quirks & Conventions

* **Android Input Legibility (`AppInput.tsx`):** Always use `<AppInput>` instead of raw `<TextInput>` so placeholder text and typed input remain clearly legible on Android in both light and dark system themes.
* **Centered Modals:** Wrap popup modals in `<KeyboardAvoidingView style={styles.modalOverlay}>` → `<View style={styles.modalBox}>` → `<ScrollView>` (do not nest duplicate `modalOverlay` views).
* **Native Date & Time Picker (`events.tsx`):** Uses `@react-native-community/datetimepicker` with `minimumDate={new Date()}`. Because this adds native Android code, a fresh EAS APK build (`eas build -p android --profile preview`) is required before pushing future OTA updates to standalone APKs.
* **PDF Generation (`pdfReceipt.ts`):** Uses `Print.printToFileAsync({ html, base64: true })` and writes via `expo-file-system/legacy` to `FileSystem.cacheDirectory` so sharing works identically in both Expo Go and standalone APKs.
* **Notifications (`reminders.ts`):** Custom Android notification channels are skipped inside Expo Go (`Constants.appOwnership === 'expo'`) to avoid `NullPointerException`, and enabled automatically in standalone EAS APK builds.
* **Environment Variables:** `society-app/.env` and `backend/.env` are gitignored. Every collaborator must maintain local `.env` files with `EXPO_PUBLIC_API_URL=https://dc-krishna.onrender.com/api` (frontend) and `ADMIN_PIN=<pin>` (backend).

---

## 7. Common Commands

* **Run app locally (Expo Go):**
```bash
cd society-app && npx expo start

```


* **Push live JS/UI updates to installed APKs (OTA):**
```bash
cd society-app && npx eas-cli update --branch preview --message "Describe change"

```


* **Build a new Android APK (needed when adding native packages like datetimepicker or editing app.json):**
```bash
cd society-app && npx eas-cli build -p android --profile preview

```



```

Once saved, commit and push:
```bash
git add CONTEXT.md
git commit -m "docs: update CONTEXT.md with Committee PIN auth and AppInput conventions"
git push origin main

```