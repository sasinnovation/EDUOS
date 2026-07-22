import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Plus, 
  Send, 
  Filter, 
  Check, 
  AlertTriangle,
  ChevronRight,
  BookOpen,
  Download,
  Printer
} from "lucide-react";

interface LessonNotesModuleProps {
  token: string;
  role: string;
}

export default function LessonNotesModule({ token, role }: LessonNotesModuleProps) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"LIST" | "CREATE">("LIST");
  
  // Create form state
  const [classId, setClassId] = useState("c-1");
  const [className, setClassName] = useState("SS3 Science");
  const [subject, setSubject] = useState("General Mathematics");
  const [topic, setTopic] = useState("");
  const [week, setWeek] = useState("1");
  const [objectives, setObjectives] = useState("");
  const [content, setContent] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Admin Review state
  const [reviewingNote, setReviewingNote] = useState<any | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewStatus, setReviewStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const handleExportLessonNotePDF = (note: any) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    let currentY = 15;
    const marginX = 15;
    const printableWidth = 180;

    const addNewPageIfNeeded = (heightNeeded: number) => {
      if (currentY + heightNeeded > 280) {
        doc.addPage();
        currentY = 20;
        // Draw page border/accent
        doc.setFillColor(79, 70, 229);
        doc.rect(marginX, 12, printableWidth, 1.5, "F");
        return true;
      }
      return false;
    };

    // Draw header stripe on first page
    doc.setFillColor(79, 70, 229);
    doc.rect(marginX, 12, printableWidth, 3, "F");
    currentY = 22;

    // School Header
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text("EDUOS CORE LESSON PLAN ARCHIVE", marginX, currentY);
    currentY += 5;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Official School Academic Board Curriculum Registry", marginX, currentY);
    currentY += 8;

    // Divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(marginX, currentY, marginX + printableWidth, currentY);
    currentY += 8;

    // Subject & Topic Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.rect(marginX, currentY, printableWidth, 32, "FD");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("SUBJECT DIVISION", marginX + 5, currentY + 6);
    doc.text("WEEK INDEX", marginX + 110, currentY + 6);

    doc.setFontSize(10);
    doc.setTextColor(79, 70, 229);
    doc.text((note.subject || "General Mathematics").toUpperCase(), marginX + 5, currentY + 11);
    doc.setTextColor(30, 41, 59);
    doc.text(`WEEK ${note.week || 1}`, marginX + 110, currentY + 11);

    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("TEACHER NAME", marginX + 5, currentY + 18);
    doc.text("TARGET CLASS", marginX + 110, currentY + 18);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(note.teacherName || "Florence Adebayo", marginX + 5, currentY + 23);
    doc.text(note.className || "SS3 Science", marginX + 110, currentY + 23);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("DOCUMENT VERIFICATION ID", marginX + 5, currentY + 29);
    doc.setFont("Courier", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`EDUOS-LN-${(note.id || "temp").toUpperCase()}`, marginX + 5, currentY + 33);
    currentY += 38;

    // Topic title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("LESSON TOPIC: " + (note.topic || "").toUpperCase(), marginX, currentY);
    currentY += 8;

    // Specific Objectives Section
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text("SPECIFIC BEHAVIORAL OBJECTIVES", marginX, currentY);
    currentY += 3;

    // Split objectives text
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const splitObj = doc.splitTextToSize(note.objectives || "", printableWidth - 10);
    
    // Draw box for objectives
    const objBoxHeight = splitObj.length * 4.5 + 6;
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(241, 245, 249);
    doc.rect(marginX, currentY, printableWidth, objBoxHeight, "FD");

    splitObj.forEach((line: string, i: number) => {
      doc.text(line, marginX + 5, currentY + 5 + (i * 4.5));
    });
    currentY += objBoxHeight + 8;

    // Content Section
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text("LESSON PLAN NOTES CONTENT", marginX, currentY);
    currentY += 5;

    // Draw long text body with auto-pagination
    doc.setFont("Courier", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const splitContent = doc.splitTextToSize(note.content || "", printableWidth);

    splitContent.forEach((line: string) => {
      addNewPageIfNeeded(5);
      doc.text(line, marginX, currentY);
      currentY += 5;
    });

    currentY += 10;

    // Signatures and review log box (We need to fit this)
    addNewPageIfNeeded(50); // Make sure we have 50mm space left, otherwise move to next page

    // Review Log Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(marginX, currentY, printableWidth, 34, "FD");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(79, 70, 229);
    doc.text("ADMINISTRATIVE CURRICULUM REVIEW SIGN-OFF", marginX + 5, currentY + 6);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("APPROVAL STATUS:", marginX + 5, currentY + 12);
    
    if (note.status === "APPROVED") {
      doc.setTextColor(16, 185, 129);
      doc.text("APPROVED & REGISTERED FOR DELIVERY", marginX + 38, currentY + 12);
    } else if (note.status === "REJECTED") {
      doc.setTextColor(244, 63, 94);
      doc.text("REJECTED - NEEDS CORRECTIONS", marginX + 38, currentY + 12);
    } else {
      doc.setTextColor(217, 119, 6);
      doc.text("PENDING ACADEMIC VERIFICATION", marginX + 38, currentY + 12);
    }

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("REVIEWER FEEDBACK:", marginX + 5, currentY + 18);
    
    doc.setFont("Helvetica", "italic");
    doc.setTextColor(51, 65, 85);
    const feedbackText = note.feedback ? `"${note.feedback}"` : '"Plan meets school pedagogical standards and curriculum timeline."';
    const splitFeedback = doc.splitTextToSize(feedbackText, printableWidth - 20);
    splitFeedback.slice(0, 2).forEach((line: string, i: number) => {
      doc.text(line, marginX + 5, currentY + 23 + (i * 4));
    });

    // Draw Signature line on the right inside review box
    doc.setFont("Times", "BoldItalic");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const reviewerName = note.reviewedBy || "Dr. Charles Kolawole";
    doc.text(reviewerName, marginX + 140, currentY + 15, { align: "center" });

    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.2);
    doc.line(marginX + 120, currentY + 18, marginX + 160, currentY + 18);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7);
    doc.text("Principal / Academic Director", marginX + 140, currentY + 22, { align: "center" });
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    const reviewDate = note.reviewedAt ? new Date(note.reviewedAt).toLocaleDateString() : new Date().toLocaleDateString();
    doc.text(`Date Signed: ${reviewDate}`, marginX + 140, currentY + 26, { align: "center" });

    // Official Stamp circle on the right side if approved
    if (note.status === "APPROVED") {
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.3);
      doc.circle(marginX + 105, currentY + 17, 6, "S");
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(4);
      doc.setTextColor(16, 185, 129);
      doc.text("PASSED", marginX + 105, currentY + 16, { align: "center" });
      doc.setFontSize(3);
      doc.text("BOARD OK", marginX + 105, currentY + 18, { align: "center" });
    }

    currentY += 42;

    // Standard Footnote
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text("This lesson note document is generated digitally and stored within the central school curriculum node database.", 105, currentY, { align: "center" });
    doc.text("Verified through CBT Pro X EduOS Core.", 105, currentY + 3, { align: "center" });

    // Save and download
    doc.save(`LessonNote_${(note.subject || "General_Mathematics").replace(/\s+/g, "_")}_Week${note.week || 1}.pdf`);
  };

  const loadNotes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/lesson-notes", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (err) {
      console.error("Error loading lesson plans:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [token]);

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!topic.trim() || !content.trim() || !objectives.trim()) {
      setErrorMsg("Please complete all required fields for the lesson note.");
      return;
    }

    try {
      const res = await fetch("/api/lesson-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          classId,
          className,
          subject,
          topic,
          week: Number(week),
          objectives,
          content
        })
      });

      if (res.ok) {
        setSuccessMsg("Lesson plan successfully uploaded and queued for principal's review.");
        setTopic("");
        setObjectives("");
        setContent("");
        loadNotes();
        setActiveTab("LIST");
      } else {
        const errData = await res.json();
        setErrorMsg(errData.message || "Failed to submit lesson notes.");
      }
    } catch (err) {
      setErrorMsg("Server error submitting lesson notes.");
    }
  };

  const handleReviewNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingNote) return;

    try {
      const res = await fetch(`/api/lesson-notes/${reviewingNote.id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          status: reviewStatus,
          feedback: reviewFeedback
        })
      });

      if (res.ok) {
        setReviewingNote(null);
        setReviewFeedback("");
        loadNotes();
      } else {
        alert("Failed to submit review.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotes = notes.filter(n => {
    if (statusFilter === "ALL") return true;
    return n.status === statusFilter;
  });

  return (
    <div className="space-y-6" id="lesson-notes-module-container">
      
      {/* Header with Title and Tab Selectors */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 border border-slate-200 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <span>EduOS Teacher Lesson Note Submission Portal</span>
          </h3>
          <p className="text-xs text-slate-400">
            {role === "TEACHER" 
              ? "Draft, submit, and track approval feedback for your weekly academic lessons." 
              : "Verify submitted lesson schedules from teachers and records assessments."}
          </p>
        </div>

        {role === "TEACHER" && (
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("LIST")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "LIST" 
                  ? "bg-white text-indigo-700 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              My Lesson Notes
            </button>
            <button
              onClick={() => setActiveTab("CREATE")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                activeTab === "CREATE" 
                  ? "bg-white text-indigo-700 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Compose Note</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Panel */}
      {activeTab === "CREATE" && role === "TEACHER" ? (
        /* TEACHER CREATE FORM */
        <form onSubmit={handleSubmitNote} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">
            Draft New Weekly Lesson Plan Notes
          </h4>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase font-mono">Target Class</label>
              <select
                value={className}
                onChange={(e) => {
                  setClassName(e.target.value);
                  setClassId(e.target.value === "SS3 Science" ? "c-1" : "c-2");
                }}
                className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-indigo-500"
              >
                <option value="SS3 Science">SS3 Science (Block A)</option>
                <option value="SS3 Arts">SS3 Arts (Block B)</option>
                <option value="SS2 Commerce">SS2 Commerce (Block C)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase font-mono">Subject Division</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-indigo-500"
              >
                <option value="General Mathematics">General Mathematics</option>
                <option value="Further Mathematics">Further Mathematics</option>
                <option value="English Language">English Language</option>
                <option value="Physics">Physics</option>
                <option value="Biology">Biology</option>
                <option value="Chemistry">Chemistry</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase font-mono">Academic Week (Term Index)</label>
              <select
                value={week}
                onChange={(e) => setWeek(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-indigo-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(wk => (
                  <option key={wk} value={wk}>Week {wk}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase font-mono">Lesson Topic Title</label>
            <input
              type="text"
              placeholder="e.g. Solving Quadratic Equations using Almighty Factorization"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase font-mono">Specific Behavioral Objectives</label>
            <textarea
              placeholder="By the end of this lesson, students should be able to..."
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              rows={2}
              className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-indigo-500 leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase font-mono">Lesson Notes Main Text Body</label>
            <textarea
              placeholder="Provide standard chapter content, mathematical equations, rules, or exercises..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-indigo-500 font-mono leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab("LIST")}
              className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Send className="h-4 w-4" />
              <span>Submit Lesson Note</span>
            </button>
          </div>
        </form>
      ) : (
        /* NOTES LISTS & REVIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Columns: Notes Table */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Filter bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-slate-400" />
                <span>Filter Submissions:</span>
              </span>

              <div className="flex bg-slate-100 p-0.5 rounded-lg">
                {["ALL", "APPROVED", "PENDING", "REJECTED"].map(f => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                      statusFilter === f 
                        ? "bg-white text-indigo-700 shadow-sm" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl text-emerald-800 text-xs">
                {successMsg}
              </div>
            )}

            {/* List block */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              {loading ? (
                <div className="py-20 text-center flex flex-col items-center justify-center space-y-2">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[11px] text-slate-500 font-mono">Loading school lesson telemetry...</span>
                </div>
              ) : filteredNotes.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {filteredNotes.map(n => {
                    return (
                      <div 
                        key={n.id}
                        className="p-5 hover:bg-slate-50/50 transition-all cursor-pointer group flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                        onClick={() => setReviewingNote(n)}
                      >
                        <div className="space-y-1.5 max-w-lg">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-slate-100 text-slate-600 font-mono text-[9px] font-bold px-2 py-0.5 rounded">
                              {n.className}
                            </span>
                            <span className="bg-indigo-50 text-indigo-700 font-bold text-[9px] px-2 py-0.5 rounded">
                              Week {n.week}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              by {n.teacherName || "Florence Adebayo"}
                            </span>
                          </div>

                          <h5 className="font-extrabold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">
                            {n.topic}
                          </h5>
                          <p className="text-slate-400 text-xs line-clamp-1">
                            Objectives: {n.objectives}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          {n.status === "APPROVED" && (
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-100">
                              <CheckCircle className="h-3.5 w-3.5" /> Approved
                            </span>
                          )}
                          {n.status === "PENDING" && (
                            <span className="bg-amber-50 text-amber-700 text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1 border border-amber-100 animate-pulse">
                              <Clock className="h-3.5 w-3.5" /> Pending
                            </span>
                          )}
                          {n.status === "REJECTED" && (
                            <span className="bg-rose-50 text-rose-700 text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1 border border-rose-100">
                              <XCircle className="h-3.5 w-3.5" /> Rejected
                            </span>
                          )}

                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-all transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center space-y-2">
                  <FileText className="h-8 w-8 text-slate-300 mx-auto" />
                  <span className="font-extrabold text-slate-700 text-xs block">No lesson plans recorded</span>
                  <span className="text-slate-400 text-[11px]">Submissions matching {statusFilter} filter are empty.</span>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Full Reader and Admin Review Action Box */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 h-fit">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-slate-800 text-sm">
                Lesson Plan Inspector
              </h4>
              <p className="text-xs text-slate-400">
                Verify curriculum alignment and standard content depth.
              </p>
            </div>

            {reviewingNote ? (
              <div className="space-y-4">
                {/* PDF Download Button Banner */}
                <div className="flex items-center justify-between bg-indigo-50/50 border border-indigo-100 p-3 rounded-2xl">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-indigo-700 block uppercase font-mono">Academic Archive</span>
                    <span className="text-xs font-semibold text-slate-700">Official Lesson Plan Note</span>
                  </div>
                  <button
                    onClick={() => handleExportLessonNotePDF(reviewingNote)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export PDF</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-extrabold font-mono text-indigo-600 block uppercase">
                      {reviewingNote.subject}
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      Week {reviewingNote.week} Note
                    </span>
                  </div>
                  <h5 className="font-black text-slate-800 text-xs">
                    {reviewingNote.topic}
                  </h5>
                  <p className="text-[11px] text-slate-500 p-3 bg-slate-50 rounded-xl leading-relaxed">
                    <strong className="block font-bold text-slate-700 mb-0.5">Objectives:</strong>
                    {reviewingNote.objectives}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <strong className="block text-[11px] text-slate-500 font-mono uppercase tracking-wider mb-2">
                    Lesson Plan Text:
                  </strong>
                  <div className="text-xs text-slate-600 font-medium whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto p-3.5 border border-slate-100 rounded-2xl bg-indigo-50/20">
                    {reviewingNote.content}
                  </div>
                </div>

                {/* Status Box or Review form */}
                {role === "ADMIN" && reviewingNote.status === "PENDING" ? (
                  <form onSubmit={handleReviewNoteSubmit} className="border-t border-slate-100 pt-4 space-y-3">
                    <h6 className="font-bold text-slate-800 text-xs">
                      Admin Submission Action:
                    </h6>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setReviewStatus("APPROVED")}
                        className={`py-2 text-[11px] font-bold rounded-xl border flex items-center justify-center gap-1 ${
                          reviewStatus === "APPROVED" 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-400" 
                            : "border-slate-200 text-slate-500"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" /> Approve Plan
                      </button>

                      <button
                        type="button"
                        onClick={() => setReviewStatus("REJECTED")}
                        className={`py-2 text-[11px] font-bold rounded-xl border flex items-center justify-center gap-1 ${
                          reviewStatus === "REJECTED" 
                            ? "bg-rose-50 text-rose-700 border-rose-400" 
                            : "border-slate-200 text-slate-500"
                        }`}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject Plan
                      </button>
                    </div>

                    <textarea
                      placeholder="Type official review feedback / corrections required..."
                      value={reviewFeedback}
                      onChange={(e) => setReviewFeedback(e.target.value)}
                      rows={2}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                    />

                    <button
                      type="submit"
                      className="w-full bg-slate-800 text-white font-bold py-2.5 rounded-xl hover:bg-slate-900 transition-colors text-xs"
                    >
                      Publish Review Outcome
                    </button>
                  </form>
                ) : (
                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <strong className="block text-[11px] text-slate-500 font-mono uppercase tracking-wider">
                      Review Log:
                    </strong>
                    <div className={`p-4 rounded-2xl border ${
                      reviewingNote.status === "APPROVED" 
                        ? "bg-emerald-50/50 border-emerald-100 text-emerald-800" 
                        : reviewingNote.status === "REJECTED"
                          ? "bg-rose-50/50 border-rose-100 text-rose-800"
                          : "bg-amber-50/30 border-amber-100 text-amber-800 animate-pulse"
                    }`}>
                      <div className="flex items-center gap-1 font-bold text-xs">
                        <span>Status:</span>
                        <span>{reviewingNote.status}</span>
                      </div>
                      {reviewingNote.feedback && (
                        <p className="text-[11px] mt-1.5 italic font-medium leading-relaxed">
                          " {reviewingNote.feedback} "
                        </p>
                      )}
                      {reviewingNote.reviewedAt && (
                        <span className="text-[9px] text-slate-400 font-mono block mt-2">
                          Evaluated: {new Date(reviewingNote.reviewedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-24 text-center text-slate-300">
                <FileText className="h-10 w-10 mb-2 stroke-1 mx-auto" />
                <span className="text-xs font-mono font-bold">Select a lesson plan note to read full contents</span>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
