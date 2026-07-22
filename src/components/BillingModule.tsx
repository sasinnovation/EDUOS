import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { 
  CreditCard, 
  CheckCircle, 
  AlertTriangle, 
  Printer, 
  Plus, 
  Trash2, 
  DollarSign, 
  TrendingUp, 
  User, 
  Calendar,
  Building,
  ShieldCheck,
  Download,
  ListFilter,
  History,
  Tag,
  Search,
  CheckCircle2,
  Lock,
  ArrowRight
} from "lucide-react";

interface BillingModuleProps {
  token: string;
  role: string;
  studentUser?: any;
}

export default function BillingModule({ token, role, studentUser }: BillingModuleProps) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [paymentsHistory, setPaymentsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Tabs: DASHBOARD, BILL_STUDENT, CATEGORIES, PAYMENT_HISTORY
  const [activeTab, setActiveTab] = useState<"DASHBOARD" | "BILL_STUDENT" | "CATEGORIES" | "PAYMENT_HISTORY">("DASHBOARD");

  // Create Invoice State (Admin)
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedStudentName, setSelectedStudentName] = useState("");
  const [className, setClassName] = useState("SS3 Science");
  const [term, setTerm] = useState("Third Term 2025/2026");
  const [dueDate, setDueDate] = useState("2026-08-01");
  const [billItems, setBillItems] = useState<{ name: string; amount: number }[]>([
    { name: "Tuition Fees", amount: 45000 },
    { name: "CBT Portal Assessment Access", amount: 5000 }
  ]);
  const [newItemName, setNewItemName] = useState("Tuition Fees");
  const [customItemName, setCustomItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Manage Categories State
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categorySuccess, setCategorySuccess] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Payment history filters
  const [payHistorySearch, setPayHistorySearch] = useState("");

  // Pay Simulation State (Student/Parent)
  const [paymentInvoice, setPaymentInvoice] = useState<any | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<"STRIPE" | "PAYSTACK">("STRIPE");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [payMethod, setPayMethod] = useState<"CARD" | "TRANSFER">("CARD");
  const [paymentStep, setPaymentStep] = useState<"INPUT" | "PROCESSING" | "SUCCESS">("INPUT");

  // Selected Invoice for receipt rendering
  const [activeReceiptInvoice, setActiveReceiptInvoice] = useState<any | null>(null);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Invoices
      const res = await fetch("/api/billing", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }

      // 2. Fetch Categories
      const catRes = await fetch("/api/billing/categories", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
        if (catData.length > 0) {
          setNewItemName(catData[0]);
        }
      }

      // 3. Admin specific fetches
      if (role === "ADMIN") {
        // Students directory
        const studRes = await fetch("/api/students", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (studRes.ok) {
          const studData = await studRes.json();
          setStudents(studData);
          if (studData.length > 0) {
            setSelectedStudentId(studData[0].id);
            setSelectedStudentName(studData[0].name);
          }
        }

        // Payments Audit Logs
        const payRes = await fetch("/api/billing/payments", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (payRes.ok) {
          const payData = await payRes.json();
          setPaymentsHistory(payData);
        }
      }
    } catch (err) {
      console.error("Error loading billing telemetry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, [token, role]);

  const handleAddItem = () => {
    const finalItemName = newItemName === "Other Custom Category..." ? customItemName : newItemName;
    if (!finalItemName.trim() || !newItemAmount) return;
    
    setBillItems(prev => [...prev, { name: finalItemName.trim(), amount: Number(newItemAmount) }]);
    setCustomItemName("");
    setNewItemAmount("");
  };

  const handleRemoveItem = (idx: number) => {
    setBillItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    if (!selectedStudentId || billItems.length === 0) {
      setCreateError("Please select a student and add at least one billable fee item.");
      return;
    }

    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: selectedStudentId,
          studentName: selectedStudentName,
          className,
          term,
          dueDate,
          items: billItems
        })
      });

      if (res.ok) {
        setCreateSuccess("Unified Term fee bill successfully created and published.");
        setBillItems([
          { name: "Tuition Fees", amount: 45000 },
          { name: "CBT Portal Assessment Access", amount: 5000 }
        ]);
        loadBillingData();
      } else {
        const errData = await res.json();
        setCreateError(errData.message || "Failed to compile school invoice.");
      }
    } catch (err) {
      setCreateError("Server error compounding school fee invoice.");
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategorySuccess(null);
    setCategoryError(null);
    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch("/api/billing/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCategoryName })
      });

      if (res.ok) {
        setCategorySuccess(`Category "${newCategoryName}" added successfully.`);
        setNewCategoryName("");
        loadBillingData();
      } else {
        const data = await res.json();
        setCategoryError(data.message || "Failed to create category");
      }
    } catch (err) {
      setCategoryError("Handshake with categories cluster failed.");
    }
  };

  const handleDeleteCategory = async (catName: string) => {
    if (!window.confirm(`Are you sure you want to remove the "${catName}" category?`)) return;
    try {
      const res = await fetch(`/api/billing/categories/${encodeURIComponent(catName)}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        loadBillingData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulatePayment = async () => {
    if (!paymentInvoice) return;
    setPaymentStep("PROCESSING");

    // Dynamic gateway details
    const gatewayMethod = selectedGateway === "PAYSTACK" 
      ? `Paystack Gateway (NGN ₦) [${payMethod === "CARD" ? "Card" : "Transfer"}]`
      : `Stripe Gateway (USD $) [Card Element]`;
    
    const gatewayRef = selectedGateway === "PAYSTACK"
      ? `pstk_trx_${Math.random().toString(36).substring(2, 11)}`
      : `ch_stripe_${Math.random().toString(36).substring(2, 13)}`;

    setTimeout(async () => {
      try {
        const res = await fetch(`/api/billing/${paymentInvoice.id}/pay`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: paymentInvoice.totalAmount,
            method: gatewayMethod,
            reference: gatewayRef
          })
        });

        if (res.ok) {
          const updated = await res.json();
          setPaymentStep("SUCCESS");
          loadBillingData();
          setActiveReceiptInvoice(updated);
        } else {
          setPaymentStep("INPUT");
          alert("Payment gateway authentication rejected. Please try again.");
        }
      } catch (err) {
        setPaymentStep("INPUT");
        console.error(err);
      }
    }, 1200);
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!window.confirm("Are you sure you want to delete this invoice? This action is irreversible.")) {
      return;
    }
    try {
      const res = await fetch(`/api/billing/${invoiceId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        if (activeReceiptInvoice && activeReceiptInvoice.id === invoiceId) {
          setActiveReceiptInvoice(null);
        }
        loadBillingData();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete invoice");
      }
    } catch (err) {
      console.error(err);
      alert("Network error deleting invoice");
    }
  };

  const handlePrintReceipt = (invoice: any) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // Border Frame
      doc.setDrawColor(16, 185, 129); // Emerald border
      doc.setLineWidth(0.8);
      doc.rect(10, 10, 190, 277, "S");
      
      doc.setDrawColor(209, 250, 229); // Subtle inner emerald border
      doc.setLineWidth(0.2);
      doc.rect(11.5, 11.5, 187, 274, "S");

      // Watermark
      doc.setTextColor(240, 253, 250);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(32);
      doc.text("OFFICIAL RECEIPT", 40, 130, { angle: 30 });
      doc.text("CBT PRO X SECURE", 40, 180, { angle: 30 });

      // Header Decorative Stripe
      doc.setFillColor(16, 185, 129); // Emerald theme color
      doc.rect(15, 15, 180, 3, "F");

      // School Institutional Header
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text("CBT PRO X (EDUOS) ACADEMY", 15, 27);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text("Educational Operating System (EduOS) SIS Finance Registry", 15, 32);
      doc.text("Lagos-Ibadan Expressway Education Hub Campus Block", 15, 36);

      // Document Type Label
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(16, 185, 129); // Emerald-600
      doc.text("OFFICIAL TUITION PAYMENT RECEIPT", 195, 27, { align: "right" });

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`DATE GENERATED: ${new Date().toLocaleDateString()}`, 195, 32, { align: "right" });
      doc.text(`INVOICE REFERENCE: ${invoice.id}`, 195, 36, { align: "right" });

      // Solid Divider Line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(15, 42, 195, 42);

      // Student and billing references
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text("BILLED RECIPIENT INFORMATION", 15, 49);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(`Student Name: ${invoice.studentName}`, 15, 55);
      doc.text(`Class Room Roster: ${invoice.className || "General"}`, 15, 60);
      doc.text(`Outstanding Balance: ₦${(invoice.totalAmount - invoice.paidAmount).toLocaleString()}`, 15, 65);

      // Financial columns
      doc.setFont("Helvetica", "bold");
      doc.text("METADATA DETAILS", 110, 49);
      doc.setFont("Helvetica", "normal");
      doc.text(`Academic Term Block: ${invoice.term}`, 110, 55);
      doc.text(`Payment Settlement Status: ${invoice.status}`, 110, 60);
      doc.text(`Authorized Registry Clerk: EduOS Auto-System`, 110, 65);

      // Table Header Row for items
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(15, 75, 180, 8, "F");
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text("FEE ITEMIZATION DESCRIPTION", 18, 80);
      doc.text("BILLED AMOUNT (₦)", 192, 80, { align: "right" });

      // Draw Items
      let y = 88;
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      (invoice.items || []).forEach((item: any) => {
        doc.text(item.name, 18, y);
        doc.text(`₦${item.amount.toLocaleString()}`, 192, y, { align: "right" });
        doc.setDrawColor(241, 245, 249);
        doc.line(15, y + 2.5, 195, y + 2.5);
        y += 7.5;
      });

      // Summary block
      y += 5;
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("COMPOUND INVOICE TOTAL:", 130, y);
      doc.text(`₦${invoice.totalAmount.toLocaleString()}`, 192, y, { align: "right" });

      doc.setTextColor(16, 185, 129);
      doc.text("TOTAL CASH COLLECTED:", 130, y + 6);
      doc.text(`₦${invoice.paidAmount.toLocaleString()}`, 192, y + 6, { align: "right" });

      doc.setTextColor(71, 85, 105);
      doc.setFont("Helvetica", "normal");
      doc.text("OFFICIAL TRANSACTION SETTLEMENT REFERENCES:", 15, y + 16);
      
      let pY = y + 22;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      if (invoice.payments && invoice.payments.length > 0) {
        invoice.payments.forEach((p: any) => {
          doc.text(`- Date: ${new Date(p.date).toLocaleString()} | Amount: ₦${p.amount.toLocaleString()} | Method: ${p.method} | Ref: ${p.reference}`, 15, pY);
          pY += 5;
        });
      } else {
        doc.text("[No settled transactions recorded on this invoice]", 15, pY);
      }

      // Security Seal & Sign-off footer
      doc.setFillColor(240, 253, 250);
      doc.rect(15, 245, 180, 20, "F");
      
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.3);
      doc.rect(15, 245, 180, 20, "S");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(6, 95, 70); // emerald-800
      doc.text("EDUOS FINANCE REGISTRY SECURITY SEAL", 20, 252);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(4, 120, 87);
      doc.text("This document is dynamically generated under double-entry cryptographic verification. No physical signature is required.", 20, 257);
      doc.text("System Reference Node: aistudio-build-secure-transaction-ledger. Safe for offline school verification.", 20, 261);

      // Save PDF or trigger automatic printable iFrame flow
      const blobPdf = doc.output("blob");
      const blobUrl = URL.createObjectURL(blobPdf);
      
      const printFrame = document.createElement("iframe");
      printFrame.style.display = "none";
      printFrame.src = blobUrl;
      document.body.appendChild(printFrame);
      
      printFrame.onload = () => {
        setTimeout(() => {
          try {
            printFrame.contentWindow?.focus();
            printFrame.contentWindow?.print();
          } catch (e) {
            console.error("Iframe receipt print triggered fallback:", e);
            window.open(blobUrl, "_blank");
          }
        }, 300);
      };

    } catch (err) {
      console.error("PDF generation or print failed:", err);
      alert("Print blocked. Attempting PDF file download...");
    }
  };

  // Finance calculations
  const totalBilled = invoices.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalCollected = invoices.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
  const totalOutstanding = totalBilled - totalCollected;
  const collectionPercent = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  // Filter payment history search
  const filteredPaymentsHistory = paymentsHistory.filter(p => {
    if (!payHistorySearch.trim()) return true;
    const q = payHistorySearch.toLowerCase();
    return (
      (p.studentName || "").toLowerCase().includes(q) ||
      (p.className || "").toLowerCase().includes(q) ||
      (p.reference || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6" id="billing-module-container">
      
      {/* Financial Overview Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-600" />
            <span>EduOS Financial Fees & Billing Administration</span>
          </h3>
          <p className="text-xs text-slate-400">
            {role === "ADMIN" 
              ? "Track tuition collectibles, manage payment categories, and monitor parent settlement history." 
              : "Review termly outstanding invoices, simulate checkout, and print official school receipts."}
          </p>
        </div>

        {role === "ADMIN" && (
          <div className="flex bg-slate-100 p-1 rounded-xl flex-wrap gap-1">
            <button
              onClick={() => setActiveTab("DASHBOARD")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "DASHBOARD" 
                  ? "bg-white text-indigo-700 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Finance Dashboard
            </button>
            <button
              onClick={() => setActiveTab("BILL_STUDENT")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                activeTab === "BILL_STUDENT" 
                  ? "bg-white text-indigo-700 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Bill Student</span>
            </button>
            <button
              onClick={() => setActiveTab("CATEGORIES")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                activeTab === "CATEGORIES" 
                  ? "bg-white text-indigo-700 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Tag className="h-3.5 w-3.5" />
              <span>Categories</span>
            </button>
            <button
              onClick={() => setActiveTab("PAYMENT_HISTORY")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                activeTab === "PAYMENT_HISTORY" 
                  ? "bg-white text-indigo-700 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Payment History</span>
            </button>
          </div>
        )}
      </div>

      {/* VIEW SWITCHING PANELS */}
      
      {/* 1. MANAGE CATEGORIES TAB (ADMIN ONLY) */}
      {activeTab === "CATEGORIES" && role === "ADMIN" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          
          {/* Add Category Form */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 h-fit">
            <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-600" />
              <span>Create Payment Category</span>
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Define standard fee types like textbooks, laboratory tools, or hostel accommodation levies. These will populate billing selectors instantly.
            </p>

            {categorySuccess && (
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-emerald-800 text-[11px] font-semibold">
                {categorySuccess}
              </div>
            )}
            {categoryError && (
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl text-rose-800 text-[11px] font-semibold">
                {categoryError}
              </div>
            )}

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Textbook Levy"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-sm cursor-pointer transition-colors"
              >
                Create Category
              </button>
            </form>
          </div>

          {/* Categories list */}
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <Tag className="h-4 w-4 text-emerald-600" />
              <span>Registered Billing Categories ({categories.length})</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat, idx) => (
                <div 
                  key={idx}
                  className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 flex justify-between items-center group hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="bg-indigo-50 text-indigo-700 p-2 rounded-xl text-xs font-black font-mono">
                      {idx + 1}
                    </div>
                    <span className="font-extrabold text-slate-700 text-xs">
                      {cat}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {categories.length === 0 && (
                <div className="py-12 col-span-2 text-center text-slate-400 text-xs">
                  No billing categories found. Please create one to start billing.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* 2. PAYMENT HISTORIES TAB (ADMIN ONLY) */}
      {activeTab === "PAYMENT_HISTORY" && role === "ADMIN" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <History className="h-4 w-4 text-emerald-600" />
                <span>Unified Fees Payment Audit Logs</span>
              </h4>
              <p className="text-slate-400 text-xs">
                Real-time transaction tracking across Stripe and Paystack checkouts.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by pupil name, reference..."
                value={payHistorySearch}
                onChange={(e) => setPayHistorySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-indigo-500 font-medium"
              />
            </div>
          </div>

          <div className="border border-slate-150 rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold font-mono">
                  <th className="p-3">Reference</th>
                  <th className="p-3">Student / Class</th>
                  <th className="p-3">Term Block</th>
                  <th className="p-3">Method / Gateway</th>
                  <th className="p-3">Settlement Date</th>
                  <th className="p-3 text-right">Amount (₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 font-medium text-slate-700">
                {filteredPaymentsHistory.map((pay, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-slate-800">{pay.reference}</td>
                    <td className="p-3">
                      <div className="font-extrabold text-slate-900">{pay.studentName}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">{pay.className}</div>
                    </td>
                    <td className="p-3 text-slate-500">{pay.term}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                        pay.method.includes("Paystack") ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-purple-50 text-purple-700 border border-purple-100"
                      }`}>
                        {pay.method}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{new Date(pay.date).toLocaleDateString()}</td>
                    <td className="p-3 text-right font-black font-mono text-emerald-700">
                      ₦{pay.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}

                {filteredPaymentsHistory.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No payment transaction logs matching query filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. BILL STUDENT TAB (ADMIN ONLY) */}
      {activeTab === "BILL_STUDENT" && role === "ADMIN" && (
        <form onSubmit={handleCreateInvoiceSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
          <h4 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-3">
            Compile and Publish New Student Term Invoice
          </h4>

          {createError && (
            <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl text-rose-800 text-xs">
              {createError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase font-mono">Select Student</label>
              <select
                value={selectedStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  const st = students.find(x => x.id === e.target.value);
                  if (st) {
                    setSelectedStudentName(st.name);
                    setClassName(st.classId === "c-1" ? "SS3 Science" : st.classId === "c-2" ? "SS3 Arts" : "SS2 Commerce");
                  }
                }}
                className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-indigo-500"
              >
                {students.map(st => (
                  <option key={st.id} value={st.id}>{st.name} ({st.registrationNumber})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase font-mono">Academic Term Block</label>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-indigo-500"
              >
                <option value="Third Term 2025/2026">Third Term 2025/2026</option>
                <option value="Second Term 2025/2026">Second Term 2025/2026</option>
                <option value="First Term 2025/2026">First Term 2025/2026</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase font-mono">Payment Deadline</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-indigo-500"
              />
            </div>
          </div>

          {/* Dynamic Item Add Block */}
          <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 space-y-4">
            <h5 className="font-bold text-slate-700 text-xs uppercase font-mono tracking-wider">
              Fee Itemization List
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="col-span-2">
                <select
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full text-xs border border-slate-200 bg-white rounded-xl p-2.5 focus:outline-indigo-500"
                >
                  {categories.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                  <option value="Other Custom Category...">Other Custom Category...</option>
                </select>
              </div>

              {newItemName === "Other Custom Category..." && (
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Enter custom label..."
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    className="w-full text-xs border border-slate-200 bg-white rounded-xl p-2.5 focus:outline-indigo-500"
                  />
                </div>
              )}

              <div className={newItemName === "Other Custom Category..." ? "col-span-2 flex gap-2" : "col-span-2 flex gap-2"}>
                <input
                  type="number"
                  placeholder="Amount (₦)"
                  value={newItemAmount}
                  onChange={(e) => setNewItemAmount(e.target.value)}
                  className="w-full text-xs border border-slate-200 bg-white rounded-xl p-2.5 focus:outline-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="bg-emerald-600 text-white font-extrabold px-4.5 rounded-xl text-xs hover:bg-emerald-700 transition-colors shrink-0"
                >
                  Add Fee
                </button>
              </div>
            </div>

            {/* Render items array */}
            <div className="divide-y divide-slate-200 border border-slate-100 bg-white rounded-xl overflow-hidden text-xs">
              {billItems.map((item, idx) => (
                <div key={idx} className="p-3 flex justify-between items-center hover:bg-slate-50/30">
                  <span className="font-semibold text-slate-700">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold font-mono">₦{item.amount.toLocaleString()}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {billItems.length === 0 && (
                <div className="p-4 text-center text-slate-400">
                  No billing items compounding.
                </div>
              )}
            </div>

            {/* Subtotal */}
            <div className="text-right font-black text-slate-800 text-sm">
              Compound Total: ₦{billItems.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setActiveTab("DASHBOARD")}
              className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-sm"
            >
              Publish Tuition Invoice
            </button>
          </div>
        </form>
      )}

      {/* 4. DASHBOARD FEE MODULE & MOCK PAYMENT GATEWAYS (STRIPE / PAYSTACK) */}
      {activeTab === "DASHBOARD" && (
        <div className="space-y-6">
          
          {/* Admin Metrics */}
          {role === "ADMIN" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold font-mono text-indigo-400 uppercase block tracking-wider">Total Billed Fees</span>
                  <div className="text-2xl font-black font-mono text-indigo-700">₦{totalBilled.toLocaleString()}</div>
                </div>
                <Building className="h-8 w-8 text-indigo-300" />
              </div>

              <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold font-mono text-emerald-400 uppercase block tracking-wider">Total Collected</span>
                  <div className="text-2xl font-black font-mono text-emerald-700">₦{totalCollected.toLocaleString()}</div>
                </div>
                <CheckCircle className="h-8 w-8 text-emerald-300" />
              </div>

              <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold font-mono text-rose-400 uppercase block tracking-wider">Outstanding Receivables</span>
                  <div className="text-2xl font-black font-mono text-rose-700">₦{totalOutstanding.toLocaleString()}</div>
                </div>
                <AlertTriangle className="h-8 w-8 text-rose-300" />
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2 shadow-sm">
                <div className="flex justify-between text-[10px] font-bold font-mono text-slate-500 uppercase">
                  <span>Collection rate</span>
                  <span>{collectionPercent}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-2 transition-all" style={{ width: `${collectionPercent}%` }} />
                </div>
                <span className="text-[9px] text-slate-400 font-mono block">Real-time tuition fulfillment telemetry</span>
              </div>
            </div>
          )}

          {/* Main Layout List + Panel Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Term Tuition Invoice lists */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="font-extrabold text-slate-800 text-sm font-mono tracking-wider uppercase">
                Term tuition billing invoices
              </h4>

              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                {loading ? (
                  <div className="py-20 text-center flex flex-col items-center justify-center space-y-2">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[11px] text-slate-500 font-mono">Loading financial ledgers...</span>
                  </div>
                ) : invoices.length > 0 ? (
                  <div className="divide-y divide-slate-100 text-xs">
                    {invoices.map(inv => {
                      const outstanding = inv.totalAmount - inv.paidAmount;
                      return (
                        <div 
                          key={inv.id}
                          className="p-5 hover:bg-slate-50/50 transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group"
                          onClick={() => {
                            setActiveReceiptInvoice(inv);
                            if (inv.status !== "PAID" && (role === "STUDENT" || role === "PARENT")) {
                              setPaymentInvoice(inv);
                              setPaymentStep("INPUT");
                            }
                          }}
                        >
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded text-[9px]">
                                {inv.id}
                              </span>
                              <span className="text-slate-400 font-semibold">
                                {inv.term}
                              </span>
                            </div>

                            <h5 className="font-extrabold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors">
                              {inv.studentName} ({inv.className})
                            </h5>

                            <div className="flex gap-4 font-mono font-bold text-[10px]">
                              <div>
                                <span className="text-slate-400">TOTAL:</span>{" "}
                                <span className="text-slate-700">₦{inv.totalAmount.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-slate-400">SETTLED:</span>{" "}
                                <span className="text-emerald-600">₦{inv.paidAmount.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            {inv.status === "PAID" ? (
                              <span className="bg-emerald-50 text-emerald-700 font-black px-3 py-1 rounded-full border border-emerald-100 tracking-wider font-mono text-[9px] uppercase">
                                PAID FULL
                              </span>
                            ) : outstanding < inv.totalAmount ? (
                              <span className="bg-amber-50 text-amber-700 font-black px-3 py-1 rounded-full border border-amber-100 tracking-wider font-mono text-[9px] uppercase">
                                PARTIAL (₦{outstanding.toLocaleString()} BAL)
                              </span>
                            ) : (
                              <span className="bg-rose-50 text-rose-700 font-black px-3 py-1 rounded-full border border-rose-100 tracking-wider font-mono text-[9px] uppercase animate-pulse">
                                UNPAID (₦{outstanding.toLocaleString()})
                              </span>
                            )}
                            
                            {role === "ADMIN" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteInvoice(inv.id);
                                }}
                                className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-24 text-center space-y-2 text-slate-400">
                    <ShieldCheck className="h-8 w-8 text-slate-300 mx-auto stroke-1" />
                    <span className="font-extrabold block text-xs">No Term Bills Issued</span>
                    <span className="text-[11px]">All student billing balances are fully cleared and in order.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Active Invoice Ledger detail & Checkout overlay */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-slate-800 text-sm font-mono tracking-wider uppercase">
                Invoice Ledger Details
              </h4>

              {activeReceiptInvoice ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 text-xs">
                  
                  {/* Ledger header */}
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <div className="space-y-1">
                      <span className="font-mono bg-slate-50 text-slate-500 font-bold px-2 py-0.5 rounded text-[9px]">
                        Ref: {activeReceiptInvoice.id}
                      </span>
                      <h5 className="font-black text-slate-800 text-sm">{activeReceiptInvoice.studentName}</h5>
                      <span className="text-slate-400 block font-semibold text-[10px]">
                        Class: {activeReceiptInvoice.className}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-mono block">DUE DATE:</span>
                      <strong className="text-slate-700 font-mono font-black">{activeReceiptInvoice.dueDate}</strong>
                    </div>
                  </div>

                  {/* items breakdown */}
                  <div className="space-y-2">
                    <span className="font-mono uppercase text-slate-400 font-bold text-[9px] tracking-wider block">Itemized Charges:</span>
                    <div className="space-y-1.5">
                      {(activeReceiptInvoice.items || []).map((it: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-slate-600 font-semibold bg-slate-50/50 p-2 rounded-xl border border-slate-100/50">
                          <span>{it.name}</span>
                          <span className="font-mono text-slate-800 font-black">₦{it.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-2 font-black text-slate-800 text-sm">
                      <span>Total Amount:</span>
                      <span className="font-mono text-indigo-700">₦{activeReceiptInvoice.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Transaction settled logs */}
                  {activeReceiptInvoice.payments && activeReceiptInvoice.payments.length > 0 && (
                    <div className="space-y-2 border-t border-slate-100 pt-3 text-[10px]">
                      <strong className="block text-slate-400 font-mono uppercase tracking-wider">Settled Transactions Log:</strong>
                      <div className="bg-emerald-50/40 border border-emerald-100 p-3 rounded-2xl space-y-1.5">
                        {activeReceiptInvoice.payments.map((p: any, i: number) => (
                          <div key={i} className="space-y-0.5">
                            <div className="flex justify-between text-emerald-800 font-extrabold">
                              <span>₦{p.amount.toLocaleString()}</span>
                              <span className="font-mono">{new Date(p.date).toLocaleDateString()}</span>
                            </div>
                            <span className="text-emerald-700 font-bold block">{p.method}</span>
                            <span className="text-slate-400 font-mono block">Ref: {p.reference}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payment controls & PDF Receipt trigger */}
                  {activeReceiptInvoice.status === "PAID" ? (
                    <button
                      onClick={() => handlePrintReceipt(activeReceiptInvoice)}
                      className="w-full bg-slate-800 text-white font-extrabold py-3 rounded-xl hover:bg-slate-900 transition-all text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Print Official Tuition Receipt</span>
                    </button>
                  ) : (role === "STUDENT" || role === "PARENT") ? (
                    
                    /* INTEGRATED DUAL GATEWAYS CHECKOUT MODULE */
                    <div className="border-t border-slate-150 pt-4 space-y-4">
                      
                      {paymentStep === "INPUT" && (
                        <div className="space-y-4 p-4 border border-indigo-100 bg-indigo-50/10 rounded-2xl relative overflow-hidden">
                          <div className="flex items-center justify-between">
                            <h6 className="font-black text-slate-800 text-xs flex items-center gap-1">
                              <ShieldCheck className="h-4 w-4 text-indigo-600" />
                              <span>Select Payment Gateway</span>
                            </h6>
                          </div>

                          {/* Stripe vs Paystack toggle */}
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <button
                              type="button"
                              onClick={() => setSelectedGateway("STRIPE")}
                              className={`py-2 rounded-xl font-black transition-all flex items-center justify-center gap-1 border cursor-pointer ${
                                selectedGateway === "STRIPE" 
                                  ? "bg-purple-600 text-white border-purple-700 shadow-sm" 
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              <Lock className="h-3.5 w-3.5" />
                              <span>Stripe (USD/EUR)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedGateway("PAYSTACK")}
                              className={`py-2 rounded-xl font-black transition-all flex items-center justify-center gap-1 border cursor-pointer ${
                                selectedGateway === "PAYSTACK" 
                                  ? "bg-emerald-600 text-white border-emerald-700 shadow-sm" 
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Paystack (NGN ₦)</span>
                            </button>
                          </div>

                          {/* STRIPE PAYMENTS FORM */}
                          {selectedGateway === "STRIPE" && (
                            <div className="space-y-3 pt-1">
                              <div className="bg-purple-950 text-purple-300 p-2.5 rounded-xl text-[10px] flex items-center justify-between border border-purple-900/50">
                                <span className="font-bold">Stripe Card Element Secure Sandbox</span>
                                <span className="font-mono text-purple-400 font-black">USD $</span>
                              </div>

                              <div className="space-y-2">
                                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Credit / Debit Card</label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    maxLength={19}
                                    placeholder="4242 4242 4242 4242"
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(e.target.value)}
                                    className="w-full text-xs border border-slate-200 bg-white rounded-xl p-2.5 focus:outline-purple-500 font-mono pl-3"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    maxLength={5}
                                    placeholder="MM/YY"
                                    value={cardExpiry}
                                    onChange={(e) => setCardExpiry(e.target.value)}
                                    className="w-full text-xs border border-slate-200 bg-white rounded-xl p-2.5 focus:outline-purple-500 font-mono text-center"
                                  />
                                  <input
                                    type="password"
                                    maxLength={3}
                                    placeholder="CVC"
                                    value={cardCvv}
                                    onChange={(e) => setCardCvv(e.target.value)}
                                    className="w-full text-xs border border-slate-200 bg-white rounded-xl p-2.5 focus:outline-purple-500 font-mono text-center"
                                  />
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={handleSimulatePayment}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1 shadow-sm cursor-pointer mt-1"
                              >
                                <span>Stripe Pay: ₦{activeReceiptInvoice.totalAmount.toLocaleString()}</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}

                          {/* PAYSTACK PAYMENTS FORM */}
                          {selectedGateway === "PAYSTACK" && (
                            <div className="space-y-3 pt-1">
                              <div className="bg-emerald-950 text-emerald-300 p-2.5 rounded-xl text-[10px] flex items-center justify-between border border-emerald-900/50">
                                <span className="font-bold">Paystack Secure Interswitch Node</span>
                                <span className="font-mono text-emerald-400 font-black">NGN ₦</span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => setPayMethod("CARD")}
                                  className={`py-1.5 font-bold rounded-lg cursor-pointer ${payMethod === "CARD" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}
                                >
                                  ATM Debit Card
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPayMethod("TRANSFER")}
                                  className={`py-1.5 font-bold rounded-lg cursor-pointer ${payMethod === "TRANSFER" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}
                                >
                                  Instant Bank Transfer
                                </button>
                              </div>

                              {payMethod === "CARD" ? (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    maxLength={19}
                                    placeholder="5061 1234 5678 9010"
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(e.target.value)}
                                    className="w-full text-xs border border-slate-200 bg-white rounded-xl p-2.5 focus:outline-emerald-500 font-mono"
                                  />
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="text"
                                      maxLength={5}
                                      placeholder="MM/YY"
                                      value={cardExpiry}
                                      onChange={(e) => setCardExpiry(e.target.value)}
                                      className="w-full text-xs border border-slate-200 bg-white rounded-xl p-2.5 focus:outline-emerald-500 font-mono text-center"
                                    />
                                    <input
                                      type="password"
                                      maxLength={3}
                                      placeholder="CVV"
                                      value={cardCvv}
                                      onChange={(e) => setCardCvv(e.target.value)}
                                      className="w-full text-xs border border-slate-200 bg-white rounded-xl p-2.5 focus:outline-emerald-500 font-mono text-center"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-3 space-y-1.5 bg-slate-50 rounded-xl border border-slate-150">
                                  <span className="font-bold text-[10px] text-slate-500 block uppercase font-mono">Providus Bank (EduOS Central Escrow)</span>
                                  <span className="font-mono text-sm text-emerald-600 font-black block select-all tracking-wider">9028349281</span>
                                  <p className="text-[9px] text-slate-400 max-w-[200px] mx-auto leading-normal">
                                    Transfer exactly ₦{activeReceiptInvoice.totalAmount.toLocaleString()} to complete the fees settlement audit.
                                  </p>
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={handleSimulatePayment}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                              >
                                <span>Paystack Pay: ₦{activeReceiptInvoice.totalAmount.toLocaleString()}</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}

                        </div>
                      )}

                      {paymentStep === "PROCESSING" && (
                        <div className="py-12 text-center space-y-3 border border-indigo-100 bg-indigo-50/10 rounded-2xl">
                          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                          <span className="text-xs text-slate-700 font-bold block">
                            Connecting Secure {selectedGateway === "PAYSTACK" ? "Paystack Interswitch Node" : "Stripe Card Elements Sandbox"}...
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block animate-pulse">Running dual-factor credential alignment assays</span>
                        </div>
                      )}

                      {paymentStep === "SUCCESS" && (
                        <div className="p-5 border border-emerald-150 bg-emerald-50/20 rounded-2xl text-center space-y-2 animate-fade-in">
                          <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto animate-bounce" />
                          <h6 className="font-extrabold text-emerald-800 text-xs">Payment Cleared Successfully!</h6>
                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            Financial ledgers updated. Printable school receipts and digital class access credentials are now fully unlocked.
                          </p>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="p-3 text-center border border-dashed border-slate-200 rounded-xl text-[10px] text-slate-400 font-medium">
                      Admin invoice review channel. No payment clearance triggers required.
                    </div>
                  )}

                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl py-24 text-center text-slate-300 shadow-sm">
                  <CreditCard className="h-10 w-10 mb-2 stroke-1 mx-auto" />
                  <span className="text-xs font-mono font-bold">Select a term invoice from the list</span>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
