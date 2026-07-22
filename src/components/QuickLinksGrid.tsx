import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserCheck, 
  School, 
  Calendar, 
  Award, 
  ShieldCheck, 
  FileText, 
  Bot, 
  Pin,
  Sparkles,
  Sliders
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Color maps for the badges
const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100", accent: "bg-indigo-600" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", accent: "bg-emerald-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", accent: "bg-amber-600" },
  rose: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100", accent: "bg-rose-600" },
  violet: { bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-100", accent: "bg-violet-600" },
  sky: { bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-100", accent: "bg-sky-600" }
};

interface ModuleConfig {
  id: string;
  label: string;
  desc: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface QuickLinksGridProps {
  role: string;
  email: string;
  onNavigate: (tabId: string) => void;
}

export default function QuickLinksGrid({ role, email, onNavigate }: QuickLinksGridProps) {
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  // Unique local storage key per user role + email
  const storageKey = `cbt_pro_pinned_links_${role}_${email || "anonymous"}`;

  // Read pinned state on mount/change
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setPinnedIds(JSON.parse(stored));
      } else {
        // Initial defaults for pinning
        const initialDefaults: Record<string, string[]> = {
          ADMIN: ["students", "exams"],
          TEACHER: ["exams", "attendance"],
          STUDENT: ["student-exams"],
          PARENT: ["parent-portal", "parent-chat"]
        };
        const defaults = initialDefaults[role] || [];
        setPinnedIds(defaults);
        localStorage.setItem(storageKey, JSON.stringify(defaults));
      }
    } catch (err) {
      console.error("Failed to load pinned status:", err);
    }
  }, [storageKey, role]);

  // Define modules catalog for all roles
  const getModulesForRole = (): ModuleConfig[] => {
    if (role === "ADMIN") {
      return [
        { id: "students", label: "Student SIS", desc: "Manage admissions registrations, bio-data, and stream assignments.", icon: Users, color: "indigo" },
        { id: "admissions", label: "Admissions Workflow", desc: "Review, audit and approve entry applications and keys.", icon: UserCheck, color: "emerald" },
        { id: "classes", label: "Classes & Rooms", desc: "Configure stream capacities, study halls, and master guides.", icon: School, color: "amber" },
        { id: "timetable", label: "Timetable Engine", desc: "Run clash-free scheduler optimization algorithms.", icon: Calendar, color: "rose" },
        { id: "parents", label: "Parent Accounts", desc: "Track and link emergency advisor/guardian accounts.", icon: ShieldCheck, color: "violet" },
        { id: "exams", label: "Exams Portal", desc: "Publish CBT examinations, dynamic question grids, and continuous assessment.", icon: SkyCardIcon, color: "sky" }
      ];
    }

    if (role === "TEACHER") {
      return [
        { id: "exams", label: "Assessment Cloud", desc: "Compile questions, publish active test structures, and audit grades.", icon: Award, color: "indigo" },
        { id: "attendance", label: "ERP Attendance Logs", desc: "Log daily lecture trackers, coordinate warning SMS updates.", icon: UserCheck, color: "emerald" },
        { id: "students", label: "Class Roster", desc: "Analyze student academic portfolios and performance insights.", icon: Users, color: "amber" },
        { id: "timetable", label: "Schedules", desc: "Monitor classroom venues, lecture times, and supervision rosters.", icon: Calendar, color: "rose" }
      ];
    }

    if (role === "STUDENT") {
      return [
        { id: "student-exams", label: "CBT Examinations", desc: "Take live computer-based assessments with active countdown monitors.", icon: Award, color: "indigo" },
        { id: "student-history", label: "Attempt History", desc: "Analyze feedback reports, continuous assessment scores and scripts.", icon: FileText, color: "emerald" },
        { id: "student-timetable", label: "Class Timetable", desc: "Check venue reservations, test dates, and course syllabi.", icon: Calendar, color: "amber" }
      ];
    }

    if (role === "PARENT") {
      return [
        { id: "parent-portal", label: "Guardian Dashboard", desc: "Track continuous assessment progress and real-time attendance ratios.", icon: School, color: "indigo" },
        { id: "parent-chat", label: "AI Advisor Chat", desc: "Consult Gemini academic advisor on ward metrics and recommended revisions.", icon: Bot, color: "emerald" }
      ];
    }

    return [];
  };

  // Helper helper component for Sky-colored card icon inside ADMIN
  function SkyCardIcon(props: any) {
    return <Award {...props} />;
  }

  const allModules = getModulesForRole();

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card navigation
    let updated: string[];
    if (pinnedIds.includes(id)) {
      updated = pinnedIds.filter(item => item !== id);
    } else {
      updated = [...pinnedIds, id];
    }
    setPinnedIds(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const pinnedModules = allModules.filter(m => pinnedIds.includes(m.id));
  const remainingModules = allModules.filter(m => !pinnedIds.includes(m.id));

  // Helper to render card
  const renderCard = (module: ModuleConfig, isPinned: boolean) => {
    const colorTheme = COLOR_CLASSES[module.color] || COLOR_CLASSES.indigo;
    const Icon = module.icon;

    return (
      <motion.div
        layoutId={`card-${module.id}`}
        key={module.id}
        onClick={() => onNavigate(module.id)}
        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-300 hover:bg-slate-50/40 transition-all cursor-pointer relative group flex flex-col justify-between h-44"
        whileHover={{ y: -3 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div>
          {/* Header row with Icon and Pin control */}
          <div className="flex items-center justify-between">
            <div className={`p-2 rounded-xl ${colorTheme.bg} ${colorTheme.text} border ${colorTheme.border} transition-colors group-hover:bg-white`}>
              <Icon className="h-5 w-5" />
            </div>

            <button
              onClick={(e) => handleTogglePin(module.id, e)}
              className={`p-1.5 rounded-lg transition-all border outline-none ${
                isPinned 
                  ? "bg-amber-50 border-amber-200 text-amber-500 hover:bg-amber-100" 
                  : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600 opacity-0 group-hover:opacity-100 focus:opacity-100"
              }`}
              title={isPinned ? "Unpin from top" : "Pin to top of screen"}
            >
              <Pin className={`h-3.5 w-3.5 ${isPinned ? "rotate-45 fill-current" : ""}`} />
            </button>
          </div>

          <h4 className="font-bold text-slate-800 text-sm mt-3.5 group-hover:text-indigo-600 transition-colors flex items-center space-x-1.5">
            <span>{module.label}</span>
            {isPinned && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full inline-block"></span>}
          </h4>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{module.desc}</p>
        </div>

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100/60 text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-indigo-500 transition-colors">
          <span>Access Module</span>
          <span className="text-slate-300 group-hover:translate-x-1 transition-transform">→</span>
        </div>
      </motion.div>
    );
  };

  if (allModules.length === 0) return null;

  return (
    <div className="space-y-6" id="quick-links-workbench">
      
      {/* Pinned Links Section */}
      {pinnedModules.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
              <Pin className="h-3.5 w-3.5 text-amber-500 rotate-45 fill-amber-500" />
              <span>Pinned Workspace Shortcuts</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-bold">
              {pinnedModules.length} Pinned
            </span>
          </div>

          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {pinnedModules.map(m => renderCard(m, true))}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {/* Remaining Links Section */}
      {remainingModules.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
            <Sliders className="h-3.5 w-3.5 text-slate-400" />
            <span>{pinnedModules.length > 0 ? "Other Available Modules" : "All Available Modules"}</span>
          </h3>

          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {remainingModules.map(m => renderCard(m, false))}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {/* Quick Pin Tip Banner */}
      {pinnedModules.length === 0 && (
        <div className="p-3.5 bg-indigo-50/50 border border-indigo-100/60 rounded-2xl flex items-center space-x-3 text-xs text-indigo-700">
          <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" />
          <p className="font-medium">
            <strong>Customization Tip:</strong> Hover over any workspace module card above and click the <Pin className="h-3 w-3 inline rotate-45" /> pin icon to pin it directly to the top of your workspace screen.
          </p>
        </div>
      )}

    </div>
  );
}
