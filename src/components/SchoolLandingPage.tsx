import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  School, CheckCircle2, Phone, Mail, MapPin, 
  Sparkles, Award, Users, BookOpen, Clock, ChevronRight, 
  ArrowLeft, FileText, AlertCircle, Calendar, QrCode, Upload, Image
} from "lucide-react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";

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
  status: "active" | "suspended";
  plan: "Basic" | "Standard" | "Enterprise";
  academicYear: string;
  createdAt: string;
}

interface SchoolLandingPageProps {
  subdomain: string;
  onBackToMain: () => void;
  onLoginSuccess?: (user: any, token: string) => void;
}

export default function SchoolLandingPage({ subdomain, onBackToMain, onLoginSuccess }: SchoolLandingPageProps) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Tab switcher inside the column card
  const [landingTab, setLandingTab] = useState<"admission" | "verify" | "login">("admission");

  // Verification States
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [verificationError, setVerificationError] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  // Login States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Admissions Form States
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [gradeApplied, setGradeApplied] = useState("SS1 Science");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<any | null>(null);
  const [formError, setFormError] = useState("");

  // Handler for Transcript Verification Search
  const handleVerifyLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError("");
    setVerificationResult(null);
    if (!verificationCode.trim()) {
      setVerificationError("Please enter a 16-character verification hash.");
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch(`/api/public/verify-result/${verificationCode.trim()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to locate transcript verification record.");
      }
      setVerificationResult(data);
    } catch (err: any) {
      setVerificationError(err.message || "Something went wrong during verification search.");
    } finally {
      setVerifying(false);
    }
  };

  // Handler to export current verified transcript summary as a secure PDF
  const handleExportPDF = () => {
    if (!verificationResult) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Outer frame/border accent
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.rect(8, 8, 194, 281);

    // Decorative primary brand color bars
    doc.setFillColor(15, 23, 42); // slate-900 (primary deep color)
    doc.rect(10, 10, 190, 36, "F");

    // Secondary colored thin accent line
    doc.setFillColor(79, 70, 229); // indigo-600
    doc.rect(10, 46, 190, 2, "F");

    // Header Content
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("EDUOS ACADEMIC LEDGER REGISTRY", 18, 22);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("OFFICIAL VERIFICATION AUDIT DOCUMENT", 18, 29);
    doc.text(`ISSUED: ${new Date().toLocaleString()}`, 18, 35);

    // Secure verified badge on top right
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(142, 18, 48, 18, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("STATUS: SECURE", 150, 25);
    doc.setFontSize(7);
    doc.text("VERIFIED RECORD", 151, 30);

    // Subtitle / Introductory Text
    doc.setTextColor(71, 85, 105); // slate-600
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("This official digital summary confirms that the specified academic record has been successfully resolved and validated against the secure ledger database of the corresponding institution. No modifications or alterations have occurred.", 15, 62, { maxWidth: 180 });

    // Inner record box
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.rect(15, 76, 180, 110, "FD");

    // Box Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(15, 76, 180, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("RESOLVED RECORD INFORMATION", 22, 82.5);

    // Render metadata key-value pairs
    let currentY = 100;
    const drawRow = (label1: string, val1: string, label2: string, val2: string) => {
      // Column 1
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(label1.toUpperCase(), 25, currentY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(val1 || "N/A", 25, currentY + 6);

      // Column 2
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(label2.toUpperCase(), 115, currentY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(val2 || "N/A", 115, currentY + 6);

      // Divider line
      doc.setDrawColor(241, 245, 249); // slate-100
      doc.setLineWidth(0.2);
      doc.line(20, currentY + 11, 190, currentY + 11);

      currentY += 16;
    };

    drawRow("Student Full Name", verificationResult.student.name, "Academic Institution", verificationResult.tenant.name);
    drawRow("Registration Number", verificationResult.student.registrationNumber, "Assigned Class / Stream", verificationResult.student.className);
    drawRow("Cumulative GPA / Avg", `${verificationResult.student.gpa}%`, "Completed Evaluations", `${verificationResult.student.completedEvaluations} Assessments`);
    drawRow("Cryptographic Hash Code", verificationCode, "System Authority Registry", "EDUOS CBT PLATFORM PRO");

    // QR Code Embed Section on PDF
    if (qrCodeUrl) {
      try {
        // Draw a light grey frame for the QR Code
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(203, 213, 225); // slate-300
        doc.setLineWidth(0.3);
        doc.rect(80, 200, 50, 50, "FD");

        doc.addImage(qrCodeUrl, "PNG", 82, 202, 46, 46);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(79, 70, 229); // indigo-600
        doc.text("SCAN QR TO INSTANTLY VERIFY ONLINE", 105, 256, { align: "center" });
      } catch (err) {
        console.error("Error drawing QR to PDF:", err);
      }
    }

    // Signatory/Authority area
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(15, 266, 195, 266);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("Disclaimer: This digital verification audit document is generated automatically by the EduOS Ledger registry. It is cryptographically secure and matches the live production student database.", 15, 273, { maxWidth: 180 });
    doc.text("EduOS Unified Registry Service - live-verify.eduos.com", 105, 282, { align: "center" });

    // Save File
    const nameClean = (verificationResult.student.name || "student").replace(/[^a-z0-9]/gi, "_").toLowerCase();
    doc.save(`eduos_verification_${nameClean}_${verificationCode}.pdf`);
  };

  // Handler for Portal Login Scoped strictly to school
  const handlePortalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: loginEmail, 
          password: loginPassword,
          tenantId: tenant?.id
        })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        if (onLoginSuccess) {
          onLoginSuccess(data.user, data.token);
        }
      } else {
        setLoginError(data.message || "Invalid credentials. Please verify your email and password keys.");
      }
    } catch (err: any) {
      setLoginError("Connection timeout or server authentication error.");
    } finally {
      setLoginLoading(false);
    }
  };

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

  const handleDirectBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenant) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("Background picture is too large. Please select an image under 15MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const originalBase64 = reader.result as string;
      try {
        const base64Str = await compressImage(originalBase64, 1600, 1200, 0.75);
        const res = await fetch(`/api/public/tenants/${tenant.id}/background`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ backgroundImageUrl: base64Str }),
        });

        if (!res.ok) {
          throw new Error("Failed to upload background image.");
        }

        const updatedTenant = await res.json();
        setTenant(updatedTenant);
      } catch (err: any) {
        alert(err.message || "An error occurred while uploading background.");
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const fetchTenantDetails = async () => {
      setIsLoading(true);
      setErrorMsg("");
      try {
        const res = await fetch(`/api/public/tenants/${subdomain}`);
        if (!res.ok) {
          throw new Error("This school instance landing page is offline or does not exist.");
        }
        const data = await res.json();
        setTenant(data);
      } catch (err: any) {
        setErrorMsg(err.message || "Could not retrieve school landing page details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantDetails();
  }, [subdomain]);

  // Check for auto-verification on mount / load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyHash = params.get("verify");
    if (verifyHash && verifyHash.length === 16) {
      setLandingTab("verify");
      setVerificationCode(verifyHash.toUpperCase());
      
      const autoVerify = async () => {
        setVerificationError("");
        setVerificationResult(null);
        setVerifying(true);
        try {
          const res = await fetch(`/api/public/verify-result/${verifyHash.trim().toUpperCase()}`);
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.message || "Failed to locate transcript verification record.");
          }
          setVerificationResult(data);
        } catch (err: any) {
          setVerificationError(err.message || "Something went wrong during verification search.");
        } finally {
          setVerifying(false);
        }
      };
      autoVerify();
    }
  }, []);

  // Generate QR Code data URL dynamically
  useEffect(() => {
    if (verificationCode && verificationCode.length === 16) {
      const fullUrl = `${window.location.origin}/school/${subdomain}?verify=${verificationCode}`;
      QRCode.toDataURL(fullUrl, {
        width: 180,
        margin: 2,
        color: {
          dark: "#0f172a", // slate-900
          light: "#ffffff"
        }
      })
      .then(url => {
        setQrCodeUrl(url);
      })
      .catch(err => {
        console.error("Error generating QR code:", err);
      });
    } else {
      setQrCodeUrl("");
    }
  }, [verificationCode, subdomain]);

  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    if (!studentName.trim() || !studentEmail.trim() || !parentName.trim() || !parentEmail.trim()) {
      setFormError("Please fill in all the required fields.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      studentName,
      studentEmail,
      gradeApplied,
      parentName,
      parentEmail,
      parentPhone,
      tenantId: tenant?.id || "default"
    };

    try {
      const res = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit admission application.");
      }
      setSubmitSuccess(data);
    } catch (err: any) {
      setFormError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStudentName("");
    setStudentEmail("");
    setGradeApplied("SS1 Science");
    setParentName("");
    setParentEmail("");
    setParentPhone("");
    setSubmitSuccess(null);
    setFormError("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <School className="h-12 w-12 text-slate-300 animate-bounce mb-3" />
        <div className="font-mono text-xs text-slate-500 uppercase tracking-widest animate-pulse">
          Retrieving School Node...
        </div>
      </div>
    );
  }

  if (errorMsg || !tenant) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm space-y-4">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Access Error</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            {errorMsg || "The requested school landing page could not be located on this cluster."}
          </p>
          <button
            onClick={onBackToMain}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Central Hub</span>
          </button>
        </div>
      </div>
    );
  }

  const isSuspended = tenant.status === "suspended";

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto text-rose-600">
            <School className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Portal Temporarily Offline</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            The school portal for <strong>{tenant.name}</strong> has been temporarily suspended by the Super Administrator. Please check back later.
          </p>
          <button
            onClick={onBackToMain}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Central Hub</span>
          </button>
        </div>
      </div>
    );
  }

  // Generate customized CSS color values
  const themePrimary = tenant.primaryColor || "#4f46e5";
  const themeSecondary = tenant.secondaryColor || "#0d9488";

  const inputBgClass = tenant.backgroundImageUrl
    ? "w-full bg-white/45 border border-white/30 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white/80 focus:border-indigo-500 transition-all placeholder:text-slate-500/70"
    : "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-all placeholder:text-slate-400";

  // Full-page background styling with elegant backdrop
  const landingPageBgStyle = tenant.backgroundImageUrl ? {
    backgroundImage: `linear-gradient(to bottom, rgba(248, 250, 252, 0.45), rgba(248, 250, 252, 0.65)), url(${tenant.backgroundImageUrl})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed" as const
  } : {};

  return (
    <div 
      className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-indigo-100 relative overflow-hidden"
      style={landingPageBgStyle}
    >
      
      {/* Background Blurring Overlay for premium autofit and elegant contrast */}
      {tenant.backgroundImageUrl && (
        <div 
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `url(${tenant.backgroundImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(20px) saturate(1.3) brightness(0.98)",
            opacity: 0.45,
            transform: "scale(1.1)" // avoids any white edge leaking from the blur
          }}
        />
      )}
      
      {/* Floating Back Button & Header bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-xs relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={onBackToMain}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 font-bold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Portal</span>
          </button>

          <div className="flex items-center space-x-2">
            {tenant.logoUrl ? (
              <img 
                src={tenant.logoUrl} 
                alt={`${tenant.name} Logo`} 
                className="w-8 h-8 rounded-lg object-contain bg-slate-50 border border-slate-100 p-0.5 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div 
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black font-mono text-xs shrink-0"
                style={{ backgroundColor: themePrimary }}
              >
                {tenant.name[0]}
              </div>
            )}
            <span className="font-extrabold text-sm tracking-tight text-slate-800">
              {tenant.name.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[9px] font-mono font-bold bg-slate-100/85 text-slate-500 px-2 py-0.5 rounded uppercase tracking-widest hidden sm:inline-block">
              ACAD YEAR: {tenant.academicYear}
            </span>
            <button
              onClick={() => document.getElementById("direct-bg-upload")?.click()}
              className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 rounded text-[10px] font-bold transition-all cursor-pointer shadow-3xs"
              title="Upload custom landing background picture"
            >
              <Upload className="h-3 w-3 shrink-0" />
              <span>Change Background</span>
            </button>
            <input 
              type="file"
              id="direct-bg-upload"
              accept="image/*"
              className="hidden"
              onChange={handleDirectBgUpload}
            />
          </div>
        </div>
      </header>

      {/* Hero Banner Section */}
      <section 
        className={`relative overflow-hidden border-b transition-all duration-300 relative z-10 ${
          tenant.backgroundImageUrl 
            ? "bg-white/40 backdrop-blur-md border-slate-200/40" 
            : "bg-white border-slate-200"
        }`} 
        id="hero-banner-section"
      >
        {/* Enhanced School Picture Background with Premium Glossy Filters */}
        {tenant.backgroundImageUrl ? (
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img 
              src={tenant.backgroundImageUrl} 
              alt={`${tenant.name} Campus`} 
              className="w-full h-full object-cover filter saturate-[1.3] brightness-[0.95] contrast-[1.05] transition-all duration-700 hover:scale-105"
              referrerPolicy="no-referrer"
            />
            {/* Premium glossy overlay gradients */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 sm:from-white/95 sm:via-white/70 to-transparent mix-blend-normal" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-white/10" />
            <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-transparent to-indigo-50/15 mix-blend-overlay" />
            {/* Glossy Backdrop blur container for premium glassmorphism */}
            <div className="absolute top-1/4 right-10 w-72 h-72 rounded-full bg-white/10 backdrop-blur-[6px] border border-white/20 shadow-2xl mix-blend-overlay animate-pulse" />
          </div>
        ) : (
          /* Fallback Background Gradients */
          <div className="absolute inset-0 opacity-10 pointer-events-none z-0">
            <div 
              className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl"
              style={{ backgroundColor: themePrimary }}
            />
            <div 
              className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl"
              style={{ backgroundColor: themeSecondary }}
            />
          </div>
        )}

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-slate-100/90 px-3 py-1 rounded-full text-xs font-bold text-slate-600 shadow-3xs backdrop-blur-xs">
              <Sparkles className="h-4 w-4" style={{ color: themePrimary }} />
              <span>Standalone School Instance Activated</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-none drop-shadow-3xs">
              Welcome to the <br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${themePrimary}, ${themeSecondary})` }}>
                {tenant.name}
              </span>
            </h1>

            <p className="text-base text-slate-700 font-semibold leading-relaxed max-w-xl">
              Unlocking absolute educational excellence. Powered by independent academic databases, custom continuous assessment modules, and specialized digital curricula curated for our local streams.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <a 
                href="#admissions-portal"
                className="px-6 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all hover:scale-102 flex items-center space-x-2"
                style={{ backgroundColor: themePrimary }}
              >
                <span>Admission Application</span>
                <ChevronRight className="h-4 w-4" />
              </a>

              <button
                onClick={onBackToMain}
                className="px-6 py-3 rounded-xl font-bold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all flex items-center space-x-2 cursor-pointer"
              >
                <span>Access Student CBT Portal</span>
              </button>
            </div>

            {/* Quick specifications */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100 max-w-lg">
              <div>
                <span className="block text-2xl font-black text-slate-800 leading-none">SS1-SS3</span>
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block mt-1">Grade Streams</span>
              </div>
              <div>
                <span className="block text-2xl font-black text-slate-800 leading-none">100%</span>
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block mt-1">CBT Compliant</span>
              </div>
              <div>
                <span className="block text-2xl font-black text-slate-800 leading-none">{tenant.plan}</span>
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block mt-1">Portal Tier</span>
              </div>
            </div>

          </div>

          {/* Visual card badge */}
          <div className="lg:col-span-5 flex justify-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-3xl p-6 shadow-2xl max-w-sm w-full relative overflow-hidden border transition-all duration-300 ${
                tenant.backgroundImageUrl 
                  ? "bg-white/40 backdrop-blur-xl border-white/30 shadow-2xl" 
                  : "bg-white border-slate-200 shadow-xl"
              }`}
            >
              <div 
                className="absolute top-0 inset-x-0 h-2"
                style={{ backgroundColor: themePrimary }}
              />

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  {tenant.logoUrl ? (
                    <img 
                      src={tenant.logoUrl} 
                      alt="" 
                      className="w-12 h-12 rounded-xl object-contain bg-slate-50/80 border border-slate-100 p-1 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="p-2 bg-slate-100/80 rounded-xl">
                      <Award className="h-6 w-6" style={{ color: themePrimary }} />
                    </div>
                  )}
                  <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full uppercase">
                    ACTIVE DIRECTORY
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-extrabold text-slate-800 text-lg leading-tight">{tenant.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    Configured with secure institutional isolation. All pupil registers, timetables, and teacher credentials exist completely inside this private cluster.
                  </p>
                </div>

                {/* Coordinates */}
                <div className="space-y-3 pt-4 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span>{tenant.contactEmail || "registrar@school.edu"}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>{tenant.contactPhone || "+234 (0) 812 345 6789"}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{tenant.address || "Main Campus Road, Nigeria"}</span>
                  </div>
                </div>

                <div className={`rounded-2xl p-4 text-xs font-bold text-center border transition-all duration-300 ${
                  tenant.backgroundImageUrl 
                    ? "bg-white/40 border-white/20" 
                    : "bg-slate-50 border-slate-100"
                }`}>
                  <span className="text-slate-500">Official Portal Instance subdomain: </span>
                  <span className="font-mono text-indigo-600">/school/{tenant.subdomain}</span>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* Main landing pages section & admissions form */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10" id="admissions-portal">
        
        {/* Core Educational Highlights */}
        <div className={`lg:col-span-6 transition-all duration-300 ${
          tenant.backgroundImageUrl 
            ? "bg-white/40 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/30 shadow-2xl space-y-6" 
            : "space-y-8"
        }`}>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Our Elite Educational Systems</h2>
            <p className="text-sm text-slate-600 font-medium">
              We operate standard Nigerian and West African Unified educational framework systems integrated into a high-technology student experience.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white"
                style={{ backgroundColor: themePrimary }}
              >
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Ogun State Unified Curriculum</h4>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Fully synchronized lesson plans and academic reviews. Our senior teachers upload robust preparatory content aligned with terminal WAEC, NECO, and JAMB expectations.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white"
                style={{ backgroundColor: themeSecondary }}
              >
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Automated Schedule Timetables</h4>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Collision-free school day rosters. Standard science, arts, and commerce class directories mapped automatically against available lecture room capacities.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white"
                style={{ backgroundColor: themePrimary }}
              >
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Continuous CBT Assessments</h4>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Rigorous computer-based testing models. Instant grading logs, proctoring violations tracking, and automated feedback reviews to guarantee robust performance tracking.
                </p>
              </div>
            </div>
          </div>

          {/* Plan Specific Notice */}
          <div className={`rounded-2xl p-5 border transition-all duration-300 ${
            tenant.backgroundImageUrl 
              ? "bg-white/30 backdrop-blur-md border-white/20" 
              : "bg-slate-100 border-slate-200"
          }`}>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1 flex items-center space-x-1.5">
              <Sparkles className="h-4 w-4" style={{ color: themeSecondary }} />
              <span>Platform Tier Features</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              This school node operates on the <strong className="text-slate-700">{tenant.plan} Subscription License</strong>. 
              {tenant.plan === "Enterprise" && " Enjoy unlimited generative AI exam content formulate assistants, advanced high-velocity assessment scoring, and automated continuous-grade risk predictors."}
              {tenant.plan === "Standard" && " Full access to standard ERP school accounting billing operations, invoice disbursements, class registry, and student dossiers."}
              {tenant.plan === "Basic" && " Essential digital CBT testing portal features, standard registrations, and fundamental school rosters."}
            </p>
          </div>
        </div>

        {/* Admissions Form Column */}
        <div className="lg:col-span-6 relative z-10">
          <div className={`rounded-3xl p-6 sm:p-8 space-y-6 border transition-all duration-300 ${
            tenant.backgroundImageUrl 
              ? "bg-white/40 backdrop-blur-xl border-white/30 shadow-2xl" 
              : "bg-white border-slate-200 shadow-sm"
          }`}>
            
            {/* Interactive Tab Headers */}
            <div className="flex border-b border-slate-100 pb-3 mb-2 gap-4">
              <button
                onClick={() => { setLandingTab("admission"); setSubmitSuccess(null); }}
                className={`pb-1 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  landingTab === "admission" ? "font-extrabold" : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
                style={{
                  borderColor: landingTab === "admission" ? themePrimary : "transparent",
                  color: landingTab === "admission" ? themePrimary : undefined
                }}
              >
                Admission
              </button>
              <button
                onClick={() => setLandingTab("verify")}
                className={`pb-1 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  landingTab === "verify" ? "font-extrabold" : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
                style={{
                  borderColor: landingTab === "verify" ? themePrimary : "transparent",
                  color: landingTab === "verify" ? themePrimary : undefined
                }}
              >
                Verify Transcript
              </button>
              <button
                onClick={() => setLandingTab("login")}
                className={`pb-1 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  landingTab === "login" ? "font-extrabold" : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
                style={{
                  borderColor: landingTab === "login" ? themePrimary : "transparent",
                  color: landingTab === "login" ? themePrimary : undefined
                }}
              >
                Portal Login
              </button>
            </div>

            <AnimatePresence mode="wait">
              {landingTab === "admission" && (
                !submitSuccess ? (
                  <motion.div 
                    key="admission-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                        ONLINE ADMISSION WORKFLOW
                      </span>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight pt-1">
                        Online Application Portal
                      </h3>
                      <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                        Submit details below to request admission review. Our administrative board will process your dossier instantly.
                      </p>
                    </div>

                    {formError && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl flex items-center space-x-2 text-xs font-semibold">
                        <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}

                    <form onSubmit={handleAdmissionSubmit} className="space-y-4">
                      {/* Student Name */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                          Student Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          className={inputBgClass}
                          placeholder="e.g. Samuel Adebayo"
                        />
                      </div>

                      {/* Student Email & Class Selection */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                            Student Email *
                          </label>
                          <input
                            type="email"
                            required
                            value={studentEmail}
                            onChange={(e) => setStudentEmail(e.target.value)}
                            className={inputBgClass}
                            placeholder="e.g. samuel@gmail.com"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                            Grade stream applied *
                          </label>
                          <select
                            value={gradeApplied}
                            onChange={(e) => setGradeApplied(e.target.value)}
                            className={inputBgClass}
                          >
                            <option value="SS1 Science">SS1 Science (Ogun standard)</option>
                            <option value="SS1 Arts">SS1 Arts</option>
                            <option value="SS2 Commerce">SS2 Commerce</option>
                            <option value="SS2 Science">SS2 Science</option>
                            <option value="SS3 Science">SS3 Science (Pre-WAEC)</option>
                            <option value="SS3 Arts">SS3 Arts</option>
                          </select>
                        </div>
                      </div>

                      {/* Separator */}
                      <div className="relative flex py-1 items-center">
                        <div className="flex-grow border-t border-slate-100"></div>
                        <span className="flex-shrink mx-3 text-slate-400 text-[9px] uppercase tracking-wider font-mono font-bold">
                          Guardian Coordinates
                        </span>
                        <div className="flex-grow border-t border-slate-100"></div>
                      </div>

                      {/* Parent Name */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                          Parent / Guardian Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={parentName}
                          onChange={(e) => setParentName(e.target.value)}
                          className={inputBgClass}
                          placeholder="e.g. Dr. Kolawole Adebayo"
                        />
                      </div>

                      {/* Parent Email & Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                            Parent Email *
                          </label>
                          <input
                            type="email"
                            required
                            value={parentEmail}
                            onChange={(e) => setParentEmail(e.target.value)}
                            className={inputBgClass}
                            placeholder="e.g. kolawole@gmail.com"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                            Parent Phone Number
                          </label>
                          <input
                            type="text"
                            value={parentPhone}
                            onChange={(e) => setParentPhone(e.target.value)}
                            className={inputBgClass}
                            placeholder="e.g. +234 803 111 2222"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 rounded-xl text-white font-bold text-xs shadow-md transition-all hover:shadow-lg hover:scale-101 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                        style={{ backgroundColor: themePrimary }}
                      >
                        <span>{isSubmitting ? "Processing Application..." : "Submit Application Dossier"}</span>
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="admission-success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="text-center space-y-6 py-6"
                  >
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-slate-800 tracking-tight">Application Transmitted!</h3>
                      <p className="text-xs text-slate-400 font-semibold leading-relaxed px-4">
                        Your admission application has been registered successfully on <strong>{tenant.name}</strong>'s private register file.
                      </p>
                    </div>

                    {/* Summary receipt card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 text-left space-y-2 max-w-sm mx-auto font-medium">
                      <div className="flex justify-between border-b border-slate-200 pb-1.5 font-bold text-[10px] text-slate-400 font-mono">
                        <span>APPLICATION NO.</span>
                        <span>{submitSuccess.id?.toUpperCase() || "ADM-PENDING"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] font-mono font-bold">STUDENT</span>
                        <span className="font-bold">{submitSuccess.studentName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] font-mono font-bold">GRADE REQUESTED</span>
                        <span>{submitSuccess.gradeApplied}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] font-mono font-bold">GUARDIAN</span>
                        <span>{submitSuccess.parentName} ({submitSuccess.parentEmail})</span>
                      </div>
                    </div>

                    <button
                      onClick={resetForm}
                      className="px-6 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                    >
                      Apply for Another Student
                    </button>
                  </motion.div>
                )
              )}

              {landingTab === "verify" && (
                <motion.div
                  key="verify-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                      TRANSCRIPT VALIDATOR
                    </span>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight pt-1">
                      Registry Verification
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                      Enter the 16-character cryptographic verification hash printed on the academic summary transcript to validate its integrity in the live ledger registry.
                    </p>
                  </div>

                  {verificationError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl flex items-center space-x-2 text-xs font-semibold">
                      <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
                      <span>{verificationError}</span>
                    </div>
                  )}

                  <form onSubmit={handleVerifyLookup} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                        Registry Verification Hash *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={16}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                        className={`${inputBgClass} font-mono font-black tracking-widest text-center`}
                        placeholder="E.G. 2F9E8D7A6B5C4D3E"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={verifying}
                      className="w-full py-3 rounded-xl text-white font-bold text-xs shadow-md transition-all hover:scale-101 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                      style={{ backgroundColor: themePrimary }}
                    >
                      <span>{verifying ? "Searching central registry..." : "Query Registry Archive"}</span>
                    </button>
                  </form>

                  {/* Verification Result Card */}
                  {verificationResult && (
                    <div className="bg-slate-50 border-2 border-dashed border-emerald-300 rounded-2xl p-5 space-y-4 max-w-md mx-auto relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[8px] font-mono font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-xs">
                        VERIFIED SECURE
                      </div>

                      <div className="flex items-center space-x-3 pb-3 border-b border-slate-200">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-sm leading-none">Official Record Confirmed</h4>
                          <span className="text-[9px] text-slate-400 font-mono block mt-1">Ref ID: {verificationCode}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Student Name</span>
                          <span className="font-bold text-slate-800">{verificationResult.student.name}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Reg Number</span>
                          <span className="font-bold text-slate-800 font-mono">{verificationResult.student.registrationNumber}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block">School Institution</span>
                          <span className="font-bold text-slate-800">{verificationResult.tenant.name}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Class / Stream</span>
                          <span className="font-bold text-slate-800">{verificationResult.student.className}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Average CBT Score</span>
                          <span className="font-extrabold text-indigo-600">{verificationResult.student.gpa}%</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Completed Exams</span>
                          <span className="font-bold text-slate-800">{verificationResult.student.completedEvaluations} Assessments</span>
                        </div>
                      </div>

                      <div className="bg-emerald-50 text-emerald-800 text-[10px] font-semibold p-2.5 rounded-xl border border-emerald-100 text-center">
                        This digital record exactly matches the physical transcript generated by the EduOS Unified Registry.
                      </div>

                      <button
                        type="button"
                        onClick={handleExportPDF}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer hover:scale-[1.01] border border-slate-950"
                      >
                        <FileText className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                        <span>Export PDF Audit Report</span>
                      </button>

                      {/* Dynamic QR Code Verification Area */}
                      <div className="border-t border-slate-200 pt-4 flex flex-col items-center justify-center text-center space-y-2">
                        <div className="flex items-center space-x-1.5 text-[10px] font-mono font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                          <QrCode className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          <span>Instant Mobile QR Verification</span>
                        </div>
                        <p className="text-[10px] text-slate-400 max-w-[280px] leading-relaxed">
                          Scan this code with a smartphone camera to instantly verify this academic record in the live registry.
                        </p>
                        {qrCodeUrl ? (
                          <div className="bg-white p-3 rounded-2xl border border-slate-150 shadow-3xs inline-block relative group transition-all hover:shadow-2xs">
                            <img 
                              src={qrCodeUrl} 
                              alt="Verification QR Code" 
                              className="w-36 h-36 block select-none"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                          </div>
                        ) : (
                          <div className="w-36 h-36 bg-slate-100 animate-pulse rounded-2xl border border-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-mono">
                            Generating QR Code...
                          </div>
                        )}
                        <span className="text-[9px] font-mono font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md max-w-full truncate block border border-slate-200">
                          HASH: {verificationCode}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {landingTab === "login" && (
                <motion.div
                  key="login-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                      DEDICATED SCHOOL LOGIN
                    </span>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight pt-1">
                      School Workspace
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                      Access the dedicated CBT & ERP workspace for <strong>{tenant.name}</strong>. Admins, teachers, parents, and students may log in below.
                    </p>
                  </div>

                  {loginError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl flex items-center space-x-2 text-xs font-semibold">
                      <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                   <form onSubmit={handlePortalLogin} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                        Registered Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className={inputBgClass}
                        placeholder="e.g. admin@school.com"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                        Password Key *
                      </label>
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className={inputBgClass}
                        placeholder="••••••••"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full py-3 rounded-xl text-white font-bold text-xs shadow-md transition-all hover:scale-101 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                      style={{ backgroundColor: themePrimary }}
                    >
                      <span>{loginLoading ? "Decrypting credentials..." : "Enter Workspace"}</span>
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </main>

      {/* Landing Page Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2">
            <div 
              className="w-6 h-6 rounded-md flex items-center justify-center text-white font-black font-mono text-xs"
              style={{ backgroundColor: themePrimary }}
            >
              {tenant.name[0]}
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white">{tenant.name}</span>
          </div>

          <p className="text-center sm:text-right text-[11px] leading-normal text-slate-500 font-medium">
            © 2026 {tenant.name}. Dedicated Portal Instance.<br />
            Powered by CBT PRO X Enterprise Node Cloud.
          </p>
        </div>
      </footer>

    </div>
  );
}
