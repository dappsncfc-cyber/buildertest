# White Horse Builders Ltd — Client Project Portal

Single-file client & site-admin portal backed by **Cloud Firestore** (real-time sync) and **Firebase Authentication** (Email/Password & Google Sign-In), with automatic fallback to **Local Demo Mode** (`localStorage`) when no Firebase config is set.

## Quick Firebase Setup

1. **Create a Firebase Project** in the [Firebase Console](https://console.firebase.google.com/).
2. **Enable Cloud Firestore**:
   - Go to **Build → Firestore Database → Create database**.
   - Start in **Test mode** for quick testing, or apply the rules in [`firestore.rules`](./firestore.rules) under the **Rules** tab.
3. **Enable Authentication**:
   - Go to **Build → Authentication → Get started**.
   - Enable **Email/Password** and **Google** sign-in providers.
4. **Register a Web App & Copy Config**:
   - Go to **Project Settings → Your apps → Add app (`</>`)**.
   - Copy the `firebaseConfig` object.
5. **Connect the Portal**:
   - **Option A (UI Setup):** Open `index.html`, click **Firebase** (or the `Local Demo` pill) in the top bar, paste your `firebaseConfig`, and click **Save & Connect**. Click **Seed Demo Projects** if your Firestore `projects` collection is empty.
   - **Option B (Hardcode for Hosting):** Replace `DEFAULT_FIREBASE_CONFIG` in `index.html` with your `firebaseConfig` object.

## Firestore Data Structure

- `projects/{projectId}` — Stores each project's state (`proj-1`, `proj-2`), including `photos`, `documents`, `variations`, `payments`, `messages`, `progress`, and `diaryNote`. Real-time updates sync via `onSnapshot`.
- `users/{uid}` — Stores user profile and `role` (`client` or `builder`).
