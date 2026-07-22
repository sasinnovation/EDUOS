import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { initGmailAuth, signInWithGmail, sendGmailMessage } from "../utils/gmail";
import { 
  Printer, 
  Download, 
  Check, 
  FileText, 
  X, 
  Award, 
  Calendar, 
  TrendingUp, 
  Sparkles, 
  Settings, 
  Eye, 
  Info, 
  RefreshCw,
  Clock,
  User,
  ShieldAlert,
  ClipboardList,
  Mail
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from "recharts";
import { logActivity } from "../utils/auditLogger";

// Helper to compute stable pure-JS verification hash of a student transcript
export function calculateStudentHash(studentId: string, regNo: string): string {
  const input = `${studentId}_${regNo}_eduos_secure_salt_2026`;
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0, ch; i < input.length; i++) {
    ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hashVal = ((h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0')).toUpperCase();
  return hashVal.substring(0, 16);
}

interface ReportExportModalProps {
  studentId: string;
  token: string;
  onClose: () => void;
}

export default function ReportExportModal({ studentId, token, onClose }: ReportExportModalProps) {
  const [studentData, setStudentData] = useState<any | null>(null);
  const [iframeWarning, setIframeWarning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [documentType, setDocumentType] = useState<"card" | "transcript">("card");

  // Configuration options
  const [reportTitle, setReportTitle] = useState("OFFICIAL ACADEMIC SUMMARY & PERFORMANCE REPORT");
  const [academicTerm, setAcademicTerm] = useState("First Term, 2026/2027 Session");
  const [customRemarks, setCustomRemarks] = useState(
    "The student has completed all scheduled Computer Based Tests (CBTs) for this assessment cycle. Demonstrates remarkable analytical capability and excellent compliance with electronic testing anti-cheat constraints. Approved for progression."
  );
  const [signatoryName, setSignatoryName] = useState("Dr. Charles Kolawole");
  const [signatoryTitle, setSignatoryTitle] = useState("Principal & Director of Admin");

  // Layout toggles
  const [showAttendance, setShowAttendance] = useState(true);
  const [showGPA, setShowGPA] = useState(true);
  const [showStamp, setShowStamp] = useState(true);
  const [showRubric, setShowRubric] = useState(true);
  const [showSignature, setShowSignature] = useState(true);
  const [showVisualGraph, setShowVisualGraph] = useState(true);
  
  // Custom font selection for signature
  const [signatureStyle, setSignatureStyle] = useState("brush"); // "brush" | "serif" | "clean"

  // Gmail integration state
  const [gmailUser, setGmailUser] = useState<any | null>(null);
  const [gmailToken, setGmailToken] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });

  const generateGeminiSummary = async (currentStudentData?: any) => {
    const targetData = currentStudentData || studentData;
    if (!targetData) return;
    
    try {
      setIsGeneratingSummary(true);
      logActivity("SYS_TRIG", `Invoked Gemini AI academic analysis & narrative report summary for student ${targetData.name}.`, "OK", "Gemini AI");
      const res = await fetch("/api/ai/student-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          studentName: targetData.name,
          className: targetData.className,
          attendanceRate: targetData.attendanceRate || 100,
          examAttempts: targetData.examAttempts || []
        })
      });
      const result = await res.json();
      if (res.ok && result.remarks) {
        setCustomRemarks(result.remarks);
      } else {
        console.warn("Failed to generate AI comments, utilizing fallback...");
      }
    } catch (err) {
      console.error("Failed to generate Gemini summary:", err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  useEffect(() => {
    const fetchFullDetails = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await fetch(`/api/students/${studentId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStudentData(data);
          
          // Pre-populate intelligent custom comments based on performance
          let initialRemarks = "";
          if (data.examAttempts && data.examAttempts.length > 0) {
            const avg = data.examAttempts.reduce((sum: number, att: any) => sum + att.percentage, 0) / data.examAttempts.length;
            if (avg >= 80) {
              initialRemarks = `Outstanding academic output! ${data.name} has recorded excellent aggregate CBT scores. Exemplary understanding displayed in all tested modules. Very regular attendance and complete compliance with CBT exam guidelines.`;
            } else if (avg >= 55) {
              initialRemarks = `${data.name} demonstrates a stable understanding of the curriculum. Consistent performance registered across primary CBT modules. Encouraged to study more advanced topic questions to transition into top performance bracket.`;
            } else {
              initialRemarks = `${data.name} requires intensive remedial guidance and closer monitoring. Scores indicate concepts are still being consolidated. Class teacher recommends attending weekend CBT test preparation clinics.`;
            }
          } else {
            initialRemarks = `No assessment data recorded yet for ${data.name}.`;
          }
          setCustomRemarks(initialRemarks);

          // Trigger Gemini-generated summary overlay
          generateGeminiSummary(data);
        } else {
          setErrorMsg("Could not fetch the comprehensive student academic history.");
        }
      } catch (err) {
        setErrorMsg("Network timed out loading dossier details.");
      } finally {
        setLoading(false);
      }
    };

    fetchFullDetails();
  }, [studentId, token]);

  useEffect(() => {
    const unsubscribe = initGmailAuth(
      (user, cachedToken) => {
        setGmailUser(user);
        setGmailToken(cachedToken);
      },
      () => {
        setGmailUser(null);
        setGmailToken(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Compute dynamic stats from attempts
  const examAttempts = studentData?.examAttempts || [];
  const attendanceRate = studentData?.attendanceRate || 100;
  const attemptsCount = examAttempts.length;

  const averagePercentage = attemptsCount > 0 
    ? Math.round(examAttempts.reduce((sum: number, att: any) => sum + att.percentage, 0) / attemptsCount) 
    : 0;

  // Compute Nigerian grading or 5.0 scale GPA based on standard metrics
  const cumulativeGPA = attemptsCount > 0
    ? (examAttempts.reduce((sum: number, att: any) => sum + (Number(att.gradePoint) || 0), 0) / attemptsCount).toFixed(2)
    : "0.00";

  // Trigger Print logic using the robust jsPDF direct-print bypass utility
  const handleTriggerPrint = () => {
    const doc = generatePDFDocument();
    if (!doc) return;

    if (studentData) {
      logActivity("EXPORT", `Generated and printed PDF academic ${documentType === "transcript" ? "transcript" : "report card"} for ${studentData.name} (${studentData.registrationNumber}) using jsPDF direct print engine.`, "SUCCESS", signatoryName);
    }

    try {
      const pdfBlob = doc.output("blob");
      const blobUrl = URL.createObjectURL(pdfBlob);

      let iframe = document.getElementById("pdf-print-iframe") as HTMLIFrameElement;
      if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.id = "pdf-print-iframe";
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "none";
        iframe.style.visibility = "hidden";
        document.body.appendChild(iframe);
      }

      iframe.src = blobUrl;
      iframe.onload = () => {
        setTimeout(() => {
          try {
            if (iframe.contentWindow) {
              iframe.contentWindow.focus();
              iframe.contentWindow.print();
            }
          } catch (e) {
            console.error("Iframe print triggered fallback:", e);
            window.open(blobUrl, "_blank");
          }
        }, 300);
      };
    } catch (err) {
      console.error("Print trigger failed:", err);
      doc.save(`${documentType === "transcript" ? "Transcript" : "ReportCard"}_${studentData.name.replace(/\s+/g, "_")}.pdf`);
    }
  };

  // Generate high-quality custom PDF document using jsPDF
  const generatePDFDocument = (): jsPDF | null => {
    if (!studentData) return null;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // If Transcript, draw an official frame around the whole page!
    if (documentType === "transcript") {
      doc.setDrawColor(79, 70, 229); // Indigo border
      doc.setLineWidth(0.8);
      doc.rect(10, 10, 190, 277, "S");
      
      doc.setDrawColor(199, 210, 254); // Subtle inner border
      doc.setLineWidth(0.2);
      doc.rect(11.5, 11.5, 187, 274, "S");

      // Draw light security watermark
      doc.setTextColor(243, 244, 246);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(26);
      doc.text("OFFICIAL ACADEMIC TRANSCRIPT", 22, 120, { angle: 35 });
      doc.text("EDUOS VERIFIED REGISTRY RECORD", 22, 175, { angle: 35 });
    }

    // Helper: Draw horizontal line
    const drawLine = (y: number, color = [226, 232, 240], thickness = 0.5) => {
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(thickness);
      doc.line(15, y, 195, y);
    };

    // Helper: Draw background cards
    const drawCard = (x: number, y: number, w: number, h: number, fillColor = [248, 250, 252], borderColor = [226, 232, 240]) => {
      doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(0.3);
      doc.rect(x, y, w, h, "FD");
    };

    // 1. Draw premium visual layout indicator stripe
    doc.setFillColor(79, 70, 229); // Indigo theme color
    doc.rect(15, 12, 180, 3, "F");

    // 2. School Institutional Header Block
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text("CBT PRO ACADEMY", 15, 23);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("Educational Operating System (EduOS) SIS Registry", 15, 27);
    doc.text("Lagos-Ibadan Expressway Education Hub Campus Block", 15, 31);

    // Right-aligned header metadata
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(documentType === "transcript" ? "OFFICIAL ACADEMIC TRANSCRIPT" : "OFFICIAL PERFORMANCE REPORT", 195, 23, { align: "right" });

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`ISSUED: ${new Date().toLocaleDateString()}`, 195, 27, { align: "right" });

    // Divider
    drawLine(35, [226, 232, 240], 0.4);

    // 3. Document Subject Header
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(reportTitle.toUpperCase(), 105, 43, { align: "center" });

    doc.setFontSize(9);
    doc.setTextColor(79, 70, 229); // Indigo-600
    doc.text(academicTerm.toUpperCase(), 105, 48, { align: "center" });

    // 4. Student Profile Grid Box
    drawCard(15, 54, 180, 26, [248, 250, 252], [226, 232, 240]);

    // Col 1 details
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("PUPIL FULL NAME", 20, 60);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(studentData.name, 20, 64);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("PRIMARY ASSIGNED CLASS", 20, 71);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(studentData.className || "Unassigned Block", 20, 75);

    // Col 2 details
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("OFFICIAL REGISTRATION INDEX", 110, 60);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(79, 70, 229); // indigo-600
    doc.text(studentData.registrationNumber, 110, 64);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("REGISTRY CONTACT EMAIL", 110, 71);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(studentData.email || "No Email Registered", 110, 75);

    // 5. Core Metrics Cards (y = 85)
    // Card 1: GPA / CGPA
    if (showGPA) {
      drawCard(15, 85, 57, 18, [239, 246, 255], [191, 219, 254]); // Indigo accent
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(37, 99, 235); // blue-600
      doc.text(documentType === "transcript" ? "CUMULATIVE CGPA" : "CUMULATIVE GPA", 43.5, 90, { align: "center" });

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text(cumulativeGPA, 43.5, 96, { align: "center" });

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(59, 130, 246);
      doc.text("Out of 5.0 Rating", 43.5, 100, { align: "center" });
    } else {
      drawCard(15, 85, 57, 18, [248, 250, 252], [226, 232, 240]);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("CUMULATIVE GPA", 43.5, 90, { align: "center" });
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text("Hidden", 43.5, 97, { align: "center" });
    }

    // Card 2: Attendance / Registered Units
    if (documentType === "transcript") {
      drawCard(76.5, 85, 57, 18, [245, 243, 255], [216, 180, 254]); // Purple accent
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(124, 58, 237); // purple-600
      doc.text("TOTAL REGISTERED UNITS", 105, 90, { align: "center" });

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      const regCredits = attemptsCount * 3.0;
      doc.text(`${regCredits.toFixed(1)} CU`, 105, 96, { align: "center" });

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(139, 92, 246);
      doc.text("Registered Courses", 105, 100, { align: "center" });
    } else if (showAttendance) {
      drawCard(76.5, 85, 57, 18, [236, 253, 245], [167, 243, 208]); // Emerald accent
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(5, 150, 105); // emerald-600
      doc.text("ATTENDANCE RATE", 105, 90, { align: "center" });

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text(`${attendanceRate}%`, 105, 96, { align: "center" });

      const attendanceLabel = attendanceRate >= 90 ? "Excellent" : attendanceRate >= 75 ? "Good" : "Probation";
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(16, 185, 129);
      doc.text(attendanceLabel, 105, 100, { align: "center" });
    } else {
      drawCard(76.5, 85, 57, 18, [248, 250, 252], [226, 232, 240]);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("ATTENDANCE RATE", 105, 90, { align: "center" });
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text("Hidden", 105, 97, { align: "center" });
    }

    // Card 3: Earned Credits / Completed CBT Tests
    if (documentType === "transcript") {
      drawCard(138, 85, 57, 18, [240, 253, 250], [153, 246, 228]); // Teal accent
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(13, 148, 136); // teal-600
      doc.text("TOTAL EARNED UNITS", 166.5, 90, { align: "center" });

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      const passedAttempts = examAttempts.filter((a: any) => a.percentage >= 40).length;
      const earnedCredits = passedAttempts * 3.0;
      doc.text(`${earnedCredits.toFixed(1)} CU`, 166.5, 96, { align: "center" });

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(20, 184, 166);
      doc.text("Successfully Passed", 166.5, 100, { align: "center" });
    } else {
      drawCard(138, 85, 57, 18, [248, 250, 252], [226, 232, 240]);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("COMPLETED CBT TESTS", 166.5, 90, { align: "center" });

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text(attemptsCount.toString(), 166.5, 96, { align: "center" });

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text("Assessed Sessions", 166.5, 100, { align: "center" });
    }

    // 6. CBT Assessment Breakdown Section
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(documentType === "transcript" ? "ACADEMIC TRANSCRIPT RECOGNIZED COURSEWORK" : "COMPUTER BASED TESTING (CBT) ASSESSMENT BREAKDOWN", 15, 110);

    // Table Header Rect
    doc.setFillColor(79, 70, 229);
    doc.rect(15, 113, 180, 8, "F");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    
    if (documentType === "transcript") {
      doc.text("Course Title / Module Division", 18, 118);
      doc.text("Course Code", 85, 118);
      doc.text("Credits", 125, 118, { align: "center" });
      doc.text("Grade Point", 155, 118, { align: "center" });
      doc.text("Letter Grade", 185, 118, { align: "center" });
    } else {
      doc.text("Exam Title", 18, 118);
      doc.text("Date Submitted", 85, 118);
      doc.text("Score %", 125, 118, { align: "center" });
      doc.text("Grade Point", 155, 118, { align: "center" });
      doc.text("Status", 185, 118, { align: "center" });
    }

    let currentY = 121;
    const rowHeight = 7.5;

    if (examAttempts.length > 0) {
      examAttempts.forEach((att: any, index: number) => {
        // Draw alternating background
        if (index % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, currentY, 180, rowHeight, "F");
        }
        // Row bottom border
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.2);
        doc.line(15, currentY + rowHeight, 195, currentY + rowHeight);

        // Values
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        
        if (documentType === "transcript") {
          doc.text(att.examTitle || "CBT Academic Module", 18, currentY + 5);

          doc.setFont("Helvetica", "normal");
          doc.setTextColor(100, 116, 139);
          // Generate a custom simulated course code
          const prefix = (att.examTitle || "GEN").slice(0, 3).toUpperCase();
          const codeNum = 100 + (index * 5);
          doc.text(`${prefix}-${codeNum}`, 85, currentY + 5);

          doc.setFont("Helvetica", "bold");
          doc.setTextColor(15, 23, 42);
          doc.text("3.0", 125, currentY + 5, { align: "center" });
          doc.text(att.gradePoint || "0.00", 155, currentY + 5, { align: "center" });

          // Calculate Letter Grade
          let letterGrade = "F";
          const score = att.percentage || 0;
          if (score >= 70) letterGrade = "A";
          else if (score >= 60) letterGrade = "B";
          else if (score >= 50) letterGrade = "C";
          else if (score >= 45) letterGrade = "D";
          else if (score >= 40) letterGrade = "E";

          if (score >= 40) {
            doc.setTextColor(16, 185, 129); // Green
          } else {
            doc.setTextColor(244, 63, 94); // Red
          }
          doc.text(letterGrade, 185, currentY + 5, { align: "center" });
        } else {
          doc.text(att.examTitle || "CBT Exam Session", 18, currentY + 5);

          doc.setFont("Helvetica", "normal");
          doc.setTextColor(100, 116, 139);
          doc.text(new Date(att.submitTime).toLocaleDateString(), 85, currentY + 5);

          doc.setFont("Helvetica", "bold");
          doc.setTextColor(15, 23, 42);
          doc.text(`${att.percentage}%`, 125, currentY + 5, { align: "center" });
          doc.text(att.gradePoint || "0.00", 155, currentY + 5, { align: "center" });

          if (att.status === "PASS") {
            doc.setTextColor(16, 185, 129);
            doc.text("PASS", 185, currentY + 5, { align: "center" });
          } else {
            doc.setTextColor(244, 63, 94);
            doc.text("FAIL", 185, currentY + 5, { align: "center" });
          }
        }

        currentY += rowHeight;
      });
    } else {
      // Empty placeholder row
      doc.setDrawColor(241, 245, 249);
      doc.line(15, currentY + 12, 195, currentY + 12);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("No assessment attempts logged for this student registry.", 105, currentY + 7, { align: "center" });
      currentY += 12;
    }

    currentY += 5;

    // 7. Remarks & Behavioral Domain Section (Only if report card, if transcript we can replace with Accreditation Details and secure lookup)
    if (documentType === "transcript") {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(79, 70, 229);
      doc.text("REGISTRAR ACCREDITATION & ACADEMIC STANDING", 15, currentY);
      doc.text("SECURE REGISTRY VERIFICATION PROTOCOL", 120, currentY);

      currentY += 2.5;

      // Draw Left Card
      drawCard(15, currentY, 100, 34, [250, 250, 250], [226, 232, 240]);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text("ACCREDITATION STATUS: National Board for Technical Education (NBTE)", 18, currentY + 6);
      doc.text("ACADEMIC STANDING: Good Academic Standing (CGPA > 2.0)", 18, currentY + 12);
      doc.text("MEDIUM OF INSTRUCTION: English Language (Certified)", 18, currentY + 18);
      doc.text("REGISTRATION PERIOD: September 2026 - Present", 18, currentY + 24);
      doc.text("TRANSCRIPT STATUS: OFFICIAL VERIFIED COPY", 18, currentY + 30);

      // Draw Right Card
      drawCard(120, currentY, 75, 34, [255, 255, 255], [226, 232, 240]);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("ONLINE REGISTRY NODES:", 125, currentY + 6);
      doc.setFont("Helvetica", "normal");
      doc.text("To securely verify the authenticity of this student transcript:", 125, currentY + 11);
      doc.setFont("Courier", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(79, 70, 229);
      doc.text("registry.cbtpro.edu.os/verify", 125, currentY + 16);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("Registry Verification Hash:", 125, currentY + 22);
      doc.setFont("Courier", "bold");
      const hash = calculateStudentHash(studentData.id, studentData.registrationNumber);
      doc.text(hash, 125, currentY + 27);

      currentY += 39;
    } else {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(79, 70, 229);
      doc.text("TEACHER / PRINCIPAL EXECUTIVE EVALUATION", 15, currentY);
      doc.text("AFFECTIVE & PSYCHOMOTOR EVALUATION", 120, currentY);

      currentY += 2.5;

      const leftWidth = 100;
      const rightWidth = 75;
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      const splitRemarks = doc.splitTextToSize(`"${customRemarks}"`, leftWidth - 10);
      
      const remarksHeight = Math.max(34, splitRemarks.length * 4.5 + 4);

      drawCard(15, currentY, leftWidth, remarksHeight, [250, 250, 250], [226, 232, 240]);
      
      splitRemarks.forEach((line: string, i: number) => {
        doc.text(line, 20, currentY + 5 + (i * 4.5));
      });

      drawCard(120, currentY, rightWidth, remarksHeight, [255, 255, 255], [226, 232, 240]);

      const behaviorData = studentData?.behavior || {
        punctuality: 5, neatness: 5, honesty: 4, peer_relationship: 4,
        attentiveness: 5, handiwork: 3, sports: 5
      };

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);

      doc.text("Punctuality:", 125, currentY + 6);
      doc.text(`${behaviorData.punctuality || 5} / 5`, 185, currentY + 6, { align: "right" });

      doc.text("Neatness / Grooming:", 125, currentY + 10);
      doc.text(`${behaviorData.neatness || 5} / 5`, 185, currentY + 10, { align: "right" });

      doc.text("Honesty & Integrity:", 125, currentY + 14);
      doc.text(`${behaviorData.honesty || 4} / 5`, 185, currentY + 14, { align: "right" });

      doc.text("Peer Group Relations:", 125, currentY + 18);
      doc.text(`${behaviorData.peer_relationship || 4} / 5`, 185, currentY + 18, { align: "right" });

      doc.text("Class Attentiveness:", 125, currentY + 22);
      doc.text(`${behaviorData.attentiveness || 5} / 5`, 185, currentY + 22, { align: "right" });

      doc.text("Handiwork / Creativity:", 125, currentY + 26);
      doc.text(`${behaviorData.handiwork || 3} / 5`, 185, currentY + 26, { align: "right" });

      doc.text("Sportsmanship / Agility:", 125, currentY + 30);
      doc.text(`${behaviorData.sports || 5} / 5`, 185, currentY + 30, { align: "right" });

      currentY += remarksHeight + 5;
    }

    // 8. Nigerian Grading Rubric Block
    if (showRubric) {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("CBT PRO ACADEMY REGISTRY SIS GRADING GUIDELINES", 15, currentY);

      currentY += 2;
      drawCard(15, currentY, 180, 8, [248, 250, 252], [241, 245, 249]);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text("A (5.0 GP) : 70% - 100%", 18, currentY + 5);
      doc.text("B (4.0 GP) : 60% - 69%", 54, currentY + 5);
      doc.text("C (3.0 GP) : 50% - 59%", 90, currentY + 5);
      doc.text("D (2.0 GP) : 45% - 49%", 126, currentY + 5);
      doc.text("E (1.0 GP) : 40% - 44%", 156, currentY + 5);
      doc.text("F (0.0 GP) : 0% - 39%", 178, currentY + 5);

      currentY += 12;
    }

    // Force bottom details (page is 297mm height, printable bottom at ~250mm)
    const signatureY = Math.max(248, currentY);

    // Rule line
    drawLine(signatureY, [226, 232, 240], 0.3);

    // Stamp circle (left side)
    if (showStamp) {
      doc.setDrawColor(79, 70, 229);
      doc.setLineWidth(0.4);
      doc.circle(28, signatureY + 12, 8, "S");
      doc.setLineWidth(0.15);
      doc.circle(28, signatureY + 12, 7.1, "S");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(5);
      doc.setTextColor(79, 70, 229);
      doc.text("CBT PRO", 28, signatureY + 10, { align: "center" });
      doc.setFontSize(3.5);
      doc.text(documentType === "transcript" ? "REGISTRAR SEAL" : "OFFICIAL STAMP", 28, signatureY + 13, { align: "center" });
    }

    // Centered footnote
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Computer Generated Assessment Record - Certified Decent Security Measures Passed.", 105, signatureY + 10, { align: "center" });
    doc.text("Verified through CBT PRO X EduOS Registry Service Node.", 105, signatureY + 13, { align: "center" });

    // Authority Signatures (right side)
    if (showSignature) {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);

      if (signatureStyle === "brush" || signatureStyle === "serif") {
        doc.setFont("Times", "BoldItalic");
        doc.setTextColor(79, 70, 229);
        doc.text(signatoryName, 170, signatureY + 8, { align: "center" });
      } else {
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        doc.text(signatoryName, 170, signatureY + 8, { align: "center" });
      }

      // Underline style
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.2);
      doc.line(150, signatureY + 11, 190, signatureY + 11);

      // Label details
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(signatoryName, 170, signatureY + 15, { align: "center" });

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(documentType === "transcript" ? "OFFICIAL REGISTRAR" : signatoryTitle.toUpperCase(), 170, signatureY + 18, { align: "center" });
    }

    return doc;
  };

  const handleExportPDF = () => {
    const doc = generatePDFDocument();
    if (!doc) return;
    logActivity("EXPORT", `Generated and downloaded PDF academic ${documentType === "transcript" ? "transcript" : "report card"} for ${studentData.name} (${studentData.registrationNumber}) using jsPDF.`, "SUCCESS", signatoryName);
    doc.save(`${documentType === "transcript" ? "Transcript" : "ReportCard"}_${studentData.name.replace(/\s+/g, "_")}.pdf`);
  };

  // Export CSV Report Action
  const handleExportCSV = () => {
    if (!studentData) return;
    logActivity("EXPORT", `Exported CSV assessment spreadsheet for student ${studentData.name}.`, "SUCCESS", signatoryName);
    const headers = ["Exam Title", "Submit Date", "Score Percentage", "Grade Point", "Status"];
    const rows = examAttempts.map((att: any) => [
      att.examTitle,
      new Date(att.submitTime).toLocaleDateString(),
      `${att.percentage}%`,
      att.gradePoint,
      att.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [
          [`STUDENT ACADEMIC REPORT CARD - ${studentData.name}`],
          [`Reg Number: ${studentData.registrationNumber} | Class: ${studentData.className || "N/A"}`],
          [],
          headers.join(","),
          ...rows.map(e => e.map(val => `"${val}"`).join(","))
        ].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ReportCard_${studentData.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON Report Action
  const handleExportJSON = () => {
    if (!studentData) return;
    logActivity("EXPORT", `Exported complete JSON academic dossier for student ${studentData.name}.`, "SUCCESS", signatoryName);
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify({
        school: "CBT PRO EDUOS SYSTEM",
        reportTitle,
        academicTerm,
        student: {
          id: studentData.id,
          name: studentData.name,
          registrationNumber: studentData.registrationNumber,
          email: studentData.email,
          className: studentData.className,
          attendanceRate: studentData.attendanceRate,
          attendanceHistory: studentData.attendanceHistory
        },
        academicPerformance: {
          averagePercentage: `${averagePercentage}%`,
          cumulativeGPA,
          totalExamsDone: attemptsCount,
          attempts: examAttempts
        },
        evaluationRemarks: customRemarks,
        certifiedBy: `${signatoryName} (${signatoryTitle})`,
        exportedAt: new Date().toISOString()
      }, null, 2)
    )}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `Dossier_${studentData.name.replace(/\s+/g, "_")}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dispatch Academic Report via Gmail API
  const handleEmailReport = async () => {
    if (!studentData) return;
    
    let activeToken = gmailToken;
    let activeUser = gmailUser;

    // Trigger OAuth if not connected
    if (!activeToken) {
      try {
        setEmailStatus({ type: null, message: "Connecting to Google Workspace node..." });
        const authRes = await signInWithGmail();
        if (authRes) {
          activeToken = authRes.accessToken;
          activeUser = authRes.user;
          setGmailUser(authRes.user);
          setGmailToken(authRes.accessToken);
          setEmailStatus({ type: null, message: "" });
        } else {
          setEmailStatus({ type: "error", message: "Gmail connection was cancelled." });
          return;
        }
      } catch (err: any) {
        console.error("Gmail Connection Cancelled:", err);
        setEmailStatus({ type: "error", message: "Gmail connection was cancelled or failed." });
        return;
      }
    }

    const targetEmail = studentData.email || prompt("Enter recipient email address:", "");
    if (!targetEmail) {
      setEmailStatus({ type: "error", message: "No recipient email address provided." });
      return;
    }

    const confirmed = window.confirm(`Confirm action: Email academic report for ${studentData.name} directly to "${targetEmail}" using your authorized Gmail account (${activeUser?.email || "SSO Mode"})?`);
    if (!confirmed) return;

    try {
      setSendingEmail(true);
      setEmailStatus({ type: null, message: "" });

      // Build an elegant HTML email report card
      const emailSubject = `Official Academic Performance Dossier - ${studentData.name} (${academicTerm})`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
          <div style="background-color: #4f46e5; height: 4px; border-radius: 4px 4px 0 0;"></div>
          <h2 style="color: #1e293b; margin-top: 15px; margin-bottom: 5px;">CBT PRO ACADEMY</h2>
          <p style="color: #64748b; font-size: 12px; margin-top: 0; margin-bottom: 20px;">Educational Operating System (EduOS) SIS Registry</p>
          
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <h3 style="color: #4f46e5; margin-top: 0; font-size: 14px; text-transform: uppercase;">Official Academic Report Card</h3>
            <table style="width: 100%; font-size: 13px; color: #334155;">
              <tr>
                <td style="padding: 4px 0; font-weight: bold; color: #64748b;">PUPIL FULL NAME:</td>
                <td style="padding: 4px 0; font-weight: bold; text-align: right; color: #1e293b;">${studentData.name}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: bold; color: #64748b;">REGISTRATION INDEX:</td>
                <td style="padding: 4px 0; font-weight: bold; text-align: right; color: #4f46e5;">${studentData.registrationNumber}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: bold; color: #64748b;">ASSIGNED CLASS:</td>
                <td style="padding: 4px 0; text-align: right;">${studentData.className || "Unassigned"}</td>
              </tr>
              ${showGPA ? `
              <tr>
                <td style="padding: 4px 0; font-weight: bold; color: #64748b;">CUMULATIVE GPA:</td>
                <td style="padding: 4px 0; font-weight: bold; text-align: right; color: #1e293b;">${cumulativeGPA} / 5.0</td>
              </tr>
              ` : ''}
              ${showAttendance ? `
              <tr>
                <td style="padding: 4px 0; font-weight: bold; color: #64748b;">ATTENDANCE RATE:</td>
                <td style="padding: 4px 0; font-weight: bold; text-align: right; color: #10b981;">${attendanceRate}%</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 4px 0; font-weight: bold; color: #64748b;">COMPLETED CBT TESTS:</td>
                <td style="padding: 4px 0; text-align: right;">${attemptsCount}</td>
              </tr>
            </table>
          </div>

          <h4 style="color: #64748b; font-size: 12px; margin-bottom: 8px; text-transform: uppercase;">Assessment Summary Matrix</h4>
          <table style="width: 100%; font-size: 12px; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #4f46e5; color: #ffffff;">
                <th style="padding: 6px 10px; text-align: left;">Exam Title</th>
                <th style="padding: 6px 10px; text-align: center;">Score</th>
                <th style="padding: 6px 10px; text-align: center;">Grade Point</th>
                <th style="padding: 6px 10px; text-align: right;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${examAttempts.map((att: any, idx: number) => `
                <tr style="border-bottom: 1px solid #f1f5f9; background-color: ${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
                  <td style="padding: 6px 10px; font-weight: bold; color: #334155;">${att.examTitle || "CBT Exam"}</td>
                  <td style="padding: 6px 10px; text-align: center; font-weight: bold;">${att.percentage}%</td>
                  <td style="padding: 6px 10px; text-align: center;">${att.gradePoint || "0.0"}</td>
                  <td style="padding: 6px 10px; text-align: right; font-weight: bold; color: ${att.status === "PASS" ? '#10b981' : '#f43f5e'};">${att.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 20px;">
            <h4 style="color: #4f46e5; margin-top: 0; font-size: 11px; text-transform: uppercase; margin-bottom: 6px;">Evaluation Remarks</h4>
            <p style="font-style: italic; font-size: 12px; color: #334155; margin: 0;">"${customRemarks}"</p>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: right; font-size: 11px; color: #64748b;">
            <p style="margin: 0; font-weight: bold; color: #1e293b;">${signatoryName}</p>
            <p style="margin: 0;">${signatoryTitle.toUpperCase()}</p>
          </div>
          
          <div style="text-align: center; margin-top: 25px; border-top: 1px dashed #cbd5e1; padding-top: 15px; font-size: 10px; color: #94a3b8;">
            <p style="margin: 2px 0;">This email is sent on behalf of CBT PRO Academy using a verified Gmail API connection.</p>
            <p style="margin: 2px 0;">Computer Generated Record Node — Certified Decent Security Measures Passed.</p>
          </div>
        </div>
      `;

      await sendGmailMessage(activeToken, targetEmail, emailSubject, emailHtml);
      setEmailStatus({ type: "success", message: `Report card successfully delivered to ${targetEmail}!` });
      logActivity("EXPORT", `Emailed student performance dossier for ${studentData.name} directly to ${targetEmail} using Gmail Node.`, "SUCCESS", signatoryName);
    } catch (err: any) {
      console.error("Email report failure:", err);
      setEmailStatus({ type: "error", message: err.message || "Failed to deliver email. Check connection or recipient syntax." });
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
      
      {/* Print styles injected dynamically */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-report-card, #printable-report-card * {
            visibility: visible !important;
          }
          #printable-report-card {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 35px !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-hidden-element {
            display: none !important;
          }
        }
      `}} />

      <div className="bg-slate-900 border border-slate-700/60 rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl relative animate-fade-in text-white">
        
        {/* Modal Top Bar header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600/20 p-2 rounded-xl text-indigo-400">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-tight text-slate-100">Academic summary Report Center</h2>
              <p className="text-[11px] text-slate-400 font-mono">STU_DOSSIER: {studentId} | Professional printable exports</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="h-10 w-10 text-indigo-400 animate-spin" />
            <p className="text-slate-400 text-xs font-mono">Dossier engine compiling academic indices...</p>
          </div>
        ) : errorMsg ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-8 text-center">
            <ShieldAlert className="h-12 w-12 text-rose-500" />
            <p className="text-sm font-bold text-slate-200">{errorMsg}</p>
            <button 
              onClick={onClose}
              className="bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-slate-700 transition-colors"
            >
              Return back
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            
            {/* LEFT WORKBENCH: Options panel (Scrollable) */}
            <div className="w-full lg:w-[35%] bg-slate-900 border-r border-slate-800 overflow-y-auto p-5 space-y-5 print-hidden-element">
              
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="font-bold text-xs text-indigo-400 uppercase tracking-widest flex items-center space-x-2">
                  <Settings className="h-3.5 w-3.5" />
                  <span>Document Type & Variables</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Document Template</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDocumentType("card");
                          setReportTitle("OFFICIAL ACADEMIC SUMMARY & PERFORMANCE REPORT");
                        }}
                        className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition-all ${
                          documentType === "card"
                            ? "bg-indigo-600 border-indigo-500 text-white"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Academic Card
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDocumentType("transcript");
                          setReportTitle("OFFICIAL STUDENT ACADEMIC TRANSCRIPT");
                        }}
                        className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition-all ${
                          documentType === "transcript"
                            ? "bg-indigo-600 border-indigo-500 text-white"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Official Transcript
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Document Title</label>
                    <input 
                      type="text" 
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Academic Session Term</label>
                    <input 
                      type="text" 
                      value={academicTerm}
                      onChange={(e) => setAcademicTerm(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Teacher / Admin Assessment Remarks</label>
                      <button
                        onClick={() => generateGeminiSummary()}
                        disabled={isGeneratingSummary || !studentData}
                        className="flex items-center space-x-1 text-[9px] font-bold text-indigo-400 hover:text-indigo-300 disabled:text-slate-500 transition-colors cursor-pointer bg-transparent border-none outline-none py-0.5 px-1 font-sans"
                        title="Rewrite comment using Gemini AI Analysis"
                      >
                        <Sparkles className={`h-3 w-3 ${isGeneratingSummary ? 'animate-spin text-indigo-400' : 'text-indigo-400'}`} />
                        <span>{isGeneratingSummary ? 'Analyzing...' : 'AI Rewrite'}</span>
                      </button>
                    </div>
                    <textarea 
                      rows={4}
                      value={customRemarks}
                      onChange={(e) => setCustomRemarks(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-slate-300 focus:outline-none focus:border-indigo-500 leading-relaxed text-xs font-sans"
                      placeholder="Enter official teacher comments..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Signatory Name</label>
                      <input 
                        type="text" 
                        value={signatoryName}
                        onChange={(e) => setSignatoryName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Title Role</label>
                      <input 
                        type="text" 
                        value={signatoryTitle}
                        onChange={(e) => setSignatoryTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Toggles Card */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                <h3 className="font-bold text-xs text-indigo-400 uppercase tracking-widest flex items-center space-x-2 pb-1 border-b border-slate-800">
                  <Eye className="h-3.5 w-3.5" />
                  <span>Document Layout Toggles</span>
                </h3>

                <div className="space-y-2.5">
                  <label className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-slate-900/50">
                    <span className="text-slate-300 font-medium">Show CBT Attendance Statistics</span>
                    <input 
                      type="checkbox" 
                      checked={showAttendance}
                      onChange={(e) => setShowAttendance(e.target.checked)}
                      className="accent-indigo-500 rounded" 
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-slate-900/50">
                    <span className="text-slate-300 font-medium">Calculate Cumulative GPA (5.0 Scale)</span>
                    <input 
                      type="checkbox" 
                      checked={showGPA}
                      onChange={(e) => setShowGPA(e.target.checked)}
                      className="accent-indigo-500 rounded" 
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-slate-900/50">
                    <span className="text-slate-300 font-medium">Render Performance Score Chart</span>
                    <input 
                      type="checkbox" 
                      checked={showVisualGraph}
                      onChange={(e) => setShowVisualGraph(e.target.checked)}
                      className="accent-indigo-500 rounded" 
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-slate-900/50">
                    <span className="text-slate-300 font-medium">Append Nigerian CBT Grading Rubric</span>
                    <input 
                      type="checkbox" 
                      checked={showRubric}
                      onChange={(e) => setShowRubric(e.target.checked)}
                      className="accent-indigo-500 rounded" 
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-slate-900/50">
                    <span className="text-slate-300 font-medium">Include Circular Stamp Of Authenticity</span>
                    <input 
                      type="checkbox" 
                      checked={showStamp}
                      onChange={(e) => setShowStamp(e.target.checked)}
                      className="accent-indigo-500 rounded" 
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-slate-900/50">
                    <span className="text-slate-300 font-medium">Render Signature Placeholders</span>
                    <input 
                      type="checkbox" 
                      checked={showSignature}
                      onChange={(e) => setShowSignature(e.target.checked)}
                      className="accent-indigo-500 rounded" 
                    />
                  </label>

                  {showSignature && (
                    <div className="pl-4 pt-1 space-y-1 bg-slate-900 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Signature Font Style</span>
                      <div className="grid grid-cols-3 gap-1">
                        {["brush", "serif", "clean"].map((style) => (
                          <button
                            key={style}
                            onClick={() => setSignatureStyle(style)}
                            className={`px-1.5 py-1 rounded text-[10px] font-bold capitalize border ${
                              signatureStyle === style 
                                ? "bg-indigo-600 border-indigo-500 text-white" 
                                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Workbench */}
              <div className="space-y-2 pt-2 text-xs font-bold">
                {iframeWarning && (
                  <div className="bg-amber-500/15 border border-amber-500/30 p-2.5 rounded-lg text-amber-500 text-[10px] leading-relaxed font-sans font-medium mb-1">
                    ⚠️ Browser printing is blocked inside the AI Studio preview frame due to security sandbox constraints. Please use the <strong>"Download PDF"</strong> button below instead, or open the app in a new tab using the top-right button to use browser print directly!
                  </div>
                )}
                <button
                  onClick={handleTriggerPrint}
                  className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl transition-all shadow-lg active:scale-[0.98] cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Document via Browser</span>
                </button>

                <button
                  onClick={handleExportPDF}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white py-2.5 rounded-xl transition-all shadow-lg active:scale-[0.98] cursor-pointer"
                >
                  <FileText className="h-4 w-4" />
                  <span>Download PDF (jsPDF)</span>
                </button>

                <button
                  onClick={handleEmailReport}
                  disabled={sendingEmail}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-xl transition-all shadow-lg active:scale-[0.98] cursor-pointer"
                >
                  {sendingEmail ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  <span>{sendingEmail ? "Transmitting Report..." : "Email Report via Gmail"}</span>
                </button>

                {emailStatus.message && (
                  <div className={`p-3 rounded-lg text-[11px] font-medium leading-relaxed ${
                    emailStatus.type === "success" 
                      ? "bg-slate-900 text-emerald-400 border border-emerald-950" 
                      : "bg-slate-900 text-rose-400 border border-rose-950"
                  }`}>
                    {emailStatus.message}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 py-2 rounded-lg transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 py-2 rounded-lg transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-400" />
                    <span>Download JSON</span>
                  </button>
                </div>
              </div>

            </div>

            {/* RIGHT PREVIEW SCREEN: Styled Physical Report (Scrollable) */}
            <div className="flex-1 bg-slate-950 overflow-y-auto p-6 md:p-10 flex items-start justify-center">
              
              {/* Target Printable Report Card Box */}
              <div 
                id="printable-report-card" 
                className="bg-white text-slate-800 p-8 rounded-2xl w-full max-w-[800px] shadow-xl border-4 border-slate-200 min-h-[1050px] relative font-sans flex flex-col justify-between"
              >
                
                {/* Visual Premium Certificate Header Border Decoration */}
                <div className="absolute top-0 left-0 right-0 h-2.5 bg-indigo-900 rounded-t-xl" />

                <div className="space-y-6 flex-1">
                  
                  {/* Institutional Header Block */}
                  <div className="flex justify-between items-center border-b-2 border-indigo-900/20 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-indigo-900">
                        <Award className="h-8 w-8 text-indigo-800 stroke-2" />
                        <span className="text-xl font-black tracking-tight font-sans">CBT PRO ACADEMY</span>
                      </div>
                      <p className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">
                        Educational Operating System (EduOS) SIS Registry
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Lagos-Ibadan Expressway Education Hub Campus Block
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1 rounded font-mono text-[10px] font-bold inline-block">
                        OFFICIAL TRANSCRIPT
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">ISSUED: {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Document Subject Header */}
                  <div className="text-center space-y-1">
                    <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug">
                      {reportTitle}
                    </h1>
                    <p className="text-xs text-indigo-700 font-mono font-bold tracking-wider uppercase">
                      {academicTerm}
                    </p>
                  </div>

                  {/* Student Profile Metadata Section */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">Pupil Full Name</span>
                        <span className="text-sm font-bold text-slate-800">{studentData.name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">Primary Assigned Class</span>
                        <span className="font-semibold text-slate-700">{studentData.className || "Unassigned Block"}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">Official Registration Index</span>
                        <span className="text-sm font-mono font-black text-indigo-900">{studentData.registrationNumber}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">Registry Contact Email</span>
                        <span className="font-mono text-slate-600">{studentData.email || "No Email Registered"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Core Metrics Bento Row */}
                  <div className="grid grid-cols-3 gap-3">
                    
                    {/* GPA Metric Card */}
                    {showGPA && (
                      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/40 border border-indigo-100/70 p-3.5 rounded-xl text-center">
                        <span className="text-[9px] text-indigo-600 block font-extrabold uppercase tracking-widest mb-0.5">
                          Cumulative Grade GPA
                        </span>
                        <div className="text-2xl font-black text-indigo-900 font-mono">
                          {cumulativeGPA}
                        </div>
                        <span className="text-[9px] text-indigo-500 font-semibold uppercase tracking-wider block mt-0.5">
                          Out of 5.0 Rating
                        </span>
                      </div>
                    )}

                    {/* Attendance Metric Card */}
                    {showAttendance && (
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/40 border border-emerald-100/70 p-3.5 rounded-xl text-center">
                        <span className="text-[9px] text-emerald-600 block font-extrabold uppercase tracking-widest mb-0.5">
                          Attendance Statistics
                        </span>
                        <div className="text-2xl font-black text-emerald-900 font-mono">
                          {attendanceRate}%
                        </div>
                        <span className="text-[9px] text-emerald-500 font-semibold uppercase tracking-wider block mt-0.5">
                          {attendanceRate >= 90 ? "Excellent" : attendanceRate >= 75 ? "Good" : "Probation"}
                        </span>
                      </div>
                    )}

                    {/* Exams Attempted Metric Card */}
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/50 p-3.5 rounded-xl text-center">
                      <span className="text-[9px] text-slate-500 block font-extrabold uppercase tracking-widest mb-0.5">
                        Completed CBT Tests
                      </span>
                      <div className="text-2xl font-black text-slate-800 font-mono">
                        {attemptsCount}
                      </div>
                      <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider block mt-0.5">
                        Assessed Sessions
                      </span>
                    </div>

                  </div>

                  {/* Visual Chart Section */}
                  {showVisualGraph && attemptsCount > 0 && (
                    <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2 font-mono">
                        Performance Progress Graph (% Score Bar Chart)
                      </span>
                      <div className="h-32 w-full text-slate-800">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={examAttempts.map((att: any) => ({
                              name: att.examTitle.split(" ")[0] || "Exam",
                              fullName: att.examTitle,
                              percentage: att.percentage,
                              status: att.status
                            }))} 
                            margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="name" 
                              tick={{ fontSize: 8, fill: '#64748b', fontWeight: 'bold' }} 
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis 
                              domain={[0, 100]} 
                              tick={{ fontSize: 8, fill: '#64748b' }} 
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-slate-950 text-white p-2 rounded-lg text-[9px] font-sans shadow-md border border-slate-800 leading-snug">
                                      <p className="font-bold">{data.fullName}</p>
                                      <p className="font-mono mt-0.5">Score: {data.percentage}% ({data.status})</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="percentage" radius={[4, 4, 0, 0]} barSize={24}>
                              {examAttempts.map((att: any, idx: number) => (
                                <Cell 
                                  key={`cell-${idx}`} 
                                  fill={att.status === "PASS" ? "#4f46e5" : "#f43f5e"} 
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Exam Sessions Table */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                      Computer Based Testing (CBT) assessment breakdown
                    </span>
                    <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-[11px] border-collapse bg-white">
                        <thead>
                          <tr className="bg-indigo-900/5 text-indigo-950 font-bold border-b border-indigo-900/10">
                            <th className="py-2.5 px-4 font-extrabold uppercase tracking-wider">Exam Title</th>
                            <th className="py-2.5 px-4 font-extrabold uppercase tracking-wider font-mono">Date</th>
                            <th className="py-2.5 px-4 font-extrabold uppercase tracking-wider font-mono text-center">Score %</th>
                            <th className="py-2.5 px-4 font-extrabold uppercase tracking-wider text-center">Grade Point</th>
                            <th className="py-2.5 px-4 font-extrabold uppercase tracking-wider text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {examAttempts.length > 0 ? (
                            examAttempts.map((att: any) => (
                              <tr key={att.id} className="hover:bg-slate-50/30">
                                <td className="py-2.5 px-4 font-bold text-slate-800">{att.examTitle}</td>
                                <td className="py-2.5 px-4 font-mono text-slate-500">{new Date(att.submitTime).toLocaleDateString()}</td>
                                <td className="py-2.5 px-4 font-mono text-center font-bold">{att.percentage}%</td>
                                <td className="py-2.5 px-4 font-mono text-center font-bold text-indigo-900">{att.gradePoint}</td>
                                <td className="py-2.5 px-4 text-right">
                                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider ${
                                    att.status === "PASS" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
                                  }`}>
                                    {att.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="text-center py-6 text-slate-400 font-mono">
                                No assessment attempts logged for this student registry.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Grid Layout for Remarks and Behavior */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-3 bg-slate-50/80 border border-dashed border-slate-200 p-4 rounded-xl space-y-1">
                      <span className="text-[10px] font-extrabold text-indigo-900/80 uppercase tracking-widest block">
                        Teacher / Principal Executive Evaluation Remarks
                      </span>
                      <p className="text-xs text-slate-700 italic leading-relaxed whitespace-pre-line font-sans">
                        "{customRemarks}"
                      </p>
                    </div>

                    <div className="md:col-span-2 bg-slate-50/80 border border-slate-200 p-4 rounded-xl space-y-3">
                      <span className="text-[10px] font-extrabold text-indigo-900/80 uppercase tracking-widest block border-b border-slate-200/50 pb-1">
                        Affective & Psychomotor Domains
                      </span>
                      {(() => {
                        const behavior = studentData?.behavior || {
                          punctuality: 5, neatness: 5, honesty: 4, peer_relationship: 4,
                          attentiveness: 5, handiwork: 3, sports: 5
                        };
                        const traits = [
                          { name: "Punctuality", val: behavior.punctuality },
                          { name: "Neatness & Grooming", val: behavior.neatness },
                          { name: "Honesty & Integrity", val: behavior.honesty },
                          { name: "Peer Group Relations", val: behavior.peer_relationship },
                          { name: "Class Attentiveness", val: behavior.attentiveness },
                          { name: "Handiwork & Creativity", val: behavior.handiwork },
                          { name: "Sportsmanship & Agility", val: behavior.sports },
                        ];
                        return (
                          <div className="space-y-1.5">
                            {traits.map((t) => (
                              <div key={t.name} className="flex justify-between items-center text-[11px] font-mono">
                                <span className="text-slate-600 font-sans">{t.name}</span>
                                <div className="flex items-center gap-1">
                                  <div className="flex text-amber-500 text-[10px]">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <span key={i} className={i < (t.val || 5) ? "opacity-100" : "opacity-20"}>★</span>
                                    ))}
                                  </div>
                                  <span className="text-slate-900 font-bold ml-1">{(t.val || 5)}/5</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Nigerian Secondary School Grading Rubric Grid */}
                  {showRubric && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[9px] text-slate-500">
                      <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">CBT PRO SIS Grading Guidelines:</span>
                      <div className="grid grid-cols-6 gap-1 text-center font-mono">
                        <div className="border border-slate-200/50 p-1 bg-white"><strong>A (5.0 GP)</strong><br />70% - 100%</div>
                        <div className="border border-slate-200/50 p-1 bg-white"><strong>B (4.0 GP)</strong><br />60% - 69%</div>
                        <div className="border border-slate-200/50 p-1 bg-white"><strong>C (3.0 GP)</strong><br />50% - 59%</div>
                        <div className="border border-slate-200/50 p-1 bg-white"><strong>D (2.0 GP)</strong><br />45% - 49%</div>
                        <div className="border border-slate-200/50 p-1 bg-white"><strong>E (1.0 GP)</strong><br />40% - 44%</div>
                        <div className="border border-slate-200/50 p-1 bg-white"><strong>F (0.0 GP)</strong><br />0% - 39%</div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Footer Section with Stamp and Signatures */}
                <div className="border-t-2 border-indigo-900/10 pt-4 flex justify-between items-end mt-4">
                  
                  {/* Circular Gold/Indigo Stamp Area */}
                  <div className="min-w-[120px]">
                    {showStamp && (
                      <div className="w-16 h-16 border-4 border-indigo-800/20 rounded-full flex flex-col items-center justify-center text-center font-mono relative select-none">
                        <div className="absolute inset-0.5 border border-dashed border-indigo-800/40 rounded-full flex flex-col items-center justify-center">
                          <span className="text-[7px] text-indigo-900 font-extrabold uppercase leading-none tracking-widest">CBT PRO</span>
                          <span className="text-[5px] text-indigo-500 mt-0.5">OFFICIAL</span>
                          <span className="text-[6px] text-indigo-900 font-black tracking-wide leading-none">STAMP</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* System Footnote */}
                  <div className="text-center text-[8px] text-slate-400 font-mono">
                    <p>Computer Generated Assessment Record - Certified Decent Security Measures Passed.</p>
                    <p>Verified through CBT PRO X EduOS Registry Service Node.</p>
                  </div>

                  {/* Authority Signature Area */}
                  <div className="min-w-[180px] text-right space-y-1">
                    {showSignature && (
                      <div className="text-center">
                        <div className="h-9 relative flex items-center justify-center">
                          {/* Beautiful cursive mock signatures based on font choices */}
                          {signatureStyle === "brush" && (
                            <span className="font-serif text-slate-800 font-bold italic tracking-wider text-base drop-shadow-sm opacity-90 select-none">
                              {signatoryName}
                            </span>
                          )}
                          {signatureStyle === "serif" && (
                            <span className="font-serif font-black text-indigo-950 italic tracking-tight text-sm select-none">
                              {signatoryName}
                            </span>
                          )}
                          {signatureStyle === "clean" && (
                            <span className="font-sans font-medium text-slate-700 tracking-wide border-b border-indigo-900/30 pb-0.5 text-xs select-none">
                              {signatoryName}
                            </span>
                          )}
                        </div>
                        <div className="w-full border-t border-slate-300 my-0.5" />
                        <p className="text-[10px] font-extrabold text-slate-800 tracking-tight block capitalize">{signatoryName}</p>
                        <p className="text-[8px] text-slate-400 font-semibold tracking-wide uppercase leading-none mt-0.5">{signatoryTitle}</p>
                      </div>
                    )}
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
