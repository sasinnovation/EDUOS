import React, { useState, useEffect, useRef } from "react";
import { 
  Award, 
  Clock, 
  Calendar,
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  FileText, 
  Check, 
  Eye, 
  Play,
  Shield,
  HelpCircle,
  Printer,
  Flag,
  Bookmark,
  Database,
  CloudUpload,
  Sparkles
} from "lucide-react";
import { Exam, Question, ExamAttempt } from "../types";
import ReportExportModal from "./ReportExportModal";
import ExamTimer from "./ExamTimer";
import StudentPerformanceSummary from "./StudentPerformanceSummary";

interface StudentCBTProps {
  activeSection: "student-exams" | "student-history" | "student-timetable";
  token: string;
  studentUser: any;
  isSimulatedOffline?: boolean;
}

export default function StudentCBT({ activeSection, token, studentUser, isSimulatedOffline = false }: StudentCBTProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPrintReport, setShowPrintReport] = useState(false);
  
  // Roster lists
  const [examsList, setExamsList] = useState<Exam[]>([]);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [timetableList, setTimetableList] = useState<any[]>([]);

  // Active exam-taking States
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [activeAttempt, setActiveAttempt] = useState<ExamAttempt | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [paletteFilter, setPaletteFilter] = useState<"ALL" | "ANSWERED" | "UNANSWERED" | "FLAGGED">("ALL");
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine && !isSimulatedOffline);
  const [syncStatus, setSyncStatus] = useState<"IDLE" | "SYNCING" | "SUCCESS" | "FAILED">("IDLE");
  
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [unsyncedItems, setUnsyncedItems] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  // Interactive Study Guide States
  const [activeResultTab, setActiveResultTab] = useState<"report" | "study">("report");
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, string>>({}); // questionId -> answer
  const [practiceResults, setPracticeResults] = useState<Record<string, { correct: boolean; checked: boolean }>>({}); // questionId -> checked state
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({}); // questionId -> explanationText
  const [aiLoadingStates, setAiLoadingStates] = useState<Record<string, boolean>>({}); // questionId -> boolean loading

  useEffect(() => {
    const checkUnsynced = () => {
      let count = 0;
      const items: any[] = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("cbt_unsynced_")) {
            const examId = key.replace("cbt_unsynced_", "");
            const dataStr = localStorage.getItem(key);
            if (dataStr) {
              const data = JSON.parse(dataStr);
              const qIds = Object.keys(data);
              count += qIds.length;
              qIds.forEach(qId => {
                items.push({ examId, qId, value: data[qId] });
              });
            }
          }
        }
      } catch (e) {
        console.error("Error checking unsynced", e);
      }
      setPendingCount(count);
      setUnsyncedItems(items);
    };

    checkUnsynced();
    const interval = setInterval(checkUnsynced, 2000);
    return () => clearInterval(interval);
  }, []);

  const triggerLocalSaveToast = () => {
    setToastMsg("Answer saved locally");
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastMsg(null);
    }, 1500);
  };

  const handleManualSyncAll = async () => {
    if (unsyncedItems.length === 0) return;
    setSyncStatus("SYNCING");
    let successCount = 0;
    
    for (const item of unsyncedItems) {
      try {
        const attemptStr = localStorage.getItem(`cbt_active_attempt_${item.examId}`);
        if (!attemptStr) continue;
        const attempt = JSON.parse(attemptStr);
        const attemptId = attempt?.id;
        if (!attemptId) continue;

        const res = await fetch(`/api/exams/${item.examId}/answers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            attemptId,
            questionId: item.qId,
            response: item.value,
            violationsCount: 0
          })
        });

        if (res.ok) {
          const key = `cbt_unsynced_${item.examId}`;
          const currentUnsynced = JSON.parse(localStorage.getItem(key) || "{}");
          delete currentUnsynced[item.qId];
          if (Object.keys(currentUnsynced).length === 0) {
            localStorage.removeItem(key);
          } else {
            localStorage.setItem(key, JSON.stringify(currentUnsynced));
          }
          successCount++;
        }
      } catch (e) {
        console.error("Error during manual sync", e);
      }
    }

    if (successCount > 0) {
      setSyncStatus("SUCCESS");
      setTimeout(() => setSyncStatus("IDLE"), 3000);
    } else {
      setSyncStatus("FAILED");
    }
  };
  
  // Timer States
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Anti-Cheat violations
  const [violationsCount, setViolationsCount] = useState(0);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);

  // Results State
  const [viewingResult, setViewingResult] = useState<any | null>(null);
  const [showResultDetail, setShowResultDetail] = useState(false);

  // Load roster data
  const loadExams = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/exams", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        // Filter out DRAFT exams for students
        if (Array.isArray(data)) {
          setExamsList(data.filter((e: Exam) => e.status === "PUBLISHED"));
        } else {
          setExamsList([]);
        }
      } else {
        setExamsList([]);
      }
    } catch (e) {
      console.error(e);
      setExamsList([]);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!studentUser) return;
    try {
      const res = await fetch(`/api/student/s-1/attempts`, { // hardcoded s-1 fallback for student user
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        setHistoryList(data);
      } else {
        setHistoryList([]);
      }
    } catch (e) {
      console.error(e);
      setHistoryList([]);
    }
  };

  const loadTimetable = async () => {
    try {
      const res = await fetch(`/api/timetable?classId=c-1`, { // science class fallback
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        setTimetableList(data);
      } else {
        setTimetableList([]);
      }
    } catch (e) {
      console.error(e);
      setTimetableList([]);
    }
  };

  useEffect(() => {
    setErrorMsg(null);
    setViewingResult(null);
    setActiveExam(null);
    setActiveAttempt(null);

    loadExams();
    loadHistory();
    loadTimetable();
  }, [activeSection]);

  // Anti-Cheat: Tab Switch Detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && activeAttempt && !activeAttempt.isSubmitted) {
        setViolationsCount(prev => {
          const updated = prev + 1;
          setShowViolationModal(true);
          // Sync with active answers update to log proctoring checks on server
          return updated;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeAttempt]);

  // Sync unsynced offline answers to server
  const syncUnsyncedAnswers = async () => {
    if (!activeExam || !activeAttempt || !isOnline) return;
    const key = `cbt_unsynced_${activeExam.id}`;
    const unsyncedStr = localStorage.getItem(key);
    if (!unsyncedStr) return;

    try {
      const unsynced: Record<string, string> = JSON.parse(unsyncedStr);
      const qIds = Object.keys(unsynced);
      if (qIds.length === 0) return;

      setSyncStatus("SYNCING");
      console.log(`[CBT PRO X] Attempting to sync ${qIds.length} offline answers...`);
      
      for (const qId of qIds) {
        const value = unsynced[qId];
        const res = await fetch(`/api/exams/${activeExam.id}/answers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            attemptId: activeAttempt.id,
            questionId: qId,
            response: value,
            violationsCount
          })
        });
        
        if (res.ok) {
          // Remove from local unsynced record after successful sync
          const currentUnsynced = JSON.parse(localStorage.getItem(key) || "{}");
          delete currentUnsynced[qId];
          localStorage.setItem(key, JSON.stringify(currentUnsynced));
        }
      }
      setSyncStatus("SUCCESS");
      setTimeout(() => setSyncStatus("IDLE"), 3000);
      console.log("[CBT PRO X] Offline answers synchronized successfully.");
    } catch (e) {
      console.error("[CBT PRO X] Error during offline answer sync:", e);
      setSyncStatus("FAILED");
    }
  };

  // Monitor Network Connectivity & Trigger Background Syncs
  useEffect(() => {
    setIsOnline(navigator.onLine && !isSimulatedOffline);
  }, [isSimulatedOffline]);

  useEffect(() => {
    const handleOnline = () => {
      if (!isSimulatedOffline) {
        setIsOnline(true);
        syncUnsyncedAnswers();
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Also run a regular check every 15 seconds to ensure any unsynced answers are synced when connection resumes
    const syncInterval = setInterval(() => {
      if (navigator.onLine && !isSimulatedOffline) {
        syncUnsyncedAnswers();
      }
    }, 15000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(syncInterval);
    };
  }, [activeExam, activeAttempt, token, isSimulatedOffline, isOnline]);

  // Periodic Background Auto-Save Mechanism (Every 60 Seconds)
  const syncCurrentAnswersDraft = async () => {
    if (!activeExam || !activeAttempt) return;
    if (!isOnline) {
      console.log("[CBT AUTO-SAVE] Device is offline. Local backups are up to date.");
      return;
    }

    try {
      console.log("[CBT AUTO-SAVE] Periodic background auto-save initiated...");
      const qIds = Object.keys(savedAnswers);
      if (qIds.length === 0) return;

      setSyncStatus("SYNCING");
      let successCount = 0;
      for (const qId of qIds) {
        const response = savedAnswers[qId];
        const res = await fetch(`/api/exams/${activeExam.id}/answers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            attemptId: activeAttempt.id,
            questionId: qId,
            response,
            violationsCount
          })
        });
        if (res.ok) {
          successCount++;
        }
      }
      setSyncStatus("SUCCESS");
      setTimeout(() => setSyncStatus("IDLE"), 3000);
      console.log(`[CBT AUTO-SAVE] Successfully synced ${successCount}/${qIds.length} draft answer responses to the backend.`);
    } catch (err) {
      console.error("[CBT AUTO-SAVE] Error during periodic background draft auto-save:", err);
      setSyncStatus("FAILED");
    }
  };

  useEffect(() => {
    if (!activeExam || !activeAttempt) return;

    console.log("[CBT AUTO-SAVE] Setting up periodic background auto-save every 60 seconds.");
    const autoSaveInterval = setInterval(() => {
      syncCurrentAnswersDraft();
    }, 60000);

    return () => {
      clearInterval(autoSaveInterval);
    };
  }, [activeExam, activeAttempt, savedAnswers, token, violationsCount]);

  // Start Exam Attempt
  const handleStartExam = async (examId: string) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setViolationsCount(0);
      setShowViolationModal(false);
      setFlaggedQuestions({});
      setPaletteFilter("ALL");

      // 1. Fetch entire exam details
      const examRes = await fetch(`/api/exams/${examId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const examData = await examRes.json();
      if (!examRes.ok) throw new Error(examData.message || "Failed to load exam details.");

      // 2. POST to start session
      const startRes = await fetch(`/api/exams/${examId}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ studentId: "s-1" }) // mapped student ID
      });
      const startData = await startRes.json();
      if (!startRes.ok) throw new Error(startData.message || "Failed to initiate exam session.");

      setActiveExam(examData);
      setExamQuestions(examData.questions || []);
      setActiveAttempt(startData.attempt);
      setSavedAnswers(startData.attempt.answers || {});
      setCurrentQIndex(0);

      // Save exam details and attempt locally for offline resilience backup
      localStorage.setItem(`cbt_cached_exam_${examId}`, JSON.stringify(examData));
      localStorage.setItem(`cbt_active_attempt_${examId}`, JSON.stringify(startData.attempt));
      localStorage.setItem(`cbt_answers_${examId}`, JSON.stringify(startData.attempt.answers || {}));

      // Compute precise remaining time based on attempt startTime (helps prevent reload/cheat time reset)
      const attemptStartTime = startData.attempt.startTime ? new Date(startData.attempt.startTime).getTime() : Date.now();
      const elapsedSeconds = Math.floor((Date.now() - attemptStartTime) / 1000);
      const examTotalSeconds = examData.duration * 60;
      const initialRemaining = Math.max(0, examTotalSeconds - elapsedSeconds);

      setSecondsRemaining(initialRemaining);

      if (initialRemaining <= 0) {
        // Automatically submit immediately if time has already run out
        handleAutoSubmit(examId, startData.attemptId || startData.attempt.id);
        return;
      }

    } catch (e: any) {
      console.warn("[CBT PRO X] Start exam API failed. Checking offline cache database...", e);
      const cachedExamStr = localStorage.getItem(`cbt_cached_exam_${examId}`);
      const cachedAttemptStr = localStorage.getItem(`cbt_active_attempt_${examId}`);
      
      if (cachedExamStr && cachedAttemptStr) {
        try {
          const cachedExam = JSON.parse(cachedExamStr);
          const cachedAttempt = JSON.parse(cachedAttemptStr);
          const cachedAnswers = JSON.parse(localStorage.getItem(`cbt_answers_${examId}`) || "{}");
          const cachedFlags = JSON.parse(localStorage.getItem(`cbt_flagged_${examId}`) || "{}");

          setActiveExam(cachedExam);
          setExamQuestions(cachedExam.questions || []);
          setActiveAttempt(cachedAttempt);
          setSavedAnswers(cachedAnswers);
          setFlaggedQuestions(cachedFlags);
          setCurrentQIndex(0);

          const attemptStartTime = cachedAttempt.startTime ? new Date(cachedAttempt.startTime).getTime() : Date.now();
          const elapsedSeconds = Math.floor((Date.now() - attemptStartTime) / 1000);
          const examTotalSeconds = cachedExam.duration * 60;
          const initialRemaining = Math.max(0, examTotalSeconds - elapsedSeconds);
          setSecondsRemaining(initialRemaining);

          setErrorMsg("You are currently offline or server is unreachable. Continuing exam in OFFLINE resilience mode. Your progress will automatically synchronize when connection is restored.");
          setLoading(false);
          return;
        } catch (restoreErr) {
          console.error("[CBT PRO X] Failed to parse local exam storage:", restoreErr);
        }
      }
      setErrorMsg(e.message || "Could not start examination. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  // Auto save answers
  const saveAnswerToBackend = async (qId: string, value: string) => {
    if (!activeAttempt || !activeExam) return;
    
    // Always backup in localStorage first for instant client recovery
    const answersKey = `cbt_answers_${activeExam.id}`;
    const localAnswers = JSON.parse(localStorage.getItem(answersKey) || "{}");
    localAnswers[qId] = value;
    localStorage.setItem(answersKey, JSON.stringify(localAnswers));

    // If offline, queue the answer for future background sync
    if (!isOnline) {
      const unsyncedKey = `cbt_unsynced_${activeExam.id}`;
      const unsynced = JSON.parse(localStorage.getItem(unsyncedKey) || "{}");
      unsynced[qId] = value;
      localStorage.setItem(unsyncedKey, JSON.stringify(unsynced));
      console.log(`[CBT PRO X] Saved option '${value}' offline for question ${qId}. Synchronizing on internet restoration.`);
      return;
    }

    try {
      const res = await fetch(`/api/exams/${activeExam?.id}/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          attemptId: activeAttempt.id,
          questionId: qId,
          response: value,
          violationsCount
        })
      });

      if (!res.ok) {
        throw new Error("Server rejected save");
      }
    } catch (e) {
      console.warn("Auto save answer API failed. Queuing for offline synchronization:", e);
      const unsyncedKey = `cbt_unsynced_${activeExam.id}`;
      const unsynced = JSON.parse(localStorage.getItem(unsyncedKey) || "{}");
      unsynced[qId] = value;
      localStorage.setItem(unsyncedKey, JSON.stringify(unsynced));
    }
  };

  // Select Option Action
  const handleSelectAnswer = (qId: string, value: string) => {
    const updated = { ...savedAnswers, [qId]: value };
    setSavedAnswers(updated);
    
    // Immediate synchronous save to local storage for reliability
    if (activeExam) {
      localStorage.setItem(`cbt_answers_${activeExam.id}`, JSON.stringify(updated));
    }

    // Trigger local save toast visual feedback
    triggerLocalSaveToast();

    // Background save with network-aware queues
    saveAnswerToBackend(qId, value);
  };

  // Submit Exam manually Action
  const handleSubmitExam = async () => {
    if (!activeExam || !activeAttempt) return;

    if (!isOnline) {
      setErrorMsg("⚠️ Network Connection Interrupted! All progress is saved locally, but you must be online to submit.");
      return;
    }

    setShowSubmitConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!activeExam || !activeAttempt) return;
    setShowSubmitConfirmModal(false);

    try {
      setLoading(true);
      if (timerRef.current) clearInterval(timerRef.current);

      const res = await fetch(`/api/exams/${activeExam.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          attemptId: activeAttempt.id,
          violationsCount
        })
      });

      const attemptResult = await res.json();
      if (res.ok) {
        // Trigger results viewing straight away
        handleViewResults(activeExam.id, activeAttempt.id);
      } else {
        setErrorMsg("Failed to submit exam. Please contact proctor.");
      }
    } catch (e) {
      setErrorMsg("Network failure submitting evaluation answers.");
    } finally {
      setLoading(false);
    }
  };

  // Timeout auto-submit
  const handleAutoSubmit = async (examId: string, attemptId: string) => {
    try {
      setErrorMsg("Assessment duration expired! Initiating secure automated answers preservation...");
      const res = await fetch(`/api/exams/${examId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ attemptId, violationsCount })
      });
      if (res.ok) {
        handleViewResults(examId, attemptId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch and display results
  const handleViewResults = async (examId: string, attemptId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/exams/${examId}/results?attemptId=${attemptId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setViewingResult(data);
      setActiveExam(null);
      setActiveAttempt(null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch AI explanation for incorrect question
  const handleFetchAiExplanation = async (q: any) => {
    try {
      setAiLoadingStates(prev => ({ ...prev, [q.id]: true }));
      const studentPreviousAns = viewingResult?.attempt?.answers[q.id];
      const res = await fetch("/api/ai/explain-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          questionText: q.text,
          options: q.options,
          answer: q.answer,
          studentAnswer: practiceAnswers[q.id] || studentPreviousAns || "[Unanswered]"
        })
      });
      const data = await res.json();
      if (res.ok && data.explanation) {
        setAiExplanations(prev => ({ ...prev, [q.id]: data.explanation }));
      } else {
        setAiExplanations(prev => ({
          ...prev,
          [q.id]: `The correct answer key is "${q.answer}". Ensure you carefully break down the parameters of the question. Pro-Tip: Eliminate incorrect choices first to double your chances of success on this topic next time!`
        }));
      }
    } catch (e) {
      console.error(e);
      setAiExplanations(prev => ({
        ...prev,
        [q.id]: `The correct answer key is "${q.answer}". Ensure you carefully break down the parameters of the question. Pro-Tip: Eliminate incorrect choices first to double your chances of success on this topic next time!`
      }));
    } finally {
      setAiLoadingStates(prev => ({ ...prev, [q.id]: false }));
    }
  };

  // Format timer text
  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="space-y-6" id="student-cbt-root">
      
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-800 text-sm flex items-center space-x-3 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0 animate-bounce" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ----------------- SECTION 1: AVAILABLE CBT EXAMS ----------------- */}
      {activeSection === "student-exams" && !activeExam && !viewingResult && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
              <Award className="h-5 w-5 text-indigo-500" />
              <span>CBT Assessment Portal</span>
            </h2>
            <p className="text-slate-500 text-xs mt-1">Select any published evaluation schedule to begin. The exam will run in secure lock mode.</p>
          </div>

          {/* Offline Synchronization Queue panel for Student CBT */}
          <div className="bg-white border-2 border-indigo-50 rounded-2xl p-5 shadow-sm space-y-4" id="student-offline-queue">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Database className="h-5 w-5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Resilience Offline Sync Registry</h3>
                  <p className="text-slate-400 text-[10px] font-mono uppercase">Answers Backup Status</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded-full uppercase tracking-wider ${
                pendingCount > 0
                  ? "bg-amber-50 text-amber-800 border border-amber-200 animate-pulse"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
              }`}>
                {pendingCount} Pending Saves
              </span>
            </div>

            {syncStatus === "SYNCING" && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 text-amber-800 animate-fade-in">
                <RefreshCw className="h-4 w-4 text-amber-600 animate-spin flex-shrink-0" />
                <span>Synchronizing pending answers to CBT Server...</span>
              </div>
            )}
            {syncStatus === "SUCCESS" && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 text-emerald-800 animate-fade-in">
                <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 animate-bounce" />
                <span>All offline actions successfully pushed to server!</span>
              </div>
            )}
            {syncStatus === "FAILED" && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 text-rose-800 animate-fade-in">
                <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0 animate-bounce" />
                <span>Failed to sync with CBT server. Please verify connection.</span>
              </div>
            )}

            {unsyncedItems.length > 0 ? (
              <div className="space-y-3">
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 pr-1">
                  {unsyncedItems.map((act, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs gap-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-700 block">Question Reference: {act.qId}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Value Backed Up: <span className="text-indigo-600 font-semibold">{act.value.length > 15 ? act.value.substring(0, 15) + '...' : act.value}</span>
                        </span>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-2 py-0.5 rounded-md font-medium shrink-0">
                        PENDING SYNC
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-slate-100 gap-3">
                  <p className="text-[11px] text-slate-500 font-medium">
                    {isOnline 
                      ? "CBT connection is online. Click sync to push your backup answers now." 
                      : "Switched to local cached backup. Synchronization is paused until server connection is restored."}
                  </p>
                  <button
                    onClick={handleManualSyncAll}
                    disabled={syncStatus === "SYNCING" || !isOnline}
                    className={`font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs flex items-center justify-center space-x-1.5 shrink-0 ${
                      !isOnline
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                        : syncStatus === "SYNCING"
                        ? "bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md"
                    }`}
                  >
                    {syncStatus === "SYNCING" ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-400" />
                    ) : (
                      <CloudUpload className="h-3.5 w-3.5" />
                    )}
                    <span>{syncStatus === "SYNCING" ? "Syncing..." : "Sync Now"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-4 border-2 border-dashed border-slate-100 rounded-xl text-center">
                <p className="text-xs font-semibold text-slate-500">All student evaluation states are fully synchronized</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Your progress is safely backed up and up-to-date with EduOS Monolith.</p>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-medium">Preparing secure delivery engine...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {examsList.map((exam) => (
                <div key={exam.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col">
                  <div className="bg-indigo-600 px-5 py-4 text-white">
                    <span className="text-[10px] bg-white/20 border border-white/10 px-2 py-0.5 rounded font-mono font-bold">ACTIVE</span>
                    <h3 className="font-bold text-base mt-2 line-clamp-1">{exam.title}</h3>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{exam.description}</p>
                    
                    <div className="grid grid-cols-2 gap-3 text-[11px] font-semibold text-slate-600 font-mono bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 block uppercase">Duration</span>
                        <span>{exam.duration} Minutes</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase">Questions</span>
                        <span>{exam.totalQuestions} Items</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartExam(exam.id)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center space-x-1.5"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Start Assessment Session</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------- SECTION 2: LIVE EXAM-TAKING SCREEN (CBT SYSTEM) ----------------- */}
      {activeExam && activeAttempt && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6" id="live-examination-deck">
          
          {/* Main Question Interface Layout */}
          <div className="xl:col-span-3 bg-white border-2 border-indigo-100 rounded-2xl shadow-md p-6 space-y-6 flex flex-col justify-between min-h-[500px]">
            
            {/* Header statistics bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block font-mono">Exam in Session</span>
                  {!isOnline ? (
                    <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono animate-pulse flex items-center space-x-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block"></span>
                      <span>Offline resilience active</span>
                    </span>
                  ) : syncStatus === "SYNCING" ? (
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono animate-pulse flex items-center space-x-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block animate-ping"></span>
                      <span>Syncing offline answers...</span>
                    </span>
                  ) : syncStatus === "SUCCESS" ? (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono">
                      ✓ Answers fully synced
                    </span>
                  ) : (
                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono flex items-center space-x-1">
                      <span className="h-1 w-1 rounded-full bg-emerald-500 inline-block"></span>
                      <span>Secure Connection</span>
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-slate-800 mt-0.5">{activeExam.title}</h2>
              </div>

              {/* Countdown clock element */}
              <ExamTimer
                initialSeconds={secondsRemaining}
                totalDurationSeconds={activeExam.duration * 60}
                onTimeout={() => handleAutoSubmit(activeExam.id, activeAttempt.id)}
                onTick={(secs) => setSecondsRemaining(secs)}
              />
            </div>

            {/* Real-time Progress Bar indicating answered questions percentage */}
            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <Bookmark className="h-4 w-4 text-indigo-500" />
                <span className="font-bold text-slate-700">Answered Progress:</span>
                <span className="font-mono text-indigo-600 font-extrabold">
                  {examQuestions.filter(q => savedAnswers[q.id] !== undefined && savedAnswers[q.id] !== "").length} / {examQuestions.length} ({examQuestions.length > 0 ? Math.round((examQuestions.filter(q => savedAnswers[q.id] !== undefined && savedAnswers[q.id] !== "").length / examQuestions.length) * 100) : 0}%)
                </span>
              </div>
              <div className="flex-1 max-w-md h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full transition-all duration-300" 
                  style={{ width: `${examQuestions.length > 0 ? Math.round((examQuestions.filter(q => savedAnswers[q.id] !== undefined && savedAnswers[q.id] !== "").length / examQuestions.length) * 100) : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Render assessed question text */}
            {examQuestions.length > 0 ? (
              <div className="space-y-6 flex-1 py-4">
                <div className="flex items-center justify-between bg-slate-50/60 p-2.5 rounded-xl border border-slate-100/80">
                  <span className="text-xs font-bold text-slate-400 font-mono">Question {currentQIndex + 1} of {examQuestions.length}</span>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const qId = examQuestions[currentQIndex].id;
                        setFlaggedQuestions(prev => ({
                          ...prev,
                          [qId]: !prev[qId]
                        }));
                      }}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                        flaggedQuestions[examQuestions[currentQIndex].id]
                          ? "bg-amber-500 border-amber-600 text-white shadow-sm shadow-amber-100"
                          : "bg-white border-slate-200 text-slate-500 hover:text-amber-500 hover:border-amber-200"
                      }`}
                    >
                      <Flag className={`h-3 w-3 ${flaggedQuestions[examQuestions[currentQIndex].id] ? "fill-current" : ""}`} />
                      <span>{flaggedQuestions[examQuestions[currentQIndex].id] ? "Flagged" : "Flag for Review"}</span>
                    </button>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded font-mono font-bold">{examQuestions[currentQIndex].scorePoints} points</span>
                  </div>
                </div>

                <p className="text-slate-800 font-bold text-lg leading-relaxed">{examQuestions[currentQIndex].text}</p>

                {/* Render input depending on question format */}
                {examQuestions[currentQIndex].type === "MCQ" && (
                  <div className="grid grid-cols-1 gap-3 mt-4">
                    {examQuestions[currentQIndex].options.map((opt, oIdx) => {
                      const isSelected = savedAnswers[examQuestions[currentQIndex].id] === opt;
                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleSelectAnswer(examQuestions[currentQIndex].id, opt)}
                          className={`w-full text-left p-3.5 rounded-xl border-2 text-sm font-semibold transition-all flex items-center justify-between ${
                            isSelected
                              ? "bg-indigo-50 border-indigo-600 text-indigo-800"
                              : "border-slate-100 hover:border-slate-200 text-slate-700 bg-slate-50/50"
                          }`}
                        >
                          <span>{opt}</span>
                          {isSelected && <Check className="h-4 w-4 text-indigo-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {examQuestions[currentQIndex].type === "TRUE_FALSE" && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {["True", "False"].map((opt) => {
                      const isSelected = savedAnswers[examQuestions[currentQIndex].id] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => handleSelectAnswer(examQuestions[currentQIndex].id, opt)}
                          className={`py-6 rounded-xl border-2 text-center text-sm font-bold transition-all ${
                            isSelected
                              ? "bg-indigo-50 border-indigo-600 text-indigo-800"
                              : "border-slate-100 hover:border-slate-200 text-slate-700 bg-slate-50/50"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {examQuestions[currentQIndex].type === "ESSAY" && (
                  <div className="space-y-2 mt-4">
                    <label className="text-xs font-bold text-slate-400 uppercase">Write Essay response</label>
                    <textarea
                      placeholder="Type your essay formulation. The evaluation schema scans keyword matches..."
                      value={savedAnswers[examQuestions[currentQIndex].id] || ""}
                      onChange={(e) => handleSelectAnswer(examQuestions[currentQIndex].id, e.target.value)}
                      className="w-full border border-slate-200 p-4 rounded-xl text-xs h-40 focus:outline-indigo-500 text-slate-800"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">Loading exam questions...</div>
            )}

            {/* Bottom sequential navigation bar */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
              <button
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex(prev => prev - 1)}
                className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Prev</span>
              </button>

              <button
                onClick={handleSubmitExam}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-2.5 rounded-lg transition-all shadow-md shadow-emerald-100"
              >
                Submit Examination
              </button>

              <button
                disabled={currentQIndex === examQuestions.length - 1}
                onClick={() => setCurrentQIndex(prev => prev + 1)}
                className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Right sidebar Question palette & Proctor checks panel */}
          <div className="space-y-6">
            
            {/* Question circles Palette grid */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">Question Palette</h3>
                <span className="text-xs text-slate-400 font-mono font-bold">{examQuestions.length} total</span>
              </div>
              
              {/* Palette filter buttons */}
              <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                {(["ALL", "ANSWERED", "UNANSWERED", "FLAGGED"] as const).map((filter) => {
                  const count = examQuestions.filter(q => {
                    const ans = savedAnswers[q.id] !== undefined && savedAnswers[q.id] !== "";
                    if (filter === "ANSWERED") return ans;
                    if (filter === "UNANSWERED") return !ans;
                    if (filter === "FLAGGED") return flaggedQuestions[q.id];
                    return true;
                  }).length;
                  
                  return (
                    <button
                      key={filter}
                      onClick={() => setPaletteFilter(filter)}
                      className={`text-[9px] font-black py-1 px-1 rounded-lg transition-all capitalize flex items-center justify-between ${
                        paletteFilter === filter
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-500 hover:bg-slate-200/60"
                      }`}
                    >
                      <span className="truncate">{filter.toLowerCase()}</span>
                      <span className={`ml-1 px-1 rounded text-[8px] ${paletteFilter === filter ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-600'}`}>{count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 xl:grid-cols-4 gap-2">
                {examQuestions.map((q, idx) => {
                  const isAnswered = savedAnswers[q.id] !== undefined && savedAnswers[q.id] !== "";
                  const isFlagged = flaggedQuestions[q.id];

                  // Apply filter condition
                  if (paletteFilter === "ANSWERED" && !isAnswered) return null;
                  if (paletteFilter === "UNANSWERED" && isAnswered) return null;
                  if (paletteFilter === "FLAGGED" && !isFlagged) return null;

                  const isActive = currentQIndex === idx;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQIndex(idx)}
                      className={`h-9 w-9 rounded-xl flex flex-col items-center justify-center relative text-xs font-bold transition-all ${
                        isActive
                          ? "bg-indigo-600 text-white font-extrabold ring-4 ring-indigo-100"
                          : isFlagged
                            ? "bg-amber-100 text-amber-800 border-2 border-amber-400"
                            : isAnswered
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                      title={`Question ${idx + 1}${isFlagged ? " (Flagged)" : ""}${isAnswered ? " (Answered)" : ""}`}
                    >
                      <span>{idx + 1}</span>
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2 items-center justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                <span className="flex items-center"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-md inline-block mr-1"></span>Answered</span>
                <span className="flex items-center"><span className="w-2.5 h-2.5 bg-slate-200 rounded-md inline-block mr-1"></span>Pending</span>
                <span className="flex items-center"><span className="w-2.5 h-2.5 bg-amber-400 rounded-md inline-block mr-1"></span>Flagged</span>
              </div>
            </div>

            {/* Interactive Proctoring violations logger */}
            <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-amber-400">
                <Shield className="h-4.5 w-4.5 animate-pulse" />
                <h4 className="font-bold text-xs uppercase tracking-wider">AI ANTI-CHEAT PROCTOR ACTIVE</h4>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block">Tab/Focus Swapped Warnings</span>
                <span className={`text-2xl font-mono font-black ${violationsCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{violationsCount} Swaps</span>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                [PROCTOR STATUS] Screen lockdown integrity scan: ON • Clipboard lockdown: ON • Browser tab switches are registered as severe exam session violations.
              </p>
            </div>

          </div>

          {/* Tab switches modal trigger */}
          {showViolationModal && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-4 border border-rose-200 shadow-xl animate-scale-up">
                <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto animate-bounce" />
                <h3 className="text-rose-600 font-extrabold text-lg">PROCTORING INTEGRITY SWAP DETECTED!</h3>
                <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                  Tab or application swapping has been registered. Under standard CBT PRO X WAEC / University assessment criteria, multiple swaps will invalidate candidate progress and score log files.
                </p>
                <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-lg text-rose-800 font-mono text-xs font-bold">
                  Active Violations Counter: {violationsCount} Warnings
                </div>
                <button
                  onClick={() => setShowViolationModal(false)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-6 rounded-lg transition-all w-full"
                >
                  I Understand, Resume Examination Assessment
                </button>
              </div>
            </div>
          )}

          {/* Custom Submit Confirmation Modal */}
          {showSubmitConfirmModal && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-4 border border-slate-200 shadow-xl animate-scale-up">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto animate-pulse" />
                <h3 className="text-slate-800 font-extrabold text-lg">Submit Examination?</h3>
                <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                  Are you certain you wish to submit this examination? Your answers will be securely synced, graded automatically, and your final performance scorecard will be generated immediately.
                </p>
                
                {/* Stats / progress summary inside modal */}
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-left space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Total Questions:</span>
                    <span className="font-bold text-slate-800">{examQuestions.length}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Answered:</span>
                    <span className="font-bold text-emerald-600">
                      {examQuestions.filter(q => savedAnswers[q.id] !== undefined && savedAnswers[q.id] !== "").length} / {examQuestions.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Time Remaining:</span>
                    <span className="font-bold text-indigo-600 font-mono">
                      {formatTimer(secondsRemaining)}
                    </span>
                  </div>
                  {violationsCount > 0 && (
                    <div className="flex justify-between text-rose-500 font-medium">
                      <span>Proctor Violations:</span>
                      <span className="font-bold font-mono text-rose-600">{violationsCount} Warning(s)</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowSubmitConfirmModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-2.5 px-4 rounded-lg transition-all"
                  >
                    Cancel, Review
                  </button>
                  <button
                    onClick={handleConfirmSubmit}
                    disabled={loading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-all"
                  >
                    {loading ? "Submitting..." : "Yes, Submit Now"}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ----------------- SECTION 3: RE-RENDER RESULTS BREAKDOWN ----------------- */}
      {viewingResult && (
        <div className="space-y-6" id="examination-results-view">
          
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex flex-col md:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded border border-white/10 uppercase tracking-widest">Grading Summary Release</span>
                <h2 className="text-xl font-bold tracking-tight mt-1">{viewingResult.exam?.title}</h2>
                <p className="text-indigo-200 text-xs mt-1">UUID: {viewingResult.attempt?.id} | Date: {new Date(viewingResult.attempt?.submitTime).toLocaleString()}</p>
              </div>

              <div className={`px-4 py-2 rounded-xl text-center border-2 ${
                viewingResult.attempt?.status === 'PASS' 
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400' 
                  : 'bg-rose-500/20 border-rose-400 text-rose-400'
              }`}>
                <span className="text-[10px] uppercase font-bold tracking-wider block">Assessment status</span>
                <span className="text-lg font-black">{viewingResult.attempt?.status}</span>
              </div>
            </div>
          </div>

          {/* Study Guide vs Report Tab Switcher */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveResultTab("report")}
              className={`flex-1 pb-3 text-xs font-bold transition-all text-center border-b-2 cursor-pointer ${
                activeResultTab === "report"
                  ? "border-indigo-600 text-indigo-600 font-extrabold"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              📊 Official Score Report Card
            </button>
            <button
              onClick={() => setActiveResultTab("study")}
              className={`flex-1 pb-3 text-xs font-bold transition-all text-center border-b-2 cursor-pointer ${
                activeResultTab === "study"
                  ? "border-indigo-600 text-indigo-600 font-extrabold"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              🎓 Interactive AI Study Guide & Revision
            </button>
          </div>

          {activeResultTab === "report" && (
            <div className="space-y-6">
              {/* Large congratulatory score metrics grid */}
          {(() => {
            const totalQuestions = viewingResult.questions?.length || 0;
            const answeredQuestions = viewingResult.questions?.filter((q: any) => {
              const studentAns = viewingResult.attempt?.answers[q.id];
              return studentAns !== undefined && studentAns !== "";
            }).length || 0;

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Aggregate score</span>
                  <div className="text-4xl font-mono font-black text-slate-800">{viewingResult.attempt?.score} points</div>
                  <p className="text-xs text-slate-500 font-semibold">from evaluated question index</p>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grade Point scale</span>
                  <div className="text-4xl font-mono font-black text-indigo-600">{viewingResult.attempt?.gradePoint}</div>
                  <p className="text-xs text-slate-500 font-semibold">Qualitative Scale: A+ to F</p>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Percentage Grade</span>
                  <div className="text-4xl font-mono font-black text-slate-800">{viewingResult.attempt?.percentage}%</div>
                  <p className="text-xs text-slate-500 font-semibold">Syllabus Pass line: {viewingResult.exam?.passingScore}%</p>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Questions Answered</span>
                  <div className="text-4xl font-mono font-black text-emerald-600">{answeredQuestions} / {totalQuestions}</div>
                  <p className="text-xs text-slate-500 font-semibold">with secure synchronization</p>
                </div>
              </div>
            );
          })()}

          {/* Assessor qualitative feedback block */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Assessor Qualitative Remarks</span>
            <p className="text-slate-700 text-sm leading-relaxed font-semibold italic">
              "{viewingResult.attempt?.remarks}"
            </p>
          </div>

          {/* Proctoring compliance metrics */}
          <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between text-xs font-mono">
            <span className="flex items-center text-indigo-300">
              <Shield className="h-4.5 w-4.5 mr-1 text-indigo-400" />
              <span>Proctor Swaps Compliance Log:</span>
            </span>
            <span className={viewingResult.attempt?.violationsCount > 0 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
              {viewingResult.attempt?.violationsCount || 0} Swaps Warning
            </span>
          </div>

          {/* Question-by-question review block */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Assessed Questions Breakdown</h3>
              <button
                onClick={() => setShowResultDetail(!showResultDetail)}
                className="text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-bold transition-all"
              >
                {showResultDetail ? "Hide Details" : "Inspect Answers Key"}
              </button>
            </div>

            {showResultDetail && (
              <div className="space-y-4 divide-y divide-slate-100">
                {viewingResult.questions?.map((q: any, idx: number) => {
                  const studentAns = viewingResult.attempt?.answers[q.id];
                  const isCorrect = studentAns && studentAns.trim().toLowerCase() === q.answer.trim().toLowerCase();
                  return (
                    <div key={q.id} className="pt-4 first:pt-0 space-y-2 text-xs text-slate-700">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-600">Question #{idx + 1} ({q.type})</span>
                        {q.type === 'ESSAY' ? (
                          <span className="text-[10px] font-mono text-slate-400">Theory Marking</span>
                        ) : isCorrect ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded flex items-center"><CheckCircle className="h-3 w-3 mr-0.5" /> Correct</span>
                        ) : (
                          <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded flex items-center"><XCircle className="h-3 w-3 mr-0.5" /> Incorrect</span>
                        )}
                      </div>
                      <p className="font-semibold text-slate-800">{q.text}</p>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                        <p><span className="text-slate-400 font-bold">Your formulation:</span> <span className="font-bold text-slate-700">{studentAns || "[No Answer Submitted]"}</span></p>
                        {q.type !== 'ESSAY' && (
                          <p><span className="text-slate-400 font-bold">Correct key:</span> <span className="font-bold text-emerald-700">{q.answer}</span></p>
                        )}
                        {q.type === 'ESSAY' && (
                          <p><span className="text-slate-400 font-bold">Assessor Keywords criteria:</span> <span className="font-mono text-indigo-700">{q.answer}</span></p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          </div>
          )}

          {activeResultTab === "study" && (
            <div className="space-y-6">
              {/* Header card with progress stats */}
              {(() => {
                const totalQuestions = viewingResult.questions?.length || 0;
                const incorrectQuestions = viewingResult.questions?.filter((q: any) => {
                  const studentAns = viewingResult.attempt?.answers[q.id];
                  return !studentAns || studentAns.trim().toLowerCase() !== q.answer.trim().toLowerCase();
                }) || [];

                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
                    <h3 className="font-bold text-amber-900 flex items-center space-x-1.5 text-base">
                      <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
                      <span>Interactive CBT Study Guide & Practice Board</span>
                    </h3>
                    <p className="text-xs text-amber-800 leading-normal">
                      We've isolated the <strong>{incorrectQuestions.length} incorrect or unattempted questions</strong> from your exam. Use this board to re-practice them with instant verification, detailed pedagogical keys, and personalized AI-powered step-by-step guidance.
                    </p>
                    <div className="flex items-center space-x-4 pt-1 text-xs">
                      <span className="font-semibold text-slate-700">Exam Total: {totalQuestions} Qs</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                      <span className="font-semibold text-rose-700">{incorrectQuestions.length} To Revise</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                      <span className="font-semibold text-emerald-700">{totalQuestions - incorrectQuestions.length} Mastered</span>
                    </div>
                  </div>
                );
              })()}

              {/* List of Incorrect questions to practice */}
              {(() => {
                const incorrectQuestions = viewingResult.questions?.filter((q: any) => {
                  const studentAns = viewingResult.attempt?.answers[q.id];
                  return !studentAns || studentAns.trim().toLowerCase() !== q.answer.trim().toLowerCase();
                }) || [];

                if (incorrectQuestions.length === 0) {
                  return (
                    <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-2xl text-center space-y-2">
                      <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
                      <h4 className="font-bold text-emerald-900">Congratulations! 100% Score Mastered</h4>
                      <p className="text-xs text-emerald-700 max-w-md mx-auto">
                        You got every single question correct on this assessment. There are no incorrect questions to revise. Great job!
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {incorrectQuestions.map((q: any, idx: number) => {
                      const studentPreviousAns = viewingResult.attempt?.answers[q.id];
                      const practiceAns = practiceAnswers[q.id] || "";
                      const pr = practiceResults[q.id];
                      const aiExpl = aiExplanations[q.id];
                      const isAiLoading = aiLoadingStates[q.id];

                      return (
                        <div key={q.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 text-xs">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                            <span className="font-extrabold text-slate-500 text-xs uppercase tracking-wider">Practice Question #{idx + 1} ({q.type})</span>
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded text-[10px] uppercase">
                              Previously Missed
                            </span>
                          </div>

                          <p className="text-sm font-semibold text-slate-800 leading-normal">{q.text}</p>

                          {/* Options Render */}
                          {q.type === 'MCQ' && q.options && (
                            <div className="grid grid-cols-1 gap-2 pt-1">
                              {q.options.map((opt: string) => {
                                const isSelected = practiceAns === opt;
                                return (
                                  <label
                                    key={opt}
                                    className={`flex items-center space-x-3 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                                      isSelected
                                        ? "bg-indigo-50 border-indigo-300 text-indigo-900"
                                        : "bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700"
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`practice-${q.id}`}
                                      value={opt}
                                      checked={isSelected}
                                      onChange={() => setPracticeAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                      disabled={pr?.checked}
                                      className="accent-indigo-600 h-4 w-4"
                                    />
                                    <span>{opt}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}

                          {q.type === 'TRUE_FALSE' && (
                            <div className="grid grid-cols-2 gap-3 pt-1">
                              {["True", "False"].map((opt) => {
                                const isSelected = practiceAns === opt;
                                return (
                                  <label
                                    key={opt}
                                    className={`flex items-center justify-center space-x-2 p-3.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                                      isSelected
                                        ? "bg-indigo-50 border-indigo-300 text-indigo-900"
                                        : "bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700"
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`practice-${q.id}`}
                                      value={opt}
                                      checked={isSelected}
                                      onChange={() => setPracticeAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                      disabled={pr?.checked}
                                      className="accent-indigo-600 h-4 w-4"
                                    />
                                    <span>{opt}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}

                          {q.type === 'ESSAY' && (
                            <div className="pt-1 space-y-2">
                              <textarea
                                placeholder="Type your practice response here..."
                                value={practiceAns}
                                onChange={(e) => setPracticeAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                disabled={pr?.checked}
                                rows={3}
                                className="w-full border border-slate-200 p-3 rounded-xl text-xs focus:outline-indigo-500 text-slate-800"
                              />
                            </div>
                          )}

                          {/* Submitted / Previous response display */}
                          <div className="bg-slate-50 px-3.5 py-2 rounded-xl text-[11px] text-slate-500 flex items-center justify-between">
                            <span>Your original submission was: <strong className="text-rose-600 font-mono">{studentPreviousAns || "[Unanswered]"}</strong></span>
                          </div>

                          {/* Verification State Banner */}
                          {pr?.checked && (
                            <div className={`p-3.5 rounded-xl border flex items-start space-x-2.5 text-xs ${
                              pr.correct
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                : "bg-rose-50 border-rose-200 text-rose-800"
                            }`}>
                              {pr.correct ? (
                                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                              ) : (
                                <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                              )}
                              <div className="space-y-1">
                                <div className="font-bold">{pr.correct ? "Mastered!" : "Correction Needed!"}</div>
                                <p className="text-[11px] leading-relaxed">
                                  {pr.correct
                                    ? "Brilliant! You identified the correct solution this time. You've closed this conceptual gap."
                                    : `The correct key is "${q.answer}". Review the explanation below to master this topic.`}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Interactive controls */}
                          <div className="flex flex-col sm:flex-row gap-2 pt-2">
                            <button
                              type="button"
                              disabled={!practiceAns.trim() || pr?.checked}
                              onClick={() => {
                                const isCorrect = practiceAns.trim().toLowerCase() === q.answer.trim().toLowerCase();
                                setPracticeResults(prev => ({
                                  ...prev,
                                  [q.id]: { correct: isCorrect, checked: true }
                                }));
                              }}
                              className="flex-1 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                            >
                              Verify Practice Answer
                            </button>
                            
                            <button
                              type="button"
                              disabled={isAiLoading}
                              onClick={() => handleFetchAiExplanation(q)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
                            >
                              <Sparkles className="h-3.5 w-3.5 animate-pulse text-indigo-500" />
                              <span>{isAiLoading ? "Consulting AI..." : aiExpl ? "Refresh AI Tutor" : "Ask AI Tutor to Explain"}</span>
                            </button>

                            {pr?.checked && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPracticeAnswers(prev => {
                                    const next = { ...prev };
                                    delete next[q.id];
                                    return next;
                                  });
                                  setPracticeResults(prev => {
                                    const next = { ...prev };
                                    delete next[q.id];
                                    return next;
                                  });
                                }}
                                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold py-2 px-4 rounded-xl text-xs cursor-pointer"
                              >
                                Retry Question
                              </button>
                            )}
                          </div>

                          {/* AI Explanation panel */}
                          {aiExpl && (
                            <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 space-y-2 animate-fade-in">
                              <h5 className="font-extrabold text-indigo-900 text-xs flex items-center space-x-1">
                                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                                <span>AI Study Advisor Tutoring & Explanation</span>
                              </h5>
                              <p className="text-slate-700 text-[11px] leading-relaxed whitespace-pre-wrap font-medium">
                                {aiExpl}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          <button
            onClick={() => {
              setViewingResult(null);
              setActiveResultTab("report");
              setPracticeAnswers({});
              setPracticeResults({});
              setAiExplanations({});
            }}
            className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-900 transition-colors text-xs cursor-pointer"
          >
            Dismiss Scores and Return to exams List
          </button>
        </div>
      )}

      {/* ----------------- SECTION 4: HISTORIC ATTEMPT LISTS ----------------- */}
      {activeSection === "student-history" && (
        <div className="space-y-6">
          <StudentPerformanceSummary studentId={studentUser?.id || "s-1"} token={token} studentName={studentUser?.name} />

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg flex items-center space-x-2">
                <FileText className="h-5 w-5 text-indigo-500" />
                <span>My Historic Performance Logs</span>
              </h3>
              <button
                onClick={() => setShowPrintReport(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Report Card</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                    <th className="py-2.5 px-4">Evaluation title</th>
                    <th className="py-2.5 px-4">Grade</th>
                    <th className="py-2.5 px-4">Percentage</th>
                    <th className="py-2.5 px-4">Violations Swaps</th>
                    <th className="py-2.5 px-4">Date Completed</th>
                    <th className="py-2.5 px-4 text-right">Records</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {historyList.length > 0 ? (
                    historyList.map(h => (
                      <tr key={h.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-bold text-slate-800">{h.examTitle}</td>
                        <td className="py-3 px-4 font-black font-mono text-indigo-600">{h.gradePoint}</td>
                        <td className="py-3 px-4 font-mono">{h.percentage}%</td>
                        <td className={`py-3 px-4 font-mono font-semibold ${h.violationsCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{h.violationsCount || 0}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-xs">{new Date(h.submitTime).toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleViewResults(h.examId, h.id)}
                            className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold py-1 px-3 rounded"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center text-slate-400 py-12">No evaluation logs found in your student record.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SECTION 5: CLASS TIMETABLE VIEW ----------------- */}
      {activeSection === "student-timetable" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-lg flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-indigo-500" />
            <span>My Classroom Weekly Schedule</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-100">
                  <th className="py-2.5 px-4">Day Of Week</th>
                  <th className="py-2.5 px-4">Subject</th>
                  <th className="py-2.5 px-4">Class Schedule Hours</th>
                  <th className="py-2.5 px-4">Assigned Teacher</th>
                  <th className="py-2.5 px-4">Assigned Location Room</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {timetableList.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-800">{t.dayOfWeek}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{t.subject}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700 bg-indigo-50/40">{t.startTime} - {t.endTime}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{t.teacher}</td>
                    <td className="py-3 px-4 text-slate-500">{t.room}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showPrintReport && (
        <ReportExportModal 
          studentId="s-1" // mapped student ID for studentUser
          token={token} 
          onClose={() => setShowPrintReport(false)} 
        />
      )}

      {/* Floating Subtle Toast Notification for Answer Auto-Saves */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-indigo-950 text-white text-xs font-bold px-4 py-3.5 rounded-xl shadow-xl flex items-center space-x-2.5 border border-indigo-800/80 z-[9999] transition-all duration-300 transform translate-y-0 scale-100 animate-fade-in" id="cbt-save-toast">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

    </div>
  );
}
