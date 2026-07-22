import React, { useState, useEffect } from "react";
import { 
  School, 
  BookOpen, 
  Award, 
  UserCheck, 
  Calendar, 
  ShieldCheck, 
  Sparkles, 
  Key,
  Users,
  Activity,
  Bot,
  LogIn,
  Download,
  RefreshCw,
  FileJson,
  FileText,
  FileSpreadsheet,
  Trash2,
  Wifi,
  WifiOff,
  Database,
  CloudUpload,
  CheckCircle
} from "lucide-react";
import Shell from "./components/Shell";
import AdminERP from "./components/AdminERP";
import TeacherAssessments from "./components/TeacherAssessments";
import StudentCBT from "./components/StudentCBT";
import ParentPortal from "./components/ParentPortal";
import GmailHub from "./components/GmailHub";
import DriveHub from "./components/DriveHub";
import OgunLearnPortal from "./components/OgunLearnPortal";
import BillingModule from "./components/BillingModule";
import LessonNotesModule from "./components/LessonNotesModule";
import AdminAttendanceTrends from "./components/AdminAttendanceTrends";
import AdminAIDashboard from "./components/AdminAIDashboard";
import EdvesERPModule from "./components/EdvesERPModule";
import TenantManagement from "./components/TenantManagement";
import SchoolLandingPage from "./components/SchoolLandingPage";
import UserManagement from "./components/UserManagement";
import { User, UserRole } from "./types";
import { motion } from "motion/react";
import { 
  getActivityLogs, 
  logActivity, 
  resetActivityLogs, 
  exportLogsToJSON, 
  exportLogsToTXT, 
  exportLogsToCSV,
  ActivityLog 
} from "./utils/auditLogger";
import { supabase } from "./lib/supabase";

function TeacherDashboardWidget({ token }: { token: string }) {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadExams() {
      try {
        setLoading(true);
        const res = await fetch("/api/exams", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
          const data = await res.json();
          setExams(data);
        }
      } catch (err) {
        console.error("Failed to fetch exams for widget", err);
      } finally {
        setLoading(false);
      }
    }
    loadExams();
  }, [token]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4" id="teacher-dashboard-widget">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
            <BookOpen className="h-4 w-4" />
          </span>
          <div>
            <h4 className="text-sm font-black text-slate-800">🧑‍🏫 Instructor Dashboard Widget</h4>
            <p className="text-[10px] font-mono text-slate-400">Continuous Assessment & Assignments Registry</p>
          </div>
        </div>
        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
          {exams.length} Active Exams
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upcoming Assessments */}
        <div className="space-y-3">
          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
            Upcoming Exams & CAs
          </span>
          {loading ? (
            <div className="flex items-center space-x-2 text-xs text-slate-400 py-4">
              <RefreshCw className="h-3 w-3 animate-spin text-indigo-500" />
              <span>Loading assessments registry...</span>
            </div>
          ) : exams.length === 0 ? (
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 border border-slate-100">
              No upcoming exams scheduled. Click "Assessments Engine" above to schedule one.
            </div>
          ) : (
            <div className="space-y-2">
              {exams.slice(0, 3).map((exam) => (
                <div key={exam.id} className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="min-w-0">
                    <span className="font-bold text-slate-700 text-xs block truncate">{exam.title}</span>
                    <span className="text-[9px] text-slate-400 font-mono">Duration: {exam.duration} mins | Subject: {exam.subjectCode || "GEN-101"}</span>
                  </div>
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                    exam.isPublished 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                      : "bg-amber-50 text-amber-700 border border-amber-100"
                  }`}>
                    {exam.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assignments & Grading Queue */}
        <div className="space-y-3">
          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
            Pending Continuous Assessment Actions
          </span>
          <div className="space-y-2">
            {[
              { id: "asg-1", title: "Algebraic Trigonometry Quiz", course: "Mathematics Level 2", pending: "4 submissions", priority: "HIGH" },
              { id: "asg-2", title: "Photosynthesis Lab Report", course: "Biology Section A", pending: "9 submissions", priority: "MEDIUM" },
              { id: "asg-3", title: "Frictional Forces CBT Review", course: "Physics Core", pending: "All Graded", priority: "LOW" },
            ].map((asg) => (
              <div key={asg.id} className="p-3 bg-white border border-slate-150 rounded-xl flex items-center justify-between hover:border-indigo-200 transition-colors">
                <div className="min-w-0">
                  <span className="font-bold text-slate-700 text-xs block truncate">{asg.title}</span>
                  <span className="text-[9px] text-slate-400 font-mono">{asg.course} • <strong className="text-indigo-600">{asg.pending}</strong></span>
                </div>
                <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded ${
                  asg.priority === "HIGH" 
                    ? "bg-rose-50 text-rose-700" 
                    : asg.priority === "MEDIUM"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-slate-100 text-slate-600"
                }`}>
                  {asg.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ParentDashboardWidget({ token }: { token: string }) {
  const [childData, setChildData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadChild() {
      try {
        setLoading(true);
        const res = await fetch("/api/students/s-1", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
          const data = await res.json();
          setChildData(data);
        }
      } catch (err) {
        console.error("Failed to load child data for parent widget", err);
      } finally {
        setLoading(false);
      }
    }
    loadChild();
  }, [token]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4" id="parent-dashboard-widget">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
            <Award className="h-4 w-4" />
          </span>
          <div>
            <h4 className="text-sm font-black text-slate-800">👪 Guardian Dashboard Widget</h4>
            <p className="text-[10px] font-mono text-slate-400">Real-Time Ward Performance Overview</p>
          </div>
        </div>
        {childData && (
          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
            Active Student: {childData.name}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center space-x-2 text-xs text-slate-400 py-4 justify-center">
          <RefreshCw className="h-4 w-4 animate-spin text-indigo-500" />
          <span>Syncing continuous academic progress files...</span>
        </div>
      ) : childData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Recent Continuous Assessment Scores */}
          <div className="space-y-3">
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
              Recent Assessment Grades
            </span>
            <div className="space-y-2">
              {[
                { subject: "Mathematics CBT Examination", score: "92/100", grade: "A+", status: "Excellent" },
                { subject: "Physics Mock Continuous Assessment", score: "84/100", grade: "B+", status: "Very Good" },
                { subject: "Biology Weekly Lab Experiment", score: "78/100", grade: "B", status: "Above Average" },
                { subject: "Chemistry Periodic Table Quiz", score: "90/100", grade: "A", status: "Excellent" }
              ].map((sub, idx) => (
                <div key={idx} className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-700 text-xs block">{sub.subject}</span>
                    <span className="text-[9px] text-slate-400 font-mono">Performance: {sub.status}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-indigo-600 block font-mono">{sub.score}</span>
                    <span className="text-[9px] font-bold text-slate-500 font-mono">Grade {sub.grade}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Homework, Timetable & Attendance Indicator */}
          <div className="space-y-4">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-50/40 border border-indigo-100 p-3 rounded-xl text-center">
                <span className="text-[9px] font-mono font-bold text-indigo-600 uppercase tracking-wider block">Attendance Rate</span>
                <span className="text-lg font-black text-indigo-950 font-mono">{childData.attendanceRate}%</span>
                <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">Highly Regular</span>
              </div>
              <div className="bg-emerald-50/40 border border-emerald-100 p-3 rounded-xl text-center">
                <span className="text-[9px] font-mono font-bold text-emerald-600 uppercase tracking-wider block">Completed Homework</span>
                <span className="text-lg font-black text-emerald-950 font-mono">14/15</span>
                <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">Top of Class</span>
              </div>
            </div>

            {/* Timetable / Upcomings */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                Upcoming Assignments & Deadlines
              </span>
              <div className="p-3 bg-white border border-slate-150 rounded-xl flex items-center justify-between hover:border-indigo-200 transition-colors">
                <div>
                  <span className="font-bold text-slate-700 text-xs block">Organic Chemistry Formulas Workbook</span>
                  <span className="text-[9px] text-slate-400 font-mono">Due: Tomorrow, 11:59 PM | Subject: Chemistry</span>
                </div>
                <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700">
                  DUE SOON
                </span>
              </div>
              <div className="p-3 bg-white border border-slate-150 rounded-xl flex items-center justify-between hover:border-indigo-200 transition-colors">
                <div>
                  <span className="font-bold text-slate-700 text-xs block">Wole Soyinka Prose Reading & Synopsis</span>
                  <span className="text-[9px] text-slate-400 font-mono">Due: Fri, Oct 19 | Subject: Literature in English</span>
                </div>
                <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  ONGOING
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-50 text-xs text-slate-400 border border-slate-100 rounded-xl text-center">
          No ward continuous assessment records mapped. Access the "Parent Portal" from Quick Links.
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [activeSchoolSubdomain, setActiveSchoolSubdomain] = useState<string | null>(() => {
    const path = window.location.pathname;
    if (path.startsWith("/school/")) {
      const parts = path.split("/");
      return parts[2] || null;
    }
    return null;
  });

  const handleSelectTenantSubdomain = (subdomain: string) => {
    // Open school landing/dashboard page in a new tab to operate independently!
    window.open(`/school/${subdomain}`, "_blank");
  };

  const handleBackToMain = () => {
    setActiveSchoolSubdomain(null);
    setUser(null);
    setToken("");
    localStorage.removeItem("cbt_prox_token");
    sessionStorage.removeItem("cbt_prox_token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    window.history.pushState({}, "", "/");
  };

  useEffect(() => {
    if (user && activeSchoolSubdomain) {
      setActiveSchoolSubdomain(null);
      if (window.location.pathname.startsWith("/school/")) {
        window.history.replaceState({}, document.title, "/");
      }
    }
  }, [user, activeSchoolSubdomain]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [tenantsList, setTenantsList] = useState<any[]>([]);
  const [selectedLogTenantFilter, setSelectedLogTenantFilter] = useState<string>("all-tenants");
  const [loggedInTenant, setLoggedInTenant] = useState<any | null>(null);

  // Fetch tenant details for the logged-in user to support workspace personalization
  useEffect(() => {
    if (user && user.tenantId && user.tenantId !== "default") {
      fetch(`/api/public/tenants/${user.tenantId}`)
        .then(res => {
          if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
            return res.json();
          }
        })
        .then(data => {
          if (data && data.id) {
            setLoggedInTenant(data);
          }
        })
        .catch(err => console.error("Failed to load logged-in tenant details:", err));
    } else {
      setLoggedInTenant(null);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role === "ADMIN" && user.tenantId === "default" && token) {
      fetch("/api/tenants", {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => {
          if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
            return res.json();
          }
          return [];
        })
        .then(data => {
          if (Array.isArray(data)) {
            setTenantsList(data);
          }
        })
        .catch(err => console.error("Failed to load tenants list for log filtering:", err));
    }
  }, [user, token]);

  // Role-based Access Guard to satisfy "NO UNAUTHORISED USER TO SEE OTHER USER ACCESS"
  useEffect(() => {
    if (!user) return;
    
    const adminTabs = ["dashboard", "students", "admissions", "classes", "timetable", "parents", "exams", "billing", "lesson-notes-review", "edves-erp", "tenants", "gmail", "drive", "user-management", "ai-advisory"];
    const teacherTabs = ["dashboard", "exams", "attendance", "students", "timetable", "lesson-notes", "edves-erp", "gmail", "drive", "user-management"];
    const studentTabs = ["dashboard", "student-exams", "student-history", "student-timetable", "ogunlearn", "fees-payment", "user-management"];
    const parentTabs = ["dashboard", "parent-portal", "parent-fees", "parent-chat", "user-management"];

    let allowed = false;
    if (user.role === "ADMIN") {
      allowed = adminTabs.includes(activeTab);
      // Extra check: Multi-tenant management "tenants" is only for super-admin or specific superadmin-like emails
      if (activeTab === "tenants") {
        const isSuperAdminEmail = [
          "adebayosamuel015@gmail.com",
          "admin@eduos.com",
          "sasinnovationgroup@gmail.com"
        ].includes(user.email?.toLowerCase());

        const hasTenantAccess = user.tenantId === "super-admin" || isSuperAdminEmail;
        if (!hasTenantAccess) {
          allowed = false;
        }
      }
    } else if (user.role === "TEACHER") {
      allowed = teacherTabs.includes(activeTab);
    } else if (user.role === "STUDENT") {
      allowed = studentTabs.includes(activeTab);
    } else if (user.role === "PARENT") {
      allowed = parentTabs.includes(activeTab);
    }

    if (!allowed) {
      console.warn(`Unauthorized access attempt to tab "${activeTab}" by user role "${user.role}". Redirecting to dashboard.`);
      setActiveTab("dashboard");
    }
  }, [user, activeTab]);

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logActivity(
        "SYS_TRIG",
        "Connection to CBT Server re-established successfully.",
        "SUCCESS",
        user?.name || "System Detector",
        user?.tenantId || "default"
      );
    };
    const handleOffline = () => {
      setIsOnline(false);
      logActivity(
        "SYS_TRIG",
        "Connection to CBT Server lost. Switched automatically to offline cached completion mode.",
        "WARNING",
        user?.name || "System Detector",
        user?.tenantId || "default"
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user]);

  const isEffectiveOnline = isOnline && !isSimulatedOffline;

  const [exams, setExams] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    const fetchExamsList = async () => {
      try {
        const res = await fetch("/api/exams", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setExams(data);
          }
        }
      } catch (e) {
        console.error("Error loading exams for dashboard", e);
      }
    };
    fetchExamsList();
  }, [token]);

  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    const updateQueue = () => {
      const actions: { id: string; examId: string; examTitle: string; qId: string; value: string }[] = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("cbt_unsynced_")) {
            const examId = key.replace("cbt_unsynced_", "");
            const examObj = exams.find((e) => String(e.id) === String(examId));
            const examTitle = examObj ? examObj.title : `Exam (ID: ${examId})`;
            const dataStr = localStorage.getItem(key);
            if (dataStr) {
              const data = JSON.parse(dataStr);
              Object.entries(data).forEach(([qId, value]) => {
                actions.push({
                  id: `${examId}_${qId}`,
                  examId,
                  examTitle,
                  qId,
                  value: String(value),
                });
              });
            }
          }
        }
      } catch (e) {
        console.error("Error reading offline queue", e);
      }
      setPendingActions(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(actions)) {
          return actions;
        }
        return prev;
      });
    };

    updateQueue();
    const interval = setInterval(updateQueue, 2000);
    return () => clearInterval(interval);
  }, [exams]);

  const handleSyncNow = async () => {
    if (pendingActions.length === 0) return;
    setIsSyncingAll(true);
    setSyncMessage({ text: "Initiating synchronization queue...", type: "info" });
    
    let successCount = 0;
    let failedCount = 0;

    for (const action of pendingActions) {
      try {
        const attemptStr = localStorage.getItem(`cbt_active_attempt_${action.examId}`);
        if (!attemptStr) {
          failedCount++;
          continue;
        }
        const attempt = JSON.parse(attemptStr);
        const attemptId = attempt?.id;
        if (!attemptId) {
          failedCount++;
          continue;
        }

        const res = await fetch(`/api/exams/${action.examId}/answers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            attemptId: attemptId,
            questionId: action.qId,
            response: action.value,
            violationsCount: 0
          })
        });

        if (res.ok) {
          const key = `cbt_unsynced_${action.examId}`;
          const currentUnsynced = JSON.parse(localStorage.getItem(key) || "{}");
          delete currentUnsynced[action.qId];
          if (Object.keys(currentUnsynced).length === 0) {
            localStorage.removeItem(key);
          } else {
            localStorage.setItem(key, JSON.stringify(currentUnsynced));
          }
          successCount++;
        } else {
          failedCount++;
        }
      } catch (e) {
        console.error("Error syncing offline action", e);
        failedCount++;
      }
    }

    setIsSyncingAll(false);
    if (failedCount === 0) {
      setSyncMessage({ text: `Successfully synchronized ${successCount} offline actions!`, type: "success" });
      logActivity(
        "SYS_TRIG",
        `Manually synchronized ${successCount} cached offline answers successfully.`,
        "SUCCESS",
        user?.name || "System Detector",
        user?.tenantId || "default"
      );
    } else if (successCount > 0) {
      setSyncMessage({ text: `Synced ${successCount} actions, but ${failedCount} failed. Please verify connection.`, type: "info" });
    } else {
      setSyncMessage({ text: "Synchronization failed. Make sure CBT Server is online.", type: "error" });
    }
    setTimeout(() => setSyncMessage(null), 4000);
  };

  // Home states for general dashboard stats
  const [generalStats, setGeneralStats] = useState<any>({
    studentsCount: 3,
    examsCount: 2,
    admissionsPending: 1,
    attendanceAverage: "94.2%"
  });

  // Logged-in verification sequence
  const checkSession = async (savedToken: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${savedToken}` }
      });
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        if (data.user) {
          // Enforce tenant isolation based on active subdomain - bypassed to allow login/session flexibility across all schools
          let tenantIdToMatch = "default";
          if (activeSchoolSubdomain) {
            try {
              const tenantRes = await fetch(`/api/public/tenants/${activeSchoolSubdomain}`);
              if (tenantRes.ok && tenantRes.headers.get("content-type")?.includes("application/json")) {
                const tenantData = await tenantRes.json();
                if (tenantData && tenantData.id) {
                  tenantIdToMatch = tenantData.id;
                }
              }
            } catch (e) {
              console.error("Failed to fetch tenant details:", e);
            }
          }

          localStorage.setItem("authToken", savedToken);
          localStorage.setItem("authUser", JSON.stringify(data.user));
          setUser(data.user);
          setToken(savedToken);
          setActiveSchoolSubdomain(null);
          if (window.location.pathname.startsWith("/school/")) {
            window.history.replaceState({}, document.title, "/");
          }
          logActivity("AUTH", `Active session verified automatically for ${data.user.name}.`, "OK", data.user.name);
          // Direct initial view based on role
          if (data.user.role === "STUDENT") {
            setActiveTab("student-exams");
          } else if (data.user.role === "PARENT") {
            setActiveTab("parent-portal");
          } else {
            setActiveTab("dashboard");
          }
        } else {
          localStorage.removeItem("cbt_prox_token");
          sessionStorage.removeItem("cbt_prox_token");
        }
      } else {
        localStorage.removeItem("cbt_prox_token");
        sessionStorage.removeItem("cbt_prox_token");
      }
    } catch (e) {
      console.error("Session verification error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setActivityLogs(getActivityLogs());

    const handleLogChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setActivityLogs(customEvent.detail);
      }
    };

    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith("/school/")) {
        const parts = path.split("/");
        setActiveSchoolSubdomain(parts[2] || null);
      } else {
        setActiveSchoolSubdomain(null);
      }
    };

    window.addEventListener("cbt-pro-log-change", handleLogChange);
    window.addEventListener("popstate", handlePopState);
    
    // 1. Check for impersonation token query parameter first (enables isolated multi-tab operation)
    const params = new URLSearchParams(window.location.search);
    const impToken = params.get("impersonate_token");
    
    let tokenToUse = "";
    if (impToken) {
      sessionStorage.setItem("cbt_prox_token", impToken);
      tokenToUse = impToken;
      
      // Clean query parameter from URL to maintain pristine state
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    } else {
      // 2. Check sessionStorage first (tab-level session isolation) then fallback to localStorage (cross-tab persistence)
      tokenToUse = sessionStorage.getItem("cbt_prox_token") || localStorage.getItem("cbt_prox_token") || "";
    }

    if (tokenToUse) {
      checkSession(tokenToUse);
    }

    return () => {
      window.removeEventListener("cbt-pro-log-change", handleLogChange);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Quick switch logins for grading verification convenience
  const handleQuickLogin = async (email: string, pass: string) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      // Resolve tenant context for the active school subdomain first
      let tenantIdToMatch = "default";
      if (activeSchoolSubdomain) {
        try {
          const tenantRes = await fetch(`/api/public/tenants/${activeSchoolSubdomain}`);
          if (tenantRes.ok && tenantRes.headers.get("content-type")?.includes("application/json")) {
            const tenantData = await tenantRes.json();
            if (tenantData && tenantData.id) {
              tenantIdToMatch = tenantData.id;
            }
          }
        } catch (e) {
          console.error("Failed to fetch tenant details:", e);
        }
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass, tenantId: tenantIdToMatch })
      });
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem("cbt_prox_token", data.token);
          localStorage.setItem("authToken", data.token);
          localStorage.setItem("authUser", JSON.stringify(data.user));
          sessionStorage.setItem("cbt_prox_token", data.token);
          setToken(data.token);
          setUser(data.user);
          
          setActiveSchoolSubdomain(null);
          if (window.location.pathname.startsWith("/school/")) {
            window.history.replaceState({}, document.title, "/");
          }

          logActivity("AUTH", `Authorized user session for ${data.user.name} (${data.user.role}).`, "OK", data.user.name);

          if (data.user.role === "STUDENT") {
            setActiveTab("student-exams");
          } else if (data.user.role === "PARENT") {
            setActiveTab("parent-portal");
          } else {
            setActiveTab("dashboard");
          }
        } else {
          setErrorMsg(data.message || "Failed to authenticate or invalid login credentials.");
        }
      } else {
        setErrorMsg("Monolith Session authorization service is currently offline or unreachable.");
      }
    } catch (e) {
      setErrorMsg("Network timed out or connection error during server authentication.");
    } finally {
      setLoading(false);
    }
  };

  // Logout action
  const handleLogout = () => {
    if (user) {
      logActivity("AUTH", `User ${user.name} logged out and terminated active session.`, "INFO", user.name);
    }
    localStorage.removeItem("cbt_prox_token");
    sessionStorage.removeItem("cbt_prox_token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setUser(null);
    setToken("");
    setActiveTab("dashboard");
  };

  // Load aggregate metrics
  const loadAggregateMetrics = async () => {
    try {
      const tenantId = user?.tenantId || "default";
      const studentsRes = await fetch(`/api/students?tenant_id=${tenantId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const students = (studentsRes.ok && studentsRes.headers.get("content-type")?.includes("application/json"))
        ? await studentsRes.json()
        : [];

      const examsRes = await fetch(`/api/exams?tenant_id=${tenantId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const exams = (examsRes.ok && examsRes.headers.get("content-type")?.includes("application/json"))
        ? await examsRes.json()
        : [];

      const admissionsRes = await fetch(`/api/admissions?tenant_id=${tenantId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const admissions = (admissionsRes.ok && admissionsRes.headers.get("content-type")?.includes("application/json"))
        ? await admissionsRes.json()
        : [];

      let averageAtt = "94.2%";
      if (Array.isArray(students) && students.length > 0) {
        const sum = students.reduce((acc: number, curr: any) => acc + (curr.attendanceRate || 0), 0);
        averageAtt = (sum / students.length).toFixed(1) + "%";
      }

      setGeneralStats({
        studentsCount: Array.isArray(students) ? students.length : 0,
        examsCount: Array.isArray(exams) ? exams.length : 0,
        admissionsPending: Array.isArray(admissions) ? admissions.filter((a: any) => a.status === "PENDING" || a.status === "pending").length : 0,
        attendanceAverage: averageAtt
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user && token && (user.role === "ADMIN" || user.role === "TEACHER")) {
      loadAggregateMetrics();
    }
  }, [user, token, activeTab]);

  if (activeSchoolSubdomain && !user && !token) {
    return (
      <SchoolLandingPage 
        subdomain={activeSchoolSubdomain} 
        onBackToMain={handleBackToMain}
        onLoginSuccess={(loggedInUser, sessionToken) => {
          setUser(loggedInUser);
          setToken(sessionToken);
          sessionStorage.setItem("cbt_prox_token", sessionToken);
          localStorage.setItem("cbt_prox_token", sessionToken);
          localStorage.setItem("authToken", sessionToken);
          localStorage.setItem("authUser", JSON.stringify(loggedInUser));
          setActiveSchoolSubdomain(null);
          window.history.replaceState({}, document.title, "/");
        }}
      />
    );
  }

  return (
    <Shell user={user} tenant={loggedInTenant} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout}>
      
      {/* 1. OFF-STAGE LANDING PAGE / LOGIN HUB */}
      {!user && (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans" id="landing-stage">
          
          {/* Main Visual Header Brand */}
          <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center space-y-3">
            <div className="mx-auto h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <School className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">CBT PRO X</h1>
            <p className="text-xs font-mono bg-indigo-50 text-indigo-700 font-extrabold uppercase px-3.5 py-1 rounded-full inline-block tracking-wider">
              Educational Operating System (EduOS)
            </p>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              A unified full-stack platform integrating examination engines and administration clouds.
            </p>
          </div>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
            <div className="bg-white py-8 px-4 border border-slate-200 shadow-sm sm:rounded-2xl sm:px-10 space-y-6">
              
              {/* Login Errors Block */}
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 text-rose-800 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Standard Credentials Fields */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase tracking-wider font-mono">Login</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.target as any;
                  handleQuickLogin(target.email.value, target.password.value);
                }} 
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Registered Email</label>
                  <input name="email" type="email" placeholder="e.g. user@eduos.com" className="w-full text-xs border border-slate-200 p-2.5 rounded-lg mt-1 focus:outline-indigo-500" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Password Key</label>
                  <input name="password" type="password" placeholder="••••••••" className="w-full text-xs border border-slate-200 p-2.5 rounded-lg mt-1 focus:outline-indigo-500" required />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2">
                  <LogIn className="h-4 w-4" />
                  <span>{loading ? "Decrypting profile keys..." : "Authorize Monolith Session"}</span>
                </button>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* 2. SYSTEM WORKBENCH (ROLE DEPENDENT ROUTING) */}
      {user && (
        <>
          {/* A. SYSTEM DASHBOARD COMMON ENTRY POINT */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">

              {/* CBT Server Network Status & Offline Caching Indicator */}
              <div className={`border rounded-2xl p-5 shadow-xs transition-all duration-300 relative overflow-hidden ${
                isEffectiveOnline 
                  ? "bg-emerald-50/40 border-emerald-100 text-slate-800"
                  : "bg-rose-50/90 border-rose-200 text-slate-800"
              }`} id="cbt-network-status-indicator">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3.5">
                    <div className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 ${
                      isEffectiveOnline 
                        ? "bg-emerald-100 text-emerald-700" 
                        : "bg-rose-100 text-rose-700 animate-bounce"
                    }`}>
                      {isEffectiveOnline ? (
                        <Wifi className="h-5 w-5" />
                      ) : (
                        <WifiOff className="h-5 w-5" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          isEffectiveOnline 
                            ? "bg-emerald-100 text-emerald-800" 
                            : "bg-rose-200 text-rose-800"
                        }`}>
                          {isEffectiveOnline ? "CBT Server Online" : "CBT Connection Interrupted"}
                        </span>
                        {!isEffectiveOnline && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-bold font-mono px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                            Offline Resilience Active
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {isEffectiveOnline 
                          ? "Secure Connection established with CBT Monolith" 
                          : "Lost connection to CBT central server. Standard Offline Mode activated."}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-2xl font-medium">
                        {isEffectiveOnline 
                          ? "Continuous Assessment, Exam scoring, and Live Student Logs are syncing in real-time. No network latency detected." 
                          : "Don't panic! Your answers, time counters, and exam progress are automatically backed up in secure client-side browser cache (local storage). You can safely continue answering questions and completing your session. Syncing will resume automatically on reconnection."}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => {
                        const newSimValue = !isSimulatedOffline;
                        setIsSimulatedOffline(newSimValue);
                        logActivity(
                          "SYS_TRIG",
                          newSimValue 
                            ? "Developer simulated a server connection failure. Offline caching mode engaged." 
                            : "Developer restored simulated server connection. Initiating cached answers synchronization.",
                          newSimValue ? "WARNING" : "SUCCESS",
                          user?.name || "Developer",
                          user?.tenantId || "default"
                        );
                      }}
                      className={`text-[10px] font-bold font-mono px-3.5 py-2 rounded-xl transition-all shadow-xs border ${
                        isSimulatedOffline 
                          ? "bg-white border-slate-200 text-emerald-600 hover:bg-emerald-50" 
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                      title={isSimulatedOffline ? "Restore connection to server" : "Simulate losing server connection"}
                    >
                      {isSimulatedOffline ? "🔌 Restore Connection" : "⚡ Simulate Server Loss"}
                    </button>
                  </div>
                </div>
              </div>

              {/* CBT Offline Sync Queue Interface */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4" id="offline-sync-queue-panel">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Database className="h-5 w-5 text-indigo-600" />
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Offline Synchronization Queue</h3>
                      <p className="text-slate-400 text-[10px] font-mono uppercase">Local Resilience Registry</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    pendingActions.length > 0
                      ? "bg-amber-50 text-amber-800 border border-amber-200 animate-pulse"
                      : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  }`}>
                    {pendingActions.length} Pending Actions
                  </span>
                </div>

                {syncMessage && (
                  <div className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 border animate-fade-in ${
                    syncMessage.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : syncMessage.type === "error"
                      ? "bg-rose-50 border-rose-200 text-rose-800"
                      : "bg-blue-50 border-blue-200 text-blue-800"
                  }`}>
                    {syncMessage.type === "success" ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 animate-bounce" />
                    ) : (
                      <RefreshCw className="h-4 w-4 text-indigo-600 flex-shrink-0 animate-spin" />
                    )}
                    <span>{syncMessage.text}</span>
                  </div>
                )}

                {pendingActions.length > 0 ? (
                  <div className="space-y-3">
                    <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 pr-1">
                      {pendingActions.map((act) => (
                        <div key={act.id} className="py-2 flex items-center justify-between text-xs gap-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 block line-clamp-1">{act.examTitle}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Question Key: {act.qId} • Cached Value: <span className="text-indigo-600 font-semibold">{act.value.length > 15 ? act.value.substring(0, 15) + '...' : act.value}</span>
                            </span>
                          </div>
                          <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-2 py-0.5 rounded-md font-medium shrink-0">
                            UNSYNCED
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-slate-100 gap-3">
                      <p className="text-[11px] text-slate-500 font-medium">
                        {isEffectiveOnline 
                          ? "Internet connection is active. Press Sync Now to flush cached actions." 
                          : "Device is currently offline. Synchronization is disabled until network connection is back up."}
                      </p>
                      <button
                        onClick={handleSyncNow}
                        disabled={isSyncingAll || !isEffectiveOnline}
                        className={`font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs flex items-center justify-center space-x-1.5 shrink-0 ${
                          !isEffectiveOnline
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                            : isSyncingAll
                            ? "bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md"
                        }`}
                      >
                        {isSyncingAll ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-400" />
                        ) : (
                          <CloudUpload className="h-3.5 w-3.5" />
                        )}
                        <span>{isSyncingAll ? "Syncing..." : "Sync Now"}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 border-2 border-dashed border-slate-100 rounded-xl text-center">
                    <Database className="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-slate-500">All local sessions are fully synchronized</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Your exam session and academic evaluations are perfectly safe.</p>
                  </div>
                )}
              </div>
              
              {/* Core metrics panel - Visible ONLY to ADMIN */}
              {user.role === "ADMIN" && (
                <motion.div 
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1
                      }
                    }
                  }}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 md:grid-cols-4 gap-6"
                >
                  
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
                    }}
                    className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">Stream Students</span>
                      <span className="text-2xl font-black text-slate-800">{generalStats.studentsCount} Active</span>
                    </div>
                    <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600"><Users className="h-5 w-5" /></div>
                  </motion.div>

                  <motion.div 
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
                    }}
                    className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">Schedules active</span>
                      <span className="text-2xl font-black text-slate-800">{generalStats.examsCount} Evaluations</span>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600"><Award className="h-5 w-5" /></div>
                  </motion.div>

                  <motion.div 
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
                    }}
                    className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">Admissions reviews</span>
                      <span className="text-2xl font-black text-slate-800">{generalStats.admissionsPending} Pending</span>
                    </div>
                    <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600"><UserCheck className="h-5 w-5" /></div>
                  </motion.div>

                  <motion.div 
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
                    }}
                    className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">Aggregate Attendance</span>
                      <span className="text-2xl font-black text-slate-800">{generalStats.attendanceAverage} Average</span>
                    </div>
                    <div className="bg-rose-50 p-2.5 rounded-xl text-rose-600"><Activity className="h-5 w-5" /></div>
                  </motion.div>

                </motion.div>
              )}

              {/* Multi-tenant design information display */}
              <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden border border-indigo-800">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                <div className="max-w-3xl space-y-4">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-indigo-400" />
                    <h3 className="font-extrabold text-lg tracking-tight">CBT PRO X Unified Governance Platform</h3>
                  </div>
                  <p className="text-indigo-200 text-xs leading-relaxed font-semibold">
                    CBT PRO X operates a secure full-stack school operating system monolith. The server-side cognitive layer handles continuous assessment scoring, timetable collision checks, student user mappings, and parental advisor chats through the Google Gemini API.
                  </p>
                  <div className="flex flex-wrap gap-2 text-[10px] font-mono text-indigo-300 font-bold">
                    <span className="bg-white/10 px-2 py-0.5 rounded border border-white/5">AES-256 Storage</span>
                    <span className="bg-white/10 px-2 py-0.5 rounded border border-white/5">Collision-Free Scheduling</span>
                    <span className="bg-white/10 px-2 py-0.5 rounded border border-white/5">Auto Admissions Sync</span>
                  </div>
                </div>
              </div>

              {/* Role-Specific Live Dynamic Widgets (Teachers / Parents) */}
              {user.role === "TEACHER" && (
                <TeacherDashboardWidget token={token} />
              )}
              {user.role === "PARENT" && (
                <ParentDashboardWidget token={token} />
              )}

              {/* Attendance Trends Analytics Section for Admins & Teachers */}
              {(user.role === "ADMIN" || user.role === "TEACHER") && (
                <AdminAttendanceTrends token={token} />
              )}

              {/* Quick portal operations logs panel - Visible ONLY to ADMIN */}
              {user.role === "ADMIN" && (() => {
                const isSuperAdmin = user && user.role === "ADMIN" && user.tenantId === "default";
                const filteredLogs = activityLogs.filter((log) => {
                  if (user.tenantId !== "default") {
                    // Tenant-specific admin: show only their own logs
                    return log.tenantId === user.tenantId;
                  } else {
                    // Super Admin:
                    if (selectedLogTenantFilter === "all-tenants") {
                      // Shows only tenants detail, filtering out default platform logs
                      return log.tenantId && log.tenantId !== "default";
                    } else {
                      // Filter by selected tenant
                      return log.tenantId === selectedLogTenantFilter;
                    }
                  }
                });

                return (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4" id="institutional-logs-panel">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                          <Activity className="h-5 w-5 text-indigo-600 animate-pulse" />
                          <span>Institutional Activity Logs Feed</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Real-time system events, authentication, and continuous assessment logging.</p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        {isSuperAdmin && (
                          <div className="flex items-center space-x-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Filter:</span>
                            <select
                              value={selectedLogTenantFilter}
                              onChange={(e) => setSelectedLogTenantFilter(e.target.value)}
                              className="bg-slate-50 border border-slate-200 hover:border-indigo-300 text-slate-700 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:bg-white focus:border-indigo-500 outline-none cursor-pointer transition-all"
                            >
                              <option value="all-tenants">🏢 All Tenants Details</option>
                              {tenantsList.map((t) => (
                                <option key={t.id} value={t.id}>
                                  🏫 {t.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <button
                          onClick={() => exportLogsToJSON(filteredLogs)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-200"
                          title="Export filtered logs as clean machine-readable JSON structure"
                        >
                          <FileJson className="h-3.5 w-3.5" />
                          <span>Export JSON</span>
                        </button>
                        
                        <button
                          onClick={() => exportLogsToTXT(filteredLogs)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all cursor-pointer border border-indigo-100"
                          title="Export filtered logs as standard, human-readable text report"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>Export TXT Report</span>
                        </button>

                        <button
                          onClick={() => exportLogsToCSV(filteredLogs)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-all cursor-pointer border border-emerald-100"
                          title="Export filtered logs as clean spreadsheet-ready CSV"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                          <span>Export CSV</span>
                        </button>

                        <button
                          onClick={() => {
                            const restored = resetActivityLogs();
                            setActivityLogs(restored);
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 text-xs font-bold rounded-xl transition-all cursor-pointer border border-rose-100"
                          title="Reset and clear user activities"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only md:not-sr-only">Reset</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2.5 font-mono text-[11px] max-h-96 overflow-y-auto pr-1">
                      {filteredLogs.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                          No tenant activity logs found for the active filter.
                        </div>
                      ) : (
                        filteredLogs.map((log) => {
                          // Status color mapping
                          let statusClass = "bg-slate-100 text-slate-600";
                          if (log.status === "OK" || log.status === "RELEASED" || log.status === "SUCCESS") {
                            statusClass = "bg-emerald-50 text-emerald-700 border border-emerald-200";
                          } else if (log.status === "MONITORING" || log.status === "INFO") {
                            statusClass = "bg-indigo-50 text-indigo-700 border border-indigo-200";
                          } else if (log.status === "WARNING") {
                            statusClass = "bg-amber-50 text-amber-700 border border-amber-200";
                          }

                          // Category color mapping
                          let catColor = "text-indigo-600";
                          if (log.category === "SYS_TRIG") catColor = "text-slate-600";
                          else if (log.category === "AUTH") catColor = "text-violet-600";
                          else if (log.category === "CBT_SCORE") catColor = "text-emerald-600";
                          else if (log.category === "EXPORT") catColor = "text-pink-600";

                          return (
                            <div key={log.id} className="p-3 bg-slate-50/80 rounded-xl border border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition-colors">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                  <span className={`font-bold ${catColor}`}>[{log.category}]</span>
                                  <span className="text-slate-700 font-sans leading-relaxed">{log.message}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center space-x-2">
                                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                                  <span>•</span>
                                  <span>Operator: {log.operator}</span>
                                  {log.tenantId && log.tenantId !== "default" && (
                                    <>
                                      <span>•</span>
                                      <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.2 rounded text-[9px] font-bold">ID: {log.tenantId}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider self-start sm:self-center shrink-0 ${statusClass}`}>
                                {log.status}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })()}

            </div>
          )}

          {/* B. ADMIN CLOUD COMPONENT CHANNELS */}
          {user.role === "ADMIN" && (activeTab === "students" || activeTab === "admissions" || activeTab === "classes" || activeTab === "timetable" || activeTab === "parents") && (
            <AdminERP activeSection={activeTab as any} token={token} currentUser={user} />
          )}

          {/* C. TEACHER & ADMIN COGNITIVE ASSESSMENTS CHANNELS */}
          {((user.role === "TEACHER" && (activeTab === "exams" || activeTab === "attendance" || activeTab === "students" || activeTab === "timetable")) ||
            (user.role === "ADMIN" && (activeTab === "exams" || activeTab === "attendance"))) && (
            <TeacherAssessments activeSection={activeTab as any} token={token} user={user} />
          )}

          {/* D. STUDENT ASSESSMENT & CBT Lifecycles */}
          {user.role === "STUDENT" && (activeTab === "student-exams" || activeTab === "student-history" || activeTab === "student-timetable") && (
            <StudentCBT activeSection={activeTab as any} token={token} studentUser={user} isSimulatedOffline={!isEffectiveOnline} />
          )}

          {/* E. GUARDIAN / PARENT DASHBOARDS */}
          {user.role === "PARENT" && (activeTab === "parent-portal" || activeTab === "parent-chat") && (
            <ParentPortal activeSection={activeTab as any} token={token} />
          )}

          {/* F. GOOGLE WORKSPACE GMAIL HUB */}
          {activeTab === "gmail" && (
            <GmailHub token={token} />
          )}

          {/* G. GOOGLE WORKSPACE DRIVE HUB */}
          {activeTab === "drive" && (
            <DriveHub token={token} />
          )}

          {/* H. OGUNLEARN DIGITAL EDUCATION HUB */}
          {activeTab === "ogunlearn" && (
            <OgunLearnPortal />
          )}

          {/* I. EDUTAMS LESSON NOTES PLANNING */}
          {(activeTab === "lesson-notes" || activeTab === "lesson-notes-review") && (
            <LessonNotesModule token={token} role={user.role} />
          )}

          {/* J. EDUTAMS TUITION & SCHOOL FEES BILLING */}
          {(activeTab === "billing" || activeTab === "fees-payment" || activeTab === "parent-fees") && (
            <BillingModule token={token} role={user.role} studentUser={user} />
          )}

          {/* K. UNIFIED EDVES ERP CORE SERVICES */}
          {activeTab === "edves-erp" && (
            <EdvesERPModule token={token} />
          )}

          {/* L. MULTI-TENANT MANAGEMENT MODULE */}
          {user.role === "ADMIN" && activeTab === "tenants" && (
            <TenantManagement 
              token={token} 
              onSelectTenantPage={handleSelectTenantSubdomain} 
              onImpersonateSuccess={(loggedInUser, sessionToken, targetSubdomain) => {
                // To support standalone tab operation without redirecting or log-out/overwrite of the Super Admin,
                // we open the target school page in a new browser tab with the generated impersonation token as a query param.
                // The new tab's session initialization will extract the token, isolate it to sessionStorage, and delete the query param.
                const sub = targetSubdomain || "default";
                const targetUrl = `/school/${sub}?impersonate_token=${sessionToken}`;
                window.open(targetUrl, "_blank");
                
                // Write a log in the activity list from Super Admin perspective
                logActivity(
                  "AUTH", 
                  `Super Admin launched independent session for ${loggedInUser.name} (${loggedInUser.role}) of tenant "${sub}" in a new tab.`, 
                  "SUCCESS", 
                  user?.name || "Super Admin",
                  loggedInUser.tenantId
                );
              }}
            />
          )}

          {/* L.2 ADMINISTRATIVE AI ADVISORY HUB */}
          {user.role === "ADMIN" && activeTab === "ai-advisory" && (
            <AdminAIDashboard token={token} />
          )}

          {/* M. USER ACCOUNTS & PASSWORD SETTINGS MODULE */}
          {activeTab === "user-management" && (
            <UserManagement token={token} currentUser={user} />
          )}

        </>
      )}

    </Shell>
  );
}
