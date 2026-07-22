/**
 * Types for CBT PRO X - AI-Powered Educational Operating System
 */

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'PARENT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
}

export interface Student {
  id: string;
  registrationNumber: string;
  name: string;
  email?: string;
  classId?: string;
  className?: string; // Loaded helper
  enrollmentDate: string;
  attendanceRate: number;
  userId?: string;
  status?: 'Active' | 'Graduated' | 'Suspended';
  platform?: string;
  stream?: string;
  room?: string;
  hostel?: string;
}

export interface AdmissionApplication {
  id: string;
  studentName: string;
  studentEmail: string;
  gradeApplied: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedAt?: string;
  remarks?: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName?: string; // Loaded helper
  date: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  room: string;
  primaryTeacher: string;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface TimetableEntry {
  id: string;
  classId: string;
  className?: string; // Loaded helper
  subject: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // e.g. "08:30"
  endTime: string;   // e.g. "10:00"
  teacher: string;
  room: string;
}

export interface Parent {
  id: string;
  name: string;
  email: string;
  phone: string;
  childStudentId: string;
  childName?: string; // Loaded helper
  tempPassword?: string; // Set upon provisioning
  userId?: string;
}

export type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'ESSAY';

export interface Question {
  id: string;
  examId: string;
  text: string;
  type: QuestionType;
  options: string[]; // Options for MCQ or True/False
  answer: string;    // Correct answer (e.g. option text, or "True"/"False", or keywords for essay)
  scorePoints: number;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  passingScore: number; // e.g. 40 (percentage)
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  totalQuestions: number;
  startTime: string;
  endTime: string;
  questions?: Question[];
}

export interface ExamAttempt {
  id: string;
  examId: string;
  examTitle?: string; // Loaded helper
  studentId: string;
  studentName?: string; // Loaded helper
  startTime: string;
  submitTime?: string;
  answers: Record<string, string>; // questionId -> submittedAnswer
  score: number;
  percentage: number;
  status: 'PASS' | 'FAIL' | 'PENDING_GRADING';
  gradePoint?: string; // A+, A, B, C, D, F
  remarks?: string;
  isSubmitted: boolean;
  violationsCount: number;
}
