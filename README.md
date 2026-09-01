# Paranas LGU Scholarship Portal

Production-style **JavaScript / React / Vite** scholarship application and administration portal using **Firebase Authentication + Firebase Realtime Database**.

This project is intentionally organized as a professional modular web application. `index.html` is only the Vite bootstrap document. Every real screen is implemented as a full JavaScript/React page under `src/pages` with dedicated services, layouts, guards, components, and Firebase modules.

## Technology

- JavaScript / JSX (no TypeScript)
- React + Vite
- React Router
- Firebase Authentication
- Firebase Realtime Database
- Lucide icon library
- No PHP
- No MySQL
- No Firestore
- No Firebase Cloud Functions
- No Firebase Storage

The 2×2 photo and drawn electronic signature are compressed and saved as Data URLs in Realtime Database. Do not use this pattern for large PDF/document uploads.

## Main code structure

```text
src/
├── App.jsx
├── main.jsx
├── config/
│   ├── firebase.js
│   └── site.js
├── context/
│   └── AuthContext.jsx
├── guards/
│   ├── RequireAuth.jsx
│   └── RequireRole.jsx
├── hooks/
│   └── useAuth.js
├── layouts/
│   ├── PublicLayout.jsx
│   ├── StudentLayout.jsx
│   └── AdminLayout.jsx
├── components/
│   ├── common/
│   ├── forms/
│   └── scholarships/
├── services/
│   ├── auth.service.js
│   ├── scholarship.service.js
│   ├── application.service.js
│   ├── notification.service.js
│   ├── content.service.js
│   └── audit.service.js
├── pages/
│   ├── public/
│   ├── auth/
│   ├── student/
│   └── admin/
├── styles/
│   ├── tokens.css
│   ├── public.css
│   ├── dashboard.css
│   ├── forms.css
│   ├── responsive.css
│   └── index.css
└── utils/
```

## Full pages included

### Public
- Homepage
- Scholarship directory
- Scholarship detail
- Program policy
- About Paranas

### Authentication
- Student registration
- Login

### Student portal
- Dashboard
- Browse scholarships
- Google Forms-style 4-step scholarship application
- 2×2 photo upload/compression
- Drawn electronic signature
- My applications
- Application details
- Revision and resubmission
- Notifications
- Profile

### Admin portal
- Dashboard
- Scholarship management
- Create/edit scholarship
- Applicant capacity
- Application form builder
- Applicant management
- Pending review queue
- Complete application review
- Assessment/evaluation
- Pending / For Revision / Approved / Rejected decisions
- Student notifications
- Public website content management
- Administrative activity logs

## Firebase configuration

The provided `.env.local` already contains the Firebase Web App configuration supplied for:

`paranas-lgu-scholarship-portal`

and the Realtime Database:

`https://paranas-lgu-scholarship-portal-default-rtdb.firebaseio.com`

If you clone the project from Git, create `.env.local` from `.env.example` because `.env.local` is ignored by Git.

## Run locally

```bash
npm install
npm run dev
```

Open the Vite URL (normally `http://localhost:5173`). Do not double-click `index.html`; this is a Vite application.

## Build

```bash
npm run build
npm run preview
```

## Firebase Authentication

Firebase Console → Authentication → Sign-in method → enable **Email/Password**.

## Realtime Database rules

Firebase Console → Realtime Database → Rules → replace the rules with `database.rules.json` and publish.

Important protections include:

- Students can register only as `student`.
- Students cannot promote themselves to `admin`.
- Only administrators can manage scholarship records.
- Only published scholarships are exposed through `publicScholarships`.
- New applications are limited by the scholarship `maxApplicants` value.
- Students can edit a submitted application only when its current status is `revision_required`, and resubmission returns it to `pending`.
- Only administrators can set Approved, Rejected, or For Revision.
- Students can read only their own application records and notifications.

## Create the first administrator

1. Register a normal account through the website.
2. Open Firebase Console → Realtime Database → `users` → the account UID.
3. Change only `role` from `student` to `admin` using the Firebase Console.
4. Sign out and sign in again.
5. The account will be routed to `/admin`.

Normal client code cannot assign the admin role.

## Professional data organization

```text
users/{uid}
scholarships/{scholarshipId}          # Admin records
publicScholarships/{scholarshipId}    # Published public mirror
applications/{scholarshipId}/{uid}
userApplicationIndex/{uid}/{scholarshipId}
notifications/{uid}/{notificationId}
siteContent/
auditLogs/
```

## Deployment to Vercel

The included `vercel.json` rewrites routes to the React application. Add the same `VITE_FIREBASE_*` values to Vercel Project Settings → Environment Variables, then deploy.

## Public municipality information

The default About content references the Philippine Statistics Authority PSGC profile for Paranas: first-class municipality, 44 barangays, population 35,281 in the 2024 POPCEN. The municipal history note references Republic Act No. 6681, which changed the municipality's name from Wright to Paranas in 1988.
