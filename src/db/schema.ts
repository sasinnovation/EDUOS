import { pgTable, text, integer, boolean, doublePrecision, jsonb } from "drizzle-orm/pg-core";

// 1. Users Schema
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull(), // ADMIN, TEACHER, STUDENT, PARENT
  tenantId: text("tenant_id").notNull().default("default"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull(),
});

// 2. Classes Schema
export const classes = pgTable("classes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  room: text("room").notNull(),
  primaryTeacher: text("primary_teacher").notNull(),
  tenantId: text("tenant_id").notNull().default("default"),
});

// 3. Students Schema
export const students = pgTable("students", {
  id: text("id").primaryKey(),
  registrationNumber: text("registration_number").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  classId: text("class_id").notNull(),
  enrollmentDate: text("enrollment_date").notNull(),
  attendanceRate: doublePrecision("attendance_rate").notNull().default(100.0),
  userId: text("user_id"),
  status: text("status").notNull().default("Active"),
  platform: text("platform").default("CBT PRO"),
  stream: text("stream").default(""),
  room: text("room").default(""),
  hostel: text("hostel").default(""),
  tenantId: text("tenant_id").notNull().default("default"),
});

// 4. Admissions Schema
export const admissions = pgTable("admissions", {
  id: text("id").primaryKey(),
  studentName: text("student_name").notNull(),
  studentEmail: text("student_email").notNull(),
  gradeApplied: text("grade_applied").notNull(),
  parentName: text("parent_name").notNull(),
  parentEmail: text("parent_email").notNull(),
  parentPhone: text("parent_phone").notNull(),
  status: text("status").notNull().default("PENDING"), // PENDING, APPROVED, REJECTED
  submittedAt: text("submitted_at").notNull(),
  reviewedAt: text("reviewed_at"),
  remarks: text("remarks"),
  tenantId: text("tenant_id").notNull().default("default"),
});

// 5. Attendance Schema
export const attendance = pgTable("attendance", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  status: text("status").notNull(), // PRESENT, ABSENT, LATE
  remarks: text("remarks"),
  tenantId: text("tenant_id").notNull().default("default"),
});

// 6. Timetable Schema
export const timetable = pgTable("timetable", {
  id: text("id").primaryKey(),
  classId: text("class_id").notNull(),
  subject: text("subject").notNull(),
  dayOfWeek: text("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  teacher: text("teacher").notNull(),
  room: text("room").notNull(),
  tenantId: text("tenant_id").notNull().default("default"),
});

// 7. Parents Schema
export const parents = pgTable("parents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  childStudentId: text("child_student_id").notNull(),
  tempPassword: text("temp_password"),
  userId: text("user_id"),
  tenantId: text("tenant_id").notNull().default("default"),
});

// 8. Exams Schema
export const exams = pgTable("exams", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  duration: integer("duration").notNull(), // in minutes
  passingScore: integer("passing_score").notNull().default(40),
  status: text("status").notNull().default("DRAFT"), // DRAFT, PUBLISHED
  totalQuestions: integer("total_questions").notNull().default(0),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  tenantId: text("tenant_id").notNull().default("default"),
});

// 9. Questions Schema
export const questions = pgTable("questions", {
  id: text("id").primaryKey(),
  examId: text("exam_id").notNull(),
  text: text("text").notNull(),
  type: text("type").notNull(), // MCQ, TRUE_FALSE, ESSAY
  options: jsonb("options").notNull().default([]), // String options
  answer: text("answer").notNull(),
  scorePoints: integer("score_points").notNull().default(10),
  tenantId: text("tenant_id").notNull().default("default"),
});

// 10. Exam Attempts Schema
export const examAttempts = pgTable("exam_attempts", {
  id: text("id").primaryKey(),
  examId: text("exam_id").notNull(),
  studentId: text("student_id").notNull(),
  startTime: text("start_time").notNull(),
  submitTime: text("submit_time"),
  answers: jsonb("answers").notNull().default({}), // key-value maps of { questionId: string }
  score: integer("score").notNull().default(0),
  percentage: doublePrecision("percentage").notNull().default(0.0),
  status: text("status").notNull().default("PENDING_GRADING"), // PASS, FAIL, PENDING_GRADING
  gradePoint: text("grade_point").default("F"),
  remarks: text("remarks"),
  isSubmitted: boolean("is_submitted").notNull().default(false),
  violationsCount: integer("violations_count").notNull().default(0),
  tenantId: text("tenant_id").notNull().default("default"),
});

// 11. Tenants Schema
export const tenants = pgTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  subdomain: text("subdomain").notNull().unique(),
  logoUrl: text("logo_url"),
  backgroundImageUrl: text("background_image_url"),
  primaryColor: text("primary_color").notNull().default("#4f46e5"),
  secondaryColor: text("secondary_color").notNull().default("#0d9488"),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  address: text("address").notNull(),
  status: text("status").notNull().default("active"),
  plan: text("plan").notNull().default("Basic"),
  academicYear: text("academic_year").notNull().default("2025/2026"),
  createdAt: text("created_at").notNull(),
});

