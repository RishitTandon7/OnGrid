<div align="center">

<img src="https://raw.githubusercontent.com/rishittandon7/ongrid/main/public/og-banner.png" alt="OnGrid Banner" width="800"/>

# OnGrid

### 3D Geofence-Based Attendance System

**The only attendance system that verifies students are on the correct floor.**

GPS + Barometric Pressure + Accelerometer + Gyroscope — fused into a single confidence score.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-green?style=flat-square&logo=postgresql)](https://supabase.com)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)
[![Contributors](https://img.shields.io/github/contributors/rishittandon7/ongrid?style=flat-square)](https://github.com/rishittandon7/ongrid/graphs/contributors)

[**Live Demo**](https://ongrid.vercel.app) · [**Report Bug**](https://github.com/rishittandon7/ongrid/issues/new?template=bug_report.yml) · [**Request Feature**](https://github.com/rishittandon7/ongrid/issues/new?template=feature_request.yml) · [**Join Discord**](https://discord.gg/your-invite)

</div>

---

## ✨ What makes OnGrid different?

Traditional geofence attendance fails in multi-floor buildings — all floors share the same GPS footprint. OnGrid solves this with **sensor fusion**:

| Signal | Accuracy | Purpose |
|--------|----------|---------|
| 🛰️ GPS (lat/lng) | ±3–10 m | Horizontal room boundary |
| 🌡️ Barometric Pressure | **±0.5 m** | Floor-level verification |
| 📡 GPS Altitude | ±3–10 m | Altitude fallback |
| 📱 Accelerometer | Relative | Anti-spoofing (motion detection) |
| 🔄 Gyroscope | Relative | Device posture validation |

A student on Floor 3 **cannot** mark attendance for a class on Floor 11 — even if their GPS coordinates are identical.

---

## 🚀 Features

### For Teachers
- 🗺️ **Classroom Geofencing** — Draw GPS polygon boundaries for each room
- 🏢 **3D Floor Calibration** — Stand in your classroom, press "Capture Altitude" — stores barometric reference
- ⏱️ **Timed Sessions** — Create attendance windows (5 min to several hours)
- 📊 **Live Dashboard** — Real-time attendance feed with student count
- 🔒 **Session Control** — Start/end sessions, view per-session records

### For Students
- 📍 **One-Tap Check-In** — Tap "Check In" → 7-sensor pipeline runs automatically
- 🌡️ **Live Sensor Feed** — See your pressure, GPS altitude, tilt & motion score in real time
- 📈 **Confidence Score** — Visual floor-match confidence bar before submission
- 📋 **Records Dashboard** — Full attendance history across all sessions

### Core Architecture
- ⚡ **Next.js 15 App Router** with server components + API routes
- 🔐 **NextAuth.js** — JWT sessions, role-based access (Teacher / Student)
- 🗄️ **Prisma + PostgreSQL** (Supabase-ready, self-host friendly)
- 🎨 **Tailwind CSS** — Dark/light mode, glassmorphism, micro-animations
- 📱 **Mobile-first** — Designed for phones in classrooms

---

## 📸 Screenshots

<div align="center">

| Teacher Dashboard | Classroom Geofencing | Student Check-In |
|:-:|:-:|:-:|
| ![dashboard](docs/screenshots/teacher-dashboard.png) | ![geofence](docs/screenshots/classroom-geofence.png) | ![checkin](docs/screenshots/student-checkin.png) |

</div>

---

## 🛠️ Tech Stack

```
Frontend        Next.js 15 (App Router) + React 18 + TypeScript
Styling         Tailwind CSS + Custom CSS animations
Auth            NextAuth.js (JWT strategy)
Database        PostgreSQL via Prisma ORM
Hosting DB      Supabase (free tier works)
Deploy          Vercel (zero config)
Sensors         Web Sensor APIs (Generic Sensor API, Geolocation API, DeviceMotion)
Icons           Lucide React
```

---

## ⚡ Quick Start (5 minutes)

### Prerequisites

- Node.js 18+
- A PostgreSQL database ([Supabase free tier](https://supabase.com) recommended)

### 1. Clone and install

```bash
git clone https://github.com/rishittandon7/ongrid.git
cd ongrid
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# PostgreSQL — use direct connection (not pooler) for migrations
DATABASE_URL="postgresql://user:password@host:5432/ongrid"

# NextAuth — generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Set up database

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — register as a teacher, create a classroom, start a session. Then register as a student and check in.

---

## 🌐 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rishittandon7/ongrid)

1. Click the button above
2. Add your environment variables in Vercel dashboard:
   - `DATABASE_URL` — your Supabase/Postgres connection string
   - `NEXTAUTH_SECRET` — random 32-byte hex string
   - `NEXTAUTH_URL` — your Vercel deployment URL (e.g. `https://ongrid.vercel.app`)
3. Deploy!

> **Note:** Run `npx prisma migrate deploy` once after deploying to apply migrations to your production database.

---

## 🗂️ Project Structure

```
ongrid/
├── prisma/
│   ├── schema.prisma          # Database models
│   └── migrations/            # Migration history
├── src/
│   ├── app/
│   │   ├── api/               # API routes (REST)
│   │   │   ├── attendance/mark/
│   │   │   ├── classrooms/
│   │   │   └── sessions/
│   │   ├── auth/              # Login + Register pages
│   │   ├── teacher/           # Teacher dashboard, classrooms, sessions
│   │   └── student/           # Student dashboard, mark attendance
│   ├── components/
│   │   └── GeofencePreview.tsx # SVG polygon renderer
│   └── lib/
│       ├── sensors.ts         # Sensor fusion (pressure, GPS, IMU)
│       ├── geofence.ts        # Polygon + altitude validation
│       ├── auth.ts            # NextAuth config
│       ├── prisma.ts          # Prisma client singleton
│       └── validators.ts      # Zod schemas
└── public/
```

---

## 🧭 Roadmap

We'd love help with these! See [Issues](https://github.com/rishittandon7/ongrid/issues) for full list.

- [ ] **WiFi SSID-based verification** — extra anti-spoofing layer ([#good-first-issue](https://github.com/rishittandon7/ongrid/labels/good%20first%20issue))
- [ ] **QR Code fallback** — teacher shows QR, student scans within geofence
- [ ] **Batch CSV export** — download attendance records per session
- [ ] **Email notifications** — alert students/teachers via Resend/SendGrid
- [ ] **Admin panel** — manage users, institutions, building configurations
- [ ] **Android/iOS app** — React Native wrapper for richer sensor access
- [ ] **Offline support** — PWA with service worker + sync queue
- [ ] **Multi-tenant** — support multiple institutions/campuses
- [ ] **Analytics dashboard** — attendance trends, per-student reports
- [ ] **Webhook support** — push attendance events to external LMS systems

---

## 🤝 Contributing

Contributions are what make open source such an amazing place. **We welcome all kinds of contributions**, from typo fixes to full features.

See [**CONTRIBUTING.md**](CONTRIBUTING.md) for a detailed guide on how to get started.

**Quick contribution steps:**

```bash
# 1. Fork + clone
git clone https://github.com/rishittandon7/ongrid.git

# 2. Create a branch
git checkout -b feat/your-feature-name

# 3. Make changes + commit
git commit -m "feat: add amazing feature"

# 4. Push + open PR
git push origin feat/your-feature-name
```

---

## 👥 Contributors

<a href="https://github.com/rishittandon7/ongrid/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=rishittandon7/ongrid" />
</a>

---

## 📄 License

MIT © [Rishit Tandon](https://github.com/rishittandon7)

See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ for classrooms that span multiple floors.**

If this project helped you, please ⭐ star it — it helps others find it!

</div>
