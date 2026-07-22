import React, { useState, useEffect } from "react";
import { 
  Users, 
  School, 
  Award, 
  CreditCard, 
  FileText, 
  Sparkles, 
  Plus, 
  Search, 
  Check, 
  X, 
  Activity, 
  Home, 
  Bus, 
  ShoppingBag, 
  DollarSign, 
  Sliders, 
  Eye, 
  Printer, 
  Loader2,
  Trash2,
  UserCheck,
  Smartphone,
  Calendar,
  Send,
  Clock,
  BookOpen,
  Wifi,
  AlertTriangle
} from "lucide-react";
import { motion } from "motion/react";

interface EdvesERPModuleProps {
  token: string;
}

export default function EdvesERPModule({ token }: EdvesERPModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<"behavior" | "hostel" | "transport" | "inventory" | "payroll" | "newglobe" | "flexisaf">("behavior");
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  
  // Edves Collections State
  const [behaviors, setBehaviors] = useState<Record<string, any>>({});
  const [hostels, setHostels] = useState<any[]>([]);
  const [transportRoutes, setTransportRoutes] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);

  // NewGlobe Platform State
  const [newglobeGuides, setNewglobeGuides] = useState<any[]>([]);
  const [newglobeSync, setNewglobeSync] = useState<any[]>([]);
  const [newglobeAudits, setNewglobeAudits] = useState<any[]>([]);
  const [newglobeAttendance, setNewglobeAttendance] = useState<any[]>([]);
  
  // FlexiSAF Platform State
  const [flexisafGradebook, setFlexisafGradebook] = useState<any[]>([]);
  const [flexisafBills, setFlexisafBills] = useState<any[]>([]);
  const [flexisafReviews, setFlexisafReviews] = useState<any[]>([]);
  const [flexisafTimetable, setFlexisafTimetable] = useState<any[]>([]);

  // Selected details for assignment forms
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [assignHostelId, setAssignHostelId] = useState<string>("");
  const [assignRoomNum, setAssignRoomNum] = useState<string>("1");
  const [assignBedLetter, setAssignBedLetter] = useState<string>("A");
  
  const [assignRouteId, setAssignRouteId] = useState<string>("");

  // Search & Active selection state for Hostels & Transport
  const [hostelSearchQuery, setHostelSearchQuery] = useState("");
  const [selectedHostelCardId, setSelectedHostelCardId] = useState<string | null>(null);
  const [transportSearchQuery, setTransportSearchQuery] = useState("");
  const [selectedTransportCardId, setSelectedTransportCardId] = useState<string | null>(null);
  
  const [shopStudentId, setShopStudentId] = useState<string>("");
  const [shopItemId, setShopItemId] = useState<string>("");
  const [shopQty, setShopQty] = useState<number>(1);
  
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);
  const [aiGeneratingComment, setAiGeneratingComment] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState("");

  // NewGlobe interactive guide states
  const [ngSelectedGuideId, setNgSelectedGuideId] = useState<string>("ng-g-1");
  const [ngActiveStepIndex, setNgActiveStepIndex] = useState<number>(0);
  const [ngSecondsLeft, setNgSecondsLeft] = useState<number>(300);
  const [ngTimerRunning, setNgTimerRunning] = useState<boolean>(false);
  const [ngSelectedClassForAttendance, setNgSelectedClassForAttendance] = useState<string>("SS3 Science");
  const [ngSelectedClassForSync, setNgSelectedClassForSync] = useState<string>("cs-1");
  const [ngNotificationLog, setNgNotificationLog] = useState<string[]>([]);
  
  // NewGlobe audit form states
  const [ngAuditAuditor, setNgAuditAuditor] = useState<string>("Supervisor Adejoke");
  const [ngAuditClass, setNgAuditClass] = useState<string>("SS3 Science");
  const [ngAuditResult, setNgAuditResult] = useState<"ON-PACE" | "AHEAD" | "BEHIND">("ON-PACE");
  const [ngAuditRemarks, setNgAuditRemarks] = useState<string>("");

  // FlexiSAF Gradebook states
  const [fsGradeClass, setFsGradeClass] = useState<string>("SS3 Science");
  const [fsGradeSubject, setFsGradeSubject] = useState<string>("Mathematics");
  
  // FlexiSAF Billing / Receipt states
  const [fsRecordPayStudentId, setFsRecordPayStudentId] = useState<string>("");
  const [fsRecordPayAmount, setFsRecordPayAmount] = useState<string>("");
  const [fsReceipt, setFsReceipt] = useState<any | null>(null);
  const [fsSmsLogs, setFsSmsLogs] = useState<string[]>([]);
  
  // FlexiSAF Lesson Review state
  const [fsSelectedReviewId, setFsSelectedReviewId] = useState<string>("");
  const [fsReviewFeedbackText, setFsReviewFeedbackText] = useState<string>("");

  // FlexiSAF Timetable scheduler states
  const [fsScheduleDay, setFsScheduleDay] = useState<string>("Monday");
  const [fsScheduleTime, setFsScheduleTime] = useState<string>("08:00 - 09:00");
  const [fsScheduleSubject, setFsScheduleSubject] = useState<string>("Mathematics");
  const [fsScheduleTeacher, setFsScheduleTeacher] = useState<string>("Mrs. Florence Adebayo");
  const [fsScheduleRoom, setFsScheduleRoom] = useState<string>("Room A");
  const [fsScheduleWarning, setFsScheduleWarning] = useState<string | null>(null);

  // Load baseline students, classes, and Edves collections
  useEffect(() => {
    fetchBaselineData();
    fetchEdvesData();
  }, []);

  const fetchBaselineData = async () => {
    try {
      const resStudents = await fetch("/api/students", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (resStudents.ok) {
        const data = await resStudents.json();
        setStudents(data);
        if (data.length > 0) {
          setSelectedStudentId(data[0].id);
          setFsRecordPayStudentId(data[0].id);
        }
      }
      
      const resClasses = await fetch("/api/classes", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (resClasses.ok) {
        const data = await resClasses.json();
        setClasses(data);
      }
    } catch (err) {
      console.error("Failed to load baseline metadata:", err);
    }
  };

  const fetchEdvesData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/edves/data", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBehaviors(data.behaviors || {});
        setHostels(data.hostels || []);
        setTransportRoutes(data.transportRoutes || []);
        setInventory(data.inventory || []);
        setSales(data.sales || []);
        setStaff(data.staff || []);
        setPayslips(data.payslips || []);
        
        // Populate NewGlobe & FlexiSAF fields
        setNewglobeGuides(data.newglobeTeacherGuides || []);
        setNewglobeSync(data.newglobeClassroomSync || []);
        setNewglobeAudits(data.newglobeAudits || []);
        setNewglobeAttendance(data.newglobePupilAttendance || []);
        setFlexisafGradebook(data.flexisafGradebook || []);
        setFlexisafBills(data.flexisafBills || []);
        setFlexisafReviews(data.flexisafLessonReviews || []);
        setFlexisafTimetable(data.flexisafTimetable || []);
      }
    } catch (err) {
      console.error("Failed to fetch Edves collections:", err);
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => {
      setActionSuccessMessage("");
    }, 4000);
  };

  // 1. Behavioral Assessment Actions
  const handleSaveBehavior = async (studentId: string, ratings: any) => {
    try {
      const res = await fetch("/api/edves/behavior", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ studentId, ratings })
      });
      if (res.ok) {
        const updated = await res.json();
        setBehaviors(prev => ({
          ...prev,
          [studentId]: updated
        }));
        showFeedback("Behavioral ratings and psychomotor metrics saved successfully!");
      }
    } catch (err) {
      console.error("Failed to save behavioral data:", err);
    }
  };

  const handleSuggestAIComment = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    setAiGeneratingComment(true);
    try {
      // Gather ratings
      const r = behaviors[studentId] || {
        punctuality: 5, neatness: 5, honesty: 4, peer_relationship: 4, 
        attentiveness: 5, handiwork: 3, sports: 5
      };

      const promptData = {
        studentName: student.name,
        className: student.className || "SS3 Science",
        ratings: r
      };

      const res = await fetch("/api/ai/behavior-comment-assist", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(promptData)
      });
      
      if (res.ok) {
        const data = await res.json();
        setBehaviors(prev => ({
          ...prev,
          [studentId]: {
            ...(prev[studentId] || r),
            remarks: data.remarks
          }
        }));
        showFeedback("AI comment generated based on ratings!");
      } else {
        // High fidelity fallback
        const comment = `${student.name} is a highly dedicated student. They maintain excellent marks in punctuality (${r.punctuality}/5) and personal neatness (${r.neatness}/5). They display strong peer relations (${r.peer_relationship}/5) and solid classroom attentiveness (${r.attentiveness}/5). Solid work ethic overall; highly recommended for future leadership roles in the class.`;
        setBehaviors(prev => ({
          ...prev,
          [studentId]: {
            ...(prev[studentId] || r),
            remarks: comment
          }
        }));
        showFeedback("AI backup remark applied successfully!");
      }
    } catch (err) {
      console.error("AI Generation failed, using static formula:", err);
    } finally {
      setAiGeneratingComment(false);
    }
  };

  const updateStudentRatingLocal = (studentId: string, field: string, val: number) => {
    const current = behaviors[studentId] || {
      punctuality: 4, neatness: 4, honesty: 4, peer_relationship: 4, 
      attentiveness: 4, handiwork: 4, sports: 4
    };
    
    setBehaviors(prev => ({
      ...prev,
      [studentId]: {
        ...current,
        [field]: val
      }
    }));
  };

  // 2. Hostel Allocation
  const handleAssignHostel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !assignHostelId) return;

    try {
      const res = await fetch("/api/edves/hostels/assign", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: selectedStudentId,
          hostelId: assignHostelId,
          room: parseInt(assignRoomNum, 10),
          bed: assignBedLetter
        })
      });
      if (res.ok) {
        const data = await res.json();
        setHostels(data.hostels);
        showFeedback(`Student assigned to dormitory bed successfully!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Transport Assign
  const handleAssignTransport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !assignRouteId) return;

    try {
      const res = await fetch("/api/edves/transport/assign", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: selectedStudentId,
          routeId: assignRouteId
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTransportRoutes(data.transportRoutes);
        showFeedback("Student registered to school bus route!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Uniform & Book Store Purchase
  const handlePurchaseItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopStudentId || !shopItemId || shopQty <= 0) return;

    try {
      const res = await fetch("/api/edves/inventory/purchase", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: shopStudentId,
          itemId: shopItemId,
          quantity: shopQty
        })
      });
      if (res.ok) {
        const data = await res.json();
        setInventory(data.inventory);
        setSales(data.sales);
        showFeedback("Purchase complete! Uniform shop receipt generated.");
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to make purchase");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Staff Payroll
  const handleRunPayroll = async () => {
    const confirmRun = window.confirm("Are you sure you want to run the staff payroll for the current month? This will issue official printable payslips for all registered teachers.");
    if (!confirmRun) return;

    try {
      const res = await fetch("/api/edves/payroll/run", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPayslips(data.payslips);
        showFeedback("Payroll ran successfully! Individual payslips are now available.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrintPayslip = (payslip: any) => {
    setSelectedPayslip(payslip);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // ====================================================
  // NEWGLOBE EVENT HANDLERS
  // ====================================================
  
  // 1. Digital Tablet Timer Tick and Page Sync
  useEffect(() => {
    let interval: any = null;
    if (ngTimerRunning && ngSecondsLeft > 0) {
      interval = setInterval(() => {
        setNgSecondsLeft((prev) => {
          if (prev <= 1) {
            setNgTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [ngTimerRunning, ngSecondsLeft]);

  const handleStartNgTimer = () => {
    setNgTimerRunning(true);
  };

  const handlePauseNgTimer = () => {
    setNgTimerRunning(false);
  };

  const handleResetNgTimer = () => {
    setNgTimerRunning(false);
    setNgSecondsLeft(300); // 5 minutes
  };

  const handleNgProgressStep = async (newIdx: number) => {
    const guide = newglobeGuides.find(g => g.id === ngSelectedGuideId);
    if (!guide) return;
    if (newIdx < 0 || newIdx >= guide.scriptSteps.length) return;

    setNgActiveStepIndex(newIdx);
    setNgSecondsLeft(300); // reset timer to 5m for new step

    // Sync progress to teacher classroom CS-1 or CS-2
    try {
      const res = await fetch("/api/newglobe/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          classroomId: ngSelectedClassForSync,
          stepIndex: newIdx,
          elapsedMinutes: Math.round((newIdx + 1) * 5) // Mock elapsed minutes
        })
      });
      if (res.ok) {
        const data = await res.json();
        setNewglobeSync(data);
        showFeedback("Tablet synchronized with Central Leaderboard in real-time!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Submit Classroom Audit
  const handleNgSubmitAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeGuide = newglobeGuides.find(g => g.id === ngSelectedGuideId);
    const teacherName = ngSelectedClassForSync === "cs-1" ? "Mrs. Florence Adebayo" : "Mr. Nelson Chidi";
    try {
      const res = await fetch("/api/newglobe/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          auditor: ngAuditAuditor,
          className: ngAuditClass,
          teacherName,
          result: ngAuditResult,
          auditedGuide: activeGuide?.topic || "Complex Roots Study",
          remarks: ngAuditRemarks || `Audit completed. Teacher found ${ngAuditResult.toLowerCase()}.`
        })
      });
      if (res.ok) {
        const data = await res.json();
        setNewglobeAudits(data);
        setNgAuditRemarks("");
        showFeedback("Supervisor digital audit submitted and synced successfully!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Sync Pupil Attendance (Roll Call)
  const handleNgAttendanceChange = async (studentId: string, status: "Present" | "Absent") => {
    try {
      const res = await fetch("/api/newglobe/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ studentId, status })
      });
      if (res.ok) {
        const data = await res.json();
        setNewglobeAttendance(data);
        
        // Log Parent SMS Simulation
        const stud = students.find(s => s.id === studentId);
        if (stud) {
          const smsText = `[EduOS SMS Hub] Notification sent to Parent of ${stud.name}: Child was marked ${status.toUpperCase()} during real-time morning digital roll-call on ${new Date().toLocaleDateString()}.`;
          setNgNotificationLog(prev => [smsText, ...prev]);
        }
        showFeedback("Attendance roll-call saved and synchronized!");
      }
    } catch (err) {
      console.error(err);
    }
  };


  // ====================================================
  // FLEXISAF EVENT HANDLERS
  // ====================================================

  // 1. Save Student Gradebook Marks
  const handleFsSaveGrades = async (studentId: string, subject: string, ca1: number, ca2: number, exam: number) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    try {
      const res = await fetch("/api/flexisaf/gradebook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId,
          studentName: student.name,
          subject,
          ca1,
          ca2,
          exam
        })
      });
      if (res.ok) {
        const data = await res.json();
        setFlexisafGradebook(data);
        showFeedback(`Grades updated for ${student.name} in ${subject}!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Record Tuition Fee Payment
  const handleFsRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fsRecordPayStudentId || !fsRecordPayAmount) return;

    const amt = Number(fsRecordPayAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid positive payment amount.");
      return;
    }

    try {
      const res = await fetch("/api/flexisaf/fee-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: fsRecordPayStudentId,
          amountPaid: amt
        })
      });
      if (res.ok) {
        const data = await res.json();
        setFlexisafBills(data);
        
        // Generate printable receipt
        const stud = students.find(s => s.id === fsRecordPayStudentId);
        const bill = data.find((b: any) => b.studentId === fsRecordPayStudentId);
        
        setFsReceipt({
          receiptNo: `SAF-REC-${Date.now().toString().slice(-6)}`,
          studentName: stud?.name || "Student",
          amount: amt,
          date: new Date().toLocaleDateString(),
          balanceRemaining: bill?.balance || 0,
          status: bill?.status || "PARTIAL"
        });
        
        setFsRecordPayAmount("");
        showFeedback(`Tuition payment of ₦${amt.toLocaleString()} captured. Receipt generated!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send SMS Fee Reminder
  const handleFsSendReminder = (studentId: string) => {
    const stud = students.find(s => s.id === studentId);
    const bill = flexisafBills.find(b => b.studentId === studentId);
    if (!stud || !bill) return;

    const msg = `[SAFSMS SMS Engine] Payment reminder dispatched to Parent of ${stud.name}. Outstanding balance: ₦${bill.balance.toLocaleString()} for the current academic session.`;
    setFsSmsLogs(prev => [msg, ...prev]);
    showFeedback(`Automated payment warning sent to ${stud.name}'s parent!`);
  };

  // 3. VP Lesson Note Review Submission
  const handleFsSubmitReview = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch("/api/flexisaf/lesson-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          id,
          status,
          feedback: fsReviewFeedbackText || `Lesson Note has been ${status.toLowerCase()} for delivery.`
        })
      });
      if (res.ok) {
        const data = await res.json();
        setFlexisafReviews(data);
        setFsSelectedReviewId("");
        setFsReviewFeedbackText("");
        showFeedback(`Lesson Plan review processed successfully: ${status}!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Timetable Scheduling Matrix
  const handleFsAddTimetableSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setFsScheduleWarning(null);

    // Clash Detection!
    // Check if classroom is occupied at that day and time
    const daySchedule = flexisafTimetable.find(t => t.day === fsScheduleDay);
    if (daySchedule) {
      const classroomClash = daySchedule.slots.find(
        (s: any) => s.time === fsScheduleTime && s.room === fsScheduleRoom
      );
      if (classroomClash) {
        setFsScheduleWarning(`⚠️ SCHEDULING CONFLICT: ${fsScheduleRoom} is already booked for ${classroomClash.subject} taught by ${classroomClash.teacher} at ${fsScheduleTime} on ${fsScheduleDay}.`);
        return;
      }

      // Check if teacher is busy elsewhere at that day and time
      const teacherClash = daySchedule.slots.find(
        (s: any) => s.time === fsScheduleTime && s.teacher === fsScheduleTeacher
      );
      if (teacherClash) {
        setFsScheduleWarning(`⚠️ SCHEDULING CONFLICT: ${fsScheduleTeacher} is already scheduled to teach ${teacherClash.subject} in ${teacherClash.room} at ${fsScheduleTime} on ${fsScheduleDay}.`);
        return;
      }
    }

    // No conflicts! Proceed to save
    const currentSlots = daySchedule ? [...daySchedule.slots] : [];
    const updatedSlots = [
      ...currentSlots,
      {
        time: fsScheduleTime,
        subject: fsScheduleSubject,
        teacher: fsScheduleTeacher,
        room: fsScheduleRoom
      }
    ];

    try {
      const res = await fetch("/api/flexisaf/timetable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          day: fsScheduleDay,
          slots: updatedSlots
        })
      });
      if (res.ok) {
        const data = await res.json();
        setFlexisafTimetable(data);
        showFeedback("Timetable updated successfully! No conflict detected.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="edves-erp-suite">
      {/* Title Header with Sparkle Badge */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 p-6 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <School className="h-6 w-6 text-indigo-200" />
            <h2 className="text-xl font-bold tracking-tight">CBT Pro X EduOS Unified Core ERP Suite</h2>
          </div>
          <p className="text-xs text-indigo-100/90 mt-1 font-sans">
            Managing school operations, student behaviors, dormitory beds, transport networks, inventory sales, and teacher payroll ledger natively in CBT Pro X EduOS.
          </p>
        </div>
        <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/20 flex items-center space-x-2 self-start md:self-auto">
          <Sparkles className="h-4 w-4 text-amber-300 animate-spin" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-amber-200">ERP Monolith Node v4.0</span>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50/50 scrollbar-none">
        <button
          onClick={() => setActiveSubTab("behavior")}
          className={`flex items-center space-x-2 px-5 py-3.5 text-xs font-bold tracking-wider uppercase border-b-2 whitespace-nowrap transition-all ${
            activeSubTab === "behavior"
              ? "border-indigo-600 text-indigo-700 bg-white"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Behavior & Affective Grading</span>
        </button>
        <button
          onClick={() => setActiveSubTab("hostel")}
          className={`flex items-center space-x-2 px-5 py-3.5 text-xs font-bold tracking-wider uppercase border-b-2 whitespace-nowrap transition-all ${
            activeSubTab === "hostel"
              ? "border-indigo-600 text-indigo-700 bg-white"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Home className="h-4 w-4" />
          <span>Hostels & Boarding</span>
        </button>
        <button
          onClick={() => setActiveSubTab("transport")}
          className={`flex items-center space-x-2 px-5 py-3.5 text-xs font-bold tracking-wider uppercase border-b-2 whitespace-nowrap transition-all ${
            activeSubTab === "transport"
              ? "border-indigo-600 text-indigo-700 bg-white"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Bus className="h-4 w-4" />
          <span>School Bus Routing</span>
        </button>
        <button
          onClick={() => setActiveSubTab("inventory")}
          className={`flex items-center space-x-2 px-5 py-3.5 text-xs font-bold tracking-wider uppercase border-b-2 whitespace-nowrap transition-all ${
            activeSubTab === "inventory"
              ? "border-indigo-600 text-indigo-700 bg-white"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Uniform & Book Shop</span>
        </button>
        <button
          onClick={() => setActiveSubTab("payroll")}
          className={`flex items-center space-x-2 px-5 py-3.5 text-xs font-bold tracking-wider uppercase border-b-2 whitespace-nowrap transition-all ${
            activeSubTab === "payroll"
              ? "border-indigo-600 text-indigo-700 bg-white"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <DollarSign className="h-4 w-4" />
          <span>Staff Payroll Ledger</span>
        </button>
        <button
          onClick={() => setActiveSubTab("newglobe")}
          className={`flex items-center space-x-2 px-5 py-3.5 text-xs font-bold tracking-wider uppercase border-b-2 whitespace-nowrap transition-all ${
            activeSubTab === "newglobe"
              ? "border-indigo-600 text-indigo-700 bg-white"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Smartphone className="h-4 w-4 text-indigo-600 animate-pulse" />
          <span>Teacher Lesson Delivery (Tablet Sync)</span>
        </button>
        <button
          onClick={() => setActiveSubTab("flexisaf")}
          className={`flex items-center space-x-2 px-5 py-3.5 text-xs font-bold tracking-wider uppercase border-b-2 whitespace-nowrap transition-all ${
            activeSubTab === "flexisaf"
              ? "border-indigo-600 text-indigo-700 bg-white"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sliders className="h-4 w-4 text-violet-600" />
          <span>Academic Administration & Gradebook</span>
        </button>
      </div>

      {/* Main Panel Content Area */}
      <div className="p-6">
        {/* Success Alert Banner */}
        {actionSuccessMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 flex items-center space-x-2"
          >
            <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <span className="text-xs font-medium font-sans">{actionSuccessMessage}</span>
          </motion.div>
        )}

        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading ERP suite modules, please wait...</p>
          </div>
        ) : (
          <>
            {/* SUBTAB 1: BEHAVIORAL ASSESSMENT */}
            {activeSubTab === "behavior" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Students List Box */}
                <div className="lg:col-span-1 border border-slate-200 rounded-xl overflow-hidden flex flex-col max-h-[500px]">
                  <div className="bg-slate-50 p-3 border-b border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Class Roster Select</span>
                  </div>
                  <div className="divide-y divide-slate-100 overflow-y-auto">
                    {students.map((st) => {
                      const isSelected = selectedStudentId === st.id;
                      const customRating = behaviors[st.id];
                      return (
                        <button
                          key={st.id}
                          onClick={() => setSelectedStudentId(st.id)}
                          className={`w-full text-left p-3 flex items-center justify-between transition-colors ${
                            isSelected ? "bg-indigo-50/50" : "hover:bg-slate-50"
                          }`}
                        >
                          <div>
                            <div className={`text-xs font-bold ${isSelected ? "text-indigo-700" : "text-slate-800"}`}>
                              {st.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {st.registrationNumber} • {st.className || "Class SS3"}
                            </div>
                          </div>
                          {customRating ? (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded uppercase font-mono tracking-wide">
                              Graded
                            </span>
                          ) : (
                            <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded uppercase font-mono tracking-wide">
                              Pending
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rating Worksheet */}
                <div className="lg:col-span-2 border border-slate-200 rounded-xl p-6 bg-white space-y-6">
                  {selectedStudentId ? (
                    (() => {
                      const st = students.find(s => s.id === selectedStudentId);
                      const currentRatings = behaviors[selectedStudentId] || {
                        punctuality: 4, neatness: 4, honesty: 4, peer_relationship: 4, 
                        attentiveness: 4, handiwork: 4, sports: 4, remarks: ""
                      };
                      
                      const fields = [
                        { name: "punctuality", label: "Punctuality & Class Arrival" },
                        { name: "neatness", label: "Personal Uniform Neatness" },
                        { name: "honesty", label: "Honesty & Trustworthiness" },
                        { name: "peer_relationship", label: "Relationship with Peers" },
                        { name: "attentiveness", label: "Classroom Attentiveness" },
                        { name: "handiwork", label: "Handiwork & Manual Dexterity" },
                        { name: "sports", label: "Sportsmanship & Physical Activity" }
                      ];

                      return (
                        <>
                          <div className="border-b border-slate-100 pb-4">
                            <h3 className="text-sm font-bold text-slate-800">
                              Affective & Psychomotor Assessment worksheet
                            </h3>
                            <p className="text-xs text-slate-500 font-sans mt-1">
                              Rate <strong className="text-indigo-600">{st?.name}</strong> ({st?.registrationNumber}) on five-star indicators below. These are stored on their official academic profile sheet.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {fields.map((f) => {
                              const ratingVal = currentRatings[f.name] || 4;
                              return (
                                <div key={f.name} className="flex flex-col space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                  <span className="text-xs font-semibold text-slate-700">{f.label}</span>
                                  <div className="flex space-x-1.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        type="button"
                                        onClick={() => updateStudentRatingLocal(selectedStudentId, f.name, star)}
                                        className="focus:outline-none transition-transform active:scale-125"
                                      >
                                        <Award 
                                          className={`h-5 w-5 ${
                                            star <= ratingVal 
                                              ? "text-amber-400 fill-amber-400" 
                                              : "text-slate-300"
                                          }`} 
                                        />
                                      </button>
                                    ))}
                                    <span className="text-xs font-bold text-slate-500 ml-2 font-mono">{ratingVal}/5</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Evaluation Remark Area */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700">Teacher’s ERP Evaluation Remark</span>
                              <button
                                type="button"
                                onClick={() => handleSuggestAIComment(selectedStudentId)}
                                disabled={aiGeneratingComment}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                              >
                                {aiGeneratingComment ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />
                                    <span>AI Writing...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-3 w-3 text-indigo-600" />
                                    <span>AI Suggest Comments</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <textarea
                              rows={3}
                              className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-sans"
                              placeholder="Type student behavior, progress, and behavioral profile remarks here..."
                              value={currentRatings.remarks || ""}
                              onChange={(e) => {
                                setBehaviors(prev => ({
                                  ...prev,
                                  [selectedStudentId]: {
                                    ...currentRatings,
                                    remarks: e.target.value
                                  }
                                }));
                              }}
                            />
                          </div>

                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={() => handleSaveBehavior(selectedStudentId, currentRatings)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center space-x-2 shadow-sm transition-all shadow-indigo-100"
                            >
                              <Check className="h-4 w-4" />
                              <span>Commit Behavioral Ratings</span>
                            </button>
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      Select a student on the left class roster to begin affective grading.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUBTAB 2: HOSTELS & ACCOMMODATION */}
            {activeSubTab === "hostel" && (
              <div className="space-y-6">
                {/* Search Bar for Quick Locate */}
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                  <div className="space-y-1 text-left w-full md:w-auto">
                    <h4 className="text-xs font-bold text-indigo-900 uppercase font-mono">Dormitory Student Search Registry</h4>
                    <p className="text-[11px] text-indigo-600">Type student's name to instantly trace their accommodation hostel wing, block, and room number.</p>
                  </div>
                  <div className="relative w-full md:w-96">
                    <input
                      type="text"
                      placeholder="🔍 Search student name to locate wing..."
                      value={hostelSearchQuery}
                      onChange={(e) => setHostelSearchQuery(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 font-medium"
                    />
                    {hostelSearchQuery && (
                      <button 
                        type="button"
                        onClick={() => setHostelSearchQuery("")}
                        className="absolute right-3 top-2.5 text-[10px] bg-slate-100 text-slate-500 hover:bg-slate-200 px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Instant Search Results Panel if searching */}
                {hostelSearchQuery.trim() !== "" && (
                  <div className="bg-white border-2 border-indigo-500/20 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
                      <span>Instant Wing Search Traces ({
                        hostels.flatMap(h => h.allocatedStudents.map(alloc => ({ ...alloc, hostelName: h.name, wing: h.gender }))).filter(alloc => {
                          const name = students.find(s => s.id === alloc.studentId)?.name || "";
                          return name.toLowerCase().includes(hostelSearchQuery.toLowerCase());
                        }).length
                      } Found)</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {hostels.flatMap(h => h.allocatedStudents.map(alloc => ({ ...alloc, hostelName: h.name, wing: h.gender }))).filter(alloc => {
                        const name = students.find(s => s.id === alloc.studentId)?.name || "";
                        return name.toLowerCase().includes(hostelSearchQuery.toLowerCase());
                      }).map((alloc, idx) => {
                        const student = students.find(s => s.id === alloc.studentId);
                        return (
                          <div key={idx} className="bg-indigo-50/30 border border-indigo-100/50 rounded-xl p-3 flex justify-between items-center">
                            <div>
                              <strong className="text-xs text-slate-800 block">{student?.name || "Student"}</strong>
                              <span className="text-[10px] text-slate-400 block font-medium">{student?.className || "Class Room"}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full block uppercase font-mono tracking-wider mb-1 text-center">
                                {alloc.hostelName} ({alloc.wing} Wing)
                              </span>
                              <span className="text-[10px] text-slate-500 font-bold block font-mono font-bold">Room {alloc.room} • Bed {alloc.bed}</span>
                            </div>
                          </div>
                        );
                      })}
                      {hostels.flatMap(h => h.allocatedStudents.map(alloc => ({ ...alloc, hostelName: h.name, wing: h.gender }))).filter(alloc => {
                        const name = students.find(s => s.id === alloc.studentId)?.name || "";
                        return name.toLowerCase().includes(hostelSearchQuery.toLowerCase());
                      }).length === 0 && (
                        <div className="col-span-2 text-center py-4 text-slate-400 text-xs italic">
                          No resident student matches found for "{hostelSearchQuery}".
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                    💡 Click on any hostel card to inspect the wing's complete detailed roster:
                  </span>
                </div>

                {/* Hostels Bed Capacity Overview Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {hostels.map((hostel) => {
                    const capacityPct = Math.round((hostel.allocatedStudents.length / hostel.capacity) * 100);
                    const isSelected = selectedHostelCardId === hostel.id;
                    return (
                      <div 
                        key={hostel.id} 
                        onClick={() => setSelectedHostelCardId(isSelected ? null : hostel.id)}
                        className={`border rounded-2xl p-5 bg-gradient-to-b from-white to-slate-50/30 cursor-pointer transition-all ${
                          isSelected ? "border-indigo-600 ring-2 ring-indigo-500/20 shadow-md bg-indigo-50/10" : "border-slate-200 hover:border-indigo-300"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                              {hostel.gender} Wing
                            </span>
                            <h3 className="text-sm font-bold text-slate-800 mt-2">{hostel.name}</h3>
                            <p className="text-xs text-slate-400 mt-0.5 font-mono">Warden: {hostel.warden}</p>
                          </div>
                          <Home className={`h-8 w-8 transition-colors ${isSelected ? "text-indigo-600" : "text-indigo-200"}`} />
                        </div>

                        {/* Bed occupancy bar */}
                        <div className="mt-4 space-y-1">
                          <div className="flex justify-between text-xs font-mono text-slate-500">
                            <span>Occupancy</span>
                            <span className="font-bold">{hostel.allocatedStudents.length} / {hostel.capacity} Beds</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                capacityPct > 85 ? "bg-rose-500" : capacityPct > 50 ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(100, capacityPct)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Roster list */}
                        <div className="mt-4 space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Current Roster Summary</span>
                          {hostel.allocatedStudents.length > 0 ? (
                            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                              {hostel.allocatedStudents.map((alloc: any) => {
                                const stInfo = students.find(s => s.id === alloc.studentId);
                                return (
                                  <div key={alloc.studentId} className="flex items-center justify-between text-[10px] bg-white border border-slate-100 px-2 py-1 rounded">
                                    <span className="font-semibold text-slate-700">{stInfo?.name || "Student"}</span>
                                    <span className="font-mono text-indigo-500 font-bold">Room {alloc.room} • Bed {alloc.bed}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic block py-2">No students assigned to this hall.</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Display Selected Wing detailed breakdown */}
                {selectedHostelCardId && (() => {
                  const selectedHostel = hostels.find(h => h.id === selectedHostelCardId);
                  if (!selectedHostel) return null;
                  return (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div className="text-left">
                          <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">
                            Detailed Occupants Directory: {selectedHostel.name} ({selectedHostel.gender} Wing)
                          </h3>
                          <span className="text-[11px] text-slate-400">Total resident students currently checked in: {selectedHostel.allocatedStudents.length}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setSelectedHostelCardId(null)}
                          className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 px-2.5 py-1 rounded-lg cursor-pointer"
                        >
                          Close Detail
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
                        {selectedHostel.allocatedStudents.map((alloc: any) => {
                          const student = students.find(s => s.id === alloc.studentId);
                          return (
                            <div key={alloc.studentId} className="border border-slate-100 bg-slate-50/50 p-3 rounded-xl flex justify-between items-center">
                              <div>
                                <span className="text-xs font-bold text-slate-800 block">{student?.name || "Student"}</span>
                                <span className="text-[10px] text-slate-400 block font-mono">{student?.className || "Unassigned Class"}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[11px] font-extrabold text-indigo-600 block font-mono">Room {alloc.room}</span>
                                <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider font-mono">Bed {alloc.bed}</span>
                              </div>
                            </div>
                          );
                        })}
                        {selectedHostel.allocatedStudents.length === 0 && (
                          <div className="col-span-3 text-center py-6 text-slate-400 text-xs italic">
                            No resident student profiles checked in.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Assignment Form */}
                <div className="border border-slate-200 rounded-2xl p-6 bg-white max-w-xl mx-auto">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-4">
                    Assign Student to Dormitory Hostel Bed
                  </h4>
                  <form onSubmit={handleAssignHostel} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">Student</label>
                        <select
                          className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          value={selectedStudentId}
                          onChange={(e) => setSelectedStudentId(e.target.value)}
                        >
                          <option value="">-- Select Student --</option>
                          {students.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.className})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">Hostel Block</label>
                        <select
                          className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          value={assignHostelId}
                          onChange={(e) => setAssignHostelId(e.target.value)}
                        >
                          <option value="">-- Select Hostel --</option>
                          {hostels.map(h => (
                            <option key={h.id} value={h.id}>{h.name} ({h.gender} wing)</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">Room Number</label>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          value={assignRoomNum}
                          onChange={(e) => setAssignRoomNum(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">Bed Designation</label>
                        <select
                          className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          value={assignBedLetter}
                          onChange={(e) => setAssignBedLetter(e.target.value)}
                        >
                          <option value="A">Bed A</option>
                          <option value="B">Bed B</option>
                          <option value="C">Bed C</option>
                          <option value="D">Bed D</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!selectedStudentId || !assignHostelId}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center space-x-2 shadow-sm shadow-indigo-100 disabled:opacity-50 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Allocate Student Bed Assignment</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* SUBTAB 3: SCHOOL BUS TRANSPORT */}
            {activeSubTab === "transport" && (
              <div className="space-y-6">
                {/* Search Bar for Quick Locate Passengers */}
                <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                  <div className="space-y-1 text-left w-full md:w-auto">
                    <h4 className="text-xs font-bold text-amber-900 uppercase font-mono">School Bus Passenger Finder</h4>
                    <p className="text-[11px] text-amber-600">Type student's name to instantly trace their route line, driver, plate number, and bus details.</p>
                  </div>
                  <div className="relative w-full md:w-96">
                    <input
                      type="text"
                      placeholder="🔍 Search student name to locate bus line..."
                      value={transportSearchQuery}
                      onChange={(e) => setTransportSearchQuery(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-800 font-medium"
                    />
                    {transportSearchQuery && (
                      <button 
                        type="button"
                        onClick={() => setTransportSearchQuery("")}
                        className="absolute right-3 top-2.5 text-[10px] bg-slate-100 text-slate-500 hover:bg-slate-200 px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Instant Transport Search Results Panel */}
                {transportSearchQuery.trim() !== "" && (
                  <div className="bg-white border-2 border-amber-500/20 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                      <span>Bus Route Passenger Traces ({
                        transportRoutes.flatMap(r => r.students.map((studId: string) => ({ studId, routeName: r.name, busNo: r.busNo, driver: r.driver, plate: r.plate }))).filter(pass => {
                          const name = students.find(s => s.id === pass.studId)?.name || "";
                          return name.toLowerCase().includes(transportSearchQuery.toLowerCase());
                        }).length
                      } Found)</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {transportRoutes.flatMap(r => r.students.map((studId: string) => ({ studId, routeName: r.name, busNo: r.busNo, driver: r.driver, plate: r.plate }))).filter(pass => {
                        const name = students.find(s => s.id === pass.studId)?.name || "";
                        return name.toLowerCase().includes(transportSearchQuery.toLowerCase());
                      }).map((pass, idx) => {
                        const student = students.find(s => s.id === pass.studId);
                        return (
                          <div key={idx} className="bg-amber-50/20 border border-amber-100/50 rounded-xl p-3 flex justify-between items-center text-left">
                            <div>
                              <strong className="text-xs text-slate-800 block">{student?.name || "Student"}</strong>
                              <span className="text-[10px] text-slate-400 block font-medium">{student?.className || "Class Room"}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full block uppercase font-mono tracking-wider mb-1 text-center">
                                Bus Line {pass.busNo} • {pass.routeName}
                              </span>
                              <span className="text-[10px] text-slate-500 font-bold block font-mono">{pass.driver} ({pass.plate})</span>
                            </div>
                          </div>
                        );
                      })}
                      {transportRoutes.flatMap(r => r.students.map((studId: string) => ({ studId, routeName: r.name, busNo: r.busNo, driver: r.driver, plate: r.plate }))).filter(pass => {
                        const name = students.find(s => s.id === pass.studId)?.name || "";
                        return name.toLowerCase().includes(transportSearchQuery.toLowerCase());
                      }).length === 0 && (
                        <div className="col-span-2 text-center py-4 text-slate-400 text-xs italic">
                          No transit student matches found for "{transportSearchQuery}".
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                    💡 Click on any bus line card to inspect the complete list of assigned student passengers:
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {transportRoutes.map((route) => {
                    const isSelected = selectedTransportCardId === route.id;
                    return (
                      <div 
                        key={route.id} 
                        onClick={() => setSelectedTransportCardId(isSelected ? null : route.id)}
                        className={`border rounded-2xl p-5 bg-gradient-to-b from-white to-slate-50/30 cursor-pointer transition-all ${
                          isSelected ? "border-amber-500 ring-2 ring-amber-500/20 shadow-md bg-amber-50/10" : "border-slate-200 hover:border-amber-300"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                              Bus Line {route.busNo}
                            </span>
                            <h3 className="text-sm font-bold text-slate-800 mt-2">{route.name}</h3>
                            <p className="text-xs text-slate-400 mt-0.5 font-mono">Driver: {route.driver} ({route.plate})</p>
                          </div>
                          <Bus className={`h-8 w-8 transition-colors ${isSelected ? "text-amber-600" : "text-amber-400"}`} />
                        </div>

                        <div className="mt-4 border-t border-slate-100 pt-3 flex justify-between text-xs font-semibold text-slate-600">
                          <span>Route Sub Fee</span>
                          <span className="font-mono text-indigo-600">₦{route.fee?.toLocaleString()} / Term</span>
                        </div>

                        {/* Roster list */}
                        <div className="mt-4 space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Assigned Bus Passengers</span>
                          {route.students.length > 0 ? (
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                              {route.students.map((studId: string) => {
                                const stInfo = students.find(s => s.id === studId);
                                return (
                                  <div key={studId} className="flex items-center space-x-2 text-[10px] text-slate-600 bg-white border border-slate-100 px-2 py-1 rounded">
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                                    <span>{stInfo?.name || "Student"}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic block py-2">No students assigned to this bus route.</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Display Selected Route Passenger list directory */}
                {selectedTransportCardId && (() => {
                  const selectedRoute = transportRoutes.find(r => r.id === selectedTransportCardId);
                  if (!selectedRoute) return null;
                  return (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div className="text-left">
                          <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">
                            Detailed Passenger Directory: {selectedRoute.name} (Bus Line {selectedRoute.busNo})
                          </h3>
                          <span className="text-[11px] text-slate-400">Total assigned student passengers: {selectedRoute.students.length}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setSelectedTransportCardId(null)}
                          className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 px-2.5 py-1 rounded-lg cursor-pointer"
                        >
                          Close Detail
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
                        {selectedRoute.students.map((studId: string) => {
                          const student = students.find(s => s.id === studId);
                          return (
                            <div key={studId} className="border border-slate-100 bg-slate-50/50 p-3 rounded-xl flex justify-between items-center">
                              <div>
                                <span className="text-xs font-bold text-slate-800 block">{student?.name || "Student"}</span>
                                <span className="text-[10px] text-slate-400 block font-mono">{student?.className || "Unassigned Class"}</span>
                              </div>
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold uppercase font-mono tracking-wider">Passenger</span>
                            </div>
                          );
                        })}
                        {selectedRoute.students.length === 0 && (
                          <div className="col-span-3 text-center py-6 text-slate-400 text-xs italic">
                            No passengers currently assigned to this bus line route.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Route Registration Form */}
                <div className="border border-slate-200 rounded-2xl p-6 bg-white max-w-xl mx-auto">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-4">
                    Register Student for School Bus Transport Routing
                  </h4>
                  <form onSubmit={handleAssignTransport} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">Student</label>
                        <select
                          className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          value={selectedStudentId}
                          onChange={(e) => setSelectedStudentId(e.target.value)}
                        >
                          <option value="">-- Select Student --</option>
                          {students.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.className})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">Transport Route</label>
                        <select
                          className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          value={assignRouteId}
                          onChange={(e) => setAssignRouteId(e.target.value)}
                        >
                          <option value="">-- Select Route --</option>
                          {transportRoutes.map(r => (
                            <option key={r.id} value={r.id}>{r.name} - {r.driver}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!selectedStudentId || !assignRouteId}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center space-x-2 shadow-sm shadow-indigo-100 disabled:opacity-50 transition-colors"
                    >
                      <Check className="h-4 w-4" />
                      <span>Register Route Transport Plan</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* SUBTAB 4: UNIFORM & BOOK STORE */}
            {activeSubTab === "inventory" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Store Catalog & Inventory */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                      Uniform & Bookshop store inventory items
                    </span>
                    <div className="divide-y divide-slate-100">
                      {inventory.map((item) => {
                        const lowStock = item.stock <= 15;
                        return (
                          <div key={item.id} className="py-3 flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-slate-800">{item.name}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Category: {item.category} • Price: <strong className="text-indigo-600">₦{item.price.toLocaleString()}</strong>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                                lowStock ? "bg-rose-100 text-rose-800 animate-pulse" : "bg-slate-100 text-slate-700"
                              }`}>
                                {item.stock} in Stock
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Transaction History Sales Ledger */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                      Store Purchases & Sales Ledger
                    </span>
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {sales.length > 0 ? (
                        [...sales].reverse().map((sale) => {
                          const sData = students.find(s => s.id === sale.studentId);
                          const iData = inventory.find(i => i.id === sale.itemId);
                          return (
                            <div key={sale.id} className="flex items-center justify-between text-[10px] bg-white border border-slate-100 px-2.5 py-1.5 rounded">
                              <div>
                                <span className="font-bold text-slate-800">{sData?.name || "Student"}</span>
                                <span className="text-slate-400 font-mono ml-2">[{sale.invoiceRef}]</span>
                              </div>
                              <div className="text-right">
                                <span className="font-semibold text-slate-700">{iData?.name || "Uniform Item"} (x{sale.qty})</span>
                                <span className="text-indigo-600 font-bold ml-3">₦{sale.totalPaid.toLocaleString()}</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-slate-400 text-center text-xs py-4">No transactions logged yet.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form column */}
                <div className="lg:col-span-1">
                  <div className="border border-slate-200 rounded-2xl p-5 bg-white sticky top-24">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-4">
                      Record Store Purchase Invoice
                    </h4>
                    <form onSubmit={handlePurchaseItem} className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">Select Student</label>
                        <select
                          className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          value={shopStudentId}
                          onChange={(e) => setShopStudentId(e.target.value)}
                        >
                          <option value="">-- Select Student --</option>
                          {students.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">Select Catalog Item</label>
                        <select
                          className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          value={shopItemId}
                          onChange={(e) => setShopItemId(e.target.value)}
                        >
                          <option value="">-- Select Store Item --</option>
                          {inventory.map(i => (
                            <option key={i.id} value={i.id}>{i.name} (₦{i.price})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">Quantity</label>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          className="w-full border border-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          value={shopQty}
                          onChange={(e) => setShopQty(parseInt(e.target.value, 10))}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!shopStudentId || !shopItemId || shopQty <= 0}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center space-x-2 shadow-sm shadow-indigo-100 disabled:opacity-50 transition-colors"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        <span>Generate Store Invoice Receipt</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 5: STAFF PAYROLL */}
            {activeSubTab === "payroll" && (
              <div className="space-y-6">
                {/* Admin Payroll Control Bar */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">HRM Payroll Execution Panel</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Release and calculate monthly salaries, bonuses, and tax deductions for school teachers.</p>
                  </div>
                  <button
                    onClick={handleRunPayroll}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center space-x-2 shadow-sm transition-all"
                  >
                    <Sliders className="h-4 w-4" />
                    <span>Run Monthly Payroll Cycle</span>
                  </button>
                </div>

                {/* Staff registry listing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Registry List */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                      Faculty & Teacher payroll profiles
                    </span>
                    <div className="divide-y divide-slate-100">
                      {staff.map((teacher) => (
                        <div key={teacher.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold text-slate-800">{teacher.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{teacher.role} • <span className="text-emerald-600 font-semibold">{teacher.status}</span></div>
                          </div>
                          <div className="flex flex-col items-start sm:items-end font-mono text-[10px] text-slate-500">
                            <div>Base: <span className="font-bold text-slate-800">₦{teacher.baseSalary.toLocaleString()}</span></div>
                            <div className="text-emerald-600">Allowance: +₦{teacher.allowances.toLocaleString()}</div>
                            <div className="text-rose-600">Deduction: -₦{teacher.deductions.toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Issued Payslips Ledger */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                      Generated Payslips Ledger
                    </span>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {payslips.length > 0 ? (
                        [...payslips].reverse().map((slip) => {
                          const tea = staff.find(t => t.id === slip.staffId);
                          return (
                            <div key={slip.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
                              <div>
                                <div className="text-xs font-bold text-slate-800">{tea?.name || "Teacher"}</div>
                                <div className="text-[9px] text-slate-400 font-mono mt-0.5">Period: {slip.payPeriod} • ID: {slip.id}</div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-xs font-extrabold text-emerald-600 mr-2">₦{slip.netPay.toLocaleString()}</span>
                                <button
                                  onClick={() => handlePrintPayslip(slip)}
                                  className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg border border-slate-200 transition-all"
                                  title="Print Payslip Receipt"
                                >
                                  <Printer className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-slate-400 text-center text-xs py-8 bg-white border border-slate-200 border-dashed rounded-xl">
                          No payroll has been run yet. Click 'Run Monthly Payroll Cycle' above to generate.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 6: NEWGLOBE TABLET DELIVERY & LEARNER ANALYTICS */}
            {activeSubTab === "newglobe" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-100 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-rose-800 flex items-center gap-1.5">
                      <Smartphone className="h-4 w-4" />
                      <span>EduOS Connected Teacher Tablets & Sync Engine</span>
                    </h3>
                    <p className="text-xs text-rose-700/80">
                      Standardizing instruction delivery via synchronized digital teacher lesson scripts, real-time rolls, and administrative lesson-pace tracking.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 bg-white px-3 py-1.5 border border-rose-200/60 rounded-xl text-[10px] font-mono text-rose-600 font-bold shadow-sm">
                    <Wifi className="h-3 w-3 animate-pulse text-rose-500" />
                    <span>Leaderboard Sync Active</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Lesson Script Tablet Simulator */}
                  <div className="lg:col-span-7 border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Active Lesson Script</span>
                        <h4 className="text-sm font-extrabold text-slate-800">Minute-by-Minute Teacher Guide</h4>
                      </div>
                      <select 
                        value={ngSelectedGuideId} 
                        onChange={(e) => {
                          setNgSelectedGuideId(e.target.value);
                          setNgActiveStepIndex(0);
                          setNgSecondsLeft(300);
                          setNgTimerRunning(false);
                        }}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-semibold text-slate-700"
                      >
                        {newglobeGuides.map(g => (
                          <option key={g.id} value={g.id}>{g.subject} (Week {g.week})</option>
                        ))}
                      </select>
                    </div>

                    {(() => {
                      const activeGuide = newglobeGuides.find(g => g.id === ngSelectedGuideId);
                      if (!activeGuide) return null;
                      const activeStep = activeGuide.scriptSteps[ngActiveStepIndex] || activeGuide.scriptSteps[0];
                      
                      return (
                        <div className="space-y-4">
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                            <div>
                              <div className="font-extrabold text-slate-800">{activeGuide.topic}</div>
                              <div className="text-[10px] text-slate-400 font-mono">Level: {activeGuide.classLevel} • Standard Duration: {activeGuide.durationMinutes} min</div>
                            </div>
                            
                            {/* Interactive Step Timer */}
                            <div className="flex items-center space-x-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl font-mono">
                              <Clock className="h-3.5 w-3.5 text-indigo-600 animate-spin" />
                              <span className="text-xs font-bold text-indigo-800">
                                {Math.floor(ngSecondsLeft / 60)}:{(ngSecondsLeft % 60).toString().padStart(2, "0")}
                              </span>
                              <div className="flex items-center space-x-1 pl-1 border-l border-indigo-200">
                                {ngTimerRunning ? (
                                  <button onClick={handlePauseNgTimer} className="text-[9px] font-bold text-amber-600 uppercase">Pause</button>
                                ) : (
                                  <button onClick={handleStartNgTimer} className="text-[9px] font-bold text-emerald-600 uppercase">Start</button>
                                )}
                                <button onClick={handleResetNgTimer} className="text-[9px] font-bold text-slate-400 uppercase">Reset</button>
                              </div>
                            </div>
                          </div>

                          {/* Steps Timeline Stagger */}
                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {activeGuide.scriptSteps.map((step: any, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => handleNgProgressStep(idx)}
                                className={`w-full text-left p-3 rounded-xl border transition-all flex items-start space-x-3 text-xs ${
                                  ngActiveStepIndex === idx 
                                    ? "bg-indigo-50/70 border-indigo-200 ring-2 ring-indigo-500/10 shadow-sm" 
                                    : "bg-white border-slate-100 hover:border-slate-300"
                                }`}
                              >
                                <span className={`h-5 w-5 rounded-full flex items-center justify-center font-mono font-bold text-[9px] flex-shrink-0 ${
                                  ngActiveStepIndex === idx 
                                    ? "bg-indigo-600 text-white" 
                                    : "bg-slate-100 text-slate-400"
                                }`}>
                                  {idx + 1}
                                </span>
                                <div className="space-y-0.5">
                                  <div className="flex items-center space-x-1.5 font-bold text-slate-700">
                                    <span>{step.activity}</span>
                                    <span className="text-[9px] text-slate-400 font-mono">({step.timeRange})</span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 line-clamp-1">{step.script}</p>
                                </div>
                              </button>
                            ))}
                          </div>

                          {/* Live Recitation Bubble */}
                          <div className="border border-indigo-100 bg-indigo-50/25 p-4 rounded-xl space-y-2">
                            <span className="text-[8px] font-extrabold text-indigo-500 tracking-wider uppercase block font-mono">Simulated Teacher Recitation Audio Prompt</span>
                            <p className="text-xs text-slate-700 italic leading-relaxed">
                              "{activeStep?.script}"
                            </p>
                          </div>

                          {/* Control actions */}
                          <div className="flex justify-between items-center pt-2">
                            <button
                              disabled={ngActiveStepIndex === 0}
                              onClick={() => handleNgProgressStep(ngActiveStepIndex - 1)}
                              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:hover:bg-transparent"
                            >
                              ← Prev Step
                            </button>
                            <span className="text-[10px] text-slate-400 font-mono">Step {ngActiveStepIndex + 1} of {activeGuide.scriptSteps.length}</span>
                            <button
                              disabled={ngActiveStepIndex === activeGuide.scriptSteps.length - 1}
                              onClick={() => handleNgProgressStep(ngActiveStepIndex + 1)}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-40"
                            >
                              Next Step & Sync Tablet →
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Right Column: Synced Classrooms & Real-Time Roster Roll */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Live connected classrooms leaderboard */}
                    <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Supervisory Dashboard</span>
                        <h4 className="text-sm font-extrabold text-slate-800">Live Classroom Lesson Coverage</h4>
                      </div>

                      <div className="space-y-3">
                        {newglobeSync.map((cs: any) => (
                          <div key={cs.id} className="p-3 border border-slate-100 bg-slate-50/30 rounded-xl space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="text-xs font-bold text-slate-800">{cs.className}</div>
                                <div className="text-[9px] text-slate-400 font-semibold">{cs.teacherName} • {cs.subject}</div>
                              </div>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full font-mono ${
                                cs.status === "ONLINE" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                              }`}>
                                {cs.status}
                              </span>
                            </div>

                            {cs.activeGuideId !== "none" ? (
                              <div className="space-y-1">
                                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                                  <span>Step {cs.currentStepIndex + 1} of 5</span>
                                  <span>{cs.completionRate}% Done ({cs.elapsedMinutes}m elapsed)</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${cs.completionRate}%` }}></div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-[9px] text-slate-400 italic">Device is offline. No active scripted guide.</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pupil Morning Attendance & SMS Dispatch */}
                    <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Real-Time roll-call</span>
                          <h4 className="text-sm font-extrabold text-slate-800">Pupil Attendance Sync</h4>
                        </div>
                        <select 
                          value={ngSelectedClassForAttendance} 
                          onChange={(e) => setNgSelectedClassForAttendance(e.target.value)}
                          className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 font-semibold text-slate-600"
                        >
                          <option value="SS3 Science">SS3 Science</option>
                          <option value="SS3 Arts">SS3 Arts</option>
                        </select>
                      </div>

                      <div className="divide-y divide-slate-100 max-h-44 overflow-y-auto pr-1">
                        {students
                          .filter(s => s.className === ngSelectedClassForAttendance)
                          .map((st) => {
                            const att = newglobeAttendance.find(a => a.studentId === st.id && a.date === new Date().toISOString().split("T")[0]);
                            const status = att?.status || "Present";
                            return (
                              <div key={st.id} className="py-2.5 flex items-center justify-between text-xs">
                                <div>
                                  <div className="font-bold text-slate-800">{st.name}</div>
                                  <div className="text-[9px] text-slate-400 font-mono">Class: {st.className} • Reg No: {st.regNo}</div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => handleNgAttendanceChange(st.id, "Present")}
                                    className={`px-2 py-1 rounded text-[9px] font-extrabold transition-colors ${
                                      status === "Present" 
                                        ? "bg-emerald-600 text-white" 
                                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    }`}
                                  >
                                    Present
                                  </button>
                                  <button
                                    onClick={() => handleNgAttendanceChange(st.id, "Absent")}
                                    className={`px-2 py-1 rounded text-[9px] font-extrabold transition-colors ${
                                      status === "Absent" 
                                        ? "bg-rose-600 text-white" 
                                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    }`}
                                  >
                                    Absent
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>

                      {/* Notification sync logs */}
                      {ngNotificationLog.length > 0 && (
                        <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-1.5">
                          <span className="text-[8px] font-bold text-rose-500 uppercase font-mono block">Real-Time Parent SMS Log</span>
                          <div className="space-y-1 max-h-20 overflow-y-auto text-[9px] text-slate-500 font-mono">
                            {ngNotificationLog.map((log, idx) => (
                              <div key={idx} className="border-b border-slate-100/60 pb-1 last:border-0">{log}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Classroom Supervisor Audit Form */}
                    <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Field Audits</span>
                        <h4 className="text-sm font-extrabold text-slate-800">Log Lesson-Pace Supervisor Audit</h4>
                      </div>

                      <form onSubmit={handleNgSubmitAudit} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500">Auditor Name</label>
                            <input 
                              type="text" 
                              value={ngAuditAuditor} 
                              onChange={(e) => setNgAuditAuditor(e.target.value)}
                              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-rose-500" 
                              required 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500">Target Classroom</label>
                            <select 
                              value={ngAuditClass} 
                              onChange={(e) => setNgAuditClass(e.target.value)}
                              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-rose-500 text-slate-700"
                            >
                              <option value="SS3 Science">SS3 Science (Maths)</option>
                              <option value="SS3 Arts">SS3 Arts (English)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500">Pace Audit Result</label>
                            <select 
                              value={ngAuditResult} 
                              onChange={(e) => setNgAuditResult(e.target.value as any)}
                              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-rose-500 text-slate-700"
                            >
                              <option value="ON-PACE">ON-PACE (Guides Match)</option>
                              <option value="AHEAD">AHEAD (Ahead of schedule)</option>
                              <option value="BEHIND">BEHIND (Lagging script)</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500">Audit Remarks</label>
                            <input 
                              type="text" 
                              value={ngAuditRemarks} 
                              onChange={(e) => setNgAuditRemarks(e.target.value)}
                              placeholder="Notes about lesson script sync..."
                              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-rose-500" 
                            />
                          </div>
                        </div>

                        <button 
                          type="submit" 
                          className="w-full text-center bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs p-2 rounded-xl transition-all"
                        >
                          Submit Supervisory Pace Audit
                        </button>
                      </form>

                      {/* Audits History Logs */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Recent Supervisor Logs</span>
                        <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                          {[...newglobeAudits].reverse().map((aud) => (
                            <div key={aud.id} className="p-2 border border-slate-100 bg-slate-50/45 rounded-lg text-[10px]">
                              <div className="flex justify-between font-bold text-slate-700">
                                <span>{aud.className} ({aud.auditor})</span>
                                <span className={`px-1 rounded font-mono text-[8px] ${
                                  aud.result === "ON-PACE" ? "bg-emerald-50 text-emerald-600" : aud.result === "AHEAD" ? "bg-indigo-50 text-indigo-600" : "bg-rose-50 text-rose-600"
                                }`}>
                                  {aud.result}
                                </span>
                              </div>
                              <p className="text-slate-500 text-[9px] mt-0.5">{aud.remarks} • <span className="font-mono text-slate-400">Date: {aud.date}</span></p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* SUBTAB 7: FLEXISAF SAFSMS CORE SUITE */}
            {activeSubTab === "flexisaf" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-violet-800 flex items-center gap-1.5">
                      <Sliders className="h-4 w-4" />
                      <span>EduOS Cognitive & Academic Administrative Suite</span>
                    </h3>
                    <p className="text-xs text-violet-700/80">
                      Auto-compiled cognitive CA gradebooks, tuition debtor ledgers with receipt printing, lesson plan approval queues, and clash-free timetables.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 bg-white px-3 py-1.5 border border-violet-200/60 rounded-xl text-[10px] font-mono text-violet-600 font-bold shadow-sm">
                    <Award className="h-3.5 w-3.5 text-violet-500 animate-spin" />
                    <span>Compiled WAEC/JAMB Standards</span>
                  </div>
                </div>

                {/* 1. Gradebook cognitive compiler */}
                <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Cognitive Module</span>
                      <h4 className="text-sm font-extrabold text-slate-800">Auto-Compiled Gradebook Sheet</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select 
                        value={fsGradeClass} 
                        onChange={(e) => setFsGradeClass(e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-semibold text-slate-700"
                      >
                        <option value="SS3 Science">SS3 Science</option>
                        <option value="SS3 Arts">SS3 Arts</option>
                        <option value="SS2 Commerce">SS2 Commerce</option>
                      </select>
                      <select 
                        value={fsGradeSubject} 
                        onChange={(e) => setFsGradeSubject(e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-semibold text-slate-700"
                      >
                        <option value="Mathematics">Mathematics</option>
                        <option value="English Language">English Language</option>
                        <option value="Financial Accounting">Financial Accounting</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 font-mono">
                        <tr>
                          <th className="p-3">Student</th>
                          <th className="p-3">CA 1 (20)</th>
                          <th className="p-3">CA 2 (20)</th>
                          <th className="p-3">Exam (60)</th>
                          <th className="p-3">Total (100)</th>
                          <th className="p-3">WAEC Grade</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(() => {
                          const classSts = students.filter(s => s.className === fsGradeClass);
                          if (classSts.length === 0) {
                            return (
                              <tr>
                                <td colSpan={8} className="p-6 text-center text-slate-400 italic">No registered class students in system.</td>
                              </tr>
                            );
                          }
                          return classSts.map((st) => {
                            const entry = flexisafGradebook.find(g => g.studentId === st.id && g.subject === fsGradeSubject) || {
                              ca1: 0, ca2: 0, exam: 0, total: 0, grade: "F9", status: "FAIL"
                            };

                            const handleInlineSave = (studentId: string) => {
                              const ca1Val = Number((document.getElementById(`ca1-${studentId}`) as HTMLInputElement)?.value || 0);
                              const ca2Val = Number((document.getElementById(`ca2-${studentId}`) as HTMLInputElement)?.value || 0);
                              const examVal = Number((document.getElementById(`exam-${studentId}`) as HTMLInputElement)?.value || 0);
                              handleFsSaveGrades(studentId, fsGradeSubject, ca1Val, ca2Val, examVal);
                            };

                            return (
                              <tr key={st.id} className="hover:bg-slate-50/50">
                                <td className="p-3 font-bold text-slate-800">
                                  {st.name}
                                  <span className="block font-mono text-[9px] text-slate-400 font-normal">{st.regNo}</span>
                                </td>
                                <td className="p-3">
                                  <input 
                                    id={`ca1-${st.id}`}
                                    type="number" 
                                    min="0" 
                                    max="20" 
                                    defaultValue={entry.ca1}
                                    className="w-14 font-mono font-bold text-center bg-slate-50 border border-slate-200 rounded p-1" 
                                  />
                                </td>
                                <td className="p-3">
                                  <input 
                                    id={`ca2-${st.id}`}
                                    type="number" 
                                    min="0" 
                                    max="20" 
                                    defaultValue={entry.ca2}
                                    className="w-14 font-mono font-bold text-center bg-slate-50 border border-slate-200 rounded p-1" 
                                  />
                                </td>
                                <td className="p-3">
                                  <input 
                                    id={`exam-${st.id}`}
                                    type="number" 
                                    min="0" 
                                    max="60" 
                                    defaultValue={entry.exam}
                                    className="w-14 font-mono font-bold text-center bg-slate-50 border border-slate-200 rounded p-1" 
                                  />
                                </td>
                                <td className="p-3 font-mono font-extrabold text-indigo-600">{entry.total}</td>
                                <td className="p-3 font-mono font-bold text-slate-700">
                                  <span className={`px-2 py-0.5 rounded ${
                                    entry.grade.startsWith("A") ? "bg-emerald-50 text-emerald-600" : entry.grade.startsWith("B") ? "bg-indigo-50 text-indigo-600" : entry.grade.startsWith("C") ? "bg-indigo-50/50 text-indigo-600" : "bg-rose-50 text-rose-500"
                                  }`}>{entry.grade}</span>
                                </td>
                                <td className="p-3">
                                  <span className={`text-[9px] font-extrabold font-mono px-1.5 py-0.5 rounded ${
                                    entry.status === "PASS" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                  }`}>
                                    {entry.status}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <button
                                    onClick={() => handleInlineSave(st.id)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-2.5 py-1 rounded transition-colors"
                                  >
                                    Save
                                  </button>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Tuition Ledger & Debtor Tracker */}
                  <div className="lg:col-span-8 border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Bursar Desk</span>
                      <h4 className="text-sm font-extrabold text-slate-800">School Tuition Debt Tracker</h4>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[9px] font-bold text-slate-400 uppercase font-mono">
                          <tr>
                            <th className="p-2.5">Pupil</th>
                            <th className="p-2.5">Total Bill</th>
                            <th className="p-2.5">Paid</th>
                            <th className="p-2.5">Balance</th>
                            <th className="p-2.5">Status</th>
                            <th className="p-2.5">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {flexisafBills.map((b) => (
                            <tr key={b.studentId} className="hover:bg-slate-50/40">
                              <td className="p-2.5 font-bold text-slate-800">{b.studentName}</td>
                              <td className="p-2.5 font-mono">₦{b.total.toLocaleString()}</td>
                              <td className="p-2.5 font-mono text-emerald-600">₦{b.paid.toLocaleString()}</td>
                              <td className="p-2.5 font-mono text-rose-600 font-extrabold">₦{b.balance.toLocaleString()}</td>
                              <td className="p-2.5">
                                <span className={`text-[8px] font-black font-mono px-1.5 py-0.5 rounded ${
                                  b.status === "PAID" ? "bg-emerald-50 text-emerald-600" : b.status === "PARTIAL" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                                }`}>
                                  {b.status}
                                </span>
                              </td>
                              <td className="p-2.5">
                                {b.balance > 0 && (
                                  <button
                                    onClick={() => handleFsSendReminder(b.studentId)}
                                    className="p-1 text-slate-400 hover:text-rose-500 rounded border border-slate-200 hover:bg-rose-50/50 transition-all text-[10px] font-bold flex items-center space-x-1"
                                    title="Dispatched Debt Warning Notification SMS"
                                  >
                                    <Smartphone className="h-3 w-3" />
                                    <span>Remind</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Receipt print box */}
                    {fsReceipt && (
                      <div className="bg-indigo-50/30 border border-dashed border-indigo-200 p-4 rounded-xl space-y-3" id="fs-invoice-receipt">
                        <div className="flex justify-between items-center text-xs font-bold text-indigo-900">
                          <span>SAFSMS Official Payment Receipt</span>
                          <span>Receipt ID: {fsReceipt.receiptNo}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-mono">
                          <div>Student Name: <span className="font-bold text-slate-800">{fsReceipt.studentName}</span></div>
                          <div>Transaction Date: <span>{fsReceipt.date}</span></div>
                          <div>Amount Received: <span className="font-bold text-emerald-600">₦{fsReceipt.amount.toLocaleString()}</span></div>
                          <div>Remaining session Balance: <span className="font-bold text-rose-600">₦{fsReceipt.balanceRemaining.toLocaleString()}</span></div>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-indigo-100/60 text-[10px]">
                          <span className="text-slate-400 font-mono">Status: {fsReceipt.status}</span>
                          <button 
                            onClick={() => window.print()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1 rounded flex items-center space-x-1"
                          >
                            <Printer className="h-3 w-3" />
                            <span>Print Receipt</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {fsSmsLogs.length > 0 && (
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-1.5">
                        <span className="text-[8px] font-bold text-indigo-500 uppercase font-mono block">Dunning Communication Logs</span>
                        <div className="space-y-1 max-h-20 overflow-y-auto text-[9px] text-slate-500 font-mono">
                          {fsSmsLogs.map((log, idx) => (
                            <div key={idx} className="border-b border-slate-100/50 pb-1 last:border-0">{log}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Register Payment & Timetable scheduler */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* Record Pay Form */}
                    <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Record Payment</span>
                        <h4 className="text-sm font-extrabold text-slate-800">Tuition Cash Receipting</h4>
                      </div>

                      <form onSubmit={handleFsRecordPayment} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">Select Student</label>
                          <select
                            value={fsRecordPayStudentId}
                            onChange={(e) => setFsRecordPayStudentId(e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 text-slate-700"
                          >
                            {students.map(st => (
                              <option key={st.id} value={st.id}>{st.name} ({st.className})</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">Amount Paid (₦)</label>
                          <input
                            type="number"
                            value={fsRecordPayAmount}
                            onChange={(e) => setFsRecordPayAmount(e.target.value)}
                            placeholder="e.g. 40000"
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full text-center bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs p-2.5 rounded-xl transition-all"
                        >
                          Process Payment & Issue Receipt
                        </button>
                      </form>
                    </div>

                    {/* VP Lesson Notes Reviews pipeline */}
                    <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Lesson approvals</span>
                        <h4 className="text-sm font-extrabold text-slate-800">Teacher Lesson Plan Reviews</h4>
                      </div>

                      <div className="space-y-2">
                        {flexisafReviews.map((rev) => (
                          <div key={rev.id} className="p-3 border border-slate-100 bg-slate-50/40 rounded-xl space-y-2 text-xs">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-bold text-slate-800">{rev.topic}</div>
                                <div className="text-[9px] text-slate-400 font-semibold">{rev.teacherName} • {rev.className}</div>
                              </div>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full font-mono ${
                                rev.status === "APPROVED" ? "bg-emerald-50 text-emerald-600" : rev.status === "REJECTED" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                              }`}>
                                {rev.status}
                              </span>
                            </div>

                            {rev.status === "PENDING" ? (
                              <div className="pt-2 border-t border-slate-100 space-y-2">
                                <textarea
                                  value={fsReviewFeedbackText}
                                  onChange={(e) => setFsReviewFeedbackText(e.target.value)}
                                  placeholder="Provide Vice-Principal review feedback..."
                                  className="w-full text-[10px] bg-white border border-slate-200 rounded p-1.5 focus:outline-none focus:border-indigo-500 h-12"
                                />
                                <div className="flex space-x-1.5">
                                  <button
                                    onClick={() => handleFsSubmitReview(rev.id, "APPROVED")}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] px-2 py-1 rounded"
                                  >
                                    Approve Note
                                  </button>
                                  <button
                                    onClick={() => handleFsSubmitReview(rev.id, "REJECTED")}
                                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[9px] px-2 py-1 rounded"
                                  >
                                    Reject Note
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-500 italic">"Feedback: {rev.feedback}"</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timetable schedule conflict manager */}
                <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">clash preventer</span>
                    <h4 className="text-sm font-extrabold text-slate-800">SAFSMS Automated Timetable Matrix</h4>
                  </div>

                  {/* Warning Clash Banner */}
                  {fsScheduleWarning && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl px-4 py-3 text-xs font-bold leading-normal">
                      {fsScheduleWarning}
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 space-y-3">
                      {flexisafTimetable.map((t) => (
                        <div key={t.day} className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                          <div className="bg-slate-50 border-b border-slate-100 p-2 text-xs font-bold text-slate-700 font-mono">
                            {t.day} Schedule
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 bg-white">
                            {t.slots.map((slot: any, sIdx: number) => (
                              <div key={sIdx} className="p-2 border border-slate-100 bg-slate-50/20 rounded-lg text-center space-y-1">
                                <span className="text-[8px] font-bold text-slate-400 font-mono block">{slot.time}</span>
                                <div className="text-xs font-bold text-indigo-700 truncate">{slot.subject}</div>
                                <div className="text-[9px] text-slate-500 truncate">{slot.teacher}</div>
                                <span className="inline-block text-[8px] px-1 bg-violet-50 text-violet-600 font-bold font-mono rounded">{slot.room}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="lg:col-span-4 border border-slate-100 bg-slate-50/40 p-4 rounded-xl space-y-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Schedule New Slot</span>
                      <form onSubmit={handleFsAddTimetableSlot} className="space-y-2.5">
                        <div className="space-y-0.5">
                          <label className="text-[9px] font-bold text-slate-500">Day of Week</label>
                          <select 
                            value={fsScheduleDay} 
                            onChange={(e) => setFsScheduleDay(e.target.value)}
                            className="w-full text-xs bg-white border border-slate-200 rounded p-1.5 focus:outline-none"
                          >
                            <option value="Monday">Monday</option>
                            <option value="Tuesday">Tuesday</option>
                          </select>
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] font-bold text-slate-500">Time Range Slot</label>
                          <select 
                            value={fsScheduleTime} 
                            onChange={(e) => setFsScheduleTime(e.target.value)}
                            className="w-full text-xs bg-white border border-slate-200 rounded p-1.5 focus:outline-none"
                          >
                            <option value="08:00 - 09:00">08:00 - 09:00</option>
                            <option value="09:00 - 10:00">09:00 - 10:00</option>
                            <option value="10:30 - 11:30">10:30 - 11:30</option>
                          </select>
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] font-bold text-slate-500">Subject Course</label>
                          <select 
                            value={fsScheduleSubject} 
                            onChange={(e) => setFsScheduleSubject(e.target.value)}
                            className="w-full text-xs bg-white border border-slate-200 rounded p-1.5 focus:outline-none"
                          >
                            <option value="Mathematics">Mathematics</option>
                            <option value="English Language">English Language</option>
                            <option value="Basic Science">Basic Science</option>
                            <option value="Financial Accounting">Financial Accounting</option>
                          </select>
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] font-bold text-slate-500">Allocated Faculty</label>
                          <select 
                            value={fsScheduleTeacher} 
                            onChange={(e) => setFsScheduleTeacher(e.target.value)}
                            className="w-full text-xs bg-white border border-slate-200 rounded p-1.5 focus:outline-none"
                          >
                            <option value="Mrs. Florence Adebayo">Mrs. Florence Adebayo</option>
                            <option value="Mr. Nelson Chidi">Mr. Nelson Chidi</option>
                            <option value="Miss Sandra Bello">Miss Sandra Bello</option>
                          </select>
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] font-bold text-slate-500">Target Classroom</label>
                          <select 
                            value={fsScheduleRoom} 
                            onChange={(e) => setFsScheduleRoom(e.target.value)}
                            className="w-full text-xs bg-white border border-slate-200 rounded p-1.5 focus:outline-none font-mono"
                          >
                            <option value="Room A">Room A</option>
                            <option value="Room B">Room B</option>
                            <option value="Room C">Room C</option>
                            <option value="Lab 1">Lab 1</option>
                          </select>
                        </div>

                        <button 
                          type="submit"
                          className="w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs p-2 rounded"
                        >
                          Schedule Slot
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Printable Payslip Modal/Invoice Layout */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-200">
            <button 
              onClick={() => setSelectedPayslip(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            
            {/* PaySlip Content */}
            <div className="space-y-4 font-sans" id="payslip-print-view">
              <div className="text-center border-b border-slate-100 pb-3">
                <School className="h-6 w-6 text-indigo-600 mx-auto mb-1" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">CBT PRO X ACADEMY</h3>
                <p className="text-[9px] text-slate-400">Official HRM Monthly Faculty Payroll Statement</p>
              </div>

              {(() => {
                const tea = staff.find(t => t.id === selectedPayslip.staffId);
                return (
                  <div className="text-xs space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-mono">Employee Name</span>
                        <span className="font-bold text-slate-800">{tea?.name}</span>
                      </div>
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-mono">Employee ID</span>
                        <span className="font-bold text-slate-800 font-mono">{tea?.id}</span>
                      </div>
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-mono">Designation Role</span>
                        <span className="font-semibold text-slate-700">{tea?.role}</span>
                      </div>
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-mono">Payment Period</span>
                        <span className="font-bold text-slate-800 font-mono">{selectedPayslip.payPeriod}</span>
                      </div>
                    </div>

                    <div className="space-y-1 bg-white border border-slate-100 rounded-lg divide-y divide-slate-100 overflow-hidden">
                      <div className="p-2 flex justify-between bg-slate-50">
                        <span className="font-bold text-slate-700">Salary Component</span>
                        <span className="font-bold text-slate-700">Amount (₦)</span>
                      </div>
                      <div className="p-2 flex justify-between text-slate-600 font-mono">
                        <span>Base Basic Salary</span>
                        <span>₦{tea?.baseSalary.toLocaleString()}</span>
                      </div>
                      <div className="p-2 flex justify-between text-emerald-600 font-mono">
                        <span>Housing & Utilities Allowance</span>
                        <span>+₦{tea?.allowances.toLocaleString()}</span>
                      </div>
                      <div className="p-2 flex justify-between text-rose-600 font-mono">
                        <span>Tax & Welfare Deductions</span>
                        <span>-₦{tea?.deductions.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-indigo-50 to-indigo-100/40 border border-indigo-100 p-3 rounded-lg flex items-center justify-between text-xs font-semibold text-slate-800">
                      <span className="text-indigo-800 font-bold uppercase tracking-wider text-[10px]">Net Take-Home Pay</span>
                      <span className="font-mono text-sm font-black text-indigo-900">₦{selectedPayslip.netPay.toLocaleString()}</span>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-center space-y-2">
                      <p className="text-[9px] text-slate-400 font-mono">Payslip ID: {selectedPayslip.id} • Issued At: {new Date(selectedPayslip.createdAt).toLocaleDateString()}</p>
                      <button
                        onClick={() => window.print()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center justify-center space-x-1.5 mx-auto shadow-md shadow-indigo-100 transition-colors"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Print Hardcopy Payslip</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
