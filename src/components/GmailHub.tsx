import React, { useState, useEffect } from "react";
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Inbox, 
  User, 
  RefreshCw, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  Lock, 
  LogOut, 
  FileText, 
  ChevronDown,
  ExternalLink
} from "lucide-react";
import { 
  signInWithGmail, 
  logoutGmail, 
  initGmailAuth, 
  sendGmailMessage, 
  listGmailMessages, 
  getHeaderValue 
} from "../utils/gmail";
import { logActivity } from "../utils/auditLogger";
import { motion, AnimatePresence } from "motion/react";

interface GmailHubProps {
  token: string;
}

export default function GmailHub({ token }: GmailHubProps) {
  const [gmailUser, setGmailUser] = useState<any | null>(null);
  const [gmailToken, setGmailToken] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // Tab states: 'compose' | 'inbox'
  const [activeSubTab, setActiveSubTab] = useState<"compose" | "inbox">("compose");

  // Compose Form State
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("custom");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // Inbox State
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [inboxError, setInboxError] = useState<string | null>(null);

  // Load registered student contact directory to autocomplete
  const [contacts, setContacts] = useState<any[]>([]);

  // Initialize Gmail Auth state
  useEffect(() => {
    const unsubscribe = initGmailAuth(
      (user, cachedToken) => {
        setGmailUser(user);
        setGmailToken(cachedToken);
        setLoadingAuth(false);
      },
      () => {
        setGmailUser(null);
        setGmailToken(null);
        setLoadingAuth(false);
      }
    );

    // Fetch school contact index to make composing a breeze
    const fetchContacts = async () => {
      try {
        const res = await fetch("/api/students", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setContacts(data);
        }
      } catch (err) {
        console.error("Failed to fetch students for Gmail directory:", err);
      }
    };
    fetchContacts();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [token]);

  // Handle Google Authorization
  const handleAuthorize = async () => {
    try {
      setLoadingAuth(true);
      const res = await signInWithGmail();
      if (res) {
        setGmailUser(res.user);
        setGmailToken(res.accessToken);
        logActivity("ADMIN_OP", `Connected Gmail API profile securely via Google Auth (${res.user.email}).`, "SUCCESS", res.user.displayName || "Admin");
      }
    } catch (err: any) {
      console.error("Authorization flow interrupted:", err);
    } finally {
      setLoadingAuth(false);
    }
  };

  // Handle Logout
  const handleDisconnect = async () => {
    if (window.confirm("Are you sure you want to disconnect your Gmail registry node? You will need to re-authenticate to send emails.")) {
      const email = gmailUser?.email || "Unknown";
      await logoutGmail();
      setGmailUser(null);
      setGmailToken(null);
      setMessages([]);
      setSelectedMessage(null);
      logActivity("ADMIN_OP", `Disconnected Gmail integration node for ${email}.`, "OK", "System");
    }
  };

  // Fetch Latest Inbox items
  const fetchInbox = async () => {
    if (!gmailToken) return;
    try {
      setLoadingInbox(true);
      setInboxError(null);
      const fetched = await listGmailMessages(gmailToken, 12);
      setMessages(fetched);
    } catch (err: any) {
      console.error("Inbox query failure:", err);
      setInboxError(err.message || "Failed to sync inbox emails. Access token may have expired.");
    } finally {
      setLoadingInbox(false);
    }
  };

  // Sync inbox on tab select or auth complete
  useEffect(() => {
    if (gmailToken && activeSubTab === "inbox") {
      fetchInbox();
    }
  }, [gmailToken, activeSubTab]);

  // Form templates mapping
  const templates: Record<string, { subject: string; body: string }> = {
    custom: {
      subject: "",
      body: ""
    },
    cbt_invite: {
      subject: "INVITATION: Upcoming School CBT Continuous Assessment Session",
      body: `<h3><strong>CBT PRO ACADEMY ASSESSMENT HUB</strong></h3>
<p>Dear Student,</p>
<p>This is to notify you that a new computer-based testing session has been scheduled in the <strong>CBT PRO Cloud Portal</strong>.</p>
<p><strong>Registry Status:</strong> Active<br>
<strong>Assessed Location:</strong> Online Portal / Cloud ERP Node<br>
<strong>Instruction:</strong> Please log in to your account with your assigned student registration credentials to start the assessment.</p>
<p>Ensure a stable internet connection and quiet testing workspace before proceeding.</p>
<br>
<p>Best regards,<br>
<strong>Academic Registry Desk</strong><br>
EduOS Educational Operating System</p>`
    },
    fee_reminder: {
      subject: "URGENT STATUS: Outstanding Tuition & Laboratory Assessment Fees",
      body: `<h3><strong>CBT PRO ACADEMY REGISTRY</strong></h3>
<p>Dear Parent / Guardian,</p>
<p>We are writing to draw your attention to outstanding school tuition and CBT session billing accounts associated with your ward's student profile.</p>
<p>To avoid portal lockouts and allow full participation in upcoming term examinations, please finalize outstanding balances immediately with the school bursar desk.</p>
<p>Thank you for your continuous support.</p>
<br>
<p>Warm regards,<br>
<strong>Finance & Treasury Operations</strong><br>
CBT Pro Academy Core Office</p>`
    },
    performance_warning: {
      subject: "ACADEMIC ADVISORY: Mid-Term Performance & Continuous Assessment Report",
      body: `<h3><strong>STUDENT PROGRESS ADVISORY</strong></h3>
<p>Dear Parent / Guardian,</p>
<p>This academic advisory is issued regarding your ward's performance across recent Continuous Assessment CBT trials and general class attendance indices.</p>
<p>We strongly recommend reviewing the available performance trends inside the <strong>Guardian Portal</strong> and scheduling a remote briefing with our academic advisors using the portal calendar tools.</p>
<br>
<p>Best regards,<br>
<strong>Office of Academic Standards</strong><br>
EduOS Registrar</p>`
    }
  };

  // Apply templates
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedTemplate(val);
    if (templates[val]) {
      setSubject(templates[val].subject);
      setEmailBody(templates[val].body);
    }
  };

  // Send Email Action
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmailToken) return;
    if (!toEmail || !subject || !emailBody) {
      setSendError("Please complete all fields (To, Subject, and Email Body) before sending.");
      return;
    }

    const confirmed = window.confirm(`Confirm action: Send this official email to "${toEmail}" via your authorized Gmail account (${gmailUser?.email})?`);
    if (!confirmed) return;

    try {
      setSendingEmail(true);
      setSendSuccess(null);
      setSendError(null);

      // Call API
      await sendGmailMessage(gmailToken, toEmail, subject, emailBody);
      
      setSendSuccess(`Email successfully delivered to ${toEmail}! Message ID logged.`);
      logActivity(
        "ADMIN_OP", 
        `Sent email to ${toEmail} using Gmail Node (Subject: "${subject}").`, 
        "SUCCESS", 
        gmailUser?.displayName || "Admin"
      );

      // Reset Form (except template selection)
      setToEmail("");
      setSubject("");
      setEmailBody("");
      setSelectedTemplate("custom");
    } catch (err: any) {
      console.error("Email delivery failure:", err);
      setSendError(err.message || "Failed to deliver email. Check recipient address syntax.");
    } finally {
      setSendingEmail(false);
    }
  };

  if (loadingAuth) {
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 text-sm font-medium">Securing Google Workspace Handshakes...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 font-sans">
      
      {/* 1. Header Banner / Connection Status Card */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-indigo-600 px-6 py-6 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Gmail SIS Integration Suite</h1>
              <p className="text-white/80 text-xs mt-0.5">
                Official Google Workspace node for direct announcements, billing updates, and digital dossier transmissions.
              </p>
            </div>
          </div>

          <div>
            {!gmailUser ? (
              <button
                onClick={handleAuthorize}
                className="flex items-center space-x-2.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold px-4 py-2.5 rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-xs"
              >
                <svg className="h-4 w-4" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span>Authorize with Google SSO</span>
              </button>
            ) : (
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md rounded-xl p-2 pl-3">
                <div className="text-right">
                  <div className="text-xs font-bold text-white">{gmailUser.displayName || "Admin User"}</div>
                  <div className="text-[10px] text-white/70 font-mono">{gmailUser.email}</div>
                </div>
                <button
                  onClick={handleDisconnect}
                  title="Disconnect Gmail Account"
                  className="bg-white/25 hover:bg-white/40 p-2 rounded-lg text-white transition-all cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2. Sub Navigation (only shown when authorized) */}
        {gmailUser && (
          <div className="flex border-b border-slate-100 bg-slate-50 px-4">
            <button
              onClick={() => setActiveSubTab("compose")}
              className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeSubTab === "compose"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Send className="h-3.5 w-3.5" />
              <span>Compose School Announcement</span>
            </button>
            <button
              onClick={() => setActiveSubTab("inbox")}
              className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeSubTab === "inbox"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Inbox className="h-3.5 w-3.5" />
              <span>Inbox Monitor (Gmail API)</span>
            </button>
          </div>
        )}
      </div>

      {/* Case 1: Unauthorized state */}
      {!gmailUser ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 animate-pulse">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Secure Gmail Account Authorization Needed</h2>
          <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
            Due to strict privacy restrictions, sending official reports and school notifications via Google services requires secure, ephemeral authentication. 
            Connect your Gmail profile once to unlock fully-integrated email communications.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-3">
            <button
              onClick={handleAuthorize}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-3 rounded-xl shadow-lg shadow-indigo-600/15 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <span>Authenticate Google Node</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Case 2: Authorized content tabs */
        <div>
          <AnimatePresence mode="wait">
            {activeSubTab === "compose" ? (
              <motion.div
                key="compose"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                
                {/* Compose Form Block (Col span 2) */}
                <div className="lg:col-span-2 bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Compose Dispatch</h2>
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-1 rounded-md flex items-center space-x-1">
                      <Sparkles className="h-3 w-3" />
                      <span>SMTP Proxy Live</span>
                    </span>
                  </div>

                  {sendSuccess && (
                    <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start space-x-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-emerald-800 font-medium">{sendSuccess}</div>
                    </div>
                  )}

                  {sendError && (
                    <div className="mb-5 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-rose-800 font-medium">{sendError}</div>
                    </div>
                  )}

                  <form onSubmit={handleSendEmail} className="space-y-4">
                    
                    {/* Recipient Input & Suggestions */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Recipient Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="parent@example.com or student@example.com"
                        value={toEmail}
                        onChange={(e) => setToEmail(e.target.value)}
                        className="w-full text-xs border border-slate-200 p-2.5 rounded-lg focus:outline-indigo-500 font-medium"
                      />
                    </div>

                    {/* Quick Template Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Dispatch Template Presets</label>
                      <div className="relative">
                        <select
                          value={selectedTemplate}
                          onChange={handleTemplateChange}
                          className="w-full text-xs border border-slate-200 p-2.5 rounded-lg focus:outline-indigo-500 appearance-none bg-white font-medium cursor-pointer"
                        >
                          <option value="custom">-- Custom Manual Email --</option>
                          <option value="cbt_invite">Assessment Portal Session Invitation</option>
                          <option value="fee_reminder">Outstanding Tuition & Trial Fees Alert</option>
                          <option value="performance_warning">Mid-term Student Progress Advisory</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-3.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Subject Line */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Subject Line</label>
                      <input
                        type="text"
                        required
                        placeholder="Subject header..."
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full text-xs border border-slate-200 p-2.5 rounded-lg focus:outline-indigo-500 font-semibold text-slate-800"
                      />
                    </div>

                    {/* Email Rich/HTML Body */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        Body Content (HTML Supported)
                      </label>
                      <textarea
                        required
                        rows={10}
                        placeholder="Type your official message content here..."
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        className="w-full text-xs border border-slate-200 p-3 rounded-lg focus:outline-indigo-500 font-medium leading-relaxed font-mono bg-slate-50"
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={sendingEmail}
                        className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-indigo-600 hover:from-red-400 hover:to-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>{sendingEmail ? "Transmitting..." : "Send Dispatch via Gmail"}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Directory Autocomplete Sidebar */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-4">Student Contact Index</h3>
                  <p className="text-[11px] text-slate-400 mb-4">
                    Click any active student's email card below to populate the recipient field.
                  </p>

                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {contacts.length > 0 ? (
                      contacts.map((contact) => (
                        <div
                          key={contact.id}
                          onClick={() => {
                            setToEmail(contact.email || "");
                            // Highlight template suggestion
                            if (selectedTemplate === "custom") {
                              setSelectedTemplate("cbt_invite");
                              setSubject(templates.cbt_invite.subject);
                              setEmailBody(templates.cbt_invite.body);
                            }
                          }}
                          className="p-3 border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/20 rounded-xl cursor-pointer transition-all flex items-center space-x-3 group"
                        >
                          <div className="h-8 w-8 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 font-bold text-xs">
                            {contact.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">
                              {contact.name}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate font-mono">
                              {contact.email || "No Email Registered"}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        No students loaded in directories.
                      </div>
                    )}
                  </div>
                </div>

              </motion.div>
            ) : (
              
              /* Inbox view */
              <motion.div
                key="inbox"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                
                {/* Inbox List Column (Col span 1 or 2) */}
                <div className="lg:col-span-1 bg-white border border-slate-100 shadow-sm rounded-2xl p-4 flex flex-col h-[580px]">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <div className="flex items-center space-x-2">
                      <Inbox className="h-4 w-4 text-indigo-600" />
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Sync Inbox</h3>
                    </div>
                    <button
                      onClick={fetchInbox}
                      disabled={loadingInbox}
                      className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${loadingInbox ? "animate-spin text-indigo-600" : ""}`} />
                    </button>
                  </div>

                  {inboxError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 mb-3">
                      {inboxError}
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {loadingInbox && messages.length === 0 ? (
                      <div className="text-center py-20 text-slate-400 text-xs">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto text-indigo-600 mb-2" />
                        Fetching latest dispatches...
                      </div>
                    ) : messages.length > 0 ? (
                      messages.map((msg) => {
                        const headers = msg.payload?.headers || [];
                        const from = getHeaderValue(headers, "From");
                        const subjectHeader = getHeaderValue(headers, "Subject") || "(No Subject)";
                        const date = getHeaderValue(headers, "Date");
                        const isSelected = selectedMessage?.id === msg.id;

                        // Parse simple sender name
                        const senderName = from.replace(/<.*>/, "").replace(/"/g, "").trim();

                        return (
                          <div
                            key={msg.id}
                            onClick={() => setSelectedMessage(msg)}
                            className={`p-3 border rounded-xl cursor-pointer transition-all flex flex-col space-y-1.5 ${
                              isSelected
                                ? "border-indigo-500 bg-indigo-50/20 shadow-sm"
                                : "border-slate-100 hover:border-slate-300 hover:bg-slate-50/40"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-bold text-slate-700 truncate max-w-[120px]">
                                {senderName}
                              </span>
                              <span className="text-[9px] text-slate-400 font-medium">
                                {new Date(date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-slate-800 truncate">
                              {subjectHeader}
                            </div>
                            <p className="text-[10px] text-slate-400 truncate">
                              {msg.snippet}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-20 text-slate-400 text-xs">
                        No messages synchronized. Click sync to retrieve your mailbox.
                      </div>
                    )}
                  </div>
                </div>

                {/* Message detail body */}
                <div className="lg:col-span-2 bg-white border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col h-[580px]">
                  {selectedMessage ? (
                    <div className="flex flex-col h-full">
                      
                      {/* Message Header */}
                      <div className="pb-4 border-b border-slate-100 mb-4">
                        <h2 className="text-sm font-bold text-slate-800">
                          {getHeaderValue(selectedMessage.payload?.headers || [], "Subject") || "(No Subject)"}
                        </h2>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3">
                          <div className="flex items-center space-x-2.5">
                            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                              <User className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-700">
                                {getHeaderValue(selectedMessage.payload?.headers || [], "From")}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                To: {getHeaderValue(selectedMessage.payload?.headers || [], "To")}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1.5 text-slate-400">
                            <Clock className="h-3 w-3" />
                            <span className="text-[10px] font-mono">
                              {getHeaderValue(selectedMessage.payload?.headers || [], "Date")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Message Body iframe/raw */}
                      <div className="flex-1 overflow-y-auto bg-slate-50 border border-slate-100 rounded-xl p-4">
                        {/* Render simple snippet if empty body parsed */}
                        <div 
                          className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ 
                            __html: selectedMessage.snippet + "<br><br><p className='text-slate-400 italic'>Note: Full rich HTML body is accessible via your primary Gmail client.</p>"
                          }}
                        />
                      </div>

                      <div className="pt-4 border-t border-slate-100 mt-4 flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 font-mono">
                          Message ID: {selectedMessage.id}
                        </span>
                        
                        <a
                          href={`https://mail.google.com/mail/u/0/#inbox/${selectedMessage.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 text-xs font-semibold px-4 py-2 rounded-lg transition-all"
                        >
                          <span>Open in native Gmail</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>

                    </div>
                  ) : (
                    <div className="m-auto text-center py-20 text-slate-400 text-xs flex flex-col items-center">
                      <Mail className="h-12 w-12 text-slate-200 mb-3 animate-bounce" />
                      <p className="font-semibold text-slate-500">No dispatch selected</p>
                      <p className="text-[11px] max-w-xs mt-1">
                        Select any email from the left pane to view detailed headers, timestamps, and communications snippets.
                      </p>
                    </div>
                  )}
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

    </div>
  );
}
