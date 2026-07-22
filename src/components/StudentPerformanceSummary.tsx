import React, { useState, useEffect } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { 
  TrendingUp, 
  Award, 
  ShieldAlert, 
  BookOpen, 
  Percent, 
  Bookmark,
  Calendar
} from "lucide-react";

interface StudentPerformanceSummaryProps {
  studentId: string;
  token: string;
  studentName?: string;
}

export default function StudentPerformanceSummary({ studentId, token, studentName }: StudentPerformanceSummaryProps) {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [chartMetric, setChartMetric] = useState<"GPA" | "PERCENTAGE">("GPA");

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        setLoading(true);
        // Load the attempts for this student
        const res = await fetch(`/api/student/${studentId}/attempts`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Sort chronologically by submitTime
          const sorted = data
            .filter((d: any) => d.isSubmitted && d.submitTime)
            .sort((a: any, b: any) => new Date(a.submitTime).getTime() - new Date(b.submitTime).getTime());
          setAttempts(sorted);
        }
      } catch (err) {
        console.error("Error fetching performance analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttempts();
  }, [studentId, token]);

  const mapGradeToGPA = (grade?: string): number => {
    if (!grade) return 0;
    switch (grade.toUpperCase()) {
      case "A+": return 5.0;
      case "A": return 4.5;
      case "B": return 4.0;
      case "C": return 3.0;
      case "D": return 2.0;
      case "E": return 1.0;
      case "F": return 0.0;
      default: return 0.0;
    }
  };

  // Prepare chart data with running cumulative GPA
  const chartData = attempts.map((attempt, idx) => {
    const scoreGPA = mapGradeToGPA(attempt.gradePoint);
    
    // Compute cumulative GPA up to this index
    let sumGPA = 0;
    for (let i = 0; i <= idx; i++) {
      sumGPA += mapGradeToGPA(attempts[i].gradePoint);
    }
    const cumulativeGPA = parseFloat((sumGPA / (idx + 1)).toFixed(2));

    return {
      name: attempt.examTitle?.substring(0, 15) || `Eval ${idx + 1}`,
      title: attempt.examTitle || `Evaluation ${idx + 1}`,
      percentage: attempt.percentage,
      gpa: scoreGPA,
      cumulativeGPA: cumulativeGPA,
      violations: attempt.violationsCount || 0,
      date: new Date(attempt.submitTime).toLocaleDateString()
    };
  });

  // Global metrics
  const avgPercentage = attempts.length > 0
    ? Math.round(attempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / attempts.length)
    : 0;

  const currentGPA = chartData.length > 0 
    ? chartData[chartData.length - 1].cumulativeGPA 
    : 0.0;

  const totalViolations = attempts.reduce((acc, curr) => acc + (curr.violationsCount || 0), 0);
  const examPassedCount = attempts.filter(a => a.status === "PASS").length;
  const passRate = attempts.length > 0 ? Math.round((examPassedCount / attempts.length) * 100) : 0;

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center space-y-3 h-80">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-slate-500 font-mono font-bold">Analyzing historic grade metrics...</span>
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-2">
        <Award className="h-8 w-8 text-slate-300 mx-auto" />
        <h4 className="font-bold text-slate-700 text-sm">Academic Performance Analytics</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          No fully evaluated CBT examinations found for {studentName || "the student"}. Take or submit an exam to start mapping grade distributions and GPA trends!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-6" id={`gpa-summary-${studentId}`}>
      
      {/* Metrics Header Cards */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-4 gap-4">
        <div>
          <h3 className="font-extrabold text-slate-800 text-base flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <span>EduOS Integrated Student Grade Performance Summary</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time Continuous Assessment (CA) & CBT exam telemetry for <span className="font-semibold text-slate-700">{studentName || "Tunde Folayan"}</span>.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setChartMetric("GPA")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              chartMetric === "GPA" 
                ? "bg-white text-indigo-700 shadow-sm" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Cumulative GPA Scale (5.0)
          </button>
          <button
            onClick={() => setChartMetric("PERCENTAGE")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              chartMetric === "PERCENTAGE" 
                ? "bg-white text-indigo-700 shadow-sm" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Exam Percentages (%)
          </button>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 space-y-1 text-center md:text-left">
          <span className="text-[10px] font-bold font-mono text-indigo-400 uppercase tracking-wider block">Cumulative GPA</span>
          <div className="text-3xl font-black font-mono text-indigo-700">{currentGPA} / 5.0</div>
          <span className="text-[10px] font-semibold text-indigo-500 flex items-center justify-center md:justify-start gap-1">
            <Bookmark className="h-3 w-3" /> Class weight: A1-F9 scale
          </span>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 space-y-1 text-center md:text-left">
          <span className="text-[10px] font-bold font-mono text-emerald-500 uppercase tracking-wider block">Average Mark</span>
          <div className="text-3xl font-black font-mono text-emerald-700">{avgPercentage}%</div>
          <span className="text-[10px] font-semibold text-emerald-500 flex items-center justify-center md:justify-start gap-1">
            <Percent className="h-3 w-3" /> Passing standard: 50%
          </span>
        </div>

        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 space-y-1 text-center md:text-left">
          <span className="text-[10px] font-bold font-mono text-amber-500 uppercase tracking-wider block">Evaluations Pass Rate</span>
          <div className="text-3xl font-black font-mono text-amber-700">{passRate}%</div>
          <span className="text-[10px] font-semibold text-amber-500 flex items-center justify-center md:justify-start gap-1">
            <Award className="h-3 w-3" /> {examPassedCount} of {attempts.length} exams passed
          </span>
        </div>

        <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 space-y-1 text-center md:text-left">
          <span className="text-[10px] font-bold font-mono text-rose-400 uppercase tracking-wider block">Proctoring Violations</span>
          <div className="text-3xl font-black font-mono text-rose-700">{totalViolations} times</div>
          <span className="text-[10px] font-semibold text-rose-500 flex items-center justify-center md:justify-start gap-1">
            <ShieldAlert className="h-3 w-3" /> Security Lock Integrity Score
          </span>
        </div>
      </div>

      {/* Visual Recharts Section */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
        <h4 className="text-xs font-bold text-slate-500 uppercase font-mono tracking-wider mb-4 flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" /> 
          <span>Chronological {chartMetric === "GPA" ? "GPA Trend Map" : "Percentage Trend Map"}</span>
        </h4>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 30, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }}
                stroke="#cbd5e1"
              />
              <YAxis 
                domain={chartMetric === "GPA" ? [0, 5] : [0, 100]} 
                tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }}
                stroke="#cbd5e1"
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: "12px", 
                  borderColor: "#cbd5e1", 
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" 
                }}
                labelClassName="font-extrabold text-slate-800 text-xs"
              />
              <Legend verticalAlign="top" height={36} />
              
              {chartMetric === "GPA" ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="gpa"
                    name="Exam Grade Point"
                    stroke="#a5b4fc"
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                    dot={{ strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulativeGPA"
                    name="Cumulative GPA Line"
                    stroke="#4f46e5"
                    strokeWidth={4}
                    activeDot={{ r: 8 }}
                    dot={{ strokeWidth: 3, r: 5 }}
                  />
                </>
              ) : (
                <Line
                  type="monotone"
                  dataKey="percentage"
                  name="Exam Percentage (%)"
                  stroke="#10b981"
                  strokeWidth={4}
                  activeDot={{ r: 8 }}
                  dot={{ strokeWidth: 3, r: 5 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
    </div>
  );
}
