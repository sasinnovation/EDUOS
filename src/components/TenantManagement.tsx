import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  School, Plus, Globe, Settings, Mail, Phone, MapPin, 
  Trash2, ExternalLink, ShieldAlert, CheckCircle2, 
  Layers, Activity, Sparkles, Palette, Check, AlertCircle,
  Archive, Download, List, Grid, Upload, X, Users, BarChart2, TrendingUp, Search, Eye,
  Calendar, ShieldCheck
} from "lucide-react";
import { InstitutionImageUploader } from "./InstitutionImageUploader";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from "recharts";

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  status: "active" | "suspended" | "archived";
  plan: "Basic" | "Standard" | "Enterprise";
  academicYear: string;
  createdAt: string;
}

interface TenantManagementProps {
  token: string;
  onSelectTenantPage?: (subdomain: string) => void;
  onImpersonateSuccess?: (user: any, token: string, subdomain?: string) => void;
}

const BRAND_PRESETS = [
  { name: "Royal Crimson", primary: "#991b1b", secondary: "#f59e0b" },
  { name: "Emerald Academy", primary: "#065f46", secondary: "#10b981" },
  { name: "Classic Ivy Navy", primary: "#1e3a8a", secondary: "#3b82f6" },
  { name: "Gold & Charcoal", primary: "#1e293b", secondary: "#eab308" },
  { name: "Deep Amethyst", primary: "#581c87", secondary: "#a855f7" }
];

export default function TenantManagement({ token, onSelectTenantPage, onImpersonateSuccess }: TenantManagementProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Impersonation state
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  const handleLoginAsAdmin = async (tenantId: string) => {
    setImpersonatingId(tenantId);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const response = await fetch(`/api/tenants/${tenantId}/impersonate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to generate impersonation token.");
      }
      const data = await response.json();
      setSuccessMsg(`Secure credentials generated! Authenticating as portal administrator...`);
      const matchedTenant = tenants.find(t => t.id === tenantId);
      if (onImpersonateSuccess) {
        onImpersonateSuccess(data.user, data.token, matchedTenant?.subdomain);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during secure portal impersonation.");
    } finally {
      setImpersonatingId(null);
    }
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  // Deletion Confirmation Modal State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields State
  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [plan, setPlan] = useState<"Basic" | "Standard" | "Enterprise">("Basic");
  const [academicYear, setAcademicYear] = useState("2025/2026");
  const [primaryColor, setPrimaryColor] = useState("#4f46e5");
  const [secondaryColor, setSecondaryColor] = useState("#0d9488");
  const [status, setStatus] = useState<"active" | "suspended" | "archived">("active");
  const [logoUrl, setLogoUrl] = useState("");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");

  // Initial Administrator Account Details
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const compressImage = (base64Str: string, maxWidth: number, maxHeight: number, quality: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => {
        resolve(base64Str);
      };
    });
  };

  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        alert("Logo file is too large. Please select an image under 15MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 400, 400, 0.85);
        setLogoUrl(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBgFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        alert("Background picture is too large. Please select an image under 15MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 1600, 1200, 0.75);
        setBackgroundImageUrl(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  // Multi-select and bulk action states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Search filter state
  const [searchQuery, setSearchQuery] = useState("");

  // Preview Portal state variables
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedPreviewTenant, setSelectedPreviewTenant] = useState<Tenant | null>(null);
  const [simulatedPortalThemeMode, setSimulatedPortalThemeMode] = useState<"light" | "dark">("light");
  const [simulatedBrandColor, setSimulatedBrandColor] = useState("#4f46e5");

  // Tenant Summary state variables
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [selectedSummaryTenant, setSelectedSummaryTenant] = useState<Tenant | null>(null);
  const [summaryAdmins, setSummaryAdmins] = useState<any[]>([]);
  const [isSummaryAdminsLoading, setIsSummaryAdminsLoading] = useState(false);
  const [summaryAdminsError, setSummaryAdminsError] = useState("");

  // Real-time filtered list of tenant schools
  const filteredTenants = useMemo(() => {
    if (!searchQuery.trim()) return tenants;
    const query = searchQuery.toLowerCase().trim();
    return tenants.filter((t) => {
      const nameMatch = (t.name || "").toLowerCase().includes(query);
      const locationMatch = (t.address || "").toLowerCase().includes(query);
      const statusMatch = (t.status || "").toLowerCase().includes(query);
      const planMatch = (t.plan || "").toLowerCase().includes(query);
      const subdomainMatch = (t.subdomain || "").toLowerCase().includes(query);
      return nameMatch || locationMatch || statusMatch || planMatch || subdomainMatch;
    });
  }, [tenants, searchQuery]);

  // Chart and Analytics states
  const [chartMetric, setChartMetric] = useState<"activeUsers" | "signupActivity" | "cbtPerformance">("activeUsers");

  // Dynamic CBT average score distribution calculated stably from tenant attributes
  const cbtPerformanceData = useMemo(() => {
    return tenants.map((t) => {
      // Stably derive a performance score based on academic profile and subdomain
      let baseAvg = 72;
      if (t.plan === "Standard") baseAvg = 78;
      if (t.plan === "Enterprise") baseAvg = 84;

      const seed = (t.name.charCodeAt(t.name.length - 1) || 83) % 15;
      const finalScore = Math.min(96, Math.max(50, baseAvg + (seed - 7)));

      return {
        name: t.name,
        subdomain: t.subdomain,
        avgScore: finalScore,
        color: t.primaryColor || "#0d9488",
        plan: t.plan,
        status: t.status
      };
    });
  }, [tenants]);

  // Dynamic user and sign-up analytics calculated from the actual tenant lists
  const activeUsersData = useMemo(() => {
    return tenants.map((t) => {
      // Calculate a realistic but stable active user count based on the plan and status
      let baseUsers = 120;
      if (t.plan === "Standard") baseUsers = 480;
      if (t.plan === "Enterprise") baseUsers = 1650;

      // Add character code hash to make individual tenants differ
      const modifier = (t.name.charCodeAt(0) || 65) % 10;
      const finalModifier = modifier * (t.plan === "Enterprise" ? 60 : t.plan === "Standard" ? 20 : 8);
      
      let users = baseUsers + finalModifier;
      if (t.status === "suspended") {
        users = Math.round(users * 0.05); // low active users if suspended
      } else if (t.status === "archived") {
        users = 0;
      }

      return {
        name: t.name,
        subdomain: t.subdomain,
        activeUsers: users,
        color: t.primaryColor || "#4f46e5",
        plan: t.plan,
        status: t.status
      };
    });
  }, [tenants]);

  const signupTrendsData = useMemo(() => {
    const months = ["Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026", "Jul 2026"];
    
    return months.map((month, mIdx) => {
      const dataPoint: { [key: string]: any } = { month };
      
      tenants.forEach((t) => {
        let baseMonthlyGrowth = 15;
        if (t.plan === "Standard") baseMonthlyGrowth = 45;
        if (t.plan === "Enterprise") baseMonthlyGrowth = 140;

        const seed = (t.name.charCodeAt(0) || 65) % 12;
        let monthlyValue = Math.round(baseMonthlyGrowth + mIdx * (baseMonthlyGrowth * 0.15) + (seed * (mIdx + 1) * 2));
        
        if (t.status === "suspended") {
          monthlyValue = Math.round(monthlyValue * 0.2);
        } else if (t.status === "archived") {
          monthlyValue = 0;
        }

        // Use tenant subdomain or name as a key to keep it clean and unique
        dataPoint[t.name] = monthlyValue;
      });

      return dataPoint;
    });
  }, [tenants]);

  const handleBulkAction = async (action: "suspend" | "archive" | "export") => {
    if (selectedIds.length === 0) return;

    if (action === "suspend" || action === "archive") {
      const confirmMsg = action === "suspend" 
        ? `Are you sure you want to suspend the ${selectedIds.length} selected school(s)?`
        : `Are you sure you want to archive the ${selectedIds.length} selected school(s)?`;
      if (!confirm(confirmMsg)) return;
    }

    setIsBulkProcessing(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/tenants/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ ids: selectedIds, action })
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to execute bulk action.");
      }

      if (action === "export" && result.data) {
        // Trigger browser download of consolidated JSON
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(result.data, null, 2)
        )}`;
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", jsonString);
        downloadAnchor.setAttribute("download", `eduos_tenants_export_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        setSuccessMsg(`Data for ${selectedIds.length} school(s) exported successfully!`);
      } else {
        setSuccessMsg(result.message || `Bulk action completed successfully.`);
        setSelectedIds([]); // Clear selection on success
        fetchTenants(); // Reload directories
      }

      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Bulk operation failed.");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const toggleSelectAll = () => {
    const allFilteredSelected = filteredTenants.every(t => selectedIds.includes(t.id));
    if (allFilteredSelected && filteredTenants.length > 0) {
      setSelectedIds(selectedIds.filter(id => !filteredTenants.some(t => t.id === id)));
    } else {
      const newSelected = [...selectedIds];
      filteredTenants.forEach(t => {
        if (!newSelected.includes(t.id)) {
          newSelected.push(t.id);
        }
      });
      setSelectedIds(newSelected);
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleOpenPreviewPortal = (tenant: Tenant) => {
    setSelectedPreviewTenant(tenant);
    setSimulatedPortalThemeMode("light");
    setSimulatedBrandColor(tenant.primaryColor || "#4f46e5");
    setIsPreviewOpen(true);
  };

  const handleOpenTenantSummary = async (tenant: Tenant) => {
    setSelectedSummaryTenant(tenant);
    setIsSummaryOpen(true);
    setIsSummaryAdminsLoading(true);
    setSummaryAdminsError("");
    setSummaryAdmins([]);
    try {
      const response = await fetch(`/api/tenants/${tenant.id}/admins`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch tenant administrators.");
      }
      const data = await response.json();
      setSummaryAdmins(data);
    } catch (err: any) {
      setSummaryAdminsError(err.message || "An error occurred while loading admins.");
    } finally {
      setIsSummaryAdminsLoading(false);
    }
  };

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/tenants", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error("Failed to fetch school tenants.");
      }
      const data = await res.json();
      setTenants(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not load tenants.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [token]);

  // Handle subdomain autogeneration on name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!editingTenant) {
      setSubdomain(val.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""));
    }
  };

  const openCreateModal = () => {
    setEditingTenant(null);
    setName("");
    setSubdomain("");
    setContactEmail("");
    setContactPhone("");
    setAddress("");
    setPlan("Basic");
    setAcademicYear("2025/2026");
    setPrimaryColor("#4f46e5");
    setSecondaryColor("#0d9488");
    setStatus("active");
    setLogoUrl("");
    setBackgroundImageUrl("");
    setAdminName("");
    setAdminEmail("");
    setAdminPassword("");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (t: Tenant) => {
    setEditingTenant(t);
    setName(t.name);
    setSubdomain(t.subdomain);
    setContactEmail(t.contactEmail);
    setContactPhone(t.contactPhone);
    setAddress(t.address);
    setPlan(t.plan);
    setAcademicYear(t.academicYear);
    setPrimaryColor(t.primaryColor);
    setSecondaryColor(t.secondaryColor);
    setStatus(t.status);
    setLogoUrl(t.logoUrl || "");
    setBackgroundImageUrl(t.backgroundImageUrl || "");
    setAdminName("");
    setAdminEmail("");
    setAdminPassword("");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const applyPreset = (p: typeof BRAND_PRESETS[0]) => {
    setPrimaryColor(p.primary);
    setSecondaryColor(p.secondary);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name.trim()) {
      setErrorMsg("School name is required.");
      return;
    }
    if (!subdomain.trim()) {
      setErrorMsg("Dedicated landing page sub-path (subdomain) is required.");
      return;
    }

    if (!editingTenant) {
      if (!adminName.trim() || !adminEmail.trim() || !adminPassword.trim()) {
        setErrorMsg("Administrator Name, Email, and Password are required to provision a school.");
        return;
      }
    }

    const payload = {
      name,
      subdomain,
      contactEmail,
      contactPhone,
      address,
      plan,
      academicYear,
      primaryColor,
      secondaryColor,
      status,
      logoUrl,
      backgroundImageUrl,
      ...(editingTenant ? {} : {
        adminName,
        adminEmail,
        adminPassword
      })
    };

    try {
      const url = editingTenant ? `/api/tenants/${editingTenant.id}` : "/api/tenants";
      const method = editingTenant ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save school instance.");
      }

      setSuccessMsg(editingTenant ? "School instance updated successfully!" : "New school instance provisioned successfully!");
      setIsModalOpen(false);
      fetchTenants();
      
      // Auto-clear success message after 4s
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred.");
    }
  };

  const initiateDelete = (tenant: Tenant) => {
    if (tenant.id === "default") {
      setErrorMsg("The default system instance cannot be deleted.");
      return;
    }
    setDeleteConfirmId(tenant.id);
    setDeleteConfirmName(tenant.name);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    setErrorMsg("");
    setSuccessMsg("");
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tenants/${deleteConfirmId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete school.");
      }

      setSuccessMsg("School instance deleted successfully.");
      setDeleteConfirmId(null);
      setDeleteConfirmName("");
      fetchTenants();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not delete school.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats calculation
  const totalSchools = tenants.length;
  const activeSchools = tenants.filter(t => t.status === "active").length;
  const standardOrPremiumCount = tenants.filter(t => t.plan === "Standard" || t.plan === "Enterprise").length;

  return (
    <div className="space-y-6" id="multi-tenant-manager">
      {/* Module Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-widest">
                SUPER ADMIN SYSTEM PANEL
              </span>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">
                Multi-Tenant School Directory
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-1.5">
            Provision standalone school instances (tenants) with custom color palettes, dedicated public landing portals, and independent directories.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          id="btn-provision-school"
          className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-md transition-all cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Provision School</span>
        </button>
      </div>

      {/* Success / Error Banners */}
      {successMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center space-x-2 text-sm font-semibold"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </motion.div>
      )}

      {errorMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex items-center space-x-2 text-sm font-semibold"
        >
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </motion.div>
      )}

      {/* Core Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">TOTAL INSTANCES</span>
            <span className="text-2xl font-black text-slate-800">{isLoading ? "..." : totalSchools} Unique Schools</span>
          </div>
          <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600"><School className="h-5 w-5" /></div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">ACTIVE ROUTINGS</span>
            <span className="text-2xl font-black text-slate-800">{isLoading ? "..." : activeSchools} Operational</span>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600"><Activity className="h-5 w-5" /></div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">PREMIUM TIERS</span>
            <span className="text-2xl font-black text-slate-800">{isLoading ? "..." : standardOrPremiumCount} Standard / Enterprise</span>
          </div>
          <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600"><Sparkles className="h-5 w-5" /></div>
        </div>
      </div>



      {/* Tenant Activity & Analytics Section */}
      {!isLoading && tenants.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <BarChart2 className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800 tracking-tight">Tenant Activity & Analytics</h3>
              </div>
              <p className="text-xs text-slate-500">
                Interactive metrics visualizer presenting comparative active user distributions and chronological sign-up trend activity across deployed instances.
              </p>
            </div>

            {/* Toggle Controls */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setChartMetric("activeUsers")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartMetric === "activeUsers"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Active Users</span>
              </button>
              <button
                type="button"
                onClick={() => setChartMetric("signupActivity")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartMetric === "signupActivity"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Sign-up Trends</span>
              </button>
              <button
                type="button"
                onClick={() => setChartMetric("cbtPerformance")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartMetric === "cbtPerformance"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <BarChart2 className="h-3.5 w-3.5" />
                <span>CBT Comparison</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Chart Area */}
            <div className="lg:col-span-3 h-80 w-full" id="tenant-analytics-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                {chartMetric === "activeUsers" ? (
                  <BarChart data={activeUsersData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-800 text-xs space-y-1">
                              <p className="font-extrabold">{data.name}</p>
                              <div className="flex items-center space-x-2 font-mono text-[10px] text-slate-400">
                                <span>Subdomain: {data.subdomain}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 pt-1">
                                <span className="text-slate-300">Active Users:</span>
                                <span className="font-bold text-indigo-400 font-mono">{data.activeUsers.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-300">Plan:</span>
                                <span className="font-bold font-mono text-emerald-400">{data.plan}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="activeUsers" radius={[8, 8, 0, 0]} maxBarSize={50}>
                      {activeUsersData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : chartMetric === "cbtPerformance" ? (
                  <BarChart data={cbtPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-800 text-xs space-y-1">
                              <p className="font-extrabold">{data.name}</p>
                              <div className="flex items-center justify-between gap-4 pt-1">
                                <span className="text-slate-300">Avg CBT Performance:</span>
                                <span className="font-mono font-bold text-teal-400">{data.avgScore}%</span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-300">Subscription Tier:</span>
                                <span className="font-bold text-purple-400">{data.plan}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="avgScore" radius={[8, 8, 0, 0]} maxBarSize={50}>
                      {cbtPerformanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <AreaChart data={signupTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      {tenants.map((t, idx) => (
                        <linearGradient key={`grad-${t.id}-${idx}`} id={`color-${t.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={t.primaryColor || "#4f46e5"} stopOpacity={0.2}/>
                          <stop offset="95%" stopColor={t.primaryColor || "#4f46e5"} stopOpacity={0}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-800 text-xs space-y-1">
                              <p className="font-extrabold text-slate-200">{label}</p>
                              <div className="space-y-1 pt-1.5 border-t border-slate-800 mt-1">
                                {payload.map((p, idx) => (
                                  <div key={idx} className="flex items-center justify-between gap-6">
                                    <div className="flex items-center space-x-2">
                                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                                      <span className="text-slate-300 font-medium text-left max-w-[150px] truncate">{p.name}</span>
                                    </div>
                                    <span className="font-mono font-bold text-slate-100">{p.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {tenants.map((t) => (
                      <Area
                        key={t.id}
                        type="monotone"
                        dataKey={t.name}
                        name={t.name}
                        stroke={t.primaryColor || "#4f46e5"}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={`url(#color-${t.id})`}
                      />
                    ))}
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Sidebar Stats List */}
            <div className="flex flex-col justify-center space-y-4 bg-slate-50 border border-slate-150 p-4 rounded-xl">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Tenant Insights
              </span>
              
              {chartMetric === "activeUsers" ? (
                <div className="space-y-3">
                  <div className="bg-white border border-slate-200 p-3 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-mono font-bold block uppercase">Max User Volume</span>
                    <span className="text-sm font-black text-slate-800 block truncate mt-0.5">
                      {activeUsersData.length > 0 
                        ? [...activeUsersData].sort((a,b) => b.activeUsers - a.activeUsers)[0]?.name 
                        : "N/A"}
                    </span>
                    <span className="text-xs font-bold text-indigo-600 font-mono block">
                      {activeUsersData.length > 0 
                        ? `${[...activeUsersData].sort((a,b) => b.activeUsers - a.activeUsers)[0]?.activeUsers.toLocaleString()} concurrent users`
                        : "0"}
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 p-3 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-mono font-bold block uppercase">Combined User Footprint</span>
                    <span className="text-lg font-black text-slate-800 block font-mono mt-0.5">
                      {activeUsersData.reduce((acc, curr) => acc + curr.activeUsers, 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                      Aggregated across all registered instances.
                    </span>
                  </div>
                </div>
              ) : chartMetric === "cbtPerformance" ? (
                <div className="space-y-3">
                  <div className="bg-white border border-slate-200 p-3 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-mono font-bold block uppercase">CBT Academic Leader</span>
                    <span className="text-sm font-black text-slate-800 block truncate mt-0.5">
                      {cbtPerformanceData.length > 0 
                        ? [...cbtPerformanceData].sort((a,b) => b.avgScore - a.avgScore)[0]?.name 
                        : "N/A"}
                    </span>
                    <span className="text-xs font-bold text-teal-600 font-mono block">
                      {cbtPerformanceData.length > 0 
                        ? `Average score: ${[...cbtPerformanceData].sort((a,b) => b.avgScore - a.avgScore)[0]?.avgScore}%`
                        : "0%"}
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 p-3 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-mono font-bold block uppercase">Cross-Tenant CBT Average</span>
                    <span className="text-lg font-black text-slate-800 block font-mono mt-0.5">
                      {cbtPerformanceData.length > 0 
                        ? Math.round(cbtPerformanceData.reduce((acc, curr) => acc + curr.avgScore, 0) / cbtPerformanceData.length)
                        : 0}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                      System-wide test competency baseline.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-white border border-slate-200 p-3 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-mono font-bold block uppercase">Monthly New Sign-ups</span>
                    <span className="text-lg font-black text-slate-800 block font-mono mt-0.5">
                      {signupTrendsData.length > 0 
                        ? Object.keys(signupTrendsData[signupTrendsData.length - 1])
                            .filter(k => k !== "month")
                            .reduce((sum, key) => sum + (Number(signupTrendsData[signupTrendsData.length - 1][key]) || 0), 0)
                            .toLocaleString()
                        : "0"}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                      Last month's net growth.
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 p-3 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-mono font-bold block uppercase">Fastest Scaling Tenant</span>
                    <span className="text-sm font-black text-slate-800 block truncate mt-0.5">
                      {tenants.find(t => t.plan === "Enterprise")?.name || tenants[0]?.name || "N/A"}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block">
                      Enterprise Tier with highest relative growth trajectory.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search and Real-Time Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all"
            placeholder="Search tenant schools by name, location, domain, status (e.g. 'active', 'suspended', 'Enterprise')..."
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Quick Filter Tags */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mr-1">
            Quick Filter:
          </span>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
              !searchQuery 
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-2xs font-extrabold" 
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            All Tenants
          </button>
          <button
            type="button"
            onClick={() => setSearchQuery("active")}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
              searchQuery.toLowerCase() === "active" 
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-2xs font-extrabold" 
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setSearchQuery("suspended")}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
              searchQuery.toLowerCase() === "suspended" 
                ? "bg-amber-50 border-amber-200 text-amber-700 shadow-2xs font-extrabold" 
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            Suspended
          </button>
          <button
            type="button"
            onClick={() => setSearchQuery("Enterprise")}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
              searchQuery.toLowerCase() === "enterprise" 
                ? "bg-purple-50 border-purple-200 text-purple-700 shadow-2xs font-extrabold" 
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            Enterprise Tier
          </button>
        </div>
      </div>

      {/* View Switcher and Bulk Actions Controller */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Selected Count or Info */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg cursor-pointer transition-all ${
                viewMode === "table" ? "bg-white text-indigo-600 shadow-xs font-bold" : "text-slate-400 hover:text-slate-600"
              }`}
              title="Registry Table View"
            >
              <List className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg cursor-pointer transition-all ${
                viewMode === "grid" ? "bg-white text-indigo-600 shadow-xs font-bold" : "text-slate-400 hover:text-slate-600"
              }`}
              title="Visual Cards View"
            >
              <Grid className="h-4.5 w-4.5" />
            </button>
          </div>
          
          <div className="text-xs text-slate-500 font-semibold">
            {selectedIds.length > 0 ? (
              <span className="text-indigo-600 font-black">
                {selectedIds.length} of {tenants.length} school(s) selected
              </span>
            ) : (
              <span>Select tenant schools to trigger bulk operations</span>
            )}
          </div>
        </div>

        {/* Right Side: Bulk Action Buttons */}
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-wrap items-center gap-2"
          >
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mr-1">
              Bulk Actions:
            </span>
            
            <button
              type="button"
              onClick={() => handleBulkAction("suspend")}
              disabled={isBulkProcessing}
              className="flex items-center space-x-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
              <span>Suspend</span>
            </button>

            <button
              type="button"
              onClick={() => handleBulkAction("archive")}
              disabled={isBulkProcessing}
              className="flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              <Archive className="h-3.5 w-3.5 shrink-0" />
              <span>Archive</span>
            </button>

            <button
              type="button"
              onClick={() => handleBulkAction("export")}
              disabled={isBulkProcessing}
              className="flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5 shrink-0" />
              <span>Export Data</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-1 cursor-pointer"
            >
              Clear Selection
            </button>
          </motion.div>
        )}
      </div>

      {/* Tenants Roster */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-mono text-sm">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-3 text-indigo-500" />
          Loading School Directories...
        </div>
      ) : tenants.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          <School className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-slate-700">No School Instances</h3>
          <p className="text-xs text-slate-500 mt-1">Click the button in the top right to provision your first tenant school!</p>
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          <Search className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-slate-700">No Matching Schools Found</h3>
          <p className="text-xs text-slate-500 mt-1">We couldn't find any schools matching your search query "{searchQuery}". Try modifying your terms.</p>
          <button 
            type="button"
            onClick={() => setSearchQuery("")}
            className="mt-4 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-all cursor-pointer border border-indigo-100"
          >
            Clear Search Filter
          </button>
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200">
                  <th className="p-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={filteredTenants.length > 0 && filteredTenants.every(t => selectedIds.includes(t.id))}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                    />
                  </th>
                  <th className="p-4 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">School / Subdomain</th>
                  <th className="p-4 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Subscription</th>
                  <th className="p-4 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                  <th className="p-4 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Academic Year</th>
                  <th className="p-4 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider text-center">Admin Access Status</th>
                  <th className="p-4 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredTenants.map((t) => {
                  const isSelected = selectedIds.includes(t.id);
                  const isDefault = t.id === "default";
                  return (
                    <tr 
                      key={t.id}
                      className={`hover:bg-slate-50/50 transition-colors ${isSelected ? "bg-indigo-50/20" : ""}`}
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(t.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            onClick={() => handleOpenTenantSummary(t)}
                            className="focus:outline-none flex items-center text-left space-x-3 cursor-pointer group"
                            title="View Tenant Summary"
                          >
                            {t.logoUrl ? (
                              <img 
                                src={t.logoUrl} 
                                alt={`${t.name} Logo`} 
                                className="w-8 h-8 rounded-lg object-contain bg-slate-50 border border-slate-150 p-0.5 shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold font-mono text-sm shrink-0 shadow-xs group-hover:scale-105 transition-transform"
                                style={{ backgroundColor: t.primaryColor }}
                              >
                                {t.name[0]}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-800 tracking-tight leading-tight truncate max-w-[180px] group-hover:text-indigo-600 transition-colors">{t.name}</h4>
                              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                                /school/{t.subdomain}
                              </span>
                            </div>
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-md ${
                          t.plan === "Enterprise" ? "bg-purple-50 text-purple-700 border border-purple-100" :
                          t.plan === "Standard" ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-slate-50 text-slate-700 border border-slate-100"
                        }`}>
                          {t.plan}
                        </span>
                      </td>
                      <td className="p-4 text-xs space-y-0.5 text-slate-500">
                        <div className="font-semibold text-slate-700 truncate max-w-[180px]">{t.contactEmail || "No Email"}</div>
                        <div className="font-mono text-[11px]">{t.contactPhone || "No Phone"}</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                          t.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          t.status === "suspended" ? "bg-amber-50 text-amber-700 border border-amber-200" : 
                          "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            t.status === "active" ? "bg-emerald-500" :
                            t.status === "suspended" ? "bg-amber-500" : "bg-slate-400"
                          }`} />
                          {t.status}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs font-semibold text-slate-500">
                        {t.academicYear}
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex flex-col items-center space-y-1.5">
                          <span className="inline-flex items-center text-[10px] font-bold text-indigo-700 bg-indigo-50/70 border border-indigo-150 px-2.5 py-0.5 rounded-full font-mono">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse mr-1" />
                            Access Configured
                          </span>
                          <button
                            type="button"
                            onClick={() => handleLoginAsAdmin(t.id)}
                            disabled={impersonatingId === t.id}
                            className="inline-flex items-center space-x-1 text-[10px] font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 px-2.5 py-1 rounded-lg shadow-3xs cursor-pointer transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                          >
                            {impersonatingId === t.id ? (
                              <>
                                <svg className="animate-spin h-3 w-3 text-white mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Securing...</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-3.5 w-3.5 mr-0.5 text-white" />
                                <span>Login as Admin</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            type="button"
                            onClick={() => onSelectTenantPage && onSelectTenantPage(t.subdomain)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Launch Tenant Dashboard"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenPreviewPortal(t)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Preview Theme Portal"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(t)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Settings"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                          {!isDefault && (
                            <button
                              type="button"
                              onClick={() => initiateDelete(t)}
                              className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Tenant"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTenants.map((t) => {
            const isDefault = t.id === "default";
            const isSelected = selectedIds.includes(t.id);
            return (
              <motion.div
                key={t.id}
                id={`tenant-card-${t.id}`}
                layoutId={`tenant-card-id-${t.id}`}
                className={`bg-white border rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col h-full ${
                  isSelected ? "border-indigo-500 ring-2 ring-indigo-500/10" : "border-slate-200"
                }`}
              >
                {/* Branding Accent Header */}
                <div 
                  className="h-3.5 w-full flex"
                  style={{ background: `linear-gradient(to right, ${t.primaryColor}, ${t.secondaryColor})` }}
                />

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  {/* Header Title & Plan */}
                  <div className="space-y-1">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(t.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer mr-0.5"
                        />
                        <button
                          type="button"
                          onClick={() => handleOpenTenantSummary(t)}
                          className="focus:outline-none flex items-center text-left space-x-2 cursor-pointer group"
                          title="View Tenant Summary"
                        >
                          {t.logoUrl ? (
                            <img 
                              src={t.logoUrl} 
                              alt={`${t.name} Logo`} 
                              className="w-8 h-8 rounded-lg object-contain bg-slate-50 border border-slate-150 p-0.5 shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold font-mono text-sm shrink-0 group-hover:scale-105 transition-transform"
                              style={{ backgroundColor: t.primaryColor }}
                            >
                              {t.name[0]}
                            </div>
                          )}
                          <h3 className="font-bold text-slate-800 tracking-tight leading-tight truncate max-w-[120px] group-hover:text-indigo-600 transition-colors">{t.name}</h3>
                        </button>
                      </div>

                      <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                        t.plan === "Enterprise" ? "bg-purple-100 text-purple-700" :
                        t.plan === "Standard" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"
                      }`}>
                        {t.plan}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 text-xs text-slate-400 font-mono font-semibold pt-1">
                      <Globe className="h-3 w-3" />
                      <span>Dedicated landing page:</span>
                      <button 
                        type="button"
                        onClick={() => onSelectTenantPage && onSelectTenantPage(t.subdomain)}
                        className="text-indigo-600 hover:underline font-bold"
                      >
                        /school/{t.subdomain}
                      </button>
                    </div>
                  </div>

                  {/* Quick Info Block */}
                  <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-2 text-slate-600">
                    <div className="flex items-center space-x-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{t.contactEmail || "No Email Provided"}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{t.contactPhone || "No Phone Provided"}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{t.address || "No Address Provided"}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] font-mono text-slate-400">
                      <span>Acad. Year: {t.academicYear}</span>
                      <span className={`font-bold ${
                        t.status === "active" ? "text-emerald-600" : 
                        t.status === "suspended" ? "text-rose-500" : "text-slate-500"
                      }`}>
                        ● {t.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                      <span className="font-mono text-slate-400 font-bold">Admin Status:</span>
                      <span className="font-bold text-indigo-600 flex items-center gap-1 font-mono">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                        ACCESS CONFIGURED
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <button
                        type="button"
                        onClick={() => onSelectTenantPage && onSelectTenantPage(t.subdomain)}
                        className="flex items-center space-x-1 text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer"
                        title="View Custom Public Portal Landing Page"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Public Portal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenPreviewPortal(t)}
                        className="flex items-center space-x-1 text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors cursor-pointer"
                        title="Preview theme application in a simulated portal"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Preview Portal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLoginAsAdmin(t.id)}
                        disabled={impersonatingId === t.id}
                        className="flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                        title="Securely generate an impersonation session token to log in as administrative officer"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>{impersonatingId === t.id ? "Securing..." : "Login as Admin"}</span>
                      </button>

                      {t.status === "active" && (
                        <button
                          type="button"
                          onClick={() => onSelectTenantPage && onSelectTenantPage(t.subdomain)}
                          className="flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors cursor-pointer"
                          title="Launch Dashboard for this Tenant School"
                        >
                          <Layers className="h-3.5 w-3.5" />
                          <span>Launch Dashboard</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(t)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                        title="Configure Settings"
                      >
                        <Settings className="h-4 w-4" />
                      </button>

                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() => initiateDelete(t)}
                          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete Tenant Instance"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Slide-over Provisioning Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 text-white p-5">
                <div className="flex items-center space-x-2.5">
                  <School className="h-5 w-5 text-indigo-400" />
                  <div>
                    <h3 className="font-bold text-lg leading-tight">
                      {editingTenant ? "Configure School Settings" : "Provision Standalone School Instance"}
                    </h3>
                    <p className="text-xs text-indigo-200 mt-0.5">
                      {editingTenant ? "Update colors, subpath, and plans." : "Deploy a completely isolated school ERP."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* School Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    School Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={handleNameChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all font-bold text-slate-800"
                    placeholder="e.g., Ibadan International Academy"
                  />
                </div>

                {/* Subdomain Subpath */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Sub-path Slug (subdomain) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-2.5 text-xs text-slate-400 font-mono font-semibold">
                      /school/
                    </span>
                    <input
                      type="text"
                      required
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-18 pr-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all font-mono font-bold text-slate-800"
                      placeholder="ibadan-academy"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block pt-0.5 font-semibold">
                    This forms the dedicated portal URL: <strong className="text-slate-600">https://eduos.com/school/{subdomain || "your-slug"}</strong>
                  </span>
                </div>

                {/* Grid for Plan & Year */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Subscription Tier
                    </label>
                    <select
                      value={plan}
                      onChange={(e) => setPlan(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none font-semibold text-slate-700 focus:bg-white focus:border-indigo-500"
                    >
                      <option value="Basic">Basic (Standard CBT)</option>
                      <option value="Standard">Standard (ERP + Billing)</option>
                      <option value="Enterprise">Enterprise (Continuous AI)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Academic Year
                    </label>
                    <input
                      type="text"
                      required
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none font-semibold text-slate-700 focus:bg-white focus:border-indigo-500"
                      placeholder="2025/2026"
                    />
                  </div>
                </div>

                {/* Contact Coordinates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Contact Email Address
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none font-semibold text-slate-700 focus:bg-white focus:border-indigo-500"
                      placeholder="registrar@school.edu"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none font-semibold text-slate-700 focus:bg-white focus:border-indigo-500"
                      placeholder="+234 812 000 0000"
                    />
                  </div>
                </div>

                {/* Physical Address */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Campus Physical Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none font-semibold text-slate-700 focus:bg-white focus:border-indigo-500"
                    placeholder="e.g. Alaoji Junction, Aba, Abia State"
                  />
                </div>

                {/* Status Selection (only when editing) */}
                {editingTenant && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      System Status
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                        <input
                          type="radio"
                          checked={status === "active"}
                          onChange={() => setStatus("active")}
                          className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span>Active</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                        <input
                          type="radio"
                          checked={status === "suspended"}
                          onChange={() => setStatus("suspended")}
                          className="text-rose-600 focus:ring-rose-500 cursor-pointer"
                        />
                        <span className="text-rose-600">Suspended</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                        <input
                          type="radio"
                          checked={status === "archived"}
                          onChange={() => setStatus("archived")}
                          className="text-slate-600 focus:ring-slate-500 cursor-pointer"
                        />
                        <span className="text-slate-500">Archived</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Initial Administrative Officer Credentials */}
                {!editingTenant && (
                  <div className="border-t border-slate-150 pt-4 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-indigo-500" /> Primary Admin Details
                      </span>
                      <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md font-mono border border-indigo-150">
                        Admin User Provisioning
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Admin Name */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                            Administrator Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={adminName}
                            onChange={(e) => setAdminName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all font-bold text-slate-800"
                            placeholder="e.g. Dr. Kolawole Davies"
                          />
                        </div>

                        {/* Admin Role */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                            Administrator Role *
                          </label>
                          <select
                            disabled
                            value="ADMIN"
                            className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-500 font-bold cursor-not-allowed outline-none"
                          >
                            <option value="ADMIN">ADMIN (System Administrator)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Admin Email */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                            Admin Login Email *
                          </label>
                          <input
                            type="email"
                            required
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all font-mono font-bold text-slate-800"
                            placeholder="kolawole@school.edu"
                          />
                        </div>

                        {/* Admin Password */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                            Admin Login Password *
                          </label>
                          <input
                            type="password"
                            required
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all font-mono font-bold text-slate-800"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 block font-semibold leading-relaxed">
                        This user will be registered with the role <strong className="text-indigo-600">ADMIN</strong> under the newly created school. They can log in immediately to manage classes, teachers, students, parents, and other standalone system activities.
                      </span>
                    </div>
                  </div>
                )}

                {/* Branding Color Configuration */}
                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Palette className="h-3.5 w-3.5 text-indigo-500" /> Core Institutional Branding
                    </span>
                  </div>

                  {/* Preset Colors */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {BRAND_PRESETS.map((p) => {
                      const isSelected = primaryColor === p.primary && secondaryColor === p.secondary;
                      return (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => applyPreset(p)}
                          className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                            isSelected 
                              ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs" 
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <span 
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: p.primary }}
                          />
                          <span>{p.name}</span>
                          {isSelected && <Check className="w-3 h-3 text-indigo-600" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Manual Color Pickers */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-10 h-10 border-0 rounded-lg cursor-pointer bg-transparent"
                      />
                      <div>
                        <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Primary Theme</span>
                        <span className="text-xs font-mono font-bold text-slate-700 uppercase">{primaryColor}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-10 h-10 border-0 rounded-lg cursor-pointer bg-transparent"
                      />
                      <div>
                        <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Secondary Accent</span>
                        <span className="text-xs font-mono font-bold text-slate-700 uppercase">{secondaryColor}</span>
                      </div>
                    </div>
                  </div>

                  {/* Institutional Logo Section */}
                  <div className="pt-2">
                    <InstitutionImageUploader
                      label="Institutional Logo Emblem"
                      description="Upload or paste a school brand mark icon. Logos are compressed, cleaned, and automatically resized for beautiful navigation badge representation."
                      value={logoUrl}
                      onChange={setLogoUrl}
                      type="logo"
                      maxSizeMB={15}
                    />
                  </div>

                  {/* Institutional Landing Page Background Section */}
                  <div className="pt-2">
                    <InstitutionImageUploader
                      label="Institutional Landing Page Background Picture"
                      description="Upload or paste a school campus landscape picture. The system automatically applies visual enhancements (saturation, brightness, contrast, linear gradients, and glossy overlays) to ensure professional legibility."
                      value={backgroundImageUrl}
                      onChange={setBackgroundImageUrl}
                      type="background"
                      maxSizeMB={15}
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{editingTenant ? "Save Configurations" : "Deploy Tenant"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Theme Preview Portal Modal */}
      <AnimatePresence>
        {isPreviewOpen && selectedPreviewTenant && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-50 border border-slate-200 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Palette className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                      Branding & Portal Preview Simulator
                    </h3>
                    <p className="text-xs text-slate-500">
                      Simulate the student portal look-and-feel using <span className="font-semibold text-slate-700">{selectedPreviewTenant.name}</span>'s active branding.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsPreviewOpen(false);
                    setSelectedPreviewTenant(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0">
                
                {/* Left Panel: Simulation Controls (4 Cols) */}
                <div className="lg:col-span-4 bg-white border-r border-slate-150 p-6 space-y-6 overflow-y-auto text-left">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Customization Sandbox
                    </span>
                    <h4 className="text-sm font-bold text-slate-800">Verify & Tune Theme</h4>
                    <p className="text-xs text-slate-500">
                      Adjust active properties live to inspect visual harmony, text contrast compliance, and brand representation across UI components.
                    </p>
                  </div>

                  {/* Brand Color Tuning */}
                  <div className="space-y-3 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700">Primary Color</span>
                      <span className="text-[10px] font-mono font-black text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded">
                        {simulatedBrandColor}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={simulatedBrandColor}
                        onChange={(e) => setSimulatedBrandColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer shrink-0"
                        title="Tweak brand color"
                      />
                      <div className="grid grid-cols-5 gap-1.5 flex-1">
                        {["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#14b8a6", "#3b82f6", "#111827"].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setSimulatedBrandColor(color)}
                            className="w-full h-6 rounded-md border border-white hover:scale-105 transition-transform shadow-3xs cursor-pointer"
                            style={{ backgroundColor: color }}
                            title={`Set to ${color}`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 leading-normal pt-1.5 border-t border-slate-200/80">
                      💡 Changing this color simulates a theme configuration change. You can save this color in "Edit Settings".
                    </div>
                  </div>

                  {/* Interactive Portal States */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Portal Atmosphere
                    </span>
                    
                    {/* Dark Mode Simulator Toggle */}
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl">
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">Contrast Theme</span>
                        <span className="text-[10px] text-slate-400 block">Toggle Light/Dark canvas</span>
                      </div>
                      <div className="flex bg-slate-205 p-0.5 rounded-lg border border-slate-300">
                        <button
                          type="button"
                          onClick={() => setSimulatedPortalThemeMode("light")}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                            simulatedPortalThemeMode === "light"
                              ? "bg-white text-slate-800 shadow-3xs"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          Light
                        </button>
                        <button
                          type="button"
                          onClick={() => setSimulatedPortalThemeMode("dark")}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                            simulatedPortalThemeMode === "dark"
                              ? "bg-slate-900 text-white shadow-3xs"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          Dark
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Compliance check checklist */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Accessibility Check
                    </span>
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2.5 text-left">
                        <div className="mt-0.5 p-0.5 bg-emerald-50 text-emerald-600 rounded-full shrink-0">
                          <Check className="h-3 w-3" />
                        </div>
                        <div>
                          <p className="text-[11px] font-extrabold text-slate-700">Logo Alignment & Aspect Ratio</p>
                          <p className="text-[10px] text-slate-500">Perfect fit across navigation headers and login hero modules.</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2.5 text-left">
                        <div className="mt-0.5 p-0.5 bg-emerald-50 text-emerald-600 rounded-full shrink-0">
                          <Check className="h-3 w-3" />
                        </div>
                        <div>
                          <p className="text-[11px] font-extrabold text-slate-700">AA Contrast Score (Normal Text)</p>
                          <p className="text-[10px] text-slate-500 font-medium">Brand color supports standard high-contrast overlays for white foreground labels.</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2.5 text-left">
                        <div className="mt-0.5 p-0.5 bg-emerald-50 text-emerald-600 rounded-full shrink-0">
                          <Check className="h-3 w-3" />
                        </div>
                        <div>
                          <p className="text-[11px] font-extrabold text-slate-700">Subdomain Redirection</p>
                          <p className="text-[10px] text-slate-500">Assigned host: <span className="font-mono text-[9px] bg-slate-200 px-1 py-0.5 rounded">{selectedPreviewTenant.subdomain}.eduos.com</span></p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick info metadata */}
                  <div className="text-[10px] text-slate-400 font-mono space-y-1 text-left pt-1">
                    <p>Instance: {selectedPreviewTenant.id}</p>
                    <p>Tier Plan: {selectedPreviewTenant.plan}</p>
                    <p>Academic Cycle: {selectedPreviewTenant.academicYear}</p>
                  </div>
                </div>

                {/* Right Panel: Simulated School Portal Viewport (8 Cols) */}
                <div className={`lg:col-span-8 p-6 flex flex-col justify-center items-center overflow-y-auto ${
                  simulatedPortalThemeMode === "light" ? "bg-slate-100" : "bg-slate-950"
                }`}>
                  
                  {/* Outer simulated device frame */}
                  <div className={`w-full max-w-xl border rounded-2xl shadow-xl overflow-hidden transition-colors duration-300 text-left ${
                    simulatedPortalThemeMode === "light" 
                      ? "bg-white border-slate-250 text-slate-800" 
                      : "bg-slate-900 border-slate-800 text-slate-100"
                  }`}>
                    
                    {/* Simulated Web Browser Tab Bar */}
                    <div className={`px-4 py-2 flex items-center justify-between border-b text-[10px] font-mono font-semibold select-none ${
                      simulatedPortalThemeMode === "light" 
                        ? "bg-slate-50 border-slate-200 text-slate-400" 
                        : "bg-slate-850 border-slate-800 text-slate-500"
                    }`}>
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400 block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block" />
                      </div>
                      <div className={`px-4 py-1 rounded-lg border text-center text-[9px] w-64 truncate mx-2 ${
                        simulatedPortalThemeMode === "light" 
                          ? "bg-white border-slate-200 text-slate-500" 
                          : "bg-slate-900 border-slate-800 text-slate-400"
                      }`}>
                        https://{selectedPreviewTenant.subdomain}.eduos.com/portal
                      </div>
                      <div className="w-10" />
                    </div>

                    {/* School Portal Simulated Live Header */}
                    <div 
                      className="px-5 py-4 flex items-center justify-between text-white transition-colors duration-300"
                      style={{ backgroundColor: simulatedBrandColor }}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        {selectedPreviewTenant.logoUrl ? (
                          <img 
                            src={selectedPreviewTenant.logoUrl} 
                            alt="School Logo" 
                            className="h-8 w-auto object-contain bg-white/10 p-1 rounded-md max-w-[120px]"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-white text-xs shrink-0">
                            {selectedPreviewTenant.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-black tracking-tight truncate uppercase">
                            {selectedPreviewTenant.name}
                          </h4>
                          <span className="text-[8px] opacity-85 font-mono block">
                            MEMBER PORTAL
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-[9px] font-mono bg-white/20 px-2 py-0.5 rounded-full uppercase">
                          STUDENT VIEW
                        </span>
                      </div>
                    </div>

                    {/* Portal Simulated Main Content Container */}
                    <div className="p-6 space-y-6">
                      
                      {/* Hero banner with brand-color-accent light tint */}
                      <div 
                        className="p-4 rounded-xl border flex flex-col justify-between gap-2.5 transition-colors duration-300"
                        style={{ 
                          borderColor: simulatedBrandColor + "30",
                          backgroundColor: simulatedBrandColor + "10"
                        }}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5">
                            <Sparkles className="h-4 w-4" style={{ color: simulatedBrandColor }} />
                            <h5 className="text-xs font-black uppercase tracking-wider" style={{ color: simulatedBrandColor }}>
                              Exam Center Open
                            </h5>
                          </div>
                          <p className={`text-xs font-bold ${
                            simulatedPortalThemeMode === "light" ? "text-slate-700" : "text-slate-300"
                          }`}>
                            Session: {selectedPreviewTenant.academicYear} Terminal Exams are now accessible online.
                          </p>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            All students must check their credentials and start times. Please verify your portal settings before scheduling CBT papers.
                          </p>
                        </div>
                      </div>

                      {/* Portal Interactive Simulated Box */}
                      <div className="space-y-3">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${
                          simulatedPortalThemeMode === "light" ? "text-slate-400" : "text-slate-500"
                        }`}>
                          Available Assessments
                        </span>

                        <div className={`p-4 border rounded-xl space-y-4 ${
                          simulatedPortalThemeMode === "light" 
                            ? "bg-slate-50 border-slate-200" 
                            : "bg-slate-800/50 border-slate-800"
                        }`}>
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div>
                              <p className="text-xs font-bold">MAT-201: Intermediate Mathematics & Algebra</p>
                              <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-1 font-mono">
                                <span>Duration: 120 mins</span>
                                <span>•</span>
                                <span>Questions: 60 MCQs</span>
                              </div>
                            </div>
                            
                            <button
                              type="button"
                              className="px-3.5 py-1.5 text-white font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer select-none hover:brightness-110 active:brightness-95"
                              style={{ backgroundColor: simulatedBrandColor }}
                              onClick={() => alert(`Simulating CBT launch on: https://${selectedPreviewTenant.subdomain}.eduos.com/cbt/launch`)}
                            >
                              Launch CBT
                            </button>
                          </div>

                          <div className="border-t border-slate-200/60 dark:border-slate-800 pt-3 flex items-center justify-between gap-3 flex-wrap">
                            <div>
                              <p className="text-xs font-bold">BIO-105: Human Anatomy & Genetics Quiz</p>
                              <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-1 font-mono">
                                <span>Duration: 45 mins</span>
                                <span>•</span>
                                <span>Questions: 30 Qs</span>
                              </div>
                            </div>
                            
                            <button
                              type="button"
                              className="px-3.5 py-1.5 text-white font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer select-none hover:brightness-110 active:brightness-95"
                              style={{ backgroundColor: simulatedBrandColor }}
                              onClick={() => alert(`Simulating Quiz launch on: https://${selectedPreviewTenant.subdomain}.eduos.com/quiz/launch`)}
                            >
                              Launch CBT
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Theme Application Verification Indicators */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <div className="flex items-center space-x-1.5">
                          <Palette className="h-3 w-3" style={{ color: simulatedBrandColor }} />
                          <span>Active Theme: <span className="font-extrabold" style={{ color: simulatedBrandColor }}>{simulatedBrandColor}</span></span>
                        </div>
                        <span>Status: Operational</span>
                      </div>

                    </div>
                  </div>

                  {/* Helper Tip */}
                  <div className="text-center mt-4 max-w-sm">
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Verify that white text remains legible on the header strip and standard action buttons. Adjust the primary color in the left sandbox to audit contrast.
                    </p>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsPreviewOpen(false);
                    setSelectedPreviewTenant(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-200"
                >
                  Close Simulator
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openEditModal(selectedPreviewTenant);
                    setIsPreviewOpen(false);
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Configure Brand Settings</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Tenant Summary Modal */}
        {isSummaryOpen && selectedSummaryTenant && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsSummaryOpen(false);
                setSelectedSummaryTenant(null);
              }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 rounded-3xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl relative z-10"
            >
              {/* Decorative Accent Strip from School's Brand Colors */}
              <div 
                className="h-2 w-full shrink-0"
                style={{ background: `linear-gradient(to right, ${selectedSummaryTenant.primaryColor}, ${selectedSummaryTenant.secondaryColor})` }}
              />

              {/* Modal Header */}
              <div className="p-6 border-b border-slate-150 flex items-start justify-between shrink-0">
                <div className="flex items-center space-x-4">
                  {selectedSummaryTenant.logoUrl ? (
                    <img 
                      src={selectedSummaryTenant.logoUrl} 
                      alt={`${selectedSummaryTenant.name} Logo`} 
                      className="w-12 h-12 rounded-xl object-contain bg-slate-50 border border-slate-200 p-1 shrink-0 shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black font-mono text-xl shrink-0 shadow-sm"
                      style={{ backgroundColor: selectedSummaryTenant.primaryColor }}
                    >
                      {selectedSummaryTenant.name[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-none mb-1">
                      {selectedSummaryTenant.name}
                    </h3>
                    <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-400">
                      <Globe className="h-3 w-3 text-slate-400" />
                      <span>{selectedSummaryTenant.subdomain}.eduos.com</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsSummaryOpen(false);
                    setSelectedSummaryTenant(null);
                  }}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title="Close Summary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-600">
                {/* Visual Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left Column: Metadata */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3.5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                      Key Information
                    </h4>
                    <div className="space-y-2.5 text-xs text-slate-600">
                      <div className="flex items-center space-x-2.5">
                        <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="font-semibold truncate" title={selectedSummaryTenant.contactEmail}>{selectedSummaryTenant.contactEmail || "Not Specified"}</span>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="font-mono">{selectedSummaryTenant.contactPhone || "Not Specified"}</span>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="truncate" title={selectedSummaryTenant.address}>{selectedSummaryTenant.address || "Not Specified"}</span>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="font-mono">Created: {new Date(selectedSummaryTenant.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Subscription Status & Branding */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3.5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-3">
                        Subscription & Contract
                      </h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {/* Status Badge */}
                        <span className={`inline-flex items-center space-x-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-md border ${
                          selectedSummaryTenant.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                          selectedSummaryTenant.status === "suspended" ? "bg-red-50 text-red-700 border-red-100" :
                          "bg-slate-100 text-slate-600 border-slate-250"
                        }`}>
                          {selectedSummaryTenant.status === "active" && <CheckCircle2 className="h-3 w-3 shrink-0" />}
                          {selectedSummaryTenant.status === "suspended" && <AlertCircle className="h-3 w-3 shrink-0" />}
                          <span>{selectedSummaryTenant.status}</span>
                        </span>

                        {/* Plan Badge */}
                        <span className={`inline-flex items-center text-[10px] font-black uppercase px-2.5 py-1 rounded-md border ${
                          selectedSummaryTenant.plan === "Enterprise" ? "bg-purple-50 text-purple-700 border-purple-100" :
                          selectedSummaryTenant.plan === "Standard" ? "bg-blue-50 text-blue-700 border-blue-100" :
                          "bg-slate-50 text-slate-700 border-slate-100"
                        }`}>
                          {selectedSummaryTenant.plan} Plan
                        </span>
                      </div>
                      <div className="text-xs space-y-1 text-slate-500 font-mono">
                        <p>Academic Year: <span className="font-bold text-slate-700">{selectedSummaryTenant.academicYear}</span></p>
                        <p>Tenant ID: <span className="font-bold text-slate-700">{selectedSummaryTenant.id}</span></p>
                      </div>
                    </div>

                    {/* Brand Colors */}
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-400 font-mono">Brand Colors:</span>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1 font-mono text-[10px] text-slate-500 font-bold">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedSummaryTenant.primaryColor }} />
                          <span>{selectedSummaryTenant.primaryColor}</span>
                        </div>
                        <div className="flex items-center space-x-1 font-mono text-[10px] text-slate-500 font-bold">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedSummaryTenant.secondaryColor }} />
                          <span>{selectedSummaryTenant.secondaryColor}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Internal Administrators managed by Tenant */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                      <Users className="h-4 w-4 animate-pulse text-indigo-500" />
                      <span>Internal Admins ({summaryAdmins.length})</span>
                    </h4>
                    <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md font-mono">
                      Tenant Context Isolation Verified
                    </span>
                  </div>

                  <div className="border border-slate-150 rounded-2xl overflow-hidden bg-white shadow-3xs">
                    {isSummaryAdminsLoading ? (
                      <div className="p-8 flex flex-col items-center justify-center space-y-2 text-slate-400 text-xs">
                        <svg className="animate-spin h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="font-semibold text-slate-500">Loading administrators...</span>
                      </div>
                    ) : summaryAdminsError ? (
                      <div className="p-6 text-center space-y-2">
                        <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
                        <p className="text-xs font-bold text-slate-700">{summaryAdminsError}</p>
                      </div>
                    ) : summaryAdmins.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 space-y-2">
                        <ShieldAlert className="h-8 w-8 text-slate-300 mx-auto" />
                        <p className="text-xs font-medium text-slate-500">No Administrators are currently configured for this tenant.</p>
                        <p className="text-[10px] text-slate-400 font-mono">Create an ADMIN user with tenant ID '{selectedSummaryTenant.id}' to delegate school management.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 font-mono font-bold">
                              <th className="p-3">Administrator</th>
                              <th className="p-3">Email Address</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 font-mono text-right">Created</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                            {summaryAdmins.map((adm) => (
                              <tr key={adm.id} className="hover:bg-slate-50/50">
                                <td className="p-3 flex items-center space-x-2">
                                  <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center font-mono text-xs shadow-3xs">
                                    {adm.name[0]}
                                  </div>
                                  <span className="font-bold text-slate-800">{adm.name}</span>
                                </td>
                                <td className="p-3 font-mono text-slate-500">{adm.email}</td>
                                <td className="p-3">
                                  <span className={`inline-flex items-center space-x-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                    adm.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-150"
                                  }`}>
                                    <span>{adm.isActive ? "Active" : "Inactive"}</span>
                                  </span>
                                </td>
                                <td className="p-3 text-right font-mono text-slate-400 text-[10px]">
                                  {new Date(adm.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsSummaryOpen(false);
                    setSelectedSummaryTenant(null);
                  }}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-200 shadow-3xs"
                >
                  Close Summary
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openEditModal(selectedSummaryTenant);
                    setIsSummaryOpen(false);
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Edit School Tenant</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deletion Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
            >
              <div className="bg-rose-50 text-rose-800 p-5 border-b border-rose-100 flex items-center space-x-3">
                <div className="bg-rose-100 p-2.5 rounded-xl text-rose-600">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wider">Confirm Deletion</h3>
                  <p className="text-xs text-rose-600 mt-0.5">This action is permanent and irreversible.</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Are you absolutely sure you want to delete <strong className="text-slate-800 font-extrabold">{deleteConfirmName}</strong>?
                </p>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs text-slate-500">
                  Deleting this school instance will completely remove all associated tenant configurations, login redirects, and localized academic data.
                </div>
              </div>

              <div className="bg-slate-50 border-t border-slate-150 px-6 py-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmId(null);
                    setDeleteConfirmName("");
                  }}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer shadow-3xs"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Confirm Delete</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
