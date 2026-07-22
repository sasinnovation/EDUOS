import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Sparkles, 
  Brain, 
  TrendingUp, 
  UserCheck, 
  AlertTriangle, 
  RotateCw, 
  Lightbulb, 
  Users, 
  School,
  ChevronRight,
  ArrowUpRight,
  CheckCircle2
} from "lucide-react";

interface ClassSummary {
  classId: string;
  className: string;
  studentCount: number;
  performanceSummary: string;
  averageClassCbtScore: number;
}

interface LowAttendanceWarning {
  studentId: string;
  studentName: string;
  attendanceRate: number;
  warningReason: string;
  customRemedialStep: string;
}

interface StrugglingPupil {
  studentId: string;
  studentName: string;
  averageScore: number;
  strugglingReason: string;
  customRemedialStep: string;
}

interface AIDashboardData {
  classSummaries: ClassSummary[];
  lowAttendanceWarnings: LowAttendanceWarning[];
  strugglingPupils: StrugglingPupil[];
  schoolLevelInsights: string;
}

interface AdminAIDashboardProps {
  token: string;
}

export default function AdminAIDashboard({ token }: AdminAIDashboardProps) {
  const [data, setData] = useState<AIDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAIData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/ai/admin-dashboard", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const jsonData = await res.json();
        setData(jsonData);
      } else {
        throw new Error("Failed to compile AI insights.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to establish contact with the AI Advisor node.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIData();
  }, [token]);

  return (
    <div className="space-y-6" id="ai-advisor-root">
      
      {/* 1. Header Hero Panel */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-955 to-slate-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -ml-16 -mb-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-widest bg-emerald-950/40 border border-emerald-900/30 px-3 py-1 rounded-full w-fit">
            <Brain className="h-3.5 w-3.5 animate-pulse" />
            <span>EduOS Machine Intelligence Node Active</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
            Administrative AI Advisory Hub
          </h1>
          <p className="text-slate-300 text-xs md:text-sm">
            Leverage server-side Gemini LLM synthesis to monitor cross-classroom achievement, audit systemic attendance deficits, and compile tailored remediation steps.
          </p>
        </div>

        <button
          onClick={fetchAIData}
          disabled={loading}
          className="bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 relative z-10 shrink-0 cursor-pointer text-white shadow-xs"
        >
          <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Compiling Live Analytics..." : "Refresh AI Advisory Report"}</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-150 rounded-3xl p-16 text-center space-y-4 shadow-xs">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <Sparkles className="h-6 w-6 text-indigo-600 absolute inset-0 m-auto animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-800 text-sm">Consulting Gemini Academic Models...</h3>
            <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
              Synthesizing current student records, attendance histories, and CBT attempt grades to generate highly contextual class performance logs and custom remedial strategies.
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-150 p-6 rounded-3xl flex items-start gap-3 shadow-xs">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h4 className="font-bold text-rose-800 text-xs uppercase font-mono tracking-wider">Analysis Connection Error</h4>
            <p className="text-rose-700 text-xs leading-relaxed">{error}</p>
            <button 
              onClick={fetchAIData}
              className="text-xs font-extrabold text-rose-900 hover:underline flex items-center gap-1 mt-1 cursor-pointer"
            >
              <span>Retry advisor handshake</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          
          {/* 2. Global AI Insights Banner */}
          <div className="bg-amber-50/40 border border-amber-200/60 rounded-3xl p-5 flex items-start gap-4 shadow-xs relative">
            <div className="bg-amber-100 p-3 rounded-2xl shrink-0 text-amber-700">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-bold font-mono tracking-wider text-amber-800 uppercase block">Global Principal Advisor Insight</span>
              <p className="text-slate-700 text-xs font-semibold leading-relaxed">
                {data.schoolLevelInsights}
              </p>
            </div>
          </div>

          {/* 3. Class Summaries Grid */}
          <div className="space-y-3">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider font-mono flex items-center gap-2">
              <School className="h-4 w-4 text-indigo-600" />
              <span>Class-by-Class CBT Performance Log</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.classSummaries.map((cls, idx) => (
                <div 
                  key={cls.classId || idx}
                  className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 hover:border-indigo-200 transition-colors"
                >
                  <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                    <div className="space-y-0.5">
                      <h4 className="font-black text-slate-800 text-sm">{cls.className}</h4>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold">
                        <Users className="h-3 w-3" />
                        <span>{cls.studentCount} Registered Pupils</span>
                      </div>
                    </div>
                    
                    {/* Ring score visualization */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-2xl font-mono text-xs">
                      <span className="text-slate-400 font-bold">AVG CBT:</span>
                      <strong className={`font-black ${cls.averageClassCbtScore >= 75 ? "text-emerald-600" : cls.averageClassCbtScore >= 50 ? "text-indigo-600" : "text-rose-600"}`}>
                        {cls.averageClassCbtScore}%
                      </strong>
                    </div>
                  </div>

                  <p className="text-slate-600 text-[11px] leading-relaxed italic bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                    "{cls.performanceSummary}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Student Intervention Grid (Low Attendance Warning + Struggling pupils) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left: Low Attendance Warnings */}
            <div className="space-y-3">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider font-mono flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span>Low Attendance Deficits warning ({data.lowAttendanceWarnings.length})</span>
              </h3>

              <div className="bg-white border border-slate-200 rounded-3xl divide-y divide-slate-100 shadow-sm overflow-hidden">
                {data.lowAttendanceWarnings.map((warning, idx) => (
                  <div key={warning.studentId || idx} className="p-4 space-y-2.5 hover:bg-slate-50/30 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-slate-800 text-xs">
                        {warning.studentName}
                      </span>
                      <span className="bg-rose-50 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-md border border-rose-100 font-mono">
                        {warning.attendanceRate}% Attendance
                      </span>
                    </div>

                    <div className="text-[11px] space-y-1 bg-slate-50 border border-slate-100/80 p-2.5 rounded-xl">
                      <div className="flex gap-1">
                        <span className="text-slate-400 font-mono font-bold text-[9px] uppercase shrink-0 mt-0.5">Pattern:</span>
                        <p className="text-slate-600 font-medium">{warning.warningReason}</p>
                      </div>
                      <div className="flex gap-1 border-t border-slate-100/60 pt-1.5 mt-1.5">
                        <span className="text-emerald-600 font-mono font-bold text-[9px] uppercase shrink-0 mt-0.5">Remedial:</span>
                        <p className="text-slate-800 font-bold">{warning.customRemedialStep}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {data.lowAttendanceWarnings.length === 0 && (
                  <div className="py-12 text-center space-y-2 text-slate-400">
                    <UserCheck className="h-6 w-6 text-slate-300 mx-auto" />
                    <span className="font-bold text-xs block">All attendance metrics nominal</span>
                    <span className="text-[11px]">No student warning triggers active.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Struggling Pupils Remediation */}
            <div className="space-y-3">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider font-mono flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                <span>Struggling Pupils CBT Remedial Actions ({data.strugglingPupils.length})</span>
              </h3>

              <div className="bg-white border border-slate-200 rounded-3xl divide-y divide-slate-100 shadow-sm overflow-hidden">
                {data.strugglingPupils.map((pupil, idx) => (
                  <div key={pupil.studentId || idx} className="p-4 space-y-2.5 hover:bg-slate-50/30 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-slate-800 text-xs">
                        {pupil.studentName}
                      </span>
                      <span className="bg-rose-50 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-md border border-rose-100 font-mono">
                        CBT Avg: {pupil.averageScore}%
                      </span>
                    </div>

                    <div className="text-[11px] space-y-1 bg-slate-50 border border-slate-100/80 p-2.5 rounded-xl">
                      <div className="flex gap-1">
                        <span className="text-slate-400 font-mono font-bold text-[9px] uppercase shrink-0 mt-0.5">Diagnosed Block:</span>
                        <p className="text-slate-600 font-medium">{pupil.strugglingReason}</p>
                      </div>
                      <div className="flex gap-1 border-t border-slate-100/60 pt-1.5 mt-1.5">
                        <span className="text-emerald-600 font-mono font-bold text-[9px] uppercase shrink-0 mt-0.5">Remedial:</span>
                        <p className="text-slate-800 font-bold">{pupil.customRemedialStep}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {data.strugglingPupils.length === 0 && (
                  <div className="py-12 text-center space-y-2 text-slate-400">
                    <CheckCircle2 className="h-6 w-6 text-slate-300 mx-auto" />
                    <span className="font-bold text-xs block">All academic baselines met</span>
                    <span className="text-[11px]">No students currently logging struggling metrics.</span>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-4 shadow-sm">
          <Brain className="h-10 w-10 text-slate-300 mx-auto stroke-1" />
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-sm">Advisor report ready for synthesis</h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              Click the refresh report trigger to command Gemini models to scan recent school databases and output diagnostics.
            </p>
          </div>
          <button 
            onClick={fetchAIData}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-2 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
          >
            Generate AI Advisory Log
          </button>
        </div>
      )}

    </div>
  );
}
