# DC-Krishna Residency — Project Context

## 1. Overview & Goal
A mobile-first residential society management app built with the MERN stack + Expo (TypeScript).
- **Core V1 Features:**
  1. **Plots Directory:** Track plot/house numbers, resident/owner details, occupancy status, and contact info.
  2. **Meetings & Event Invites:** Publish society meetings/events, toggle plot-level RSVPs, and schedule local phone reminders.
  3. **Maintenance & Donation Receipts:** Record payments, generate formatted HTML-to-PDF receipts (`RCP-YYYY-NNN`), and share directly via WhatsApp/system share sheet.

---

## 2. Tech Stack & Services
- **Frontend:** React Native, Expo SDK 58 (`expo-router`), TypeScript
  - **Key Packages:** `expo-print`, `expo-sharing`, `expo-file-system`, `expo-notifications`, `expo-updates`, `expo-constants`, `@expo/vector-icons`
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
│   ├── server.js               # Express entry point & route mounting
│   ├── models/
│   │   ├── Plot.js             # Plot/house schema
│   │   ├── Event.js            # Meeting/event & RSVP schema
│   │   └── Receipt.js          # Maintenance/donation receipt schema
│   └── routes/
│       ├── plots.js            # GET /api/plots, POST, PUT, DELETE
│       ├── events.js           # GET /api/events, POST, PATCH /:id/rsvp
│       └── receipts.js         # GET /api/receipts, POST
└── society-app/
    ├── .env                    # Local env: EXPO_PUBLIC_API_URL=[https://dc-krishna.onrender.com/api](https://dc-krishna.onrender.com/api)
    ├── app.json                # Expo config, plugins, runtimeVersion, projectId
    ├── eas.json                # EAS Build (preview -> APK) & OTA channels
    └── src/
        ├── app/
        │   ├── _layout.tsx     # Bottom tab navigation (Plots, Invites, Receipts)
        │   ├── index.tsx       # Plots screen
        │   ├── events.tsx      # Meetings & Invites screen
        │   └── receipts.tsx    # Receipts generation & history screen
        └── services/
            ├── pdfReceipt.ts   # Base64 HTML-to-PDF generation + cache write + share sheet
            └── reminders.ts    # Local scheduled notifications with Expo Go safe fallback

4. Feature Ownership (Vertical Slices)
    Plots & Receipts (Priyansh):

    backend/models/Plot.js, backend/routes/plots.js, society-app/src/app/index.tsx

    backend/models/Receipt.js, backend/routes/receipts.js, society-app/src/app/receipts.tsx, society-app/src/services/pdfReceipt.ts

    Meetings & Event Invites (Collaborator):

    backend/models/Event.js, backend/routes/events.js, society-app/src/app/events.tsx, society-app/src/services/reminders.ts

    Shared Files (Coordinate before editing):

    society-app/src/app/_layout.tsx, backend/server.js, society-app/app.json, society-app/eas.json

5. Technical Quirks & Conventions
    PDF Generation (pdfReceipt.ts): Uses Print.printToFileAsync({ html, base64: true }) and writes via expo-file-system/legacy to FileSystem.cacheDirectory so sharing works identically in both Expo Go and standalone APKs.

    Notifications (reminders.ts): Custom Android notification channels are skipped inside Expo Go (Constants.appOwnership === 'expo') to avoid NullPointerException, and enabled automatically in standalone EAS APK builds.

    Environment Variables: society-app/.env is gitignored. Every collaborator must create society-app/.env locally with EXPO_PUBLIC_API_URL=https://dc-krishna.onrender.com/api.

6. Common Commands
    Run app locally (Expo Go):

    Bash
    cd society-app && npx expo start
    Push live JS/UI updates to installed APKs (OTA):

    Bash
    cd society-app && npx eas-cli update --branch preview --message "Describe change"
    Build a new Android APK (only needed when adding native packages or editing app.json):

    Bash
    cd society-app && npx eas-cli build -p android --profile preview

    Save that as **`CONTEXT.md`** in `D:\Projects\DC-Krishna\`, commit, and push it to `main`:

    ```bash
    git add CONTEXT.md
    git commit -m "Add project CONTEXT.md for collaboration"
    git push origin main