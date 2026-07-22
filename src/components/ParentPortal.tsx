import React, { useState, useEffect, useRef } from "react";
import { 
  Users, 
  Bot, 
  Calendar, 
  Award, 
  Send, 
  RefreshCw, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  HeartHandshake,
  Printer
} from "lucide-react";
import ReportExportModal from "./ReportExportModal";

interface ParentPortalProps {
  activeSection: "parent-portal" | "parent-chat";
  token: string;
}

export default function ParentPortal({ activeSection, token }: ParentPortalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPrintReport, setShowPrintReport] = useState(false);

  // Parent child linked stats
  const [childData, setChildData] = useState<any | null>(null);

  // Chat counselor stats
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "Welcome to the Parent Counselling Center. I am your CBT PRO X AI Academic Advisor. I have direct access to your child's continuous assessments, exam results, and daily attendance trends. How can I assist you with their educational development today?" }
  ]);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const fetchChildProfile = async () => {
    try {
      setLoading(true);
      // Fetches parent details -> and loads child s-1 profile (Tunde Folayan)
      const res = await fetch("/api/students/s-1", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setChildData(data);
    } catch (e) {
      console.error(e);
      setErrorMsg("Failed to pull child student file indicators.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildProfile();
  }, []);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessageText = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { sender: "user", text: userMessageText }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/advisor-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessageText,
          history: chatHistory
        })
      });

      const data = await res.json();
      if (res.ok) {
        setChatHistory(prev => [...prev, { sender: "ai", text: data.reply }]);
      } else {
        setChatHistory(prev => [...prev, { sender: "ai", text: "My connection to the academic analyzer is currently unstable. Please re-submit your advisory inquiry shortly." }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { sender: "ai", text: "Unable to reach Gemini Advisor services. Verify server active connections." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" id="parent-portal-root">
      
      {/* Visual Header Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Guardian & Counselling Portal
          </span>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight mt-2 capitalize">
            {activeSection === "parent-portal" ? "Child Academic Progress file" : "AI Assessor Advisory chat"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {activeSection === "parent-portal" 
              ? "Access real-time continuous assessment records, weekly timetables, and CBT scoreboards for your child."
              : "Consult our real-time AI counsellor regarding target WAEC preparation strategies and attendance statistics."}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-800 text-sm flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ----------------- SECTION 1: REAL-TIME GUARDIAN DASHBOARD ----------------- */}
      {activeSection === "parent-portal" && childData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Child Profile summary widget */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-mono font-bold tracking-wider px-2 py-0.5 rounded">LINKED WARDS INDEX</span>
                  <h3 className="text-xl font-bold text-slate-800 mt-2">{childData.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Registration: {childData.registrationNumber} | Level: {childData.className} | Platform: {childData.platform || "CBT PRO X (EDUOS)"}</p>
                </div>
                <button
                  onClick={() => setShowPrintReport(true)}
                  className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Report</span>
                </button>
              </div>

              {/* Graphical Circular Attendance Meter */}
              <div className="py-6 flex flex-col items-center justify-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  {/* Outer circle */}
                  <div className="absolute inset-0 rounded-full border-8 border-slate-100"></div>
                  <div 
                    className="absolute inset-0 rounded-full border-8 border-indigo-600"
                    style={{ 
                      clipPath: `polygon(50% 50%, 50% 0%, ${childData.attendanceRate >= 50 ? '100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%' : '100% 0%, 100% 100%, 50% 100%'})`,
                      transform: `rotate(${childData.attendanceRate * 3.6}deg)`
                    }}
                  ></div>
                  <div className="absolute inset-2.5 bg-white rounded-full flex flex-col items-center justify-center text-center shadow-inner">
                    <span className="text-xs text-slate-400 font-bold block">Attendance</span>
                    <span className="text-xl font-black font-mono text-slate-800">{childData.attendanceRate}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-500 font-medium">
                <span className="font-bold text-slate-700 block mb-1">Status Feedback:</span>
                {childData.attendanceRate >= 90 
                  ? "Tunde exhibits exemplary attendance consistency, optimizing syllabus comprehension outcomes."
                  : "Attendance rate resides below targeted indices. Advise parent to contact form tutor Mrs. Florence Adebayo."}
              </div>
            </div>

            {/* Attendance calendar dates listing */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 lg:col-span-2">
              <h3 className="font-bold text-slate-800 text-base flex items-center space-x-1.5 pb-2 border-b border-slate-100">
                <Calendar className="h-4.5 w-4.5 text-indigo-500" />
                <span>Class Attendance Roster Log (Past 30 Days)</span>
              </h3>

              <div className="overflow-y-auto max-h-[300px] space-y-2">
                {childData.attendanceHistory && childData.attendanceHistory.length > 0 ? (
                  childData.attendanceHistory.map((h: any) => (
                    <div key={h.id} className="p-3 border border-slate-100 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          h.status === 'PRESENT' ? 'bg-emerald-500' :
                          h.status === 'LATE' ? 'bg-amber-500' :
                          'bg-rose-500'
                        }`}></span>
                        <div>
                          <span className="text-xs font-bold text-slate-800">{h.date}</span>
                          {h.remarks && <p className="text-[10px] text-slate-400 font-medium mt-0.5">Remarks: {h.remarks}</p>}
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono font-bold uppercase ${
                        h.status === 'PRESENT' ? 'text-emerald-700' :
                        h.status === 'LATE' ? 'text-amber-700' :
                        'text-rose-700'
                      }`}>{h.status}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-xs text-slate-400 py-12">No attendance logs on record.</div>
                )}
              </div>
            </div>

          </div>

          {/* Child CBT exam attempt scores card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center space-x-1.5 pb-2 border-b border-slate-100">
              <Award className="h-4.5 w-4.5 text-indigo-500" />
              <span>Released CBT Examination Scoreboard</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {childData.examAttempts && childData.examAttempts.length > 0 ? (
                childData.examAttempts.map((att: any) => (
                  <div key={att.id} className="border border-slate-100 p-4 rounded-xl flex flex-col justify-between hover:border-slate-200 transition-colors shadow-sm bg-slate-50/50">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          att.status === 'PASS' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>{att.status}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{new Date(att.submitTime).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm mt-2 line-clamp-1">{att.examTitle}</h4>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100/70 text-xs font-mono font-bold text-slate-600">
                      <span>Percentage: {att.percentage}%</span>
                      <span className="text-indigo-600 font-black">Grade Point: {att.gradePoint}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center text-xs text-slate-400 py-12 border border-dashed border-slate-200 rounded-xl">
                  No released assessment scores on record yet for this candidate.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SECTION 2: AI ADVISOR COUNSELING BOT ----------------- */}
      {activeSection === "parent-chat" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[550px]" id="parent-chat-interface">
          
          {/* Quick Context Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 text-center">
                <Sparkles className="h-6 w-6 text-indigo-500 mx-auto mb-1 animate-pulse" />
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide">Gemini Cognitive Counselor</h4>
                <p className="text-[10px] text-slate-400 mt-1">Direct synthesis of student logs and behavioral trends.</p>
              </div>

              <div className="text-xs space-y-2.5 text-slate-500 font-medium">
                <p className="font-bold text-slate-700">Sample Queries to Try:</p>
                <button 
                  onClick={() => setChatInput("Can you evaluate Tunde's current Mathematics result of 100% and propose next syllabus tracks?")}
                  className="w-full text-left p-2 rounded-lg border border-slate-100 hover:border-indigo-300 text-[11px] hover:bg-slate-50 transition-colors"
                >
                  "Evaluate Tunde's maths score..."
                </button>
                <button 
                  onClick={() => setChatInput("Tunde has a 94.5% attendance average. Does this trigger any high-school performance risks?")}
                  className="w-full text-left p-2 rounded-lg border border-slate-100 hover:border-indigo-300 text-[11px] hover:bg-slate-50 transition-colors"
                >
                  "Analyse attendance risk thresholds..."
                </button>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px] text-slate-400 font-mono leading-relaxed">
              [SYSTEM VERIFICATION] Assessor Engine model: gemini-3.5-flash • Full Context Isolation Enabled.
            </div>
          </div>

          {/* Interactive Live Message Arena */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden justify-between">
            
            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[350px]">
              {chatHistory.map((ch, idx) => (
                <div 
                  key={idx}
                  className={`flex ${ch.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                    ch.sender === 'user'
                      ? "bg-indigo-600 text-white rounded-tr-none font-medium shadow-md shadow-indigo-100"
                      : "bg-slate-100 text-slate-800 rounded-tl-none font-semibold border border-slate-200/50"
                  }`}>
                    <span className="text-[10px] font-bold block uppercase tracking-wider mb-1.5 opacity-60">
                      {ch.sender === 'user' ? 'Parent Inquiry' : 'AI Counselor'}
                    </span>
                    <p>{ch.text}</p>
                  </div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick entry box */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-slate-50/50 flex gap-2">
              <input
                type="text"
                placeholder={loading ? "Analyzing educational metrics..." : "Consult AI Counselor regarding child progress metrics..."}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={loading}
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-xs bg-white focus:outline-none focus:border-indigo-500 text-slate-800"
              />
              <button
                type="submit"
                disabled={loading || !chatInput.trim()}
                className="bg-indigo-600 text-white hover:bg-indigo-700 p-2.5 rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>

          </div>
        </div>
      )}

      {showPrintReport && childData && (
        <ReportExportModal 
          studentId={childData.id} 
          token={token} 
          onClose={() => setShowPrintReport(false)} 
        />
      )}

    </div>
  );
}
