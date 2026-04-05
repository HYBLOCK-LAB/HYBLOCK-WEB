# Participation Status Check System

A simple, QR-based attendance management system for HYBLOCK.

## Features

- **QR Attendance:** Members can check in by scanning an event-specific QR code and entering their name. (15-minute time limit)
- **Admin Dashboard:** A real-time view of attendance status across all events.
- **Dynamic Events:** Add new event columns (e.g., Basic, Advanced, Special events) directly from the admin panel.
- **Supabase Sync:** Attendance, sessions, and member data are stored in Supabase.
- **Member Validation:** Only active members registered in Supabase can check in.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Vanilla CSS (Brand color: `#0e4a84`)
- **Database:** Supabase
- **QR Generation:** `qrcode.react` (Dashboard) and QR Server API (High-res)

## Setup Instructions

### 1. Supabase Configuration

Add your Supabase project URL and service role key.

### 2. Environment Variables

Create a `.env.local` file (or set these in Vercel):

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
DEFAULT_SESSION_COHORT=1
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
3.  Add the Supabase environment variables in the Vercel dashboard.
4.  Deploy!

## Directory Structure

- `app/`: Next.js App Router pages and API routes.
- `components/`: Reusable UI components.
- `lib/`: Utility functions (Supabase integration, site data).
- `public/`: Static assets (logo.png).
