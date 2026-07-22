import fs from "fs";
import path from "path";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";
import * as schema from "./schema.js";
import { supabase } from "../lib/supabase.js";
import { AsyncLocalStorage } from "async_hooks";

// AsyncLocalStorage to maintain the tenant ID request context across database calls
export const tenantLocalStorage = new AsyncLocalStorage<string>();

export function getTenantId(): string {
  return tenantLocalStorage.getStore() || "default";
}

// Database URL from environment variables
const DATABASE_URL = process.env.DATABASE_URL;

export let isPostgreSQL = false;
let db: any = null;

// Initialize Drizzle if DATABASE_URL is present
if (DATABASE_URL) {
  try {
    const pool = new pg.Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes("localhost") || DATABASE_URL.includes("127.0.0.1") ? false : { rejectUnauthorized: false }
    });
    db = drizzle(pool, { schema });
    console.log("[CBT PRO X DB] Attempting to connect and verify PostgreSQL Database...");

    // Asynchronously verify table existence, then setup/seed tables
    pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')")
      .then(async (res) => {
        isPostgreSQL = true;
        console.log("[CBT PRO X DB] PostgreSQL connected successfully. Verifying tables and data...");

        try {
          // 1. Pre-create all application tables if they do not exist
          await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
              id TEXT PRIMARY KEY,
              email TEXT NOT NULL UNIQUE,
              name TEXT NOT NULL,
              password TEXT NOT NULL,
              role TEXT NOT NULL,
              tenant_id TEXT NOT NULL DEFAULT 'default',
              is_active BOOLEAN NOT NULL DEFAULT TRUE,
              created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS classes (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              room TEXT NOT NULL,
              primary_teacher TEXT NOT NULL,
              tenant_id TEXT NOT NULL DEFAULT 'default'
            );
            CREATE TABLE IF NOT EXISTS students (
              id TEXT PRIMARY KEY,
              registration_number TEXT NOT NULL UNIQUE,
              name TEXT NOT NULL,
              email TEXT NOT NULL,
              class_id TEXT NOT NULL,
              enrollment_date TEXT NOT NULL,
              attendance_rate DOUBLE PRECISION NOT NULL DEFAULT 100.0,
              user_id TEXT,
              status TEXT NOT NULL DEFAULT 'Active',
              platform TEXT DEFAULT 'CBT PRO',
              stream TEXT DEFAULT '',
              room TEXT DEFAULT '',
              hostel TEXT DEFAULT '',
              tenant_id TEXT NOT NULL DEFAULT 'default'
            );
            CREATE TABLE IF NOT EXISTS admissions (
              id TEXT PRIMARY KEY,
              student_name TEXT NOT NULL,
              student_email TEXT NOT NULL,
              grade_applied TEXT NOT NULL,
              parent_name TEXT NOT NULL,
              parent_email TEXT NOT NULL,
              parent_phone TEXT NOT NULL,
              status TEXT NOT NULL DEFAULT 'PENDING',
              submitted_at TEXT NOT NULL,
              reviewed_at TEXT,
              remarks TEXT,
              tenant_id TEXT NOT NULL DEFAULT 'default'
            );
            CREATE TABLE IF NOT EXISTS attendance (
              id TEXT PRIMARY KEY,
              student_id TEXT NOT NULL,
              date TEXT NOT NULL,
              status TEXT NOT NULL,
              remarks TEXT,
              tenant_id TEXT NOT NULL DEFAULT 'default'
            );
            CREATE TABLE IF NOT EXISTS timetable (
              id TEXT PRIMARY KEY,
              class_id TEXT NOT NULL,
              subject TEXT NOT NULL,
              day_of_week TEXT NOT NULL,
              start_time TEXT NOT NULL,
              end_time TEXT NOT NULL,
              teacher TEXT NOT NULL,
              room TEXT NOT NULL,
              tenant_id TEXT NOT NULL DEFAULT 'default'
            );
            CREATE TABLE IF NOT EXISTS parents (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              email TEXT NOT NULL,
              phone TEXT NOT NULL,
              child_student_id TEXT NOT NULL,
              temp_password TEXT,
              user_id TEXT,
              tenant_id TEXT NOT NULL DEFAULT 'default'
            );
            CREATE TABLE IF NOT EXISTS exams (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              description TEXT NOT NULL DEFAULT '',
              duration INTEGER NOT NULL,
              passing_score INTEGER NOT NULL DEFAULT 40,
              status TEXT NOT NULL DEFAULT 'DRAFT',
              total_questions INTEGER NOT NULL DEFAULT 0,
              start_time TEXT NOT NULL,
              end_time TEXT NOT NULL,
              tenant_id TEXT NOT NULL DEFAULT 'default'
            );
            CREATE TABLE IF NOT EXISTS questions (
              id TEXT PRIMARY KEY,
              exam_id TEXT NOT NULL,
              text TEXT NOT NULL,
              type TEXT NOT NULL,
              options JSONB NOT NULL DEFAULT '[]'::jsonb,
              answer TEXT NOT NULL,
              score_points INTEGER NOT NULL DEFAULT 10,
              tenant_id TEXT NOT NULL DEFAULT 'default'
            );
            CREATE TABLE IF NOT EXISTS exam_attempts (
              id TEXT PRIMARY KEY,
              exam_id TEXT NOT NULL,
              student_id TEXT NOT NULL,
              start_time TEXT NOT NULL,
              submit_time TEXT,
              answers JSONB NOT NULL DEFAULT '{}'::jsonb,
              score INTEGER NOT NULL DEFAULT 0,
              percentage DOUBLE PRECISION NOT NULL DEFAULT 0.0,
              status TEXT NOT NULL DEFAULT 'PENDING_GRADING',
              grade_point TEXT DEFAULT 'F',
              remarks TEXT,
              is_submitted BOOLEAN NOT NULL DEFAULT FALSE,
              violations_count INTEGER NOT NULL DEFAULT 0,
              tenant_id TEXT NOT NULL DEFAULT 'default'
            );
            CREATE TABLE IF NOT EXISTS tenants (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              subdomain TEXT NOT NULL UNIQUE,
              logo_url TEXT,
              background_image_url TEXT,
              primary_color TEXT NOT NULL DEFAULT '#4f46e5',
              secondary_color TEXT NOT NULL DEFAULT '#0d9488',
              contact_email TEXT NOT NULL,
              contact_phone TEXT NOT NULL,
              address TEXT NOT NULL,
              status TEXT NOT NULL DEFAULT 'active',
              plan TEXT NOT NULL DEFAULT 'Basic',
              academic_year TEXT NOT NULL DEFAULT '2025/2026',
              created_at TEXT NOT NULL
            );
          `);

          // Run explicit ALTER migrations to add tenant_id and other missing columns to any existing tables that don't have them yet
          await pool.query(`
            ALTER TABLE classes ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
            ALTER TABLE students ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
            ALTER TABLE students ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'CBT PRO';
            ALTER TABLE students ADD COLUMN IF NOT EXISTS stream TEXT DEFAULT '';
            ALTER TABLE students ADD COLUMN IF NOT EXISTS room TEXT DEFAULT '';
            ALTER TABLE students ADD COLUMN IF NOT EXISTS hostel TEXT DEFAULT '';
            ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
            ALTER TABLE admissions ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
            ALTER TABLE attendance ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
            ALTER TABLE timetable ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
            ALTER TABLE parents ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
            ALTER TABLE exams ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
            ALTER TABLE questions ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
            ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
            ALTER TABLE tenants ADD COLUMN IF NOT EXISTS background_image_url TEXT;
          `);

          console.log("[CBT PRO X DB] All database schemas ensured and migrated successfully.");
        } catch (tableErr: any) {
          console.error("[CBT PRO X DB] Table creation / schema assertion error:", tableErr.message);
        }

        // 2. Insert or update the Super Admin user
        try {
          const now = new Date().toISOString();
          await pool.query(`
            INSERT INTO users (id, email, name, password, role, created_at)
            VALUES ('u-5', 'adebayosamuel015@gmail.com', 'Super Admin', 'Hibilero@2104', 'ADMIN', $1)
            ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role
          `, [now]);
          console.log("[CBT PRO X DB] Super Admin credentials guaranteed in database.");
        } catch (adminErr: any) {
          console.error("[CBT PRO X DB] Error upserting Super Admin user:", adminErr.message);
        }

        // 3. Seed application data if empty
        try {
          const examsCountRes = await pool.query("SELECT COUNT(*) FROM exams");
          if (parseInt(examsCountRes.rows[0].count, 10) === 0) {
            console.log("[CBT PRO X DB] No exams found. Database is fresh. Running full automatic seed...");
            const now = new Date().toISOString();

            // Classes
            await pool.query(`
              INSERT INTO classes (id, name, room, primary_teacher) VALUES
              ('c-1', 'SS3 Science', 'Block A - Room 102', 'Mrs. Florence Adebayo'),
              ('c-2', 'SS3 Arts', 'Block A - Room 104', 'Mr. Nelson Chidi'),
              ('c-3', 'SS2 Commerce', 'Block B - Room 201', 'Miss Sandra Bello')
              ON CONFLICT (id) DO NOTHING;
            `);

            // Users
            await pool.query(`
              INSERT INTO users (id, email, name, password, role, created_at) VALUES 
              ('u-1', 'admin@eduos.com', 'Dr. Charles Kolawole', 'admin123', 'ADMIN', $1),
              ('u-2', 'teacher@eduos.com', 'Mrs. Florence Adebayo', 'teacher123', 'TEACHER', $1),
              ('u-3', 'student@eduos.com', 'Tunde Folayan', 'student123', 'STUDENT', $1),
              ('u-4', 'parent@eduos.com', 'Chief Folayan', 'parent123', 'PARENT', $1)
              ON CONFLICT (email) DO NOTHING;
            `, [now]);

            // Students
            await pool.query(`
              INSERT INTO students (id, registration_number, name, email, class_id, enrollment_date, attendance_rate, user_id) VALUES
              ('s-1', 'STU2026001', 'Tunde Folayan', 'student@eduos.com', 'c-1', '2026-01-10', 94.5, 'u-3'),
              ('s-2', 'STU2026002', 'Amina Bello', 'amina.b@eduos.com', 'c-1', '2026-01-12', 88.0, NULL),
              ('s-3', 'STU2026003', 'Chinedu Okafor', 'chinedu@eduos.com', 'c-2', '2026-01-15', 100.0, NULL)
              ON CONFLICT (id) DO NOTHING;
            `);

            // Admissions
            await pool.query(`
              INSERT INTO admissions (id, student_name, student_email, grade_applied, parent_name, parent_email, parent_phone, status, submitted_at, reviewed_at, remarks) VALUES
              ('adm-1', 'Sade Ademola', 'sade@email.com', 'SS1 Science', 'Dr. Kunle Ademola', 'kunle@email.com', '+234 803 111 2222', 'PENDING', $1, NULL, NULL),
              ('adm-2', 'Ibrahim Musa', 'ibrahim@email.com', 'SS2 Commerce', 'Alhaji Musa', 'musa@email.com', '+234 805 333 4444', 'APPROVED', $1, $1, 'Credentials verified. Excellent entrance exam.')
              ON CONFLICT (id) DO NOTHING;
            `, [now]);

            // Parents
            await pool.query(`
              INSERT INTO parents (id, name, email, phone, child_student_id, user_id) VALUES
              ('p-1', 'Chief Folayan', 'parent@eduos.com', '+234 812 345 6789', 's-1', 'u-4')
              ON CONFLICT (id) DO NOTHING;
            `);

            // Exams
            await pool.query(`
              INSERT INTO exams (id, title, description, duration, passing_score, status, total_questions, start_time, end_time) VALUES
              ('ex-1', 'SS3 Mathematics Mid-Term Exam', 'Covers Core Algebra, Probability Distributions, and Trigonometric Identities.', 15, 50, 'PUBLISHED', 4, $1, '2026-12-31T23:59:59.000Z'),
              ('ex-2', 'Introduction to General Physics', 'Evaluates Newtonian Mechanics, Thermodynamics, and basic Electrical Fields.', 30, 40, 'PUBLISHED', 3, $1, '2026-12-31T23:59:59.000Z')
              ON CONFLICT (id) DO NOTHING;
            `, [now]);

            // Questions
            await pool.query(`
              INSERT INTO questions (id, exam_id, text, type, options, answer, score_points) VALUES
              ('q-1', 'ex-1', 'Solve for x: 3x + 7 = 22.', 'MCQ', '["x = 5", "x = 4", "x = 15", "x = 6"]'::jsonb, 'x = 5', 25),
              ('q-2', 'ex-1', 'The derivative of sin(x) with respect to x is cos(x).', 'TRUE_FALSE', '["True", "False"]'::jsonb, 'True', 25),
              ('q-3', 'ex-1', 'Which of the following is a prime number?', 'MCQ', '["12", "21", "29", "33"]'::jsonb, '29', 25),
              ('q-4', 'ex-1', 'Explain the conceptual difference between combination and permutation in your own words.', 'ESSAY', '[]'::jsonb, 'combination order does not matter, permutation order does matter', 25),
              ('q-5', 'ex-2', 'State Newton''s Second Law of Motion.', 'MCQ', '["F = m * a", "F = m * v", "E = m * v^2", "P = F / A"]'::jsonb, 'F = m * a', 34),
              ('q-6', 'ex-2', 'Water boils at 100 degrees Fahrenheit under standard atmospheric pressure.', 'TRUE_FALSE', '["True", "False"]'::jsonb, 'False', 33),
              ('q-7', 'ex-2', 'Describe the energy conservation principle in a closed thermodynamic system.', 'ESSAY', '[]'::jsonb, 'first law thermodynamics conservation total energy', 33)
              ON CONFLICT (id) DO NOTHING;
            `);

            // Exam attempts
            await pool.query(`
              INSERT INTO exam_attempts (id, exam_id, student_id, start_time, submit_time, answers, score, percentage, status, grade_point, remarks, is_submitted, violations_count) VALUES
              ('attp-1', 'ex-1', 's-1', $1, $1, '{"q-1": "x = 5", "q-2": "True", "q-3": "29", "q-4": "Permutations are ordered lists whereas combinations are unordered collections."}'::jsonb, 100, 100.0, 'PASS', 'A+', 'Exceptional performance.', TRUE, 0)
              ON CONFLICT (id) DO NOTHING;
            `, [now]);

            console.log("[CBT PRO X DB] Successfully seeded missing mock records in PostgreSQL!");
          }
        } catch (seedErr: any) {
          console.error("[CBT PRO X DB] Error during automatic seeding:", seedErr.message);
        }

        // 4. Verify Supabase Client is operational
        try {
          const { data, error } = await supabase.from('users').select('id').limit(1);
          if (error) {
            console.warn("[CBT PRO X DB] Supabase client test run issue:", error.message);
          } else {
            console.log("[CBT PRO X DB] Supabase client test verified successfully!");
          }
        } catch (sbErr: any) {
          console.warn("[CBT PRO X DB] Supabase client test skipped. Reason:", sbErr.message);
        }
      })
      .catch((err) => {
        console.error("[CBT PRO X DB] PostgreSQL connection/verification error:", err.message);
        isPostgreSQL = false;
      });
  } catch (err) {
    console.error("[CBT PRO X DB] Failed to connect to PostgreSQL. Keeping Local Fallback mode active.", err);
    isPostgreSQL = false;
  }
} else {
  console.log("[CBT PRO X DB] No DATABASE_URL found. Running in Local Fallback mode using 'db.json' for durable preview persistence.");
}

// Helper to safely execute database queries with an automatic local fallback on failure and automatic tenant-isolation filtering
async function executeQuery<T>(pgOp: () => Promise<T>, localOp: () => T | Promise<T>): Promise<T> {
  let result: T;
  if (isPostgreSQL) {
    try {
      result = await pgOp();
    } catch (err: any) {
      console.error("[CBT PRO X DB] PostgreSQL query failed, dynamically disabling PostgreSQL for this session & falling back to local database. Error:", err.message || err);
      isPostgreSQL = false;
      result = await localOp();
    }
  } else {
    result = await localOp();
  }

  // Intercept and inject automatic tenant-isolation filter on outgoing database requests
  const activeTenantId = tenantLocalStorage.getStore();
  if (activeTenantId && activeTenantId !== "super-admin-bypass") {
    if (Array.isArray(result)) {
      return result.filter((item: any) => {
        if (!item || typeof item !== "object") return true;
        
        // Skip filtering for tenants table
        if (item.subdomain && item.plan) return true;

        const itemTenant = item.tenantId || item.tenant_id;
        if (itemTenant === undefined) return true;
        return itemTenant === activeTenantId;
      }) as unknown as T;
    } else if (result && typeof result === "object") {
      const item: any = result;
      // Skip filtering for tenants table
      if (item.subdomain && item.plan) return result;

      const itemTenant = item.tenantId || item.tenant_id;
      if (itemTenant !== undefined && itemTenant !== activeTenantId) {
        return null as unknown as T;
      }
    }
  }

  return result;
}

// ----------------------------------------------------
// LOCAL FILE BACKEND ENGINE (Synchronized File Storage)
// ----------------------------------------------------
const DB_FILE_PATH = path.join(process.cwd(), "db.json");

interface LocalDbSchema {
  users: any[];
  classes: any[];
  students: any[];
  admissions: any[];
  attendance: any[];
  timetable: any[];
  parents: any[];
  exams: any[];
  questions: any[];
  examAttempts: any[];
  lessonNotes?: any[];
  billingInvoices?: any[];
  billingCategories?: string[];
  tenants?: any[];
}

const INITIAL_SEED_DATA: LocalDbSchema = {
  users: [
    { id: "u-1", email: "admin@eduos.com", name: "Dr. Charles Kolawole", password: "admin123", role: "ADMIN", tenantId: "default", isActive: true, createdAt: new Date().toISOString() },
    { id: "u-2", email: "teacher@eduos.com", name: "Mrs. Florence Adebayo", password: "teacher123", role: "TEACHER", tenantId: "default", isActive: true, createdAt: new Date().toISOString() },
    { id: "u-3", email: "student@eduos.com", name: "Tunde Folayan", password: "student123", role: "STUDENT", tenantId: "default", isActive: true, createdAt: new Date().toISOString() },
    { id: "u-4", email: "parent@eduos.com", name: "Chief Folayan", password: "parent123", role: "PARENT", tenantId: "default", isActive: true, createdAt: new Date().toISOString() },
    { id: "u-5", email: "adebayosamuel015@gmail.com", name: "Super Admin", password: "Hibilero@2104", role: "ADMIN", tenantId: "default", isActive: true, createdAt: new Date().toISOString() },
  ],
  classes: [
    { id: "c-1", name: "SS3 Science", room: "Block A - Room 102", primaryTeacher: "Mrs. Florence Adebayo" },
    { id: "c-2", name: "SS3 Arts", room: "Block A - Room 104", primaryTeacher: "Mr. Nelson Chidi" },
    { id: "c-3", name: "SS2 Commerce", room: "Block B - Room 201", primaryTeacher: "Miss Sandra Bello" }
  ],
  students: [
    { id: "s-1", registrationNumber: "STU2026001", name: "Tunde Folayan", email: "student@eduos.com", classId: "c-1", enrollmentDate: "2026-01-10", attendanceRate: 94.5, userId: "u-3" },
    { id: "s-2", registrationNumber: "STU2026002", name: "Amina Bello", email: "amina.b@eduos.com", classId: "c-1", enrollmentDate: "2026-01-12", attendanceRate: 88.0 },
    { id: "s-3", registrationNumber: "STU2026003", name: "Chinedu Okafor", email: "chinedu@eduos.com", classId: "c-2", enrollmentDate: "2026-01-15", attendanceRate: 100.0 }
  ],
  admissions: [
    { id: "adm-1", studentName: "Sade Ademola", studentEmail: "sade@email.com", gradeApplied: "SS1 Science", parentName: "Dr. Kunle Ademola", parentEmail: "kunle@email.com", parentPhone: "+234 803 111 2222", status: "PENDING", submittedAt: "2026-07-01T10:00:00.000Z" },
    { id: "adm-2", studentName: "Ibrahim Musa", studentEmail: "ibrahim@email.com", gradeApplied: "SS2 Commerce", parentName: "Alhaji Musa", parentEmail: "musa@email.com", parentPhone: "+234 805 333 4444", status: "APPROVED", submittedAt: "2026-06-28T09:30:00.000Z", reviewedAt: "2026-06-29T14:00:00.000Z", remarks: "Credentials verified. Excellent entrance exam." },
  ],
  attendance: [
    { id: "att-1", studentId: "s-1", date: "2026-07-05", status: "PRESENT", remarks: "Punctual" },
    { id: "att-2", studentId: "s-2", date: "2026-07-05", status: "PRESENT", remarks: "Punctual" },
    { id: "att-3", studentId: "s-3", date: "2026-07-05", status: "PRESENT", remarks: "Punctual" },
    { id: "att-4", studentId: "s-1", date: "2026-07-06", status: "PRESENT", remarks: "On time" },
    { id: "att-5", studentId: "s-2", date: "2026-07-06", status: "ABSENT", remarks: "Parent reported sick leave" },
    { id: "att-6", studentId: "s-3", date: "2026-07-06", status: "LATE", remarks: "Heavy traffic" },
    { id: "att-7", studentId: "s-1", date: "2026-07-07", status: "PRESENT", remarks: "" },
    { id: "att-8", studentId: "s-2", date: "2026-07-07", status: "PRESENT", remarks: "Returned from sick leave" },
    { id: "att-9", studentId: "s-3", date: "2026-07-07", status: "PRESENT", remarks: "" },
  ],
  timetable: [
    { id: "t-1", classId: "c-1", subject: "Mathematics", dayOfWeek: "Monday", startTime: "08:30", endTime: "10:00", teacher: "Mrs. Florence Adebayo", room: "Block A - Room 102" },
    { id: "t-2", classId: "c-1", subject: "Chemistry", dayOfWeek: "Monday", startTime: "10:30", endTime: "12:00", teacher: "Dr. Kunle Gabriel", room: "Science Lab 1" },
    { id: "t-3", classId: "c-1", subject: "Physics", dayOfWeek: "Tuesday", startTime: "08:30", endTime: "10:00", teacher: "Mr. Nelson Chidi", room: "Block A - Room 102" },
    { id: "t-4", classId: "c-2", subject: "Literature", dayOfWeek: "Monday", startTime: "08:30", endTime: "10:00", teacher: "Miss Sandra Bello", room: "Block A - Room 104" },
  ],
  parents: [
    { id: "p-1", name: "Chief Folayan", email: "parent@eduos.com", phone: "+234 812 345 6789", childStudentId: "s-1", userId: "u-4" }
  ],
  exams: [
    {
      id: "ex-1",
      title: "SS3 Mathematics Mid-Term Exam",
      description: "Covers Core Algebra, Probability Distributions, and Trigonometric Identities. Formulated for university admission preparation.",
      duration: 15,
      passingScore: 50,
      status: "PUBLISHED",
      totalQuestions: 4,
      startTime: "2026-07-01T00:00:00.000Z",
      endTime: "2026-12-31T23:59:59.000Z"
    },
    {
      id: "ex-2",
      title: "Introduction to General Physics",
      description: "Evaluates Newtonian Mechanics, Thermodynamics, and basic Electrical Fields. Ensure you have your calculator ready.",
      duration: 30,
      passingScore: 40,
      status: "PUBLISHED",
      totalQuestions: 3,
      startTime: "2026-07-01T00:00:00.000Z",
      endTime: "2026-12-31T23:59:59.000Z"
    },
    {
      id: "ex-3",
      title: "National WAEC English Mock Trial",
      description: "Focuses on comprehension, active versus passive syntax structures, and logical vocabulary pairings.",
      duration: 45,
      passingScore: 50,
      status: "DRAFT",
      totalQuestions: 0,
      startTime: "2026-08-01T00:00:00.000Z",
      endTime: "2026-08-15T23:59:59.000Z"
    }
  ],
  questions: [
    { id: "q-1", examId: "ex-1", text: "Solve for x: 3x + 7 = 22.", type: "MCQ", options: ["x = 5", "x = 4", "x = 15", "x = 6"], answer: "x = 5", scorePoints: 25 },
    { id: "q-2", examId: "ex-1", text: "The derivative of sin(x) with respect to x is cos(x).", type: "TRUE_FALSE", options: ["True", "False"], answer: "True", scorePoints: 25 },
    { id: "q-3", examId: "ex-1", text: "Which of the following is a prime number?", type: "MCQ", options: ["12", "21", "29", "33"], answer: "29", scorePoints: 25 },
    { id: "q-4", examId: "ex-1", text: "Explain the conceptual difference between combination and permutation in your own words.", type: "ESSAY", options: [], answer: "combination order does not matter, permutation order does matter", scorePoints: 25 },
    { id: "q-5", examId: "ex-2", text: "State Newton's Second Law of Motion.", type: "MCQ", options: ["F = m * a", "F = m * v", "E = m * c^2", "P = F / A"], answer: "F = m * a", scorePoints: 34 },
    { id: "q-6", examId: "ex-2", text: "Water boils at 100 degrees Fahrenheit under standard atmospheric pressure.", type: "TRUE_FALSE", options: ["True", "False"], answer: "False", scorePoints: 33 },
    { id: "q-7", examId: "ex-2", text: "Describe the energy conservation principle in a closed thermodynamic system.", type: "ESSAY", options: [], answer: "first law thermodynamics conservation total energy", scorePoints: 33 }
  ],
  examAttempts: [
    {
      id: "attp-1",
      examId: "ex-1",
      studentId: "s-1",
      startTime: "2026-07-08T09:00:00.000Z",
      submitTime: "2026-07-08T09:12:00.000Z",
      answers: {
        "q-1": "x = 5",
        "q-2": "True",
        "q-3": "29",
        "q-4": "Permutations are ordered lists whereas combinations are unordered collections."
      },
      score: 100,
      percentage: 100,
      status: "PASS",
      gradePoint: "A+",
      remarks: "Exceptional performance, absolute mastery of core Algebra and Trigonometric concepts.",
      isSubmitted: true,
      violationsCount: 0
    }
  ],
  lessonNotes: [
    {
      id: "note-1",
      teacherId: "u-2",
      teacherName: "Mrs. Florence Adebayo",
      classId: "c-1",
      className: "SS3 Science",
      subject: "General Mathematics",
      topic: "Quadratic Equations",
      week: 1,
      objectives: "By the end of this lesson, students should be able to solve quadratic equations using the factorization method and the quadratic formula.",
      content: "Introduction to Quadratic Equations. Standard Form: ax^2 + bx + c = 0. Solving methods discussed: Factorization, Completing the Square, and Quadratic Formula (popularly known as the 'Almighty Formula' in Nigerian curricula). Practice examples include factoring x^2 - 5x + 6 = 0.",
      status: "APPROVED",
      feedback: "Well articulated lesson plan. Detailed and aligns perfectly with the Ogun State unified curriculum.",
      createdAt: "2026-07-10T08:00:00.000Z",
      reviewedAt: "2026-07-10T12:00:00.000Z"
    },
    {
      id: "note-2",
      teacherId: "u-2",
      teacherName: "Mrs. Florence Adebayo",
      classId: "c-1",
      className: "SS3 Science",
      subject: "Further Mathematics",
      topic: "Matrices & Determinants",
      week: 2,
      objectives: "Students should learn to compute 2x2 and 3x3 determinants and apply Cramer's rule.",
      content: "Definition of matrices, dimension types, operations. Matrix multiplication conditions. Determinants of 2x2 matrices: ad - bc. Introduction to 3x3 cofactor expansion.",
      status: "PENDING",
      createdAt: "2026-07-12T14:30:00.000Z"
    }
  ],
  billingInvoices: [
    {
      id: "inv-1001",
      studentId: "s-1",
      studentName: "Tunde Folayan",
      className: "SS3 Science",
      term: "Third Term 2025/2026",
      dueDate: "2026-08-01",
      status: "PENDING",
      items: [
        { name: "Tuition Fees", amount: 45000 },
        { name: "CBT Portal Assessment Access", amount: 5000 },
        { name: "Science Laboratory Levy", amount: 7500 },
        { name: "PTA Levies", amount: 2500 }
      ],
      totalAmount: 60000,
      paidAmount: 0,
      payments: [],
      createdAt: "2026-07-10T10:00:00.000Z"
    },
    {
      id: "inv-1002",
      studentId: "s-2",
      studentName: "Amina Bello",
      className: "SS3 Science",
      term: "Third Term 2025/2026",
      dueDate: "2026-08-01",
      status: "PAID",
      items: [
        { name: "Tuition Fees", amount: 45000 },
        { name: "CBT Portal Assessment Access", amount: 5000 },
        { name: "Science Laboratory Levy", amount: 7500 },
        { name: "PTA Levies", amount: 2500 }
      ],
      totalAmount: 60000,
      paidAmount: 60000,
      payments: [
        { date: "2026-07-11T15:30:00.000Z", amount: 60000, method: "Bank Transfer (GTBank)", reference: "TXN-902138942-OGUN" }
      ],
      createdAt: "2026-07-10T10:00:00.000Z"
    }
  ],
  tenants: [
    {
      id: "default",
      name: "CBT PRO X (EDUOS)",
      subdomain: "default",
      logoUrl: "",
      primaryColor: "#4f46e5",
      secondaryColor: "#0d9488",
      contactEmail: "admin@eduos.com",
      contactPhone: "+234 812 345 6789",
      address: "10, Alake Drive, Abeokuta, Ogun State, Nigeria",
      status: "active",
      plan: "Enterprise",
      academicYear: "2025/2026",
      createdAt: new Date().toISOString()
    }
  ]
};

// Reads local DB file
function readLocalDb(): LocalDbSchema {
  if (!fs.existsSync(DB_FILE_PATH)) {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(INITIAL_SEED_DATA, null, 2), "utf-8");
    return INITIAL_SEED_DATA;
  }
  try {
    const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    let updated = false;
    if (!parsed.lessonNotes || parsed.lessonNotes.length === 0) {
      parsed.lessonNotes = INITIAL_SEED_DATA.lessonNotes;
      updated = true;
    }
    if (!parsed.billingInvoices || parsed.billingInvoices.length === 0) {
      parsed.billingInvoices = INITIAL_SEED_DATA.billingInvoices;
      updated = true;
    }
    if (!parsed.tenants || parsed.tenants.length === 0) {
      parsed.tenants = INITIAL_SEED_DATA.tenants;
      updated = true;
    }
    if (updated) {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(parsed, null, 2), "utf-8");
    }
    return parsed;
  } catch (err) {
    console.error("Error reading local db file, resetting to seed data:", err);
    return INITIAL_SEED_DATA;
  }
}

// Writes local DB file
function writeLocalDb(data: LocalDbSchema) {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to local DB file:", err);
  }
}

// ----------------------------------------------------
// DATABASE OPERATION WRAPPERS (Dual-Mode Handlers)
// ----------------------------------------------------

// 1. Users Queries
export async function dbGetUsers(): Promise<any[]> {
  return executeQuery(
    async () => await db.select().from(schema.users),
    () => readLocalDb().users
  );
}

export async function dbFindUserById(id: string): Promise<any | null> {
  return executeQuery(
    async () => {
      const res = await db.select().from(schema.users).where(eq(schema.users.id, id));
      return res[0] || null;
    },
    () => readLocalDb().users.find(x => x.id === id) || null
  );
}

export async function dbFindUserByEmail(email: string): Promise<any | null> {
  const emailLower = email.toLowerCase();
  return executeQuery(
    async () => {
      const res = await db.select().from(schema.users).where(eq(schema.users.email, emailLower));
      return res[0] || null;
    },
    () => readLocalDb().users.find(x => x.email.toLowerCase() === emailLower) || null
  );
}

export async function dbFindUserByEmailAndTenant(email: string, tenantId: string): Promise<any | null> {
  const emailLower = email.toLowerCase();
  return executeQuery(
    async () => {
      const res = await db.select()
        .from(schema.users)
        .where(
          and(
            eq(schema.users.email, emailLower),
            eq(schema.users.tenantId, tenantId)
          )
        );
      return res[0] || null;
    },
    () => readLocalDb().users.find(x => 
      x.email.toLowerCase() === emailLower && 
      (x.tenantId === tenantId || x.tenant_id === tenantId)
    ) || null
  );
}

export async function dbAddUser(user: any): Promise<any> {
  user.email = user.email.toLowerCase();
  user.tenantId = user.tenantId || getTenantId();
  user.tenant_id = user.tenant_id || user.tenantId;
  return executeQuery(
    async () => {
      await db.insert(schema.users).values({
        id: user.id,
        email: user.email,
        name: user.name,
        password: user.password,
        role: user.role,
        tenantId: user.tenantId,
        isActive: user.isActive !== undefined ? user.isActive : true,
        createdAt: user.createdAt || new Date().toISOString()
      });
      return user;
    },
    () => {
      const local = readLocalDb();
      const idx = local.users.findIndex(x => x.id === user.id);
      if (idx !== -1) {
        local.users[idx] = user;
      } else {
        local.users.push(user);
      }
      writeLocalDb(local);
      return user;
    }
  );
}

export async function dbUpdateUser(userId: string, name: string, passwordHash?: string, role?: string, tenantId?: string): Promise<any> {
  return executeQuery(
    async () => {
      const updateData: any = { name };
      if (passwordHash) {
        updateData.password = passwordHash;
      }
      if (role !== undefined) {
        updateData.role = role;
      }
      if (tenantId !== undefined) {
        updateData.tenantId = tenantId;
      }
      await db.update(schema.users)
        .set(updateData)
        .where(eq(schema.users.id, userId));
      
      const res = await db.select().from(schema.users).where(eq(schema.users.id, userId));
      return res[0] || null;
    },
    () => {
      const local = readLocalDb();
      const idx = local.users.findIndex(x => x.id === userId);
      if (idx !== -1) {
        local.users[idx].name = name;
        if (passwordHash) {
          local.users[idx].password = passwordHash;
        }
        if (role !== undefined) {
          local.users[idx].role = role;
        }
        if (tenantId !== undefined) {
          local.users[idx].tenantId = tenantId;
        }
        writeLocalDb(local);
        return local.users[idx];
      }
      return null;
    }
  );
}

// 2. Classes Queries
export async function dbGetClasses(): Promise<any[]> {
  return executeQuery(
    async () => await db.select().from(schema.classes),
    () => readLocalDb().classes
  );
}

export async function dbAddClass(cls: any): Promise<any> {
  cls.tenantId = cls.tenantId || getTenantId();
  cls.tenant_id = cls.tenant_id || cls.tenantId;
  return executeQuery(
    async () => {
      await db.insert(schema.classes).values(cls);
      return cls;
    },
    () => {
      const local = readLocalDb();
      local.classes.push(cls);
      writeLocalDb(local);
      return cls;
    }
  );
}

// 3. Students Queries
export async function dbGetStudents(): Promise<any[]> {
  return executeQuery(
    async () => await db.select().from(schema.students),
    () => readLocalDb().students
  );
}

export async function dbGetStudentById(id: string): Promise<any | null> {
  return executeQuery(
    async () => {
      const res = await db.select().from(schema.students).where(eq(schema.students.id, id));
      return res[0] || null;
    },
    () => readLocalDb().students.find(s => s.id === id) || null
  );
}

export async function dbGetStudentByUserId(userId: string): Promise<any | null> {
  return executeQuery(
    async () => {
      const res = await db.select().from(schema.students).where(eq(schema.students.userId, userId));
      return res[0] || null;
    },
    () => readLocalDb().students.find(s => s.userId === userId) || null
  );
}

export async function dbAddStudent(student: any): Promise<any> {
  student.tenantId = student.tenantId || getTenantId();
  student.tenant_id = student.tenant_id || student.tenantId;
  return executeQuery(
    async () => {
      await db.insert(schema.students).values({
        id: student.id,
        registrationNumber: student.registrationNumber,
        name: student.name,
        email: student.email,
        classId: student.classId,
        enrollmentDate: student.enrollmentDate,
        attendanceRate: student.attendanceRate || 100.0,
        userId: student.userId || null,
        status: student.status || "Active",
        platform: student.platform || "CBT PRO",
        stream: student.stream || "",
        room: student.room || "",
        hostel: student.hostel || "",
        tenantId: student.tenantId
      });
      return student;
    },
    () => {
      const local = readLocalDb();
      local.students.push({
        ...student,
        status: student.status || "Active",
        platform: student.platform || "CBT PRO",
        stream: student.stream || "",
        room: student.room || "",
        hostel: student.hostel || ""
      });
      writeLocalDb(local);
      return student;
    }
  );
}

export async function dbUpdateStudentAttendanceRate(studentId: string, rate: number): Promise<void> {
  return executeQuery(
    async () => {
      await db.update(schema.students).set({ attendanceRate: rate }).where(eq(schema.students.id, studentId));
    },
    () => {
      const local = readLocalDb();
      const st = local.students.find(s => s.id === studentId);
      if (st) {
        st.attendanceRate = rate;
        writeLocalDb(local);
      }
    }
  );
}

export async function dbUpdateStudentsStatus(studentIds: string[], status: string): Promise<void> {
  return executeQuery(
    async () => {
      for (const id of studentIds) {
        await db.update(schema.students).set({ status }).where(eq(schema.students.id, id));
      }
    },
    () => {
      const local = readLocalDb();
      local.students.forEach(s => {
        if (studentIds.includes(s.id)) {
          s.status = status;
        }
      });
      writeLocalDb(local);
    }
  );
}

// 4. Admissions Queries
export async function dbGetAdmissions(): Promise<any[]> {
  return executeQuery(
    async () => await db.select().from(schema.admissions),
    () => readLocalDb().admissions
  );
}

export async function dbAddAdmission(application: any): Promise<any> {
  application.tenantId = application.tenantId || getTenantId();
  application.tenant_id = application.tenant_id || application.tenantId;
  return executeQuery(
    async () => {
      await db.insert(schema.admissions).values({
        id: application.id,
        studentName: application.studentName,
        studentEmail: application.studentEmail,
        gradeApplied: application.gradeApplied,
        parentName: application.parentName,
        parentEmail: application.parentEmail,
        parentPhone: application.parentPhone,
        status: application.status || "PENDING",
        submittedAt: application.submittedAt || new Date().toISOString(),
        reviewedAt: application.reviewedAt || null,
        remarks: application.remarks || null,
        tenantId: application.tenantId
      });
      return application;
    },
    () => {
      const local = readLocalDb();
      local.admissions.push(application);
      writeLocalDb(local);
      return application;
    }
  );
}

export async function dbGetAdmissionById(id: string): Promise<any | null> {
  return executeQuery(
    async () => {
      const res = await db.select().from(schema.admissions).where(eq(schema.admissions.id, id));
      return res[0] || null;
    },
    () => readLocalDb().admissions.find(a => a.id === id) || null
  );
}

export async function dbUpdateAdmission(id: string, status: string, remarks: string): Promise<any> {
  const reviewedAt = new Date().toISOString();
  return executeQuery(
    async () => {
      await db.update(schema.admissions).set({
        status,
        remarks,
        reviewedAt
      }).where(eq(schema.admissions.id, id));
      
      const res = await db.select().from(schema.admissions).where(eq(schema.admissions.id, id));
      return res[0];
    },
    () => {
      const local = readLocalDb();
      const app = local.admissions.find(a => a.id === id);
      if (app) {
        app.status = status;
        app.remarks = remarks;
        app.reviewedAt = reviewedAt;
        writeLocalDb(local);
        return app;
      }
      return null;
    }
  );
}

// 5. Attendance Queries
export async function dbGetAttendance(date?: string): Promise<any[]> {
  return executeQuery(
    async () => {
      if (date) {
        return await db.select().from(schema.attendance).where(eq(schema.attendance.date, date));
      }
      return await db.select().from(schema.attendance);
    },
    () => {
      const list = readLocalDb().attendance;
      if (date) {
        return list.filter(a => a.date === date);
      }
      return list;
    }
  );
}

export async function dbAddAttendance(log: any): Promise<any> {
  log.tenantId = log.tenantId || getTenantId();
  log.tenant_id = log.tenant_id || log.tenantId;
  return executeQuery(
    async () => {
      await db.delete(schema.attendance).where(
        and(
          eq(schema.attendance.studentId, log.studentId),
          eq(schema.attendance.date, log.date)
        )
      );
      await db.insert(schema.attendance).values(log);
      return log;
    },
    () => {
      const local = readLocalDb();
      local.attendance = local.attendance.filter(a => !(a.studentId === log.studentId && a.date === log.date));
      local.attendance.push(log);
      writeLocalDb(local);
      return log;
    }
  );
}

export async function dbGetAttendanceForStudent(studentId: string): Promise<any[]> {
  return executeQuery(
    async () => {
      return await db.select().from(schema.attendance).where(eq(schema.attendance.studentId, studentId));
    },
    () => readLocalDb().attendance.filter(a => a.studentId === studentId)
  );
}

// 6. Timetable Queries
export async function dbGetTimetable(classId?: string): Promise<any[]> {
  return executeQuery(
    async () => {
      if (classId) {
        return await db.select().from(schema.timetable).where(eq(schema.timetable.classId, classId));
      }
      return await db.select().from(schema.timetable);
    },
    () => {
      const list = readLocalDb().timetable;
      if (classId) {
        return list.filter(t => t.classId === classId);
      }
      return list;
    }
  );
}

export async function dbAddTimetable(entry: any): Promise<any> {
  entry.tenantId = entry.tenantId || getTenantId();
  entry.tenant_id = entry.tenant_id || entry.tenantId;
  return executeQuery(
    async () => {
      await db.insert(schema.timetable).values(entry);
      return entry;
    },
    () => {
      const local = readLocalDb();
      local.timetable.push(entry);
      writeLocalDb(local);
      return entry;
    }
  );
}

// 7. Parents Queries
export async function dbGetParents(): Promise<any[]> {
  return executeQuery(
    async () => await db.select().from(schema.parents),
    () => readLocalDb().parents
  );
}

export async function dbGetParentByUserId(userId: string): Promise<any | null> {
  return executeQuery(
    async () => {
      const res = await db.select().from(schema.parents).where(eq(schema.parents.userId, userId));
      return res[0] || null;
    },
    () => readLocalDb().parents.find(p => p.userId === userId) || null
  );
}

export async function dbAddParent(parent: any): Promise<any> {
  parent.tenantId = parent.tenantId || getTenantId();
  parent.tenant_id = parent.tenant_id || parent.tenantId;
  return executeQuery(
    async () => {
      await db.insert(schema.parents).values(parent);
      return parent;
    },
    () => {
      const local = readLocalDb();
      local.parents.push(parent);
      writeLocalDb(local);
      return parent;
    }
  );
}

// 8. Exams Queries
export async function dbGetExams(): Promise<any[]> {
  return executeQuery(
    async () => await db.select().from(schema.exams),
    () => readLocalDb().exams
  );
}

export async function dbGetExamById(id: string): Promise<any | null> {
  return executeQuery(
    async () => {
      const res = await db.select().from(schema.exams).where(eq(schema.exams.id, id));
      return res[0] || null;
    },
    () => readLocalDb().exams.find(e => e.id === id) || null
  );
}

export async function dbAddExam(exam: any): Promise<any> {
  exam.tenantId = exam.tenantId || getTenantId();
  exam.tenant_id = exam.tenant_id || exam.tenantId;
  return executeQuery(
    async () => {
      await db.insert(schema.exams).values(exam);
      return exam;
    },
    () => {
      const local = readLocalDb();
      local.exams.push(exam);
      writeLocalDb(local);
      return exam;
    }
  );
}

export async function dbUpdateExam(id: string, updates: any): Promise<any> {
  return executeQuery(
    async () => {
      await db.update(schema.exams).set(updates).where(eq(schema.exams.id, id));
      const res = await db.select().from(schema.exams).where(eq(schema.exams.id, id));
      return res[0];
    },
    () => {
      const local = readLocalDb();
      const index = local.exams.findIndex(e => e.id === id);
      if (index !== -1) {
        local.exams[index] = { ...local.exams[index], ...updates };
        writeLocalDb(local);
        return local.exams[index];
      }
      return null;
    }
  );
}

export async function dbDeleteExam(id: string): Promise<boolean> {
  return executeQuery(
    async () => {
      await db.delete(schema.questions).where(eq(schema.questions.examId, id));
      await db.delete(schema.exams).where(eq(schema.exams.id, id));
      return true;
    },
    () => {
      const local = readLocalDb();
      const beforeLength = local.exams.length;
      local.exams = local.exams.filter(e => e.id !== id);
      local.questions = local.questions.filter(q => q.examId !== id);
      writeLocalDb(local);
      return local.exams.length < beforeLength;
    }
  );
}

// 9. Questions Queries
export async function dbGetQuestionsForExam(examId: string): Promise<any[]> {
  return executeQuery(
    async () => await db.select().from(schema.questions).where(eq(schema.questions.examId, examId)),
    () => readLocalDb().questions.filter(q => q.examId === examId)
  );
}

export async function dbAddQuestion(question: any): Promise<any> {
  question.tenantId = question.tenantId || getTenantId();
  question.tenant_id = question.tenant_id || question.tenantId;
  return executeQuery(
    async () => {
      await db.insert(schema.questions).values({
        id: question.id,
        examId: question.examId,
        text: question.text,
        type: question.type,
        options: question.options || [],
        answer: question.answer,
        scorePoints: question.scorePoints || 10,
        tenantId: question.tenantId
      });
      return question;
    },
    () => {
      const local = readLocalDb();
      local.questions.push(question);
      writeLocalDb(local);
      return question;
    }
  );
}

export async function dbAddQuestionsBulk(bulkQuestions: any[]): Promise<any[]> {
  const tenantId = getTenantId();
  for (const q of bulkQuestions) {
    q.tenantId = q.tenantId || tenantId;
    q.tenant_id = q.tenant_id || q.tenantId;
  }
  return executeQuery(
    async () => {
      for (const q of bulkQuestions) {
        await db.insert(schema.questions).values({
          id: q.id,
          examId: q.examId,
          text: q.text,
          type: q.type,
          options: q.options || [],
          answer: q.answer,
          scorePoints: q.scorePoints || 10,
          tenantId: q.tenantId
        });
      }
      return bulkQuestions;
    },
    () => {
      const local = readLocalDb();
      local.questions.push(...bulkQuestions);
      writeLocalDb(local);
      return bulkQuestions;
    }
  );
}

// 10. Exam Attempts Queries
export async function dbGetExamAttemptById(id: string): Promise<any | null> {
  return executeQuery(
    async () => {
      const res = await db.select().from(schema.examAttempts).where(eq(schema.examAttempts.id, id));
      return res[0] || null;
    },
    () => readLocalDb().examAttempts.find(a => a.id === id) || null
  );
}

export async function dbGetActiveAttempt(examId: string, studentId: string): Promise<any | null> {
  return executeQuery(
    async () => {
      const res = await db.select().from(schema.examAttempts).where(
        and(
          eq(schema.examAttempts.examId, examId),
          eq(schema.examAttempts.studentId, studentId),
          eq(schema.examAttempts.isSubmitted, false)
        )
      );
      return res[0] || null;
    },
    () => readLocalDb().examAttempts.find(att => att.examId === examId && att.studentId === studentId && !att.isSubmitted) || null
  );
}

export async function dbAddExamAttempt(attempt: any): Promise<any> {
  attempt.tenantId = attempt.tenantId || getTenantId();
  attempt.tenant_id = attempt.tenant_id || attempt.tenantId;
  return executeQuery(
    async () => {
      await db.insert(schema.examAttempts).values({
        id: attempt.id,
        examId: attempt.examId,
        studentId: attempt.studentId,
        startTime: attempt.startTime || new Date().toISOString(),
        submitTime: attempt.submitTime || null,
        answers: attempt.answers || {},
        score: attempt.score || 0,
        percentage: attempt.percentage || 0.0,
        status: attempt.status || "PENDING_GRADING",
        gradePoint: attempt.gradePoint || "F",
        remarks: attempt.remarks || null,
        isSubmitted: attempt.isSubmitted || false,
        violationsCount: attempt.violationsCount || 0,
        tenantId: attempt.tenantId
      });
      return attempt;
    },
    () => {
      const local = readLocalDb();
      local.examAttempts.push(attempt);
      writeLocalDb(local);
      return attempt;
    }
  );
}

export async function dbUpdateAttemptAnswer(attemptId: string, questionId: string, response: string, violationsCount?: number): Promise<void> {
  return executeQuery(
    async () => {
      const attempt = await dbGetExamAttemptById(attemptId);
      if (attempt) {
        const updatedAnswers = { ...attempt.answers, [questionId]: response };
        const updates: any = { answers: updatedAnswers };
        if (violationsCount !== undefined) {
          updates.violationsCount = violationsCount;
        }
        await db.update(schema.examAttempts).set(updates).where(eq(schema.examAttempts.id, attemptId));
      }
    },
    () => {
      const local = readLocalDb();
      const attempt = local.examAttempts.find(att => att.id === attemptId);
      if (attempt) {
        attempt.answers[questionId] = response;
        if (violationsCount !== undefined) {
          attempt.violationsCount = violationsCount;
        }
        writeLocalDb(local);
      }
    }
  );
}

export async function dbSubmitAttempt(attemptId: string, submissionDetails: any): Promise<any> {
  return executeQuery(
    async () => {
      await db.update(schema.examAttempts).set({
        score: submissionDetails.score,
        percentage: submissionDetails.percentage,
        status: submissionDetails.status,
        gradePoint: submissionDetails.gradePoint,
        remarks: submissionDetails.remarks,
        submitTime: submissionDetails.submitTime || new Date().toISOString(),
        isSubmitted: true,
        violationsCount: submissionDetails.violationsCount
      }).where(eq(schema.examAttempts.id, attemptId));
      
      return await dbGetExamAttemptById(attemptId);
    },
    () => {
      const local = readLocalDb();
      const attempt = local.examAttempts.find(att => att.id === attemptId);
      if (attempt) {
        attempt.score = submissionDetails.score;
        attempt.percentage = submissionDetails.percentage;
        attempt.status = submissionDetails.status;
        attempt.gradePoint = submissionDetails.gradePoint;
        attempt.remarks = submissionDetails.remarks;
        attempt.submitTime = submissionDetails.submitTime || new Date().toISOString();
        attempt.isSubmitted = true;
        attempt.violationsCount = submissionDetails.violationsCount;
        writeLocalDb(local);
        return attempt;
      }
      return null;
    }
  );
}

export async function dbGetStudentAttempts(studentId: string): Promise<any[]> {
  return executeQuery(
    async () => {
      return await db.select().from(schema.examAttempts).where(
        and(
          eq(schema.examAttempts.studentId, studentId),
          eq(schema.examAttempts.isSubmitted, true)
        )
      );
    },
    () => readLocalDb().examAttempts.filter(att => att.studentId === studentId && att.isSubmitted)
  );
}

export async function dbGetAllAttempts(): Promise<any[]> {
  return executeQuery(
    async () => await db.select().from(schema.examAttempts),
    () => readLocalDb().examAttempts
  );
}

// EduTAMS Lesson Notes operations
export async function dbGetLessonNotes(): Promise<any[]> {
  return executeQuery(
    async () => [],
    () => readLocalDb().lessonNotes || []
  );
}

export async function dbAddLessonNote(note: any): Promise<any> {
  note.tenantId = note.tenantId || getTenantId();
  note.tenant_id = note.tenant_id || note.tenantId;
  return executeQuery(
    async () => note,
    () => {
      const local = readLocalDb();
      if (!local.lessonNotes) local.lessonNotes = [];
      local.lessonNotes.push(note);
      writeLocalDb(local);
      return note;
    }
  );
}

export async function dbUpdateLessonNote(id: string, updates: any): Promise<any> {
  return executeQuery(
    async () => updates,
    () => {
      const local = readLocalDb();
      if (!local.lessonNotes) local.lessonNotes = [];
      const idx = local.lessonNotes.findIndex(n => n.id === id);
      if (idx !== -1) {
        local.lessonNotes[idx] = { ...local.lessonNotes[idx], ...updates };
        writeLocalDb(local);
        return local.lessonNotes[idx];
      }
      return null;
    }
  );
}

// EduTAMS School Fee Billing operations
export async function dbGetBillingInvoices(): Promise<any[]> {
  return executeQuery(
    async () => [],
    () => readLocalDb().billingInvoices || []
  );
}

export async function dbAddBillingInvoice(invoice: any): Promise<any> {
  invoice.tenantId = invoice.tenantId || getTenantId();
  invoice.tenant_id = invoice.tenant_id || invoice.tenantId;
  return executeQuery(
    async () => invoice,
    () => {
      const local = readLocalDb();
      if (!local.billingInvoices) local.billingInvoices = [];
      local.billingInvoices.push(invoice);
      writeLocalDb(local);
      return invoice;
    }
  );
}

export async function dbUpdateBillingInvoice(id: string, updates: any): Promise<any> {
  return executeQuery(
    async () => updates,
    () => {
      const local = readLocalDb();
      if (!local.billingInvoices) local.billingInvoices = [];
      const idx = local.billingInvoices.findIndex(i => i.id === id);
      if (idx !== -1) {
        local.billingInvoices[idx] = { ...local.billingInvoices[idx], ...updates };
        writeLocalDb(local);
        return local.billingInvoices[idx];
      }
      return null;
    }
  );
}

export async function dbDeleteBillingInvoice(id: string): Promise<boolean> {
  return executeQuery(
    async () => true,
    () => {
      const local = readLocalDb();
      if (!local.billingInvoices) local.billingInvoices = [];
      const idx = local.billingInvoices.findIndex(i => i.id === id);
      if (idx !== -1) {
        local.billingInvoices.splice(idx, 1);
        writeLocalDb(local);
        return true;
      }
      return false;
    }
  );
}

export async function dbGetBillingCategories(): Promise<string[]> {
  return executeQuery(
    async () => ["Tuition Fees", "Exam Fees", "Textbooks", "Uniforms", "Laboratory Levy", "Sports Levy", "Library Fee"],
    () => {
      const db = readLocalDb();
      if (!db.billingCategories) {
        return ["Tuition Fees", "Exam Fees", "Textbooks", "Uniforms", "Laboratory Levy", "Sports Levy", "Library Fee"];
      }
      return db.billingCategories;
    }
  );
}

export async function dbAddBillingCategory(category: string): Promise<string[]> {
  return executeQuery(
    async () => [category],
    () => {
      const local = readLocalDb();
      if (!local.billingCategories) {
        local.billingCategories = ["Tuition Fees", "Exam Fees", "Textbooks", "Uniforms", "Laboratory Levy", "Sports Levy", "Library Fee"];
      }
      if (!local.billingCategories.includes(category)) {
        local.billingCategories.push(category);
        writeLocalDb(local);
      }
      return local.billingCategories;
    }
  );
}

export async function dbDeleteBillingCategory(category: string): Promise<string[]> {
  return executeQuery(
    async () => [],
    () => {
      const local = readLocalDb();
      if (!local.billingCategories) {
        local.billingCategories = ["Tuition Fees", "Exam Fees", "Textbooks", "Uniforms", "Laboratory Levy", "Sports Levy", "Library Fee"];
      }
      const index = local.billingCategories.indexOf(category);
      if (index !== -1) {
        local.billingCategories.splice(index, 1);
        writeLocalDb(local);
      }
      return local.billingCategories;
    }
  );
}

// ----------------------------------------------------
// TENANTS OPERATIONS (Multi-Tenant Management)
// ----------------------------------------------------
export async function dbGetTenants(): Promise<any[]> {
  return executeQuery(
    async () => await db.select().from(schema.tenants),
    () => {
      const dbData = readLocalDb();
      if (!dbData.tenants) dbData.tenants = [];
      return dbData.tenants;
    }
  );
}

export async function dbGetTenantById(id: string): Promise<any | null> {
  return executeQuery(
    async () => {
      const res = await db.select().from(schema.tenants).where(eq(schema.tenants.id, id));
      return res[0] || null;
    },
    () => {
      const dbData = readLocalDb();
      if (!dbData.tenants) dbData.tenants = [];
      return dbData.tenants.find(t => t.id === id) || null;
    }
  );
}

export async function dbGetTenantBySubdomain(subdomain: string): Promise<any | null> {
  return executeQuery(
    async () => {
      const res = await db.select().from(schema.tenants).where(eq(schema.tenants.subdomain, subdomain));
      return res[0] || null;
    },
    () => {
      const dbData = readLocalDb();
      if (!dbData.tenants) dbData.tenants = [];
      return dbData.tenants.find(t => t.subdomain.toLowerCase() === subdomain.toLowerCase()) || null;
    }
  );
}

export async function dbAddTenant(tenant: any): Promise<any> {
  const sanitizedTenant = {
    id: tenant.id,
    name: tenant.name,
    subdomain: tenant.subdomain,
    logoUrl: tenant.logoUrl || "",
    backgroundImageUrl: tenant.backgroundImageUrl || "",
    primaryColor: tenant.primaryColor || "#4f46e5",
    secondaryColor: tenant.secondaryColor || "#0d9488",
    contactEmail: tenant.contactEmail || "",
    contactPhone: tenant.contactPhone || "",
    address: tenant.address || "",
    status: tenant.status || "active",
    plan: tenant.plan || "Basic",
    academicYear: tenant.academicYear || "2025/2026",
    createdAt: tenant.createdAt || new Date().toISOString()
  };
  return executeQuery(
    async () => {
      await db.insert(schema.tenants).values(sanitizedTenant);
      return sanitizedTenant;
    },
    () => {
      const dbData = readLocalDb();
      if (!dbData.tenants) dbData.tenants = [];
      dbData.tenants.push(sanitizedTenant);
      writeLocalDb(dbData);
      return sanitizedTenant;
    }
  );
}

export async function dbUpdateTenant(id: string, updates: any): Promise<any> {
  return executeQuery(
    async () => {
      await db.update(schema.tenants).set(updates).where(eq(schema.tenants.id, id));
      const res = await db.select().from(schema.tenants).where(eq(schema.tenants.id, id));
      return res[0] || null;
    },
    () => {
      const dbData = readLocalDb();
      if (!dbData.tenants) dbData.tenants = [];
      const idx = dbData.tenants.findIndex(t => t.id === id);
      if (idx !== -1) {
        dbData.tenants[idx] = { ...dbData.tenants[idx], ...updates };
        writeLocalDb(dbData);
        return dbData.tenants[idx];
      }
      return null;
    }
  );
}

export async function dbDeleteTenant(id: string): Promise<boolean> {
  return executeQuery(
    async () => {
      await db.delete(schema.tenants).where(eq(schema.tenants.id, id));
      return true;
    },
    () => {
      const dbData = readLocalDb();
      if (!dbData.tenants) dbData.tenants = [];
      const beforeLength = dbData.tenants.length;
      dbData.tenants = dbData.tenants.filter(t => t.id !== id);
      if (dbData.tenants.length < beforeLength) {
        writeLocalDb(dbData);
        return true;
      }
      return false;
    }
  );
}

export async function dbDeleteUser(id: string): Promise<boolean> {
  return executeQuery(
    async () => {
      await db.delete(schema.users).where(eq(schema.users.id, id));
      return true;
    },
    () => {
      const dbData = readLocalDb();
      if (!dbData.users) dbData.users = [];
      const beforeLength = dbData.users.length;
      dbData.users = dbData.users.filter(u => u.id !== id);
      if (dbData.users.length < beforeLength) {
        writeLocalDb(dbData);
        return true;
      }
      return false;
    }
  );
}

