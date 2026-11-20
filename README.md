# Switchland.in — Land & Plot Store

Mobile-first land browsing and comparison for Hyderabad, Boduppal and Yadagirigutta. The current React frontend uses Firebase Authentication (email/password) and Cloud Firestore directly; Vercel hosts the frontend, while Firebase hosts authentication and data.

> The ten sample plots are illustrative demo data. They are not verified offers, legal advice, or guarantees of title, approval, utilities, distance, availability, or value. The comparison graph shows hypothetical 3%, 5%, and 8% annual compounding scenarios, not a price forecast.

## What runs where

- **Vercel:** React/Vite website, deployed from the `client` directory.
- **Firebase Authentication:** email/password accounts for the website.
- **Cloud Firestore:** public plot listings, private customer profiles, enquiries, and admin roles.
- **Legacy optional backend:** `server/` and `server/sql/` contain the earlier Express/PostgreSQL implementation. The current Firebase-connected frontend does not call that API, so PostgreSQL does not need to be deployed for the current site.

## One-time Firebase project setup

Use the existing project ID: `switchland-b58a0`. No service-account key or Firebase Admin credential belongs in the browser or in Vercel.

1. Open the [Firebase Console](https://console.firebase.google.com/) and select `switchland-b58a0`.
2. In **Project settings → General → Your apps**, add a **Web app** (or select the existing web app). The supplied web configuration is already in `client/.env.example`; confirm it matches the app shown in the console.
3. In **Build → Authentication → Get started → Sign-in method**, enable **Email/Password**.
4. In **Build → Firestore Database**, create a database in **Native mode**. Choose the region closest to your customers; the database region cannot be changed later.
5. In **Build → Storage**, create the default Storage bucket. This is required for admin photo uploads and may require the Firebase project to use the Blaze billing plan. Set up billing limits/alerts before using it.
6. In **Authentication → Settings → Authorized domains**, ensure `localhost`, your Vercel `*.vercel.app` hostname, and your production custom domain are allowed.

## Local setup (Windows PowerShell)

From the repository folder:

```powershell
Set-Location .\client
npm install
Copy-Item .env.example .env
```

The example file is prefilled with the Firebase web configuration supplied for this project. Verify it against **Project settings → Your apps**, then run the dev server:

```powershell
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`). Restart the dev server after changing `.env`.

The web API key and app ID are public client configuration, not server secrets. Firebase Security Rules protect the data. Never put a service-account JSON file, private key, or Admin SDK credential in `client/`, a `VITE_` variable, or source control.

## Deploy Firestore rules and indexes

The repository includes `firebase.json`, `.firebaserc`, `firestore.rules`, and `firestore.indexes.json`. After creating the Firestore database and installing Node.js, open PowerShell at the repository root and run:

```powershell
npx -y firebase-tools@latest login
npx -y firebase-tools@latest use switchland-b58a0
npx -y firebase-tools@latest deploy --only firestore:rules,firestore:indexes,storage
```

Sign in to the Google account that has access to this Firebase project. Review the project ID shown before confirming a deployment. If the CLI reports that it cannot find a database, finish creating Firestore in the Firebase Console first.

Rules intentionally allow public reads only for `available` lands and location suggestions, let users read/write only their own profile and enquiries, validate listing and enquiry fields, and reserve listing/location management for admins. Admin documents cannot be created or edited by website users.

## Create the first admin and seed the ten demo plots

1. Start the website and create your own account through **Create account**.
2. In Firebase Console, open **Authentication → Users**, copy your account's UID.
3. Open **Firestore Database → Data** and create a collection named `admins`. Add a document whose document ID is that exact UID, for example:

   ```text
   Collection: admins
   Document ID: <your Firebase Auth UID>
   Field: role (string) = admin
   ```

   Do this only for trusted staff. Firestore checks whether `admins/{uid}` exists; Storage upload rules also require its `role` field to equal `admin`. Client-side rules deny writes to this collection, so bootstrap it in the Firebase Console. Never hardcode an admin password or grant admin access based on a username/email alone; only add trusted Firebase Authentication UIDs. If an admin password was shared or exposed, rotate it in Firebase Authentication.

4. Sign out and sign back in. Open `/admin` and choose **Seed demo plots & Telangana locations**. It inserts only missing sample documents, so it can safely be run again without overwriting existing listings.
5. Use **Add a plot** to create listings with plot specs, water/market distances, GPS coordinates, a cover photo, gallery images, and an optional true 360° panorama. On supported phones, the cover-photo chooser can open the camera. A regular camera photo is not a 360° panorama. Uploads accept image files up to 25 MB each.
6. The listing dashboard shows published lands and lets an admin mark them available or sold. Verify every title, approval, utility, distance, and map pin before publishing real land.

## Deploy the website to Vercel

1. Import the repository in Vercel and set **Root Directory** to `client`.
2. Use build command `npm run build` and output directory `dist` (Vercel normally detects Vite automatically).
3. In **Project → Settings → Environment Variables**, add these for Production (and Preview/Development if needed):

   ```text
   VITE_FIREBASE_API_KEY=<apiKey from Firebase web app config>
   VITE_FIREBASE_AUTH_DOMAIN=<authDomain from Firebase web app config>
   VITE_FIREBASE_PROJECT_ID=switchland-b58a0
   VITE_FIREBASE_APP_ID=<appId from Firebase web app config>
   VITE_FIREBASE_STORAGE_BUCKET=switchland-b58a0.firebasestorage.app
   ```

4. Redeploy after adding or changing environment variables. If a deployment still shows “Failed to fetch,” confirm the deployment uses the `client` root and new build, all five variables match the web app, Authentication/Firestore/Storage are enabled, and the Firebase rules above were deployed.

## Data model

- `lands/{listingId}` — plot details; public reads are restricted to `status: "available"`.
- `locations/{locationId}` — public autocomplete names for all 33 Telangana districts, major towns, and Hyderabad localities; only admins can add/edit/delete them.
- `users/{uid}` — the signed-in user's name/email only; readable by that user.
- `bookings/{bookingId}` — visit or purchase enquiries; readable by the owner and admins.
- `admins/{uid}` — admin allow-list; bootstrap through the Firebase Console, never from the client.
- Land documents may include GPS coordinates, gallery image URLs, and a 360° panorama URL. Uploaded media is stored under `lands/{listingId}/` in Firebase Storage; the public storefront can read media, but only allow-listed admins can upload or delete it.

The listing filters run against the public Firestore results in the client (up to 100 available plots per request). When Firebase is not configured or there are no available Firestore lands, the storefront falls back to the built-in illustrative demo plots and bundled location suggestions. Selecting a known place shows a keyless Google Maps embed and an **Open in Google Maps** link; this embed does not draw custom red boundary polygons. Add server-side search or pagination before growing beyond the listing limit.

## Existing PostgreSQL data and accounts

Connecting Firebase does not automatically copy rows from PostgreSQL, booking history, or password hashes. This workspace has no live PostgreSQL connection/export configured, so no existing records were migrated. Export and review any listings/bookings before importing them into Firestore. Existing bcrypt password hashes cannot be converted into Firebase passwords; existing users must create/reset their Firebase Authentication passwords. Do not copy private customer data into public listing documents.

## Legacy PostgreSQL/API (optional)

The older backend remains under `server/`. Its setup is only needed if you intentionally restore the previous API frontend:

```powershell
Set-Location .\server
Copy-Item .env.example .env
# Configure DATABASE_URL and JWT_SECRET in server/.env
npm install
npm run dev
```

Vercel does not host PostgreSQL or Firestore. For this Firebase-connected version, deploy the frontend to Vercel and keep Firestore in Firebase; the Express/PostgreSQL server is not required.
