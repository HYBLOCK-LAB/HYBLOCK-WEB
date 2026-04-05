# Participation Status Check System

A simple, QR-based attendance management system for HYBLOCK.

## Features

- **QR Attendance:** Members can check in by scanning an event-specific QR code and entering their name. (15-minute time limit)
- **Admin Dashboard:** A real-time view of attendance status across all events.
- **Dynamic Events:** Add new event columns (e.g., Basic, Advanced, Special events) directly from the admin panel.
- **Google Sheets Sync:** All data is persisted in a Google Sheet for easy management and historical tracking.
- **Member Validation:** Only pre-registered members can check in (validated against `lib/members.json`).

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Vanilla CSS (Brand color: `#0e4a84`)
- **Database:** Google Sheets API
- **QR Generation:** `qrcode.react` (Dashboard) and QR Server API (High-res)

## Setup Instructions

### 1. Google Sheets API Configuration

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project.
3.  Enable the **Google Sheets API**.
4.  Go to **IAM & Admin > Service Accounts** and create a service account.
5.  Generate a **JSON Key** for the service account and download it.
6.  Share your Google Sheet with the service account email (as an **Editor**).

### 2. Environment Variables

Create a `.env.local` file (or set these in Vercel):

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account-email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 3. Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the check-in page or [http://localhost:3000/admin](http://localhost:3000/admin) for the dashboard.

## Deployment on Vercel

1.  Push the code to a GitHub repository.
2.  Import the project to Vercel.
3.  Add the environment variables (`GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY`) in the Vercel dashboard.
4.  Deploy!

## Directory Structure

- `app/`: Next.js App Router pages and API routes.
- `components/`: Reusable UI components.
- `lib/`: Utility functions (Google Sheets integration, member list).
- `public/`: Static assets (logo.png).
