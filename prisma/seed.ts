/**
 * prisma/seed.ts
 * Seeds the database with:
 *  - 1 teacher account
 *  - 5 student accounts (all with bcryptjs-hashed passwords)
 *  - 1 classroom with a realistic 4-corner GPS polygon
 */

import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

const SALT_ROUNDS = 12;

async function main() {
  console.log('🌱 Starting database seed...');

  // ─── Hash helper ──────────────────────────────────────────────────────────
  const hash = (plain: string) => bcrypt.hash(plain, SALT_ROUNDS);

  // ─── Teacher ──────────────────────────────────────────────────────────────
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@college.edu' },
    update: {},
    create: {
      email: 'teacher@college.edu',
      passwordHash: await hash('Teacher@123'),
      name: 'Dr. Ananya Sharma',
      role: Role.TEACHER,
    },
  });
  console.log(`✅ Teacher created: ${teacher.email}`);

  // ─── Students ─────────────────────────────────────────────────────────────
  const studentsData = [
    { email: 'alice@college.edu',   name: 'Alice Mehta',       password: 'Student@123' },
    { email: 'bob@college.edu',     name: 'Bob Krishnamurthy', password: 'Student@123' },
    { email: 'charlie@college.edu', name: 'Charlie Verma',     password: 'Student@123' },
    { email: 'diana@college.edu',   name: 'Diana Rao',         password: 'Student@123' },
    { email: 'ethan@college.edu',   name: "Ethan D'Souza",     password: 'Student@123' },
  ];

  for (const s of studentsData) {
    const student = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        passwordHash: await hash(s.password),
        name: s.name,
        role: Role.STUDENT,
      },
    });
    console.log(`✅ Student created: ${student.email}`);
  }

  // ─── Classroom ────────────────────────────────────────────────────────────
  // Realistic GPS coordinates near IIT Bombay campus
  // Represents a ~10m × 8m room footprint (approx 0.00009° lat/lng per meter)
  const classroom = await prisma.classroom.upsert({
    where: { id: 'clr_seed_001' },
    update: {},
    create: {
      id: 'clr_seed_001',
      name: 'Lecture Hall A-101',
      label: 'LH-A101',
      floor: 1,
      building: 'A-Block',
      polygon: [
        { lat: 19.13320, lng: 72.91680 }, // NW corner
        { lat: 19.13320, lng: 72.91689 }, // NE corner
        { lat: 19.13311, lng: 72.91689 }, // SE corner
        { lat: 19.13311, lng: 72.91680 }, // SW corner
      ],
    },
  });
  console.log(`✅ Classroom created: ${classroom.name} (${classroom.building}, Floor ${classroom.floor})`);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Credentials Summary:');
  console.log('   Teacher  → teacher@college.edu   / Teacher@123');
  console.log('   Students → alice@college.edu     / Student@123');
  console.log('             → bob@college.edu       / Student@123');
  console.log('             → charlie@college.edu   / Student@123');
  console.log('             → diana@college.edu     / Student@123');
  console.log('             → ethan@college.edu     / Student@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
