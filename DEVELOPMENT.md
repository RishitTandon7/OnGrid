# OnGrid - Development Guide

## Project Overview

OnGrid is a geofence-based attendance system built with Next.js. Students can mark attendance by physically being within a classroom's GPS geofence during an active attendance session.

### Architecture

```
┌─────────────────────────────────────────┐
│         Next.js Frontend                │
│   (React Components + Tailwind CSS)     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Next.js API Routes                 │
│  (NextAuth, Classrooms, Attendance)     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Prisma ORM                         │
│   (Database layer)                      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      PostgreSQL Database                │
│  (Users, Sessions, Attendance)          │
└─────────────────────────────────────────┘
```

## Key Components

### 1. Authentication (`src/lib/auth.ts`)
- NextAuth.js with JWT strategy
- Credentials provider (email/password)
- Role-based access (TEACHER/STUDENT)
- Session storage via JWT tokens

### 2. Geofencing (`src/lib/geofence.ts`)
- Point-in-polygon detection (Ray Casting)
- GPS coordinate validation
- Distance calculation support

### 3. Database Schema (`prisma/schema.prisma`)
- **User**: Teacher/Student accounts with password hashes
- **Classroom**: GPS polygon geofences
- **AttendanceSession**: Time-limited attendance windows
- **AttendanceRecord**: Individual attendance marks
- **WebAuthnCredential**: Future passkey support

### 4. API Routes
- **Auth**: Register, login via NextAuth
- **Classrooms**: CRUD operations (teacher only)
- **Sessions**: Create, manage attendance sessions
- **Attendance**: Mark presence, view history

### 5. UI Pages
- **Login/Register**: Public auth pages
- **Teacher**: Dashboard, classroom management, session details
- **Student**: Dashboard, mark attendance, view history

## Development Workflow

### 1. Database Setup

```bash
# Copy .env.example to .env.local and update DATABASE_URL
cp .env.example .env.local

# Generate NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Run migrations
npx prisma migrate dev --name init

# Seed database with test data
npm run seed

# View database (Prisma Studio)
npx prisma studio
```

### 2. Start Development Server

```bash
npm install
npm run dev
```

Visit http://localhost:3000

### 3. Test the Flow

**Teacher**:
1. Login as `teacher@college.edu` / `Teacher@123`
2. Create a classroom with geofence coordinates
3. Start an attendance session
4. View student attendance records

**Student**:
1. Login as `alice@college.edu` / `Student@123`
2. Go to "Mark Attendance"
3. Allow location access when prompted
4. Click "Mark Attendance" if within geofence
5. View attendance in "My Records"

## Code Organization

### Frontend Components
- **Pages**: Located in `src/app/` with Next.js App Router
- **Styles**: Tailwind CSS in `globals.css` and inline classes
- **No separate component library**: Keeping codebase simple

### Backend Logic
- **API Routes**: `src/app/api/` - RESTful endpoints
- **Auth**: NextAuth.js with custom JWT callbacks
- **Validation**: Zod schemas in `src/lib/validators.ts`
- **Database**: Prisma ORM singleton in `src/lib/prisma.ts`

### Utilities
- **Geofencing**: Ray casting algorithm, distance calculations
- **IP Validation**: Campus WiFi subnet checks (ready for use)
- **Device Fingerprinting**: User-Agent tracking

## Common Tasks

### Adding a New Database Field

1. Edit `prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name description`
3. Update API routes to use new field
4. Update frontend forms if needed

### Adding a New API Endpoint

1. Create file: `src/app/api/resource/route.ts`
2. Use Zod for input validation
3. Call Prisma for database operations
4. Return NextResponse with appropriate status code
5. Add role checks with `getServerSession(authOptions)`

### Debugging

```bash
# View Prisma logs
NODE_ENV=development npm run dev

# Check database state
npx prisma studio

# View NextAuth logs
NEXTAUTH_DEBUG=1 npm run dev

# Inspect network requests
# Use browser DevTools → Network tab
```

## Security Considerations

- ✅ Passwords hashed with bcrypt (12 salt rounds)
- ✅ JWT tokens for session management
- ✅ NextAuth CSRF protection
- ✅ Geolocation verification required for attendance
- ✅ Rate limiting ready (use middleware)
- ✅ SQL injection prevention (Prisma)

**TODO Security**:
- [ ] Add rate limiting middleware
- [ ] Implement refresh token rotation
- [ ] Add HTTPS requirement in production
- [ ] Implement email verification
- [ ] Add audit logging

## Performance Tips

1. **Database Queries**: Use Prisma select to limit fields
2. **Frontend**: Images optimized with Next.js Image component
3. **Caching**: Leverage Next.js ISR or revalidate tags
4. **API**: Consider adding pagination for large datasets

## Testing

Currently no automated tests. To add:

```bash
npm install --save-dev vitest @testing-library/react
```

Then create test files: `*.test.ts`, `*.test.tsx`

## Deployment

### Environment Variables
```
DATABASE_URL           # Production PostgreSQL
NEXTAUTH_SECRET        # Strong random string
NEXTAUTH_URL          # Your domain
WEBAUTHN_ORIGIN       # Your domain
```

### Docker
```bash
docker build -t ongrid .
docker run -p 3000:3000 -e DATABASE_URL=... ongrid
```

### Vercel
1. Push to GitHub
2. Import project in Vercel dashboard
3. Add environment variables
4. Deploy automatically on push

## Troubleshooting

### "Can't reach database server"
```bash
# Ensure PostgreSQL is running
psql -U postgres -d ongrid

# Check DATABASE_URL in .env.local
```

### "NEXTAUTH_SECRET not set"
```bash
# Generate and add to .env.local
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### "Geolocation not working"
- Must use HTTPS in production
- User must grant location permission
- Check browser console for errors

### "Authentication fails"
- Clear cookies and try again
- Check NEXTAUTH_URL matches your domain
- Verify user exists in database
- Check password hashing in seed data

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [NextAuth.js Docs](https://next-auth.js.org/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zod Validation](https://zod.dev/)

## Getting Help

1. Check existing issues/discussions
2. Review middleware and callbacks
3. Look at similar implementations
4. Ask on Stack Overflow with `next.js` tag
