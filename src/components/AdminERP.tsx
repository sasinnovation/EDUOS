import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { 
  Users, 
  UserPlus, 
  Calendar, 
  Clock, 
  School, 
  Plus, 
  Check, 
  X, 
  AlertTriangle, 
  Download, 
  Key, 
  CheckCircle,
  UserCheck,
  Eye,
  BookOpen,
  Printer
} from "lucide-react";
import { Student, AdmissionApplication, SchoolClass, TimetableEntry, Parent } from "../types";
import ReportExportModal from "./ReportExportModal";

interface AdminERPProps {
  activeSection: "students" | "admissions" | "classes" | "timetable" | "parents";
  token: string;
  currentUser?: any;
}

export default function AdminERP({ activeSection, token, currentUser }: AdminERPProps) {
  // Common states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tenant/School list states for Super Admin dropdowns
  const [tenantsList, setTenantsList] = useState<any[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");

  // Student SIS states
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [printStudentId, setPrintStudentId] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<"Active" | "Graduated" | "Suspended">("Active");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Admissions workflow states
  const [admissionsList, setAdmissionsList] = useState<AdmissionApplication[]>([]);
  const [reviewModalApp, setReviewModalApp] = useState<AdmissionApplication | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewRemarks, setReviewedRemarks] = useState("");
  const [admissionsSuccessData, setAdmissionsSuccessData] = useState<any | null>(null);

  // Classes states
  const [classesList, setClassesList] = useState<SchoolClass[]>([]);
  const [newClassName, setNewClassName] = useState("");
  const [newClassRoom, setNewClassRoom] = useState("");
  const [newClassTeacher, setNewClassTeacher] = useState("");

  // Timetable states
  const [timetableList, setTimetableList] = useState<TimetableEntry[]>([]);
  const [newSlotClassId, setNewSlotClassId] = useState("");
  const [newSlotSubject, setNewSlotSubject] = useState("");
  const [newSlotDay, setNewSlotDay] = useState<any>("Monday");
  const [newSlotStart, setNewSlotStart] = useState("08:30");
  const [newSlotEnd, setNewSlotEnd] = useState("10:00");
  const [newSlotTeacher, setNewSlotTeacher] = useState("");
  const [newSlotRoom, setNewSlotRoom] = useState("");
  const [timetableConflict, setTimetableConflict] = useState<any | null>(null);

  // Parent states
  const [parentsList, setParentsList] = useState<Parent[]>([]);
  const [newParentName, setNewParentName] = useState("");
  const [newParentEmail, setNewParentEmail] = useState("");
  const [newParentPhone, setNewParentPhone] = useState("");
  const [newParentChildId, setNewParentChildId] = useState("");
  const [provisionedParentResult, setProvisionedParentResult] = useState<any | null>(null);
  const [invitationsList, setInvitationsList] = useState<any[]>([]);
  const [expandedInvitationId, setExpandedInvitationId] = useState<string | null>(null);

  // Teacher states
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherEmail, setNewTeacherEmail] = useState("");
  const [newTeacherPassword, setNewTeacherPassword] = useState("");

  // Single student states
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentClassId, setNewStudentClassId] = useState("");
  const [newStudentPlatform, setNewStudentPlatform] = useState("CBT PRO X (EDUOS)");
  const [newStudentStream, setNewStudentStream] = useState("");
  const [newStudentRoom, setNewStudentRoom] = useState("");
  const [newStudentHostel, setNewStudentHostel] = useState("");
  const [newStudentParentName, setNewStudentParentName] = useState("");
  const [newStudentParentEmail, setNewStudentParentEmail] = useState("");
  const [newStudentParentPhone, setNewStudentParentPhone] = useState("");

  // Fetch functions
  const fetchTenants = async () => {
    try {
      const res = await fetch("/api/tenants", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTenantsList(data);
        if (data.length > 0) {
          // Default selection is first school/tenant
          setSelectedTenantId(data[0].id);
          fetchStudents(data[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to fetch tenants", e);
    }
  };

  const fetchStudents = async (tenantIdToFetch?: string) => {
    try {
      const activeTenantId = tenantIdToFetch !== undefined ? tenantIdToFetch : selectedTenantId;
      const url = activeTenantId ? `/api/students?tenant_id=${activeTenantId}` : "/api/students";
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setStudentsList(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStudentDetails = async (studentId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/students/${studentId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setSelectedStudent(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadProfilePDF = (student: any) => {
    if (!student) return;

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // Frame border
      doc.setDrawColor(79, 70, 229); // Indigo theme
      doc.setLineWidth(0.8);
      doc.rect(10, 10, 190, 277, "S");

      doc.setDrawColor(224, 231, 255); // Subtle inner border
      doc.setLineWidth(0.25);
      doc.rect(11.5, 11.5, 187, 274, "S");

      // Header Banner
      doc.setFillColor(79, 70, 229);
      doc.rect(12, 12, 186, 20, "F");

      // Banner text
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.text("EDUOS CLOUD SYSTEMS - STUDENT COMPREHENSIVE DOSSIER", 16, 21);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(224, 231, 255);
      doc.text("Generated: " + new Date().toLocaleString() + " | VERIFIED REGISTRY", 16, 27);

      // Section: Bio-Data
      doc.setTextColor(30, 41, 59); // slate-800
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.text("STUDENT PROFILE BIOMETRICS & GENERAL INFO", 15, 42);

      // Divider line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(15, 45, 195, 45);

      // Draw grid details
      const drawInfoRow = (label1: string, val1: string, label2: string, val2: string, y: number) => {
        doc.setFillColor(248, 250, 252); // soft grey bg
        doc.rect(15, y, 82, 9, "F");
        doc.rect(113, y, 82, 9, "F");

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(label1, 18, y + 6);
        doc.text(label2, 116, y + 6);

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59); // slate-800
        doc.text(val1 || "N/A", 50, y + 6);
        doc.text(val2 || "N/A", 148, y + 6);
      };

      drawInfoRow("STUDENT NAME", student.name, "REGISTRATION NO", student.registrationNumber, 49);
      drawInfoRow("CLASS / LEVEL", student.className, "ACADEMIC STATUS", student.status || "Active", 60);
      drawInfoRow("EMAIL ADDRESS", student.email, "ASSIGNED STREAM", student.stream || "General", 71);
      drawInfoRow("HOSTEL RESIDENCE", student.hostel, "ALLOCATED ROOM", student.room || "N/A", 82);
      drawInfoRow("PLATFORM INSTANCE", student.platform || "CBT PRO X (EDUOS)", "ATTENDANCE RATE", `${student.attendanceRate || 0}%`, 93);

      // Add simple visual representation for Attendance
      const attRate = student.attendanceRate || 0;
      doc.setFillColor(241, 245, 249);
      doc.rect(15, 107, 180, 10, "F");
      
      // Select bar color based on rate
      if (attRate >= 90) {
        doc.setFillColor(16, 185, 129); // green
      } else if (attRate >= 75) {
        doc.setFillColor(245, 158, 11); // amber
      } else {
        doc.setFillColor(239, 68, 68); // red
      }
      doc.rect(15, 107, (180 * Math.min(attRate, 100)) / 100, 10, "F");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(`ATTENDANCE RATIO: ${attRate}% OF ACADEMIC YEAR TOTAL`, 20, 113.5);

      // Section: Exam scores
      doc.setTextColor(30, 41, 59); // slate-800
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.text("COMPUTER BASED TESTING (CBT) HISTORIC TRANSCRIPTS", 15, 129);

      // Divider line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(15, 132, 195, 132);

      const attempts = student.examAttempts || [];
      if (attempts.length > 0) {
        // Draw Table Header
        doc.setFillColor(79, 70, 229);
        doc.rect(15, 136, 180, 8, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text("EXAM MODULE TITLE", 18, 141.5);
        doc.text("DATE CONCLUDED", 100, 141.5);
        doc.text("PERCENTAGE", 140, 141.5);
        doc.text("GRADE POINT", 170, 141.5);

        let currentY = 144;
        attempts.forEach((att: any, idx: number) => {
          // Zebra striping
          if (idx % 2 === 0) {
            doc.setFillColor(250, 250, 250);
          } else {
            doc.setFillColor(255, 255, 255);
          }
          doc.rect(15, currentY, 180, 8, "F");
          doc.setDrawColor(241, 245, 249);
          doc.line(15, currentY + 8, 195, currentY + 8);

          doc.setTextColor(51, 65, 85);
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(8);
          doc.text(att.examTitle || "CBT Exam", 18, currentY + 5.5);

          doc.setFont("Helvetica", "normal");
          doc.text(att.submitTime ? new Date(att.submitTime).toLocaleDateString() : "N/A", 100, currentY + 5.5);
          
          doc.setFont("Helvetica", "bold");
          doc.text(`${att.percentage}%`, 140, currentY + 5.5);
          doc.text(String(att.gradePoint || "0.0"), 170, currentY + 5.5);

          currentY += 8;
        });
      } else {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, 136, 180, 20, "F");
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text("No Computer Based Testing (CBT) records found for this student.", 50, 148);
      }

      // Footer disclaimer & verification seal
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 250, 195, 250);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(79, 70, 229);
      doc.text("OFFICIAL EDUOS EMBEDDED SYSTEM METRIC DATA", 15, 256);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text("This document is a direct extraction of the student record database. All results are cryptographically logged.", 15, 261);
      doc.text("Bypassing, forging or modifying this record without appropriate database token authorization is strictly audited.", 15, 265);

      doc.save(`StudentProfile_${student.name.replace(/\s+/g, "_")}.pdf`);
    } catch (e) {
      console.error("PDF generation error: ", e);
      setErrorMsg("Failed to generate PDF document using jsPDF.");
    }
  };

  const fetchAdmissions = async () => {
    try {
      const res = await fetch("/api/admissions", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setAdmissionsList(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classes", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setClassesList(data);
      if (data.length > 0) {
        setNewSlotClassId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTimetable = async () => {
    try {
      const res = await fetch("/api/timetable", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setTimetableList(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchParents = async () => {
    try {
      const res = await fetch("/api/parents", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setParentsList(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInvitations = async () => {
    try {
      const res = await fetch("/api/parents/invitations", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInvitationsList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/teachers", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTeachersList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Run fetches depending on current dashboard view active
  useEffect(() => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setTimetableConflict(null);
    setProvisionedParentResult(null);
    setAdmissionsSuccessData(null);
    setSelectedStudent(null);
    setSelectedStudentIds([]);

    if (currentUser?.tenantId === "default") {
      fetchTenants();
    } else {
      fetchStudents();
    }
    fetchClasses();
    fetchAdmissions();
    fetchTimetable();
    fetchParents();
    fetchInvitations();
    fetchTeachers();
  }, [activeSection, currentUser]);

  // Create class action
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    try {
      setLoading(true);
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: newClassName, room: newClassRoom, primaryTeacher: newClassTeacher })
      });
      if (res.ok) {
        setSuccessMsg(`Class room "${newClassName}" registered into database.`);
        setNewClassName("");
        setNewClassRoom("");
        setNewClassTeacher("");
        fetchClasses();
      } else {
        const error = await res.json();
        setErrorMsg(error.message || "Failed to create class room.");
      }
    } catch (err) {
      setErrorMsg("Network failure creating class.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim() || !newTeacherEmail.trim() || !newTeacherPassword.trim()) {
      setErrorMsg("Please fill in all teacher credentials.");
      return;
    }
    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newTeacherName,
          email: newTeacherEmail,
          password: newTeacherPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Teacher "${newTeacherName}" successfully registered.`);
        setNewTeacherName("");
        setNewTeacherEmail("");
        setNewTeacherPassword("");
        fetchTeachers();
      } else {
        setErrorMsg(data.message || "Failed to register teacher.");
      }
    } catch (err) {
      setErrorMsg("Network error registering teacher.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) {
      setErrorMsg("Student name is required.");
      return;
    }
    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newStudentName,
          email: newStudentEmail,
          classId: newStudentClassId,
          platform: currentUser?.tenantId === "default" ? newStudentPlatform : "CBT PRO X (EDUOS)",
          stream: newStudentStream,
          room: newStudentRoom,
          hostel: newStudentHostel,
          tenantId: currentUser?.tenantId === "default" ? selectedTenantId : undefined,
          parentName: newStudentParentName,
          parentEmail: newStudentParentEmail,
          parentPhone: newStudentParentPhone
        })
      });
      const data = await res.json();
      if (res.ok) {
        let msg = `Student "${newStudentName}" successfully created.`;
        if (newStudentParentEmail) {
          msg += ` Automated parent invitation and credentials successfully triggered for "${newStudentParentName}" (${newStudentParentEmail}) via SMS & Email.`;
        }
        setSuccessMsg(msg);
        setNewStudentName("");
        setNewStudentEmail("");
        setNewStudentClassId("");
        setNewStudentPlatform("CBT PRO X (EDUOS)");
        setNewStudentStream("");
        setNewStudentRoom("");
        setNewStudentHostel("");
        setNewStudentParentName("");
        setNewStudentParentEmail("");
        setNewStudentParentPhone("");
        if (currentUser?.tenantId === "default") {
          fetchStudents(selectedTenantId);
        } else {
          fetchStudents();
        }
        fetchInvitations();
      } else {
        setErrorMsg(data.message || "Failed to create student.");
      }
    } catch (err) {
      setErrorMsg("Network error creating student.");
    } finally {
      setLoading(false);
    }
  };

  // Timetable Create with conflict detection action
  const handleCreateTimetableSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setTimetableConflict(null);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!newSlotClassId || !newSlotSubject || !newSlotTeacher || !newSlotRoom) {
      setErrorMsg("Please provide all timetable slot parameters.");
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
          classId: newSlotClassId,
          subject: newSlotSubject,
          dayOfWeek: newSlotDay,
          startTime: newSlotStart,
          endTime: newSlotEnd,
          teacher: newSlotTeacher,
          room: newSlotRoom
        })
      });

      if (res.status === 201) {
        setSuccessMsg(`Class timetable slot for "${newSlotSubject}" successfully scheduled.`);
        setNewSlotSubject("");
        setNewSlotTeacher("");
        setNewSlotRoom("");
        fetchTimetable();
      } else if (res.status === 409) {
        const conflict = await res.json();
        setTimetableConflict(conflict);
      } else {
        const err = await res.json();
        setErrorMsg(err.message || "Scheduling failure occurred.");
      }
    } catch (err) {
      setErrorMsg("Network timed out processing scheduling checks.");
    } finally {
      setLoading(false);
    }
  };

  // Export Timetable to CSV action
  const exportTimetableToCSV = () => {
    const headers = ["Class Name", "Subject", "Day", "Start Time", "End Time", "Teacher", "Location Room"];
    const rows = timetableList.map(t => [
      t.className || "Unknown Class",
      t.subject,
      t.dayOfWeek,
      t.startTime,
      t.endTime,
      t.teacher,
      t.room
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CBT_PRO_X_Timetable_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Review Admission Decision action
  const handleReviewAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalApp) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/admissions/${reviewModalApp.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: reviewStatus, remarks: reviewRemarks })
      });

      const result = await res.json();
      if (res.ok) {
        setAdmissionsSuccessData(result);
        setReviewModalApp(null);
        setReviewedRemarks("");
        fetchAdmissions();
        fetchStudents();
        fetchParents();
      } else {
        setErrorMsg(result.message || "Failed to process admission evaluation.");
      }
    } catch (err) {
      setErrorMsg("Failure communicating review submission.");
    } finally {
      setLoading(false);
    }
  };

  // Parent profile Account Provisioning action
  const handleCreateParent = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisionedParentResult(null);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!newParentName || !newParentEmail || !newParentChildId) {
      setErrorMsg("Missing parent email, name, or child link parameter.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/parents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newParentName,
          email: newParentEmail,
          phone: newParentPhone,
          childStudentId: newParentChildId
        })
      });

      const result = await res.json();
      if (res.ok) {
        setProvisionedParentResult(result);
        setNewParentName("");
        setNewParentEmail("");
        setNewParentPhone("");
        fetchParents();
        fetchInvitations();
      } else {
        setErrorMsg(result.message || "Failed to provision parent user profile.");
      }
    } catch (e) {
      setErrorMsg("Connection failure during portal provisioning.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedStudentIds.length === 0) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      setIsBulkUpdating(true);
      const res = await fetch("/api/students/bulk-status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          studentIds: selectedStudentIds,
          status: bulkStatus
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || `Successfully updated enrollment status of ${selectedStudentIds.length} student(s) to ${bulkStatus}.`);
        setSelectedStudentIds([]);
        await fetchStudents();
        if (selectedStudent) {
          await fetchStudentDetails(selectedStudent.id);
        }
      } else {
        setErrorMsg(data.message || "Failed to perform bulk status update.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network failure performing bulk status update.");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const parseCsvText = (text: string) => {
    const lines = text.split(/\r?\n/);
    if (lines.length <= 1) return [];

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
    const nameIdx = headers.indexOf("name");
    const emailIdx = headers.indexOf("email");
    const classIdIdx = headers.findIndex(h => h === "classid" || h === "class_id" || h === "class" || h === "classname" || h === "class_name");
    const statusIdx = headers.indexOf("status");
    const platformIdx = headers.findIndex(h => h === "platform" || h === "platformname" || h === "platform_name");
    const streamIdx = headers.findIndex(h => h === "stream" || h === "specialization" || h === "subject" || h === "subject_specialization");
    const roomIdx = headers.findIndex(h => h === "room" || h === "classroom_room" || h === "class_room" || h === "room_number");
    const hostelIdx = headers.findIndex(h => h === "hostel" || h === "hostel_wing" || h === "wing" || h === "hostel_block");

    if (nameIdx === -1) {
      throw new Error("Invalid CSV header: 'name' column is required.");
    }

    const students: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values: string[] = [];
      let currentVal = "";
      let inQuotes = false;
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
          currentVal = "";
        } else {
          currentVal += char;
        }
      }
      values.push(currentVal.trim().replace(/^["']|["']$/g, ''));

      if (values.length > 0 && values[nameIdx]) {
        let classVal = classIdIdx !== -1 && values[classIdIdx] ? values[classIdIdx].trim() : "";
        let mappedClassId = classVal;
        
        // Advanced Mapping: resolve Class Name to actual Class ID
        if (classesList && classesList.length > 0 && classVal) {
          const foundClass = classesList.find(c => 
            c.name.trim().toLowerCase() === classVal.toLowerCase() || 
            c.id.trim().toLowerCase() === classVal.toLowerCase()
          );
          if (foundClass) {
            mappedClassId = foundClass.id;
          }
        }

        const rawPlatform = platformIdx !== -1 && values[platformIdx] ? values[platformIdx].trim() : "";
        const mappedPlatform = rawPlatform || "CBT PRO";
        const mappedStream = streamIdx !== -1 && values[streamIdx] ? values[streamIdx].trim() : "General";
        const mappedRoom = roomIdx !== -1 && values[roomIdx] ? values[roomIdx].trim() : "N/A";
        const mappedHostel = hostelIdx !== -1 && values[hostelIdx] ? values[hostelIdx].trim() : "N/A";

        students.push({
          name: values[nameIdx].trim(),
          email: emailIdx !== -1 && values[emailIdx] ? values[emailIdx].trim() : "",
          classId: mappedClassId,
          status: statusIdx !== -1 && values[statusIdx] ? values[statusIdx].trim() : "Active",
          platform: mappedPlatform,
          stream: mappedStream,
          room: mappedRoom,
          hostel: mappedHostel
        });
      }
    }
    return students;
  };

  const handleCsvFile = async (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const text = await file.text();
      const students = parseCsvText(text);
      if (students.length === 0) {
        setErrorMsg("The CSV file does not contain any valid student records.");
        return;
      }

      setLoading(true);
      const res = await fetch("/api/students/bulk-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ students })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || `Successfully imported ${students.length} students.`);
        await fetchStudents();
      } else {
        setErrorMsg(data.message || "Failed to import student records.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to process the uploaded CSV file.");
    } finally {
      setLoading(false);
    }
  };

  const handleCsvFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleCsvFile(file);
    }
  };

  const handleCsvDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleCsvFile(file);
    }
  };

  const downloadCsvTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,name,email,class,status,platform,specialization,room,hostel\nJohn Doe,john.doe@example.com,SS3 Science,Active,CBT PRO X (EDUOS),Science,Room 102,Emerald Hall\nJane Smith,jane.smith@example.com,SS3 Arts,Active,Edves,Arts,Room 104,Ruby Hall\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="admin-erp-root">
      
      {/* Dynamic Header Block */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            School Cloud ERP Module
          </span>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight mt-2 capitalize">
            {activeSection === "students" && "Student Information System (SIS)"}
            {activeSection === "admissions" && "Admissions Workflow Management"}
            {activeSection === "classes" && "Class Rooms & Faculty Mapping"}
            {activeSection === "timetable" && "Timetable Conflict-Detection Engine"}
            {activeSection === "parents" && "Parent Portal Provisioning Dashboard"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {activeSection === "students" && "Access individual academic indices, records linking, and physical rosters."}
            {activeSection === "admissions" && "Review enrollment applications, trigger student database mappings, and provision logins."}
            {activeSection === "classes" && "Create high-school structures, assign physical blocks, and declare form tutors."}
            {activeSection === "timetable" && "Establish weekly schedules with advanced teacher availability constraints and room collision safety."}
            {activeSection === "parents" && "Map child indices to parents, instantly auto-generate Portal users and export temporary keys."}
          </p>
        </div>
      </div>

      {/* Global Toast Notifications banner */}
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

      {/* ----------------- SECTION 1: STUDENTS SIS ----------------- */}
      {activeSection === "students" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-indigo-500" />
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Active Student Roster</h3>
                  {currentUser?.tenantId === "default" && (
                    <span className="text-[10px] text-indigo-600 font-mono font-bold uppercase tracking-wider block">SUPER ADMIN PLATFORM</span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end sm:self-auto">
                {currentUser?.tenantId === "default" && (
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">School:</span>
                    <select
                      value={selectedTenantId}
                      onChange={(e) => {
                        setSelectedTenantId(e.target.value);
                        fetchStudents(e.target.value);
                      }}
                      className="border border-indigo-200 bg-indigo-50/70 text-indigo-900 font-bold rounded-lg text-xs p-1.5 focus:outline-indigo-500"
                    >
                      {tenantsList.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <span className="text-xs font-mono text-slate-500 font-semibold bg-slate-100 px-2 py-1 rounded-md">
                  {studentsList.length} Pupils
                </span>
              </div>
            </div>

            {/* Bulk Action Panel */}
            {selectedStudentIds.length > 0 && (
              <div className="bg-indigo-50 border-b border-indigo-100 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                <div className="flex items-center space-x-2.5 text-indigo-900 font-medium text-sm">
                  <span className="bg-indigo-600 text-white text-xs font-mono font-bold h-6 w-6 rounded-full flex items-center justify-center">
                    {selectedStudentIds.length}
                  </span>
                  <span>{selectedStudentIds.length === 1 ? 'student' : 'students'} selected for bulk action</span>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <span className="text-xs font-bold text-indigo-700/70 uppercase tracking-wider">Set Status:</span>
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value as any)}
                    className="text-xs bg-white border border-indigo-200 rounded-lg px-3 py-1.5 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Graduated">Graduated</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                  
                  <button
                    onClick={handleBulkStatusUpdate}
                    disabled={isBulkUpdating}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 px-3.5 py-1.5 rounded-lg font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    {isBulkUpdating ? (
                      <span>Applying...</span>
                    ) : (
                      <>
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Apply</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setSelectedStudentIds([])}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3.5 px-6 w-12 text-center">
                      <input 
                        type="checkbox"
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                        checked={studentsList.length > 0 && selectedStudentIds.length === studentsList.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudentIds(studentsList.map(s => s.id));
                          } else {
                            setSelectedStudentIds([]);
                          }
                        }}
                        id="select-all-students-checkbox"
                      />
                    </th>
                    <th className="py-3.5 px-6">Reg Number</th>
                    <th className="py-3.5 px-6">Student Name</th>
                    {currentUser?.tenantId === "default" && <th className="py-3.5 px-6">Platform</th>}
                    <th className="py-3.5 px-6">Class (e.g. SS1)</th>
                    <th className="py-3.5 px-6">Stream/Subject</th>
                    <th className="py-3.5 px-6">Allocated Room</th>
                    <th className="py-3.5 px-6">Hostel</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Attendance Rate</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {studentsList.map((stu) => (
                    <tr key={stu.id} className={`hover:bg-slate-50/70 transition-colors ${selectedStudentIds.includes(stu.id) ? 'bg-indigo-50/20' : ''}`}>
                      <td className="py-3.5 px-6 text-center">
                        <input 
                          type="checkbox"
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                          checked={selectedStudentIds.includes(stu.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudentIds(prev => [...prev, stu.id]);
                            } else {
                              setSelectedStudentIds(prev => prev.filter(id => id !== stu.id));
                            }
                          }}
                          id={`student-checkbox-${stu.id}`}
                        />
                      </td>
                      <td className="py-3.5 px-6 font-mono font-bold text-slate-700">{stu.registrationNumber}</td>
                      <td className="py-3.5 px-6 font-semibold text-slate-800">{stu.name}</td>
                      {currentUser?.tenantId === "default" && (
                        <td className="py-3.5 px-6 text-slate-500 font-medium text-xs">{stu.platform || "CBT PRO"}</td>
                      )}
                      <td className="py-3.5 px-6 text-slate-600">
                        <span className="px-2 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-700">
                          {stu.className || "Unassigned"}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-500 font-semibold text-xs">{stu.stream || "General"}</td>
                      <td className="py-3.5 px-6 text-slate-500 font-mono text-xs">{stu.room || "N/A"}</td>
                      <td className="py-3.5 px-6 text-slate-500 text-xs">{stu.hostel || "N/A"}</td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          stu.status === "Graduated"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : stu.status === "Suspended"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}>
                          {stu.status || "Active"}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${stu.attendanceRate >= 90 ? 'bg-emerald-500' : stu.attendanceRate >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${Math.min(stu.attendanceRate, 100)}%` }}
                            ></div>
                          </div>
                          <span className={`text-xs font-bold font-mono ${stu.attendanceRate >= 90 ? 'text-emerald-600' : stu.attendanceRate >= 75 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {stu.attendanceRate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => fetchStudentDetails(stu.id)}
                          className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center space-x-1 ml-auto cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Inspect Records</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3 flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-indigo-500" />
              <span>ERP Record Inspection</span>
            </h3>

            {selectedStudent ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="mr-2">
                    <h4 className="text-xl font-bold text-slate-800">{selectedStudent.name}</h4>
                    <p className="text-xs text-slate-500 font-mono mt-1">UUID: {selectedStudent.id} | Email: {selectedStudent.email || "N/A"}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                    <button
                      onClick={() => setPrintStudentId(selectedStudent.id)}
                      className="flex items-center justify-center space-x-1 px-2.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Report Card</span>
                    </button>
                    <button
                      onClick={() => handleDownloadProfilePDF(selectedStudent)}
                      className="flex items-center justify-center space-x-1 px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>

                <div className={`grid ${currentUser?.tenantId === "default" ? "grid-cols-4" : "grid-cols-3"} gap-3`}>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Reg Index</span>
                    <span className="font-mono text-xs font-bold text-slate-700">{selectedStudent.registrationNumber}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Active Class</span>
                    <span className="text-xs font-bold text-slate-700 truncate block">{selectedStudent.className}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Status</span>
                    <span className={`text-xs font-bold ${
                      selectedStudent.status === "Graduated"
                        ? "text-blue-600"
                        : selectedStudent.status === "Suspended"
                        ? "text-rose-600"
                        : "text-emerald-600"
                    }`}>
                      {selectedStudent.status || "Active"}
                    </span>
                  </div>
                  {currentUser?.tenantId === "default" && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Platform</span>
                      <span className="text-xs font-bold text-indigo-600 truncate block">{selectedStudent.platform || "CBT PRO"}</span>
                    </div>
                  )}
                </div>

                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50 text-center">
                  <span className="text-xs text-indigo-600 block font-bold uppercase tracking-wider mb-1">CBT Aggregate Attendance Rate</span>
                  <div className="text-3xl font-black font-mono text-indigo-700">{selectedStudent.attendanceRate}%</div>
                </div>

                <div>
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Completed Exam CBT Scores</h5>
                  {selectedStudent.examAttempts && selectedStudent.examAttempts.length > 0 ? (
                    <div className="space-y-2">
                      {selectedStudent.examAttempts.map((att: any) => (
                        <div key={att.id} className="bg-white border border-slate-100 p-3 rounded-lg flex items-center justify-between text-xs hover:border-slate-200 transition-colors shadow-sm">
                          <div>
                            <p className="font-bold text-slate-800 line-clamp-1">{att.examTitle}</p>
                            <span className="text-slate-400 font-mono text-[10px]">Date: {new Date(att.submitTime).toLocaleDateString()}</span>
                          </div>
                          <div className="text-right">
                            <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide inline-block mb-1 ${att.status === 'PASS' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                              {att.status}: {att.percentage}%
                            </span>
                            <div className="text-[11px] font-black text-slate-700">Grade Point: {att.gradePoint}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-xs text-slate-400 py-6 border border-dashed border-slate-200 rounded-xl">
                      No CBT sessions logged for this Student user yet.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-12 flex flex-col items-center justify-center space-y-3">
                <Users className="h-10 w-10 text-slate-200 stroke-1" />
                <p className="text-xs max-w-[200px] mx-auto text-slate-400">Select any student inspection link to drill down into aggregate attendance records and CBT statistics.</p>
              </div>
            )}
          </div>

          {/* Bulk CSV Import Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3 flex items-center space-x-2">
              <Download className="h-5 w-5 text-indigo-500" />
              <span>Bulk CSV Student Import</span>
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload a CSV file containing columns: <code className="bg-slate-100 font-mono text-indigo-600 px-1 py-0.5 rounded">name</code>, <code className="bg-slate-100 font-mono text-indigo-600 px-1 py-0.5 rounded">email</code>, <code className="bg-slate-100 font-mono text-indigo-600 px-1 py-0.5 rounded">classId</code>, <code className="bg-slate-100 font-mono text-indigo-600 px-1 py-0.5 rounded">status</code> (optional).
            </p>
            
            <div 
              className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-6 text-center cursor-pointer transition-all relative group"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleCsvDrop}
              onClick={() => document.getElementById("csv-file-input")?.click()}
            >
              <input 
                type="file" 
                id="csv-file-input" 
                accept=".csv" 
                className="hidden" 
                onChange={handleCsvFileSelect}
              />
              <Download className="h-8 w-8 text-slate-400 mx-auto mb-2 stroke-1 group-hover:text-indigo-500 transition-colors" />
              <span className="text-xs font-bold text-indigo-600 block mb-1">Drag & Drop CSV file</span>
              <span className="text-[10px] text-slate-400 block">or click to browse local files</span>
            </div>
            
            <div className="flex justify-between items-center text-xs pt-1">
              <button
                onClick={downloadCsvTemplate}
                type="button"
                className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1 cursor-pointer"
              >
                <span>📥 Download CSV Template</span>
              </button>
            </div>
          </div>

          {/* Add Single Student Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3 flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-indigo-500" />
              <span>Add Single Student Profile</span>
            </h3>
            
            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. john.doe@school.com"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800"
                />
              </div>

              <div className={`grid ${currentUser?.tenantId === "default" ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Class Room</label>
                  <select
                    value={newStudentClassId}
                    onChange={(e) => setNewStudentClassId(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800"
                  >
                    <option value="">Unassigned</option>
                    {classesList.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {currentUser?.tenantId === "default" && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-indigo-700 uppercase">Platform Name</label>
                    <select
                      value={newStudentPlatform}
                      onChange={(e) => setNewStudentPlatform(e.target.value)}
                      className="w-full border border-indigo-200 bg-indigo-50/20 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800 font-semibold"
                    >
                      <option value="CBT PRO X (EDUOS)">CBT PRO X (EDUOS)</option>
                      <option value="EduOS ERP">EduOS ERP</option>
                    </select>
                  </div>
                )}
              </div>

              {currentUser?.tenantId === "default" && (
                <div className="space-y-1 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                  <label className="text-xs font-bold text-indigo-800 uppercase block mb-1">Target School / Tenant (Super Admin Only)</label>
                  <select
                    value={selectedTenantId}
                    onChange={(e) => {
                      setSelectedTenantId(e.target.value);
                      fetchStudents(e.target.value);
                    }}
                    className="w-full border border-indigo-200 bg-white p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-indigo-900 font-bold"
                  >
                    {tenantsList.map(tenant => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name} ({tenant.subdomain}.cbtprox.com)
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-indigo-500 mt-1 font-mono">
                    Adding a student will assign them to the selected school database.
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Stream / Subject (e.g. Science, Arts)</label>
                <input
                  type="text"
                  placeholder="e.g. Science"
                  value={newStudentStream}
                  onChange={(e) => setNewStudentStream(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Allocated Room</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 204"
                    value={newStudentRoom}
                    onChange={(e) => setNewStudentRoom(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Hostel Block</label>
                  <input
                    type="text"
                    placeholder="e.g. Emerald Hall"
                    value={newStudentHostel}
                    onChange={(e) => setNewStudentHostel(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Optional Automated Parent Invitation Block */}
              <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100 space-y-3">
                <h4 className="text-xs font-bold text-emerald-800 flex items-center space-x-1.5">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Automated Parent Invitation (Optional)</span>
                </h4>
                <p className="text-[10px] text-emerald-600/90 leading-normal">
                  Providing these details automatically provisions a Parent Portal User Account and triggers welcome registration instructions instantly via simulated SMS and SMTP Email.
                </p>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Parent's Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Chief Folayan"
                      value={newStudentParentName}
                      onChange={(e) => setNewStudentParentName(e.target.value)}
                      className="w-full border border-slate-200 bg-white p-2 rounded-lg text-xs focus:outline-emerald-500 text-slate-800"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Parent's Email</label>
                      <input
                        type="email"
                        placeholder="e.g. parent@eduos.com"
                        value={newStudentParentEmail}
                        onChange={(e) => setNewStudentParentEmail(e.target.value)}
                        className="w-full border border-slate-200 bg-white p-2 rounded-lg text-xs focus:outline-emerald-500 text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Parent's Phone</label>
                      <input
                        type="text"
                        placeholder="e.g. +234 803 123 4567"
                        value={newStudentParentPhone}
                        onChange={(e) => setNewStudentParentPhone(e.target.value)}
                        className="w-full border border-slate-200 bg-white p-2 rounded-lg text-xs focus:outline-emerald-500 text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4" />
                <span>{loading ? "Registering..." : "Create Student Profile"}</span>
              </button>
            </form>
          </div>

          {/* Add Single Teacher Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3 flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-indigo-500" />
              <span>Add Single Teacher Profile</span>
            </h3>
            
            <form onSubmit={handleCreateTeacher} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Teacher Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Richard Feyman"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. r.feyman@school.com"
                  value={newTeacherEmail}
                  onChange={(e) => setNewTeacherEmail(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Temporary Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newTeacherPassword}
                  onChange={(e) => setNewTeacherPassword(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white p-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span>{loading ? "Registering..." : "Register Teacher Account"}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- SECTION 2: ADMISSIONS WORKFLOW ----------------- */}
      {activeSection === "admissions" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-indigo-500" />
                <span>Applications Admissions Inbox</span>
              </h3>
              <span className="text-xs font-mono text-slate-500 font-semibold">{admissionsList.length} Total Submissions</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3.5 px-6">Date Submitted</th>
                    <th className="py-3.5 px-6">Applicant Name</th>
                    <th className="py-3.5 px-6">Grade Applied</th>
                    <th className="py-3.5 px-6">Parent Primary / Email</th>
                    <th className="py-3.5 px-6">Current Status</th>
                    <th className="py-3.5 px-6 text-right">Action Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {admissionsList.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6 text-slate-500 font-mono text-xs">
                        {new Date(app.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-slate-800">
                        <div>{app.studentName}</div>
                        <div className="text-[11px] text-slate-400 font-normal">{app.studentEmail}</div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-700 font-medium">{app.gradeApplied}</td>
                      <td className="py-3.5 px-6">
                        <div className="font-semibold text-slate-700 text-xs">{app.parentName}</div>
                        <div className="text-[11px] text-slate-400">{app.parentEmail}</div>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold tracking-wide ${
                          app.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                          app.status === 'REJECTED' ? 'bg-rose-50 text-rose-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        {app.status === "PENDING" ? (
                          <button
                            onClick={() => {
                              setReviewModalApp(app);
                              setReviewedRemarks("");
                            }}
                            className="text-xs bg-indigo-600 text-white hover:bg-indigo-700 px-3.5 py-2 rounded-lg font-bold shadow-sm transition-all"
                          >
                            Evaluate
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Evaluated</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Admissions Success Modal Details */}
          {admissionsSuccessData && (
            <div className="bg-indigo-900 text-white rounded-2xl p-6 shadow-xl space-y-4 animate-fade-in border-2 border-indigo-400">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
                <h4 className="text-lg font-extrabold tracking-tight">Admissions workflow executed successfully!</h4>
              </div>
              <p className="text-indigo-200 text-xs leading-relaxed max-w-3xl">
                The database triggers have mapped the applicant directly. Dr Charles Kolawole, Administrator. Please copy and deliver these login details to the respective parents:
              </p>
              <div className="bg-indigo-950 p-4 rounded-xl border border-indigo-800 text-xs font-mono space-y-2 max-w-2xl">
                <div><span className="text-indigo-400 font-bold uppercase">Student Roster Reg index:</span> {studentsList[studentsList.length-1]?.registrationNumber || "GEN-STU"}</div>
                <div><span className="text-indigo-400 font-bold uppercase">Linked Student Login:</span> {admissionsSuccessData.application?.studentEmail} (Password: student123)</div>
                <div><span className="text-indigo-400 font-bold uppercase">Guardian Portal Parent Login:</span> {admissionsSuccessData.application?.parentEmail}</div>
                <div><span className="text-rose-400 font-bold uppercase">Guardian One-Time Temp Password:</span> parent@eduos (or newly randomly assigned in log database)</div>
              </div>
              <button 
                onClick={() => setAdmissionsSuccessData(null)}
                className="bg-indigo-700 hover:bg-indigo-800 px-4 py-1.5 rounded-lg text-xs font-bold transition-all text-white border border-indigo-500"
              >
                Dismiss Logs
              </button>
            </div>
          )}

          {/* Evaluate Modal Dialog Component */}
          {reviewModalApp && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-6 animate-scale-up">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-lg">Evaluate Application #{reviewModalApp.id}</h3>
                  <button onClick={() => setReviewModalApp(null)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                </div>

                <div className="text-xs bg-slate-50 p-3 rounded-lg space-y-1.5">
                  <p className="text-slate-700 font-semibold">Applicant Student: <span className="font-bold text-slate-900">{reviewModalApp.studentName}</span></p>
                  <p className="text-slate-700 font-semibold">Grade Applied: <span className="font-bold text-slate-900">{reviewModalApp.gradeApplied}</span></p>
                  <p className="text-slate-700 font-semibold">Parent Primary: <span className="font-bold text-slate-900">{reviewModalApp.parentName} ({reviewModalApp.parentEmail})</span></p>
                </div>

                <form onSubmit={handleReviewAdmission} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Status Decision</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setReviewStatus("APPROVED")}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${reviewStatus === 'APPROVED' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-slate-200 text-slate-600'}`}
                      >
                        Approve Candidate
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewStatus("REJECTED")}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${reviewStatus === 'REJECTED' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'border-slate-200 text-slate-600'}`}
                      >
                        Reject Candidate
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Review Remarks / Conditions</label>
                    <textarea
                      value={reviewRemarks}
                      onChange={(e) => setReviewedRemarks(e.target.value)}
                      placeholder="e.g. Cleared credentials, score metrics on placement CBT exceed thresholds."
                      className="w-full text-xs border border-slate-200 p-3 rounded-xl h-24 focus:outline-indigo-500 text-slate-800"
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white font-bold text-xs py-3 rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center"
                    disabled={loading}
                  >
                    {loading ? "Processing Database Linking..." : "Commit Admissions Evaluation"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------- SECTION 3: CLASSES & ROOMS ----------------- */}
      {activeSection === "classes" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3 flex items-center space-x-2">
              <School className="h-5 w-5 text-indigo-500" />
              <span>Registered High School Classes</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classesList.map((cls) => (
                <div key={cls.id} className="border border-slate-100 p-4 rounded-xl hover:border-slate-200 transition-all space-y-2 bg-slate-50/50 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-base">{cls.name}</span>
                    <span className="text-[10px] font-mono bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{cls.id}</span>
                  </div>
                  <p className="text-xs text-slate-500"><span className="font-bold text-slate-600">Location:</span> {cls.room}</p>
                  <p className="text-xs text-slate-500"><span className="font-bold text-slate-600">Primary Form Tutor:</span> {cls.primaryTeacher}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3 flex items-center space-x-2">
              <Plus className="h-5 w-5 text-indigo-500" />
              <span>Add Class Room Profile</span>
            </h3>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Class Stream Name</label>
                <input
                  type="text"
                  placeholder="e.g. SS1 Science C"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Allocated Block / Room</label>
                <input
                  type="text"
                  placeholder="e.g. Block C - Room 204"
                  value={newClassRoom}
                  onChange={(e) => setNewClassRoom(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Form Tutor Teacher</label>
                <input
                  type="text"
                  placeholder="e.g. Mr. Timothy Ola"
                  value={newClassTeacher}
                  onChange={(e) => setNewClassTeacher(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white font-bold text-xs py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {loading ? "Registering..." : "Submit Class Profile"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- SECTION 4: TIMETABLE & CONFLICT ENGINE ----------------- */}
      {activeSection === "timetable" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Create timetable slot block */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3 flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-indigo-500" />
                <span>Schedule New Slot</span>
              </h3>

              <form onSubmit={handleCreateTimetableSlot} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Target Stream Class</label>
                  <select
                    value={newSlotClassId}
                    onChange={(e) => setNewSlotClassId(e.target.value)}
                    className="w-full border border-slate-200 p-2 rounded-lg text-xs focus:outline-indigo-500 text-slate-800"
                    required
                  >
                    {classesList.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Subject Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Further Mathematics"
                    value={newSlotSubject}
                    onChange={(e) => setNewSlotSubject(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Day of Week</label>
                  <select
                    value={newSlotDay}
                    onChange={(e) => setNewSlotDay(e.target.value)}
                    className="w-full border border-slate-200 p-2 rounded-lg text-xs focus:outline-indigo-500 text-slate-800"
                    required
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Start (HH:MM)</label>
                    <input
                      type="text"
                      placeholder="08:30"
                      value={newSlotStart}
                      onChange={(e) => setNewSlotStart(e.target.value)}
                      className="w-full border border-slate-200 p-2 rounded-lg text-xs focus:outline-indigo-500 text-slate-800 font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">End (HH:MM)</label>
                    <input
                      type="text"
                      placeholder="10:00"
                      value={newSlotEnd}
                      onChange={(e) => setNewSlotEnd(e.target.value)}
                      className="w-full border border-slate-200 p-2 rounded-lg text-xs focus:outline-indigo-500 text-slate-800 font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Subject Teacher</label>
                  <input
                    type="text"
                    placeholder="Mrs. Florence Adebayo"
                    value={newSlotTeacher}
                    onChange={(e) => setNewSlotTeacher(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Physical Room/Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Science Lab 2"
                    value={newSlotRoom}
                    onChange={(e) => setNewSlotRoom(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md"
                >
                  {loading ? "Checking schedule integrity..." : "Verify & Schedule Slot"}
                </button>
              </form>
            </div>

            {/* Overlapping conflict banner block */}
            <div className="xl:col-span-2 space-y-6">
              {timetableConflict && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm text-amber-900 space-y-2 animate-pulse-slow">
                  <div className="flex items-center space-x-2 text-amber-800 font-black">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <span>TIMETABLE SHIELD ACTIVE • SCHEDULE COLLISION</span>
                  </div>
                  <p className="text-xs leading-relaxed font-semibold">
                    {timetableConflict.message}
                  </p>
                  <div className="text-[11px] font-mono uppercase bg-amber-100 inline-block px-2.5 py-0.5 rounded text-amber-800 font-bold">
                    Reason: Overlap protection schema of class/staff/facility
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-lg">Active Institutional Academic Schedule</h3>
                  <button
                    onClick={exportTimetableToCSV}
                    className="flex items-center space-x-1.5 text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-bold transition-all"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                        <th className="py-2.5 px-4">Class</th>
                        <th className="py-2.5 px-4">Subject</th>
                        <th className="py-2.5 px-4">Day</th>
                        <th className="py-2.5 px-4">Hours Time</th>
                        <th className="py-2.5 px-4">Teacher</th>
                        <th className="py-2.5 px-4">Room/Lab</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {timetableList.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-slate-800">{t.className}</td>
                          <td className="py-3 px-4 text-slate-700 font-medium">{t.subject}</td>
                          <td className="py-3 px-4 font-mono text-slate-500">{t.dayOfWeek}</td>
                          <td className="py-3 px-4 font-mono text-slate-700 font-bold bg-indigo-50/30">
                            {t.startTime} - {t.endTime}
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">{t.teacher}</td>
                          <td className="py-3 px-4 text-slate-500">{t.room}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ----------------- SECTION 5: PARENTS ACCOUNTS ----------------- */}
      {activeSection === "parents" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3 flex items-center space-x-2">
              <Users className="h-5 w-5 text-indigo-500" />
              <span>Registered Guardian Connections</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-100">
                    <th className="py-2.5 px-4">Parent Guardian</th>
                    <th className="py-2.5 px-4">Contact Phone</th>
                    <th className="py-2.5 px-4">Linked Child</th>
                    <th className="py-2.5 px-4">User Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {parentsList.map((parent) => (
                    <tr key={parent.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{parent.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{parent.email}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-xs">{parent.phone || "No phone linked"}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{parent.childName || "Linked Student User"}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold rounded">
                          AUTO-PROVISIONED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Automated Parent Invitations Log Card */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg flex items-center space-x-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span>Automated Parent Welcome Dispatch History</span>
              </h3>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-mono font-bold px-2.5 py-1 rounded-lg">
                {invitationsList.length} Dispatched
              </span>
            </div>

            {invitationsList.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No automated parent invitations dispatched yet. Register a new student profile with parent details to trigger welcome dispatches.
              </div>
            ) : (
              <div className="space-y-3">
                {invitationsList.map((inv) => (
                  <div key={inv.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800">{inv.parentName}</span>
                          <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded">
                            Parent of {inv.studentName}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Recipient Email: <span className="font-mono text-slate-600 font-semibold">{inv.parentEmail}</span> | Phone: <span className="font-mono text-slate-600 font-semibold">{inv.parentPhone}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Dispatched At: {new Date(inv.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right hidden sm:block">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px] uppercase tracking-wider block mb-0.5">
                            {inv.status}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">SMTP & SMS Gateway</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setExpandedInvitationId(expandedInvitationId === inv.id ? null : inv.id)}
                          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-2.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer"
                        >
                          {expandedInvitationId === inv.id ? "Hide Notice" : "Inspect Notice"}
                        </button>
                      </div>
                    </div>

                    {expandedInvitationId === inv.id && (
                      <div className="bg-slate-900 text-emerald-400 p-4 rounded-lg border border-slate-800 font-mono text-[11px] whitespace-pre-wrap leading-relaxed animate-fade-in">
                        {inv.message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3 flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-indigo-500" />
              <span>Connect Parent & Account</span>
            </h3>

            {provisionedParentResult && (
              <div className="bg-indigo-900 text-white p-4 rounded-xl border border-indigo-700 space-y-2.5 animate-fade-in text-xs font-mono">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold font-sans">
                  <Check className="h-4 w-4" />
                  <span>PROVISIONING COMPLETED</span>
                </div>
                <p className="text-[11px] text-indigo-200 font-sans leading-relaxed">
                  The Parent and login credentials have been mapped safely:
                </p>
                <div className="bg-indigo-950 p-2.5 rounded border border-indigo-800">
                  <div>Parent Username: {provisionedParentResult.parent?.email}</div>
                  <div className="text-amber-400 font-bold">Temp Password: {provisionedParentResult.tempPassword}</div>
                </div>
                <button 
                  onClick={() => setProvisionedParentResult(null)}
                  className="bg-indigo-800 hover:bg-indigo-950 text-white font-sans text-[11px] py-1 px-3.5 rounded border border-indigo-600 font-bold"
                >
                  Dismiss
                </button>
              </div>
            )}

            <form onSubmit={handleCreateParent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Guardian Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Chief Folayan"
                  value={newParentName}
                  onChange={(e) => setNewParentName(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Primary Email Address</label>
                <input
                  type="email"
                  placeholder="parent@email.com"
                  value={newParentEmail}
                  onChange={(e) => setNewParentEmail(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Mobile Number (SMS Absence alerts)</label>
                <input
                  type="text"
                  placeholder="+234 812 345 6789"
                  value={newParentPhone}
                  onChange={(e) => setNewParentPhone(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Link Student Child</label>
                <select
                  value={newParentChildId}
                  onChange={(e) => setNewParentChildId(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-indigo-500 text-slate-800"
                  required
                >
                  <option value="">-- Choose child --</option>
                  {studentsList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.registrationNumber})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md"
              >
                {loading ? "Registering & Provisioning..." : "Provision Parent User Account"}
              </button>
            </form>
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
