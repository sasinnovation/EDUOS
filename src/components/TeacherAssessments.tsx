import React, { useState, useEffect } from "react";
import { 
  Award, 
  FileText, 
  Sparkles, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  ChevronRight, 
  X, 
  BrainCircuit, 
  Calendar, 
  Clock, 
  UserCheck, 
  BookOpen,
  Trash2,
  Printer,
  Shield,
  Download,
  Layers,
  Search,
  Filter
} from "lucide-react";
import { Exam, Question, Student, AttendanceRecord } from "../types";
import ReportExportModal from "./ReportExportModal";

interface TeacherAssessmentsProps {
  activeSection: "exams" | "attendance" | "students" | "timetable";
  token: string;
  user?: any;
}

export default function TeacherAssessments({ activeSection, token, user }: TeacherAssessmentsProps) {
  // Common state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Timetable/Schedule States
  const [timetableList, setTimetableList] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [onlyMySchedules, setOnlyMySchedules] = useState(true);

  // New Schedule Form State
  const [schedClassId, setSchedClassId] = useState("");
  const [schedSubject, setSchedSubject] = useState("");
  const [schedDayOfWeek, setSchedDayOfWeek] = useState("Monday");
  const [schedStartTime, setSchedStartTime] = useState("08:30");
  const [schedEndTime, setSchedEndTime] = useState("10:00");
  const [schedTeacherName, setSchedTeacherName] = useState("");
  const [schedRoom, setSchedRoom] = useState("");

  // Exam States
  const [examsList, setExamsList] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [selectedExamAttempts, setSelectedExamAttempts] = useState<any[]>([]);
  const [examTab, setExamTab] = useState<"questions" | "attempts">("questions");
  
  // New Exam Form
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDuration, setNewDuration] = useState("15");
  const [newPassingScore, setNewPassingScore] = useState("50");

  // New Manual Question Form
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState<"MCQ" | "TRUE_FALSE" | "ESSAY">("MCQ");
  const [qOption1, setQOption1] = useState("");
  const [qOption2, setQOption2] = useState("");
  const [qOption3, setQOption3] = useState("");
  const [qOption4, setQOption4] = useState("");
  const [qCorrectAnswer, setQCorrectAnswer] = useState("");
  const [qPoints, setQPoints] = useState("10");

  // AI Question Generator Form
  const [aiSubject, setAiSubject] = useState("General Mathematics");
  const [aiTopic, setAiTopic] = useState("Quadratic Equations");
  const [aiQty, setAiQty] = useState("3");
  const [aiDifficulty, setAiDifficulty] = useState("Medium");
  const [aiSuccessLog, setAiSuccessData] = useState<any | null>(null);

  // Attendance ERP logging States
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [printStudentId, setPrintStudentId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceStatus, setAttendanceStatus] = useState<"PRESENT" | "ABSENT" | "LATE">("PRESENT");
  const [attendanceRemarks, setAttendanceRemarks] = useState("");
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  const [smsAlertLog, setSmsAlertLog] = useState<string | null>(null);

  // --- Exam Results Portal States & Hooks ---
  const [activeSubTab, setActiveSubTab] = useState<"evaluations" | "results">("evaluations");
  const [resultsList, setResultsList] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [tenantsList, setTenantsList] = useState<any[]>([]);
  const [selectedResultsTenantId, setSelectedResultsTenantId] = useState("");
  
  // Results Filters
  const [classFilter, setClassFilter] = useState("ALL");
  const [armFilter, setArmFilter] = useState("ALL");
  const [examFilter, setExamFilter] = useState("ALL");
  const [resultsSearchQuery, setResultsSearchQuery] = useState("");

  useEffect(() => {
    const isSuperAdmin = user?.tenantId === "default" || [
      "adebayosamuel015@gmail.com",
      "admin@eduos.com",
      "sasinnovationgroup@gmail.com"
    ].includes(user?.email?.toLowerCase());

    if (isSuperAdmin) {
      const fetchTenants = async () => {
        try {
          const res = await fetch("/api/tenants", {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setTenantsList(data);
            if (data.length > 0) {
              setSelectedResultsTenantId(data[0].id);
            }
          }
        } catch (e) {
          console.error("Failed to fetch tenants", e);
        }
      };
      fetchTenants();
    } else {
      setSelectedResultsTenantId(user?.tenantId || "default");
    }
  }, [user, token]);

  const fetchResults = async (tenantId: string) => {
    try {
      setLoadingResults(true);
      const url = `/api/results/all?tenant_id=${tenantId}`;
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResultsList(data);
      } else {
        console.error("Failed to fetch results", res.statusText);
      }
    } catch (e) {
      console.error("Error fetching results:", e);
    } finally {
      setLoadingResults(false);
    }
  };

  useEffect(() => {
    if (activeSection === "exams" && activeSubTab === "results" && selectedResultsTenantId) {
      fetchResults(selectedResultsTenantId);
    }
  }, [activeSection, activeSubTab, selectedResultsTenantId]);

  // Export results helper
  const handleExportToCSV = () => {
    // Determine the list to export based on filters
    const listToExport = filteredResults;
    if (listToExport.length === 0) {
      setErrorMsg("No results found to export.");
      return;
    }

    const headers = [
      "Student Name",
      "Registration Number",
      "Class",
      "Stream",
      "Platform",
      "Evaluation Title",
      "Score Obtained",
      "Percentage (%)",
      "Grade Point",
      "Status",
      "Submission Date",
      "Tab Swaps / Violations"
    ];

    const rows = listToExport.map(r => [
      `"${(r.studentName || "Unknown").replace(/"/g, '""')}"`,
      `"${(r.registrationNumber || "N/A").replace(/"/g, '""')}"`,
      `"${(r.className || "Unassigned").replace(/"/g, '""')}"`,
      `"${(r.stream || "General").replace(/"/g, '""')}"`,
      `"${(r.platform || "CBT PRO").replace(/"/g, '""')}"`,
      `"${(r.examTitle || "CBT Exam").replace(/"/g, '""')}"`,
      r.score || 0,
      r.percentage || 0,
      `"${(r.gradePoint || "F").replace(/"/g, '""')}"`,
      `"${r.status || "FAIL"}"`,
      r.submitTime ? new Date(r.submitTime).toLocaleString() : "N/A",
      r.violationsCount || 0
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CBT_Results_Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccessMsg(`Successfully exported ${listToExport.length} exam result record(s) in a single sheet.`);
  };

  // Filtered results calculation
  const filteredResults = resultsList.filter(item => {
    // 1. Search Query
    if (resultsSearchQuery) {
      const q = resultsSearchQuery.toLowerCase();
      const nameMatch = item.studentName?.toLowerCase().includes(q);
      const regMatch = item.registrationNumber?.toLowerCase().includes(q);
      if (!nameMatch && !regMatch) return false;
    }

    // 2. Class prefix filter (e.g., JSS1, SS1, SS2, etc.)
    if (classFilter !== "ALL") {
      const itemClass = (item.className || "").toUpperCase().replace(/\s+/g, "");
      const filterClass = classFilter.toUpperCase().replace(/\s+/g, "");
      if (!itemClass.includes(filterClass)) {
        return false;
      }
    }

    // 3. Sub-class / Arm filter
    if (armFilter !== "ALL") {
      const itemClass = (item.className || "").toUpperCase().trim();
      const filterArm = armFilter.toUpperCase().trim();
      if (itemClass !== filterArm) {
        return false;
      }
    }

    // 4. Exam filter
    if (examFilter !== "ALL") {
      if (item.examId !== examFilter && item.examTitle !== examFilter) {
        return false;
      }
    }

    return true;
  });

  // Fetch API procedures
  const fetchExams = async () => {
    try {
      const res = await fetch("/api/exams", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setExamsList(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchExamAttempts = async (examId: string) => {
    try {
      const res = await fetch(`/api/exams/${examId}/attempts`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedExamAttempts(data);
      }
    } catch (e) {
      console.error("fetchExamAttempts error:", e);
    }
  };

  const fetchExamDetails = async (examId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/exams/${examId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setSelectedExam(data);
      setExamQuestions(data.questions || []);
      await fetchExamAttempts(examId);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/students", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setStudentsList(data);
      if (data.length > 0) {
        setSelectedStudentId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAttendanceLogs = async () => {
    try {
      const res = await fetch(`/api/attendance?date=${attendanceDate}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setAttendanceLogs(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/timetable", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setTimetableList(data);
    } catch (e) {
      console.error("fetchTimetable error:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassesList = async () => {
    try {
      const res = await fetch("/api/classes", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setClassesList(data);
      if (data.length > 0) {
        setSchedClassId(data[0].id);
        setSchedRoom(data[0].room || "");
      }
    } catch (e) {
      console.error("fetchClassesList error:", e);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!schedClassId || !schedSubject.trim() || !schedDayOfWeek || !schedStartTime || !schedEndTime || !schedTeacherName.trim() || !schedRoom.trim()) {
      setErrorMsg("Please fill in all scheduling fields");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/timetable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          classId: schedClassId,
          subject: schedSubject,
          dayOfWeek: schedDayOfWeek,
          startTime: schedStartTime,
          endTime: schedEndTime,
          teacher: schedTeacherName,
          room: schedRoom
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Successfully scheduled "${schedSubject}" for ${schedDayOfWeek}s!`);
        setSchedSubject("");
        fetchTimetable();
      } else {
        setErrorMsg(data.message || "Failed to schedule class session due to overlap.");
      }
    } catch (err) {
      setErrorMsg("Network error trying to publish schedule entry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setAiSuccessData(null);
    setSmsAlertLog(null);
    setSelectedExam(null);

    fetchExams();
    fetchStudents();
    fetchAttendanceLogs();

    if (activeSection === "timetable") {
      fetchTimetable();
      fetchClassesList();
    }
  }, [activeSection]);

  useEffect(() => {
    if (user?.name) {
      setSchedTeacherName(user.name);
    }
  }, [user]);

  useEffect(() => {
    if (activeSection === "attendance") {
      fetchAttendanceLogs();
    }
  }, [attendanceDate]);

  // Create exam Action
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setLoading(true);
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          duration: Number(newDuration),
          passingScore: Number(newPassingScore),
          status: "DRAFT"
        })
      });
      if (res.ok) {
        setSuccessMsg(`Exam title "${newTitle}" created in draft status.`);
        setNewTitle("");
        setNewDesc("");
        fetchExams();
      } else {
        setErrorMsg("Failed to initialize draft exam template.");
      }
    } catch (e) {
      setErrorMsg("Network timed out creating exam layout.");
    } finally {
      setLoading(false);
    }
  };

  // Publish / Close Exam Action
  const handleUpdateExamStatus = async (examId: string, newStatus: "PUBLISHED" | "CLOSED") => {
    try {
      setLoading(true);
      const res = await fetch(`/api/exams/${examId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setSuccessMsg(`Exam status updated to ${newStatus}.`);
        fetchExams();
        if (selectedExam && selectedExam.id === examId) {
          fetchExamDetails(examId);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Delete Exam Action
  const handleDeleteExam = async (examId: string) => {
    if (!confirm("Are you sure you want to delete this exam and all its questions?")) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/exams/${examId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccessMsg("Exam deleted successfully.");
        setSelectedExam(null);
        fetchExams();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Create Manual Question Action
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam || !qText.trim()) return;

    let options: string[] = [];
    if (qType === "MCQ") {
      options = [qOption1, qOption2, qOption3, qOption4].filter(o => o.trim() !== "");
      if (options.length < 2) {
        setErrorMsg("Multiple Choice questions need at least 2 options.");
        return;
      }
    } else if (qType === "TRUE_FALSE") {
      options = ["True", "False"];
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/exams/${selectedExam.id}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          text: qText,
          type: qType,
          options,
          answer: qCorrectAnswer,
          scorePoints: Number(qPoints)
        })
      });

      if (res.ok) {
        setSuccessMsg("Question registered to assessment index.");
        setQText("");
        setQOption1("");
        setQOption2("");
        setQOption3("");
        setQOption4("");
        setQCorrectAnswer("");
        fetchExamDetails(selectedExam.id);
      } else {
        setErrorMsg("Failed to upload question to assessment.");
      }
    } catch (err) {
      setErrorMsg("Error registering assessment question.");
    } finally {
      setLoading(false);
    }
  };

  // AI Question Generation Action (using Gemini model series!)
  const handleAiGenerateQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      setAiSuccessData(null);

      const res = await fetch(`/api/exams/${selectedExam.id}/generate-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: aiSubject,
          topic: aiTopic,
          quantity: aiQty,
          difficulty: aiDifficulty
        })
      });

      const data = await res.json();
      if (res.ok) {
        setAiSuccessData(data);
        setSuccessMsg(`AI assessor completed content generation for ${aiSubject}!`);
        fetchExamDetails(selectedExam.id);
        fetchExams();
      } else {
        setErrorMsg(data.message || "Failed to utilize Gemini question designer.");
      }
    } catch (e) {
      setErrorMsg("Network failure requesting Gemini API generation.");
    } finally {
      setLoading(false);
    }
  };

  // Submit student daily attendance status (ERP logging)
  const handleLogAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      setSmsAlertLog(null);

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: selectedStudentId,
          date: attendanceDate,
          status: attendanceStatus,
          remarks: attendanceRemarks
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("Attendance log updated successfully.");
        setAttendanceRemarks("");
        fetchAttendanceLogs();
        fetchStudents();

        if (attendanceStatus === "ABSENT" && data.notificationDispatched) {
          const studentName = studentsList.find(s => s.id === selectedStudentId)?.name;
          setSmsAlertLog(`[PRIORITY OUTBOUND ALERT] Monolithic SMS Dispatch: Absency warning regarding student ${studentName} securely routed to parental coordinates.`);
        }
      } else {
        setErrorMsg(data.message || "Attendance update error.");
      }
    } catch (e) {
      setErrorMsg("Network timed out processing attendance indices.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" id="teacher-assessments-root">
      
      {/* Upper Context Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
          Assessment & ERP Cloud
        </span>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight mt-2 capitalize">
          {activeSection === "exams" && "CBT Examination Engine Panel"}
          {activeSection === "attendance" && "Daily Student Attendance ERP"}
          {activeSection === "students" && "Registered Stream Pupils"}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {activeSection === "exams" && "Build, publish and assess timed exams, with Gemini-powered automated question generator capabilities."}
          {activeSection === "attendance" && "Verify daily class registers, configure sick leaves, and execute parent alert mechanisms."}
          {activeSection === "students" && "Direct student enrollment directories, index assignments and average examination grades."}
        </p>
      </div>

      {/* Action Toasts */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800 text-sm flex items-center space-x-3 shadow-sm animate-fade-in">
          <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-800 text-sm flex items-center space-x-3 shadow-sm animate-fade-in">
          <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ----------------- SECTION 1: ASSESSMENT CLOUD (CBT EXAMS) ----------------- */}
      {activeSection === "exams" && (
        <div className="space-y-6">
          {/* Sub-tab Navigation */}
          <div className="flex border-b border-slate-200 gap-1 sm:gap-2">
            <button
              onClick={() => setActiveSubTab("evaluations")}
              className={`pb-3 text-xs sm:text-sm font-bold border-b-2 px-3 sm:px-4 transition-colors cursor-pointer ${
                activeSubTab === "evaluations"
                  ? "border-indigo-600 text-indigo-600 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              Evaluation & Question Builder
            </button>
            <button
              onClick={() => setActiveSubTab("results")}
              className={`pb-3 text-xs sm:text-sm font-bold border-b-2 px-3 sm:px-4 transition-colors cursor-pointer ${
                activeSubTab === "results"
                  ? "border-indigo-600 text-indigo-600 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              Class & Exam Results Directory
            </button>
          </div>

          {activeSubTab === "evaluations" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Exams Roster Column */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 text-base">Course Evaluations</h3>
                  <span className="text-xs text-slate-400 font-bold font-mono">{examsList.length} total</span>
                </div>

                <div className="space-y-2">
                  {examsList.map((exam) => (
                    <div
                      key={exam.id}
                      onClick={() => fetchExamDetails(exam.id)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                        selectedExam?.id === exam.id
                          ? "bg-indigo-50 border-indigo-500 shadow-sm"
                          : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded tracking-wide ${
                          exam.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" :
                          exam.status === "CLOSED" ? "bg-slate-100 text-slate-600" :
                          "bg-amber-50 text-amber-700"
                        }`}>
                          {exam.status}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">Duration: {exam.duration}m</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm mt-2 line-clamp-1">{exam.title}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{exam.description}</p>
                      
                      <div className="mt-2.5 flex items-center justify-between text-[11px] font-semibold text-slate-500 font-mono">
                        <span>{exam.totalQuestions} Questions</span>
                        <span className="text-indigo-600 flex items-center">Inspect <ChevronRight className="h-3 w-3 ml-0.5" /></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Course Template Creator form */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
                <h3 className="font-bold text-slate-800 text-base flex items-center space-x-1.5 pb-2 border-b border-slate-100">
                  <Plus className="h-4 w-4 text-indigo-500" />
                  <span>Draft New Evaluation</span>
                </h3>

                <form onSubmit={handleCreateExam} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Assessment Title</label>
                    <input
                      type="text"
                      placeholder="e.g. SS3 General Maths Term 2"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800 font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Course Description</label>
                    <textarea
                      placeholder="Identify evaluated syllabus subtopics..."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 h-16 text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">Duration (Mins)</label>
                      <input
                        type="number"
                        value={newDuration}
                        onChange={(e) => setNewDuration(e.target.value)}
                        className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800 font-bold"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">Pass Threshold (%)</label>
                      <input
                        type="number"
                        value={newPassingScore}
                        onChange={(e) => setNewPassingScore(e.target.value)}
                        className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800 font-bold"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-lg transition-all shadow-sm"
                  >
                    Initialize Draft Layout
                  </button>
                </form>
              </div>
            </div>

            {/* Right Exam Detail workspace Column */}
            <div className="lg:col-span-2 space-y-6">
              {selectedExam ? (
                <div className="space-y-6">
                  
                  {/* Exam Settings Control & Info Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
                      <div>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{selectedExam.id}</span>
                        <h2 className="text-xl font-bold text-slate-800 mt-1">{selectedExam.title}</h2>
                      </div>
                      <div className="flex items-center space-x-2">
                        {selectedExam.status === "DRAFT" && (
                          <button
                            onClick={() => handleUpdateExamStatus(selectedExam.id, "PUBLISHED")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Publish CBT</span>
                          </button>
                        )}
                        {selectedExam.status === "PUBLISHED" && (
                          <button
                            onClick={() => handleUpdateExamStatus(selectedExam.id, "CLOSED")}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Close Exam</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteExam(selectedExam.id)}
                          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-all"
                          title="Delete Exam"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium text-slate-600">
                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-0.5">Status Check</span>
                        <span className={`font-bold font-mono ${selectedExam.status === 'PUBLISHED' ? 'text-emerald-600' : 'text-amber-600'}`}>{selectedExam.status}</span>
                      </div>
                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-0.5">Duration Limits</span>
                        <span className="font-bold text-slate-800">{selectedExam.duration} Minutes</span>
                      </div>
                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-0.5">Evaluation Points</span>
                        <span className="font-bold text-slate-800">{examQuestions.reduce((acc, curr) => acc + curr.scorePoints, 0)} Total</span>
                      </div>
                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-0.5">Passing Line</span>
                        <span className="font-bold text-slate-800">{selectedExam.passingScore}%</span>
                      </div>
                    </div>
                  </div>

                  {/* WORKSPACE SUB-SECTIONS TABS */}
                  <div className="flex border-b border-slate-200 mt-2">
                    <button
                      type="button"
                      onClick={() => setExamTab("questions")}
                      className={`pb-2.5 px-4 font-bold text-xs border-b-2 transition-all ${
                        examTab === "questions"
                          ? "border-indigo-600 text-indigo-600 font-extrabold"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Design Questions ({examQuestions.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setExamTab("attempts")}
                      className={`pb-2.5 px-4 font-bold text-xs border-b-2 transition-all flex items-center space-x-1.5 ${
                        examTab === "attempts"
                          ? "border-indigo-600 text-indigo-600 font-extrabold"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <span>Submissions & Proctoring ({selectedExamAttempts.length})</span>
                      {selectedExamAttempts.some(a => a.violationsCount > 0) && (
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping"></span>
                      )}
                    </button>
                  </div>

                  {examTab === "questions" ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Manual Question adding workbench */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                        <FileText className="h-4 w-4 text-indigo-500" />
                        <span>Manual Assessment Writer</span>
                      </h3>

                      <form onSubmit={handleCreateQuestion} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Assessed Question prompt</label>
                          <textarea
                            placeholder="Type the exam question instruction..."
                            value={qText}
                            onChange={(e) => setQText(e.target.value)}
                            className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800 h-16"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Question Format</label>
                            <select
                              value={qType}
                              onChange={(e: any) => setQType(e.target.value)}
                              className="w-full border border-slate-200 p-2 rounded-lg text-xs focus:outline-indigo-500 text-slate-800"
                              required
                            >
                              <option value="MCQ">Multiple Choice MCQ</option>
                              <option value="TRUE_FALSE">True / False</option>
                              <option value="ESSAY">Theory / Essay</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Weight Score (Points)</label>
                            <input
                              type="number"
                              value={qPoints}
                              onChange={(e) => setQPoints(e.target.value)}
                              className="w-full border border-slate-200 p-2 rounded-lg text-xs focus:outline-indigo-500 text-slate-800 font-mono font-bold"
                              required
                            />
                          </div>
                        </div>

                        {qType === "MCQ" && (
                          <div className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Configure MCQ choices</span>
                            <div className="grid grid-cols-2 gap-2">
                              <input type="text" placeholder="Option A" value={qOption1} onChange={(e)=>setQOption1(e.target.value)} className="border border-slate-200 p-2 rounded text-xs text-slate-800 bg-white" required />
                              <input type="text" placeholder="Option B" value={qOption2} onChange={(e)=>setQOption2(e.target.value)} className="border border-slate-200 p-2 rounded text-xs text-slate-800 bg-white" required />
                              <input type="text" placeholder="Option C" value={qOption3} onChange={(e)=>setQOption3(e.target.value)} className="border border-slate-200 p-2 rounded text-xs text-slate-800 bg-white" required />
                              <input type="text" placeholder="Option D" value={qOption4} onChange={(e)=>setQOption4(e.target.value)} className="border border-slate-200 p-2 rounded text-xs text-slate-800 bg-white" required />
                            </div>
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">
                            {qType === 'ESSAY' ? "Scoring Keywords Match list (Comma-separated words)" : "Strict Correct Answer text"}
                          </label>
                          <input
                            type="text"
                            placeholder={qType === 'ESSAY' ? "combination, permutation, factorial, sequence" : qType === 'TRUE_FALSE' ? "True" : "Exact option copy match"}
                            value={qCorrectAnswer}
                            onChange={(e) => setQCorrectAnswer(e.target.value)}
                            className="w-full border border-slate-200 p-2 rounded-lg text-xs focus:outline-indigo-500 text-slate-800 font-semibold"
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-slate-800 text-white font-bold text-xs py-2 rounded-lg hover:bg-slate-900 transition-colors"
                        >
                          Upload Question
                        </button>
                      </form>
                    </div>

                    {/* AI Generator Dashboard workbench using Gemini */}
                    <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg space-y-4 relative overflow-hidden border border-indigo-700">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
                      
                      <h3 className="font-bold text-white text-sm flex items-center space-x-2 pb-2 border-b border-white/10">
                        <BrainCircuit className="h-4 w-4 text-indigo-300 animate-pulse" />
                        <span>Gemini AI Question designer</span>
                      </h3>

                      <form onSubmit={handleAiGenerateQuestions} className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-indigo-300 uppercase">Target Curriculum Subject</label>
                          <input
                            type="text"
                            value={aiSubject}
                            onChange={(e) => setAiSubject(e.target.value)}
                            className="w-full bg-white/10 border border-white/10 p-2 rounded-lg focus:outline-none focus:border-indigo-400 text-white font-medium"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-indigo-300 uppercase">Subtopic Syllabus Focus</label>
                          <input
                            type="text"
                            value={aiTopic}
                            onChange={(e) => setAiTopic(e.target.value)}
                            className="w-full bg-white/10 border border-white/10 p-2 rounded-lg focus:outline-none focus:border-indigo-400 text-white"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-indigo-300 uppercase">Quantity (1-5)</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              value={aiQty}
                              onChange={(e) => setAiQty(e.target.value)}
                              className="w-full bg-white/10 border border-white/10 p-2 rounded-lg text-white font-bold"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-indigo-300 uppercase">Academic Difficulty</label>
                            <select
                              value={aiDifficulty}
                              onChange={(e) => setAiDifficulty(e.target.value)}
                              className="w-full bg-indigo-900 border border-white/10 p-2 rounded-lg text-white font-medium"
                              required
                            >
                              <option value="Easy">Easy (SS1 Grade)</option>
                              <option value="Medium">Medium (SS2 Grade)</option>
                              <option value="Hard">Hard (SS3 / WAEC Level)</option>
                            </select>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs py-3 rounded-xl hover:opacity-90 transition-all flex items-center justify-center space-x-1 border border-emerald-400"
                        >
                          <Sparkles className="h-4 w-4 text-white animate-spin" />
                          <span>{loading ? "Generating Assessment..." : "Verify & Inject AI Questions"}</span>
                        </button>
                      </form>

                      {aiSuccessLog && (
                        <div className="bg-indigo-950/70 p-3 rounded-xl border border-white/10 space-y-1.5 text-[10px] text-indigo-200">
                          <p className="font-bold text-white uppercase tracking-wider flex items-center">
                            <CheckCircle className="h-3 w-3 text-emerald-400 mr-1" />
                            <span>Outbound Gemini Dispatch log</span>
                          </p>
                          <p>{aiSuccessLog.message}</p>
                          <p className="font-mono text-[9px] text-indigo-300">Target Assessor Model: gemini-3.5-flash-latest</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Interactive Questions list */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 text-base">Current Question Set ({examQuestions.length})</h3>
                    {examQuestions.length > 0 ? (
                      <div className="space-y-3.5 divide-y divide-slate-100">
                        {examQuestions.map((q, idx) => (
                          <div key={q.id} className="pt-3.5 first:pt-0 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 font-mono">Q{idx + 1} ({q.type})</span>
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">{q.scorePoints} pts</span>
                            </div>
                            <p className="font-semibold text-slate-700 leading-relaxed">{q.text}</p>
                            {q.options && q.options.length > 0 && (
                              <div className="grid grid-cols-2 gap-2 mt-1">
                                {q.options.map((opt, oIdx) => (
                                  <div key={oIdx} className="bg-slate-50 p-2 rounded text-slate-600 border border-slate-100">
                                    {opt}
                                  </div>
                                ))}
                              </div>
                            )}
                            <p className="text-[11px] text-emerald-700 bg-emerald-50 inline-block px-2.5 py-1 rounded font-bold">
                              Correct Answer key: {q.answer}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                        No questions in this assessment bank yet. Add manually above or try the AI Generator!
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Submissions & Proctoring Tab view */
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Exam Submission Registry</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Live monitoring of completed or active exam sessions with anti-cheat telemetry.</p>
                    </div>
                    <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold self-start sm:self-center">
                      {selectedExamAttempts.length} Candidate Logs
                    </span>
                  </div>

                  {selectedExamAttempts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                            <th className="p-3">Candidate</th>
                            <th className="p-3">Reg. Number</th>
                            <th className="p-3">Score & Status</th>
                            <th className="p-3">Grade Point</th>
                            <th className="p-3 text-center">Violations (Tab Swaps)</th>
                            <th className="p-3">Submission Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedExamAttempts.map((attempt) => {
                            const isPassed = attempt.status === "PASS";
                            const hasViolations = attempt.violationsCount > 0;
                            
                            return (
                              <tr key={attempt.id} className="hover:bg-slate-50/40 transition-all font-medium">
                                <td className="p-3">
                                  <div className="font-bold text-slate-800">{attempt.studentName}</div>
                                  <div className="text-[9px] text-slate-400 font-mono">Attempt UUID: {attempt.id.slice(0, 8)}...</div>
                                </td>
                                <td className="p-3 text-slate-600 font-mono">{attempt.registrationNumber}</td>
                                <td className="p-3">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="font-mono font-bold text-slate-800">{attempt.score} pts</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide ${
                                      isPassed 
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                        : "bg-rose-50 text-rose-700 border border-rose-200"
                                    }`}>
                                      {attempt.status}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3 font-bold text-indigo-600 font-mono">{attempt.gradePoint || "F"}</td>
                                <td className="p-3 text-center">
                                  <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                                    hasViolations 
                                      ? "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse" 
                                      : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  }`}>
                                    <Shield className="h-3 w-3" />
                                    <span>{attempt.violationsCount || 0} Swaps</span>
                                  </span>
                                </td>
                                <td className="p-3 text-slate-400 font-mono text-[10px]">
                                  {attempt.submitTime ? new Date(attempt.submitTime).toLocaleString() : "Active Session"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                      <AlertTriangle className="h-8 w-8 text-slate-200 mx-auto mb-2 animate-bounce" />
                      <h4 className="font-bold text-slate-700">No Submissions Recorded</h4>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-1">
                        No students have initiated or completed an assessment session for this course evaluation yet.
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 space-y-3 flex flex-col items-center justify-center">
                  <Award className="h-12 w-12 text-slate-200 stroke-1" />
                  <h3 className="font-bold text-slate-700">Course Assessment Workspace</h3>
                  <p className="text-xs max-w-sm text-slate-400 mx-auto">
                    Please select a specific evaluation template on the left-side rail to modify settings, add test parameters, or query the AI Generative model.
                  </p>
                </div>
              )}
            </div>
          </div>
          ) : (
            /* ----------------- SUB-MODULE: CLASS & EXAM RESULTS DIRECTORY ----------------- */
            <div className="space-y-6 animate-fade-in">
              {/* Filter controls panel */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-indigo-500" />
                    <h3 className="font-bold text-slate-800 text-sm">Categorical Result Filters</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {filteredResults.length} records found
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                  {/* 1. Tenant/School selector for Super Admin */}
                  {tenantsList.length > 0 && (
                    <div className="flex flex-col gap-1.5 min-w-[200px]">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select School / Tenant</label>
                      <div className="relative">
                        <select
                          value={selectedResultsTenantId}
                          onChange={(e) => {
                            setSelectedResultsTenantId(e.target.value);
                            setClassFilter("ALL");
                            setArmFilter("ALL");
                            setExamFilter("ALL");
                          }}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 pl-3 rounded-xl focus:outline-indigo-500 cursor-pointer appearance-none pr-8 h-[36px]"
                        >
                          {tenantsList.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                        <Layers className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  )}

                  {/* 2. Base Class Filter */}
                  <div className="flex flex-col gap-1.5 min-w-[150px]">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Class Category</label>
                    <select
                      value={classFilter}
                      onChange={(e) => {
                        setClassFilter(e.target.value);
                        setArmFilter("ALL");
                      }}
                      className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl focus:outline-indigo-500 cursor-pointer h-[36px]"
                    >
                      <option value="ALL">All Categories (JSS & SS)</option>
                      <option value="JSS 1">Junior Secondary 1 (JSS 1)</option>
                      <option value="JSS 2">Junior Secondary 2 (JSS 2)</option>
                      <option value="JSS 3">Junior Secondary 3 (JSS 3)</option>
                      <option value="SS 1">Senior Secondary 1 (SS 1)</option>
                      <option value="SS 2">Senior Secondary 2 (SS 2)</option>
                      <option value="SS 3">Senior Secondary 3 (SS 3)</option>
                    </select>
                  </div>

                  {/* 3. Sub-class / Arm Filter */}
                  <div className="flex flex-col gap-1.5 min-w-[150px]">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sub-class / Arm Group</label>
                    <select
                      value={armFilter}
                      onChange={(e) => setArmFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl focus:outline-indigo-500 cursor-pointer h-[36px]"
                    >
                      <option value="ALL">All Arms / Groups</option>
                      {Array.from(new Set(resultsList.map(r => r.className?.trim()).filter(Boolean))).sort().map(c => (
                        <option key={String(c)} value={String(c)}>{String(c)}</option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Exam Template Filter */}
                  <div className="flex flex-col gap-1.5 min-w-[170px]">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exam Evaluation Test</label>
                    <select
                      value={examFilter}
                      onChange={(e) => setExamFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl focus:outline-indigo-500 cursor-pointer h-[36px]"
                    >
                      <option value="ALL">All Evaluation Tests</option>
                      {Array.from(new Map(resultsList.map(r => [r.examId, r.examTitle])).entries()).map(([id, title]) => (
                        <option key={id} value={id}>{String(title)}</option>
                      ))}
                    </select>
                  </div>

                  {/* 5. Search field */}
                  <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Student</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search student name or reg..."
                        value={resultsSearchQuery}
                        onChange={(e) => setResultsSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 pl-8 rounded-xl focus:outline-indigo-500 font-medium h-[36px]"
                      />
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  {/* 6. Export spreadsheet button */}
                  <button
                    onClick={handleExportToCSV}
                    className="flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer self-end h-[36px]"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export Sheet</span>
                  </button>
                </div>
              </div>

              {/* Results table panel */}
              {loadingResults ? (
                <div className="py-20 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                  <p className="text-xs">Loading educational result logs...</p>
                </div>
              ) : filteredResults.length > 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                          <th className="p-3.5 pl-5">Student / Candidate</th>
                          <th className="p-3.5">Class & Arm</th>
                          <th className="p-3.5">Exam Evaluation</th>
                          <th className="p-3.5">Score Obt.</th>
                          <th className="p-3.5">Pct (%)</th>
                          <th className="p-3.5">Grade</th>
                          <th className="p-3.5 text-center">Swaps</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 text-right pr-5">Dossier</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {filteredResults.map((item, idx) => {
                          const isPassed = item.status === "PASS";
                          const swapCount = item.violationsCount || 0;
                          return (
                            <tr key={item.id || idx} className="hover:bg-slate-50/40 transition-colors">
                              <td className="p-3.5 pl-5">
                                <div className="font-bold text-slate-800">{item.studentName}</div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.registrationNumber}</div>
                              </td>
                              <td className="p-3.5">
                                <div className="text-slate-700 font-bold">{item.className || "Unassigned"}</div>
                                {item.stream && (
                                  <div className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-bold inline-block mt-0.5">{item.stream}</div>
                                )}
                              </td>
                              <td className="p-3.5">
                                <div className="text-slate-800 font-semibold line-clamp-1">{item.examTitle}</div>
                                <div className="text-[9px] text-slate-400 font-mono mt-0.5">{item.submitTime ? new Date(item.submitTime).toLocaleDateString() : "N/A"}</div>
                              </td>
                              <td className="p-3.5 font-mono text-slate-700 font-bold">{item.score} pts</td>
                              <td className="p-3.5 font-mono font-bold text-slate-800">{item.percentage}%</td>
                              <td className="p-3.5">
                                <span className="font-black text-indigo-600 font-mono text-xs">{item.gradePoint || "F"}</span>
                              </td>
                              <td className="p-3.5 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                  swapCount > 0 ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                }`}>
                                  {swapCount} Swaps
                                </span>
                              </td>
                              <td className="p-3.5">
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wider ${
                                  isPassed ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}>
                                  {item.status || "FAIL"}
                                </span>
                              </td>
                              <td className="p-3.5 text-right pr-5">
                                <button
                                  onClick={() => setPrintStudentId(item.studentId)}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all cursor-pointer"
                                >
                                  <Printer className="h-3 w-3" />
                                  <span>Dossier</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 space-y-3 flex flex-col items-center justify-center shadow-sm">
                  <Award className="h-12 w-12 text-slate-200 stroke-1" />
                  <h3 className="font-bold text-slate-700">No Results Found</h3>
                  <p className="text-xs max-w-sm text-slate-400 mx-auto">
                    There are no student examination attempts recorded matching your filter parameters.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ----------------- SECTION 2: DAILY ATTENDANCE REGISTER ----------------- */}
      {activeSection === "attendance" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Submit Attendance Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3 flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-indigo-500" />
              <span>ERP Log Attendance</span>
            </h3>

            <form onSubmit={handleLogAttendance} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Calendar Date</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 font-mono text-slate-800"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Select Pupil</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800"
                  required
                >
                  {studentsList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.registrationNumber})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Attendance Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["PRESENT", "ABSENT", "LATE"] as const).map((stat) => (
                    <button
                      key={stat}
                      type="button"
                      onClick={() => setAttendanceStatus(stat)}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                        attendanceStatus === stat 
                          ? stat === 'PRESENT' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' :
                            stat === 'ABSENT' ? 'bg-rose-50 border-rose-500 text-rose-700' :
                            'bg-amber-50 border-amber-500 text-amber-700'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {stat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Remarks / Justification</label>
                <input
                  type="text"
                  placeholder="e.g. Reported sick, on time, heavy rain"
                  value={attendanceRemarks}
                  onChange={(e) => setAttendanceRemarks(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md"
              >
                Commit Roster Entry
              </button>
            </form>

            {smsAlertLog && (
              <div className="bg-slate-900 border-l-4 border-amber-500 p-3.5 rounded-r-xl space-y-1 text-white font-mono text-[10px] leading-relaxed">
                <div className="flex items-center text-amber-400 font-bold font-sans">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                  <span>SMS ALERTS TELEMETRY DISPATCH</span>
                </div>
                <p>{smsAlertLog}</p>
              </div>
            )}
          </div>

          {/* List Daily Register Column */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-lg">Daily Classroom Attendance Register</h3>
              <span className="text-xs font-mono font-bold text-slate-500">{attendanceDate}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-100">
                    <th className="py-2.5 px-4">Pupil Classmate</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Internal Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {attendanceLogs.length > 0 ? (
                    attendanceLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-bold text-slate-800">{log.studentName}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            log.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700' :
                            log.status === 'ABSENT' ? 'bg-rose-50 text-rose-700' :
                            'bg-amber-50 text-amber-700'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-xs italic">{log.remarks || "---"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="text-center text-slate-400 py-12">No attendance registered for this calendar date.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ----------------- SECTION 3: CLASS ROSTER SUMMARY ----------------- */}
      {activeSection === "students" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-lg">My Class Roster Oversight</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4">Registration</th>
                  <th className="py-3 px-4">Full Student Name</th>
                  <th className="py-3 px-4">Linked Account Login</th>
                  <th className="py-3 px-4">Attendance Average</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {studentsList.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{s.registrationNumber}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{s.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-xs">{s.email || "No email mapped"}</td>
                    <td className="py-3 px-4">
                      <span className={`font-mono font-bold ${s.attendanceRate >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{s.attendanceRate}%</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] font-mono">ACTIVE</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setPrintStudentId(s.id)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all cursor-pointer ml-auto"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Report Card</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- SECTION 4: SCHEDULES & TIMETABLES ----------------- */}
      {activeSection === "timetable" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Schedule Creator Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 text-left animate-fadeIn">
            <h3 className="font-bold text-slate-800 text-lg flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-indigo-500" />
              <span>Schedule New Session</span>
            </h3>
            <p className="text-xs text-slate-400 font-sans">Add an academic lecture or lesson note review window with real-time room collision & teacher clash protection.</p>

            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase font-sans">Class Room</label>
                <select
                  value={schedClassId}
                  onChange={(e) => {
                    setSchedClassId(e.target.value);
                    const cls = classesList.find(c => c.id === e.target.value);
                    if (cls) {
                      setSchedRoom(cls.room || "");
                    }
                  }}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800 font-sans"
                >
                  <option value="">-- Select Class --</option>
                  {classesList.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase font-sans">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. General Mathematics"
                  value={schedSubject}
                  onChange={(e) => setSchedSubject(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800 font-medium font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase font-sans">Day of Week</label>
                  <select
                    value={schedDayOfWeek}
                    onChange={(e) => setSchedDayOfWeek(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800 font-semibold font-sans"
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase font-sans">Classroom Room</label>
                  <input
                    type="text"
                    placeholder="e.g. Science Lab 1"
                    value={schedRoom}
                    onChange={(e) => setSchedRoom(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800 font-semibold font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase font-sans">Start Time</label>
                  <input
                    type="time"
                    value={schedStartTime}
                    onChange={(e) => setSchedStartTime(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 font-mono text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase font-sans">End Time</label>
                  <input
                    type="time"
                    value={schedEndTime}
                    onChange={(e) => setSchedEndTime(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase font-sans">Supervising Teacher</label>
                <input
                  type="text"
                  placeholder="Supervising Staff Name"
                  value={schedTeacherName}
                  onChange={(e) => setSchedTeacherName(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800 font-medium font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center space-x-2 cursor-pointer font-sans"
              >
                <Plus className="h-4 w-4" />
                <span>{loading ? "Verifying..." : "Establish Lecture Schedule"}</span>
              </button>
            </form>
          </div>

          {/* Timetable Calendar Display */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4 text-left animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <h3 className="font-bold text-slate-800 text-lg font-sans">Weekly Class Schedule Planner</h3>
                <p className="text-[11px] text-slate-400 font-sans">Review class lecture slots and venue timetables.</p>
              </div>

              {/* Toggles */}
              <div className="flex items-center space-x-3 bg-slate-50 p-1.5 rounded-xl border border-slate-100 shrink-0">
                <label className="flex items-center space-x-1.5 text-xs text-slate-600 cursor-pointer select-none px-1.5 font-bold font-sans">
                  <input
                    type="checkbox"
                    checked={onlyMySchedules}
                    onChange={(e) => setOnlyMySchedules(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <span>My Slots Only</span>
                </label>
              </div>
            </div>

            {/* Timetable Items Grid */}
            <div className="space-y-4">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => {
                const daySlots = timetableList.filter(t => {
                  if (t.dayOfWeek !== day) return false;
                  if (onlyMySchedules && user?.name) {
                    return t.teacher.trim().toLowerCase() === user.name.trim().toLowerCase();
                  }
                  return true;
                });

                return (
                  <div key={day} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-widest font-mono">{day}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-bold">{daySlots.length} slot(s)</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {daySlots.map((slot, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 hover:border-indigo-300 transition-all relative overflow-hidden group shadow-sm">
                          {/* Top Border Indicator */}
                          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>
                          
                          <div className="flex justify-between items-start pt-1">
                            <div>
                              <h4 className="font-black text-xs text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight font-sans">{slot.subject}</h4>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5 font-sans">{slot.className || "Standard Room"}</p>
                            </div>
                            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">{slot.room}</span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100 pt-2 font-medium">
                            <div className="flex items-center space-x-1 font-mono">
                              <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                              <span className="font-extrabold">{slot.startTime} - {slot.endTime}</span>
                            </div>
                            <div className="flex items-center space-x-1 font-sans">
                              <span className="text-slate-400">By:</span>
                              <span className="font-bold text-slate-700">{slot.teacher}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {daySlots.length === 0 && (
                        <div className="col-span-2 text-center py-4 text-slate-400 text-xs italic font-mono">
                          No lecture slots established for {day}.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {printStudentId && (
        <ReportExportModal 
          studentId={printStudentId} 
          token={token} 
          onClose={() => setPrintStudentId(null)} 
        />
      )}

    </div>
  );
}
