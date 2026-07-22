import React, { useState, useEffect, useRef } from "react";
import { 
  BookOpen, 
  School, 
  UserCheck, 
  Calendar, 
  Users, 
  Award, 
  FileText, 
  LogOut, 
  User, 
  Bot, 
  Sparkles,
  Sliders,
  Bell,
  Search,
  X,
  ChevronRight,
  Mail,
  HardDrive,
  CreditCard,
  Layers
} from "lucide-react";
import { UserRole } from "../types";
import ReportExportModal from "./ReportExportModal";

interface ShellProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    tenantId: string;
  } | null;
  tenant?: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function Shell({ user, tenant, activeTab, setActiveTab, onLogout, children }: ShellProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedReportStudentId, setSelectedReportStudentId] = useState<string | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get navigation links based on user role
  const getNavLinks = () => {
    const common = [
      { id: "dashboard", label: "Dashboard", icon: BookOpen }
    ];

    if (!user) {
      return common;
    }

    if (user.role === "ADMIN") {
      const links = [
        ...common,
        { id: "students", label: "Student SIS", icon: Users },
        { id: "admissions", label: "Admissions Workflow", icon: UserCheck },
        { id: "classes", label: "Classes & Rooms", icon: School },
        { id: "timetable", label: "Timetable Engine", icon: Calendar },
        { id: "parents", label: "Parent Accounts", icon: Sliders },
        { id: "exams", label: "Exams Portal", icon: Award },
        { id: "billing", label: "Fees & ERP Billing", icon: CreditCard },
        { id: "lesson-notes-review", label: "Lesson Plans Review", icon: FileText },
        { id: "edves-erp", label: "EduOS Administrative ERP", icon: Sliders },
        { id: "ai-advisory", label: "Administrative AI Advisor", icon: Sparkles },
      ];

      const isSuperAdminEmail = [
        "adebayosamuel015@gmail.com",
        "admin@eduos.com",
        "sasinnovationgroup@gmail.com"
      ].includes(user.email?.toLowerCase());

      if (user.tenantId === "super-admin" || isSuperAdminEmail) {
        links.push({ id: "tenants", label: "Multi-tenant Management", icon: Layers });
      }

      links.push(
        { id: "gmail", label: "Gmail Hub", icon: Mail },
        { id: "drive", label: "Google Drive", icon: HardDrive }
      );

      return links;
    }

    if (user.role === "TEACHER") {
      return [
        ...common,
        { id: "exams", label: "Assessment Cloud", icon: Award },
        { id: "attendance", label: "ERP Attendance Logs", icon: UserCheck },
        { id: "students", label: "Class Roster", icon: Users },
        { id: "timetable", label: "Schedules", icon: Calendar },
        { id: "lesson-notes", label: "My Lesson Notes Plan", icon: FileText },
        { id: "edves-erp", label: "EduOS Administrative ERP", icon: Sliders },
        { id: "gmail", label: "Gmail Hub", icon: Mail },
        { id: "drive", label: "Google Drive", icon: HardDrive },
      ];
    }

    if (user.role === "STUDENT") {
      return [
        ...common,
        { id: "student-exams", label: "CBT Examinations", icon: Award },
        { id: "student-history", label: "Attempt History", icon: FileText },
        { id: "student-timetable", label: "Class Timetable", icon: Calendar },
        { id: "ogunlearn", label: "Study & Revision Center", icon: Sparkles },
        { id: "fees-payment", label: "School Fees Billing", icon: CreditCard },
      ];
    }

    if (user.role === "PARENT") {
      return [
        ...common,
        { id: "parent-portal", label: "Guardian Dashboard", icon: School },
        { id: "parent-fees", label: "Child's Tuition Billing", icon: CreditCard },
        { id: "parent-chat", label: "AI Advisor Chat", icon: Bot },
      ];
    }

    return common;
  };

  const rawLinks = getNavLinks();
  const links = user ? [...rawLinks, { id: "user-management", label: "User Accounts Settings", icon: Sliders }] : rawLinks;

  // Load student directory for instant global search matches
  useEffect(() => {
    if (user && (user.role === "ADMIN" || user.role === "TEACHER")) {
      const fetchStudents = async () => {
        try {
          setLoadingStudents(true);
          const token = localStorage.getItem("cbt_prox_token") || "";
          const res = await fetch("/api/students", {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setStudents(data);
          }
        } catch (err) {
          console.error("Failed to load student SIS records for search index:", err);
        } finally {
          setLoadingStudents(false);
        }
      };
      fetchStudents();
    }
  }, [user]);

  // Click outside to close search results popup
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut listener (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filtering calculations
  const filteredLinks = searchQuery.trim()
    ? links.filter(link => 
        link.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredStudents = searchQuery.trim()
    ? students.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.registrationNumber && s.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.className && s.className.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  if (!user) {
    return <>{children}</>;
  }

  const hasBg = tenant && tenant.backgroundImageUrl;
  const themePrimary = tenant?.primaryColor || "#4f46e5";

  return (
    <div 
      className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-hidden" 
      id="app-shell"
      style={hasBg ? {
        backgroundImage: `linear-gradient(to bottom, rgba(248, 250, 252, 0.85), rgba(248, 250, 252, 0.95)), url(${tenant.backgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      } : {}}
    >
      {/* Fixed Ambient Blurring Overlay when background image is present */}
      {hasBg && (
        <div 
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `url(${tenant.backgroundImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(24px) saturate(1.25) brightness(0.98)",
            opacity: 0.35,
            transform: "scale(1.1)"
          }}
        />
      )}

      {/* Upper Navigation Bar */}
      <header className={`sticky top-0 z-30 border-b transition-all duration-300 relative ${
        hasBg 
          ? "bg-white/75 backdrop-blur-md border-slate-200/50 shadow-xs" 
          : "bg-white border-slate-200"
      }`} id="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 shrink-0 relative z-10">
            {tenant && tenant.logoUrl ? (
              <img 
                src={tenant.logoUrl} 
                alt={`${tenant.name} Logo`} 
                className="w-9 h-9 rounded-lg object-contain bg-slate-50 border border-slate-100 p-0.5 shrink-0 shadow-3xs"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div 
                className="text-white p-2 rounded-lg flex items-center justify-center shadow-md shadow-indigo-100"
                style={{ backgroundColor: themePrimary }}
              >
                <School className="h-5 w-5" />
              </div>
            )}
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-600 to-violet-700 bg-clip-text text-transparent">
                {tenant ? tenant.name.toUpperCase() : "CBT PRO X"}
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold uppercase tracking-wider">
                {tenant ? "School Portal" : "EduOS Monolith"}
              </span>
            </div>
          </div>

          {/* Global Search Component */}
          <div className="flex-1 max-w-sm mx-4 relative hidden sm:block" ref={searchRef}>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder="Search modules or student SIS... (⌘K)"
                className="w-full bg-slate-50 border border-slate-200 pl-9 pr-8 py-1.5 text-xs rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 transition-all font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Results Dropdown */}
            {isOpen && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {/* Modules Matches */}
                {filteredLinks.length > 0 && (
                  <div className="p-2">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest px-2 py-0.5 block">Active Modules</span>
                    {filteredLinks.map((link) => {
                      const IconComponent = link.icon;
                      return (
                        <button
                          key={link.id}
                          onClick={() => {
                            setActiveTab(link.id);
                            setSearchQuery("");
                            setIsOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 transition-colors flex items-center justify-between rounded-lg group"
                        >
                          <div className="flex items-center space-x-2">
                            <IconComponent className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600" />
                            <span className="text-xs font-semibold text-slate-700 group-hover:text-indigo-600">{link.label}</span>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Student Records Matches */}
                {filteredStudents.length > 0 && (
                  <div className="p-2">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest px-2 py-0.5 block">Student SIS Records</span>
                    {filteredStudents.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSelectedReportStudentId(s.id);
                          setSearchQuery("");
                          setIsOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between rounded-lg group"
                      >
                        <div>
                          <div className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{s.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {s.registrationNumber} • {s.className || "No Class"} {s.attendanceRate ? `• ${s.attendanceRate}% Att.` : ""}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 text-[9px] font-extrabold text-indigo-500 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-50/50 px-2 py-1 rounded">
                          <span>View Report</span>
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {filteredLinks.length === 0 && filteredStudents.length === 0 && (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No matching modules or student records found.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4 shrink-0">
            <div className="flex items-center space-x-2 text-right hidden md:block">
              <div className="text-sm font-semibold text-slate-800">{user.name}</div>
              <div className="text-xs font-mono text-slate-500 flex items-center justify-end space-x-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
                <span>{user.role} Portal</span>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

            <button 
              onClick={onLogout}
              className="flex items-center space-x-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              title="Sign Out"
              id="btn-logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Left Side Rail for Large Screens */}
        {user.role !== "PARENT" && (
          <aside className="w-64 flex-shrink-0 hidden lg:block relative z-10" id="side-rail">
            <div className={`sticky top-22 rounded-xl p-4 border transition-all duration-300 ${
              hasBg 
                ? "bg-white/80 backdrop-blur-md border-white/50 shadow-lg" 
                : "bg-white border-slate-200 shadow-sm"
            } space-y-6`}>
              <div className="px-2">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Core Navigation</h2>
              </div>
              <nav className="space-y-1">
                {links.map((link) => {
                  const IconComponent = link.icon;
                  const isSelected = activeTab === link.id;
                  return (
                    <button
                      key={link.id}
                      id={`nav-link-${link.id}`}
                      onClick={() => setActiveTab(link.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600 font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent"
                      }`}
                    >
                      <IconComponent className={`h-4 w-4 ${isSelected ? "text-indigo-600" : "text-slate-400"}`} />
                      <span>{link.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-slate-100">
                <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-lg p-3 text-center border border-indigo-100">
                  <Sparkles className="h-5 w-5 text-indigo-500 mx-auto mb-1 animate-bounce" />
                  <h4 className="text-xs font-bold text-slate-800">CBT PRO X Intelligent AI</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Generative exam assessment & student risk forecasts</p>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Dynamic Center Workstage Column */}
        <main className="flex-1 min-w-0" id="center-workstage">
          {/* Mobile Quick Rail Bar */}
          {user.role !== "PARENT" && (
            <div className={`lg:hidden mb-6 rounded-xl p-2 flex space-x-1 overflow-x-auto border transition-all duration-300 relative z-10 ${
              hasBg 
                ? "bg-white/80 backdrop-blur-md border-white/50 shadow-md" 
                : "bg-white border-slate-200 shadow-sm"
            }`} id="mobile-nav">
              {links.map((link) => {
                const IconComponent = link.icon;
                const isSelected = activeTab === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => setActiveTab(link.id)}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <IconComponent className="h-3.5 w-3.5" />
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Parent Minimalist Header Tab bar */}
          {user.role === "PARENT" && (
            <div className={`mb-6 rounded-2xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border transition-all duration-300 relative z-10 ${
              hasBg 
                ? "bg-white/80 backdrop-blur-md border-white/50 shadow-md" 
                : "bg-white border-slate-200 shadow-sm"
            }`} id="parent-subtabs">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-widest text-center">WARD DOSSIER HUB</span>
                <div className="flex flex-wrap gap-1">
                  {links.map((link) => {
                    const IconComponent = link.icon;
                    const isSelected = activeTab === link.id;
                    return (
                      <button
                        key={link.id}
                        onClick={() => setActiveTab(link.id)}
                        className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <IconComponent className="h-4 w-4" />
                        <span>{link.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="text-[9px] font-mono text-slate-400 font-bold self-center sm:pr-2">
                🔒 SECURE PARENT INTEGRITY CHANNEL
              </div>
            </div>
          )}

          <div className="space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Footer Credentials Info */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400 font-mono">
          CBT PRO X Educational Operating System • Monolithic Architecture Standard v2.0 • Secured Multi-Tenant Pipeline
        </div>
      </footer>

      {selectedReportStudentId && (
        <ReportExportModal
          studentId={selectedReportStudentId}
          token={localStorage.getItem("cbt_prox_token") || ""}
          onClose={() => setSelectedReportStudentId(null)}
        />
      )}
    </div>
  );
}
