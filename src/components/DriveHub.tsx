import React, { useState, useEffect, useRef } from "react";
import { 
  HardDrive, 
  Folder, 
  FolderPlus, 
  UploadCloud, 
  FileSpreadsheet, 
  Trash2, 
  ExternalLink, 
  ChevronRight, 
  RefreshCw, 
  Lock, 
  Plus, 
  Search, 
  ArrowLeft, 
  Clock, 
  User, 
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileImage,
  FileCode,
  File,
  X
} from "lucide-react";
import { 
  signInWithDrive, 
  logoutDrive, 
  initDriveAuth, 
  listDriveFiles, 
  uploadDriveFile, 
  createDriveFolder, 
  deleteDriveFile, 
  uploadTextFileToDrive 
} from "../utils/drive";
import { logActivity } from "../utils/auditLogger";
import { motion, AnimatePresence } from "motion/react";

interface DriveHubProps {
  token: string;
}

interface FileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  iconLink?: string;
  webViewLink?: string;
  owners?: Array<{
    displayName: string;
    emailAddress: string;
    photoLink?: string;
  }>;
}

export default function DriveHub({ token }: DriveHubProps) {
  const [driveUser, setDriveUser] = useState<any | null>(null);
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // File explorer states
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string>("root");
  const [folderTrail, setFolderTrail] = useState<Array<{ id: string; name: string }>>([
    { id: "root", name: "My Drive" }
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [fileFilter, setFileFilter] = useState<"all" | "folders" | "documents" | "spreadsheets" | "images">("all");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  // Status banners
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal / Inputs
  const [newFolderName, setNewFolderName] = useState("");
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);

  // File Upload State
  const [uploadingFile, setUploadingFile] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ERP Exports States
  const [exportingStudents, setExportingStudents] = useState(false);
  const [exportingAdmissions, setExportingAdmissions] = useState(false);

  // Initialize Drive Auth State
  useEffect(() => {
    const unsubscribe = initDriveAuth(
      (user, cachedToken) => {
        setDriveUser(user);
        setDriveToken(cachedToken);
        setLoadingAuth(false);
      },
      () => {
        setDriveUser(null);
        setDriveToken(null);
        setLoadingAuth(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Handle Google Authorization
  const handleAuthorize = async () => {
    try {
      setLoadingAuth(true);
      setErrorMsg(null);
      const res = await signInWithDrive();
      if (res) {
        setDriveUser(res.user);
        setDriveToken(res.accessToken);
        logActivity("ADMIN_OP", `Connected Google Drive API node via Google Auth (${res.user.email}).`, "SUCCESS", res.user.displayName || "Admin");
      }
    } catch (err: any) {
      console.error("Authorization flow failed:", err);
      const isClosed = err.code === "auth/popup-closed-by-user" || err.message?.includes("popup-closed-by-user") || err.message?.includes("closed by user");
      const isBlocked = err.code === "auth/popup-blocked" || err.message?.includes("popup-blocked") || err.message?.includes("blocked");
      
      if (isClosed) {
        setErrorMsg("The Google sign-in window was closed before completion. Please try again and make sure to complete the Google authentication process.");
      } else if (isBlocked) {
        setErrorMsg("The Google sign-in popup was blocked by your browser settings. Please allow popups for this site, or open this application in a new tab (click the icon in the top-right corner of the preview iframe) and try again.");
      } else {
        setErrorMsg(`Google authorization failed. Note: If you are running inside a nested preview iframe, please open the application in a new tab (using the icon in the top-right corner of the preview) to complete the connection.`);
      }
    } finally {
      setLoadingAuth(false);
    }
  };

  // Handle Disconnect
  const handleDisconnect = async () => {
    if (window.confirm("Are you sure you want to disconnect your Google Drive storage node?")) {
      const email = driveUser?.email || "Unknown";
      await logoutDrive();
      setDriveUser(null);
      setDriveToken(null);
      setFiles([]);
      setSelectedFile(null);
      setFolderTrail([{ id: "root", name: "My Drive" }]);
      setCurrentFolderId("root");
      logActivity("ADMIN_OP", `Disconnected Google Drive integration node for ${email}.`, "OK", "System");
    }
  };

  // Fetch Files
  const fetchFiles = async () => {
    if (!driveToken) return;
    try {
      setLoadingFiles(true);
      setErrorMsg(null);
      const fileList = await listDriveFiles(driveToken, currentFolderId, searchQuery);
      setFiles(fileList);
    } catch (err: any) {
      console.error("Failed to query files:", err);
      setErrorMsg("Failed to query Google Drive contents. Try reconnecting your account.");
    } finally {
      setLoadingFiles(false);
    }
  };

  // Trigger fetch files when current folder, token, or search triggers
  useEffect(() => {
    if (driveToken) {
      fetchFiles();
    }
  }, [driveToken, currentFolderId, searchQuery]);

  // Handle clicking a folder
  const handleFolderClick = (folder: FileItem) => {
    setCurrentFolderId(folder.id);
    setFolderTrail(prev => [...prev, { id: folder.id, name: folder.name }]);
    setSelectedFile(null);
  };

  // Handle trail navigation back
  const handleTrailClick = (index: number) => {
    const targetTrail = folderTrail.slice(0, index + 1);
    const targetFolder = targetTrail[targetTrail.length - 1];
    setFolderTrail(targetTrail);
    setCurrentFolderId(targetFolder.id);
    setSelectedFile(null);
  };

  // Create Folder action
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveToken || !newFolderName.trim()) return;

    try {
      setCreatingFolder(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      
      const newFolder = await createDriveFolder(driveToken, newFolderName, currentFolderId);
      
      setSuccessMsg(`Folder "${newFolderName}" successfully created!`);
      logActivity(
        "ADMIN_OP", 
        `Created new folder "${newFolderName}" in Drive under folder ID: ${currentFolderId}.`, 
        "SUCCESS", 
        driveUser?.displayName || "Admin"
      );
      
      setNewFolderName("");
      setShowFolderModal(false);
      fetchFiles();
    } catch (err: any) {
      console.error("Folder creation failure:", err);
      setErrorMsg(err.message || "Failed to create folder.");
    } finally {
      setCreatingFolder(false);
    }
  };

  // Delete file action
  const handleDeleteFile = async (file: FileItem) => {
    if (!driveToken) return;

    const confirmed = window.confirm(
      `CRITICAL ACTION CONFIRMATION:\nAre you sure you want to permanently delete "${file.name}" from your Google Drive?\nThis action is irreversible and cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      
      await deleteDriveFile(driveToken, file.id);
      
      setSuccessMsg(`"${file.name}" has been deleted successfully.`);
      logActivity(
        "ADMIN_OP", 
        `Deleted file "${file.name}" (ID: ${file.id}) from Google Drive.`, 
        "SUCCESS", 
        driveUser?.displayName || "Admin"
      );
      
      if (selectedFile?.id === file.id) {
        setSelectedFile(null);
      }
      fetchFiles();
    } catch (err: any) {
      console.error("File deletion failure:", err);
      setErrorMsg(err.message || "Failed to delete file.");
    }
  };

  // File Upload Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!driveToken) return;

    const confirmed = window.confirm(`Confirm Upload: Upload "${file.name}" (${(file.size / 1024).toFixed(1)} KB) to the active Drive folder?`);
    if (!confirmed) return;

    try {
      setUploadingFile(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const result = await uploadDriveFile(driveToken, file, currentFolderId);
      
      setSuccessMsg(`Successfully uploaded "${file.name}" to Google Drive!`);
      logActivity(
        "ADMIN_OP", 
        `Uploaded file "${file.name}" to Google Drive folder ID: ${currentFolderId}.`, 
        "SUCCESS", 
        driveUser?.displayName || "Admin"
      );

      fetchFiles();
    } catch (err: any) {
      console.error("File upload failure:", err);
      setErrorMsg(err.message || "Failed to upload file.");
    } finally {
      setUploadingFile(false);
    }
  };

  // ERP Export: Student SIS Directory to Drive
  const handleExportStudents = async () => {
    if (!driveToken) return;
    try {
      setExportingStudents(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      // 1. Fetch Students
      const res = await fetch("/api/students", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load Student directory from SIS database.");
      const students = await res.json();

      if (students.length === 0) {
        throw new Error("No active student records found in SIS roster to export.");
      }

      // 2. Format CSV
      const headers = "Registration ID,Student Name,Email Address,Class Room,Enrollment Date,Attendance Rate\n";
      const rows = students.map((s: any) => 
        `"${s.registrationNumber || ''}","${s.name || ''}","${s.email || ''}","${s.className || 'Unassigned'}","${s.enrollmentDate || ''}","${s.attendanceRate || 100}%"`
      ).join("\n");
      const csvContent = headers + rows;

      // 3. Save to Google Drive
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `EduOS_Student_Directory_Export_${timestamp}.csv`;
      
      await uploadTextFileToDrive(driveToken, fileName, csvContent, "text/csv", currentFolderId);

      setSuccessMsg(`Student database roster exported successfully to Google Drive as "${fileName}"!`);
      logActivity(
        "EXPORT", 
        `Exported student database directory to Google Drive (${students.length} rows, Filename: "${fileName}").`, 
        "SUCCESS", 
        driveUser?.displayName || "Admin"
      );

      fetchFiles();
    } catch (err: any) {
      console.error("Student export failed:", err);
      setErrorMsg(err.message || "Failed to export student directory.");
    } finally {
      setExportingStudents(false);
    }
  };

  // ERP Export: Admissions Application list to Drive
  const handleExportAdmissions = async () => {
    if (!driveToken) return;
    try {
      setExportingAdmissions(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      // 1. Fetch admissions Applications
      const res = await fetch("/api/admissions", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load applications ledger from ERP database.");
      const admissions = await res.json();

      if (admissions.length === 0) {
        throw new Error("No admission applications found in the ledger to export.");
      }

      // 2. Format CSV
      const headers = "Application ID,Student Name,Student Email,Grade Applied,Parent Name,Parent Email,Parent Phone,Workflow Status,Submitted At\n";
      const rows = admissions.map((a: any) => 
        `"${a.id || ''}","${a.studentName || ''}","${a.studentEmail || ''}","${a.gradeApplied || ''}","${a.parentName || ''}","${a.parentEmail || ''}","${a.parentPhone || ''}","${a.status || ''}","${a.submittedAt || ''}"`
      ).join("\n");
      const csvContent = headers + rows;

      // 3. Save to Google Drive
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `EduOS_Admissions_Ledger_Export_${timestamp}.csv`;
      
      await uploadTextFileToDrive(driveToken, fileName, csvContent, "text/csv", currentFolderId);

      setSuccessMsg(`Admissions Applications ledger exported successfully to Google Drive as "${fileName}"!`);
      logActivity(
        "EXPORT", 
        `Exported admissions Applications ledger to Google Drive (${admissions.length} rows, Filename: "${fileName}").`, 
        "SUCCESS", 
        driveUser?.displayName || "Admin"
      );

      fetchFiles();
    } catch (err: any) {
      console.error("Admissions export failed:", err);
      setErrorMsg(err.message || "Failed to export admissions ledger.");
    } finally {
      setExportingAdmissions(false);
    }
  };

  // Helper to format bytes
  const formatBytes = (bytes: string | undefined) => {
    if (!bytes) return "N/A";
    const num = Number(bytes);
    if (isNaN(num)) return "N/A";
    if (num === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(num) / Math.log(k));
    return parseFloat((num / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Helper to resolve icon based on mimeType
  const getFileIcon = (mimeType: string) => {
    if (mimeType === "application/vnd.google-apps.folder") {
      return <Folder className="h-5 w-5 text-amber-500 fill-amber-100" />;
    } else if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType === "text/csv") {
      return <FileSpreadsheet className="h-5 w-5 text-emerald-600 fill-emerald-50" />;
    } else if (mimeType.includes("pdf")) {
      return <FileText className="h-5 w-5 text-rose-600 fill-rose-50" />;
    } else if (mimeType.includes("image")) {
      return <FileImage className="h-5 w-5 text-blue-500 fill-blue-50" />;
    } else if (mimeType.includes("javascript") || mimeType.includes("json") || mimeType.includes("typescript")) {
      return <FileCode className="h-5 w-5 text-violet-600 fill-violet-50" />;
    }
    return <File className="h-5 w-5 text-slate-500 fill-slate-50" />;
  };

  // File filtering logic
  const filteredFiles = files.filter(f => {
    if (fileFilter === "all") return true;
    if (fileFilter === "folders") return f.mimeType === "application/vnd.google-apps.folder";
    if (fileFilter === "spreadsheets") return f.mimeType.includes("spreadsheet") || f.mimeType.includes("excel") || f.mimeType === "text/csv";
    if (fileFilter === "documents") return f.mimeType.includes("document") || f.mimeType.includes("pdf") || f.mimeType.includes("word");
    if (fileFilter === "images") return f.mimeType.includes("image");
    return true;
  });

  if (loadingAuth) {
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 text-sm font-medium">Securing Google Workspace Storage handshakes...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-6 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-inner">
              <HardDrive className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Google Drive Storage Vault</h1>
              <p className="text-white/80 text-xs mt-0.5">
                Unified storage node for sharing educational resources, lecture syllabi, and administrative ERP system exports.
              </p>
            </div>
          </div>

          <div>
            {!driveUser ? (
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
                <span>Authorize Drive Sync</span>
              </button>
            ) : (
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md rounded-xl p-2 pl-3">
                <div className="text-right">
                  <div className="text-xs font-bold text-white">{driveUser.displayName || "Admin Storage"}</div>
                  <div className="text-[10px] text-white/70 font-mono">{driveUser.email}</div>
                </div>
                <button
                  onClick={handleDisconnect}
                  title="Disconnect Drive Node"
                  className="bg-white/25 hover:bg-white/40 p-2 rounded-lg text-white transition-all cursor-pointer"
                >
                  <LogOutIcon />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-800 font-semibold">{successMsg}</div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-800 font-semibold">{errorMsg}</div>
        </div>
      )}

      {/* Case 1: Unauthorized state */}
      {!driveUser ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 animate-pulse">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Secure Storage Node Authorization Required</h2>
          <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
            Connect your institutional or personal Google Workspace Drive folder to view, manage, and upload class timetables, syllabus notes, and export school ERP registers directly to your storage space.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleAuthorize}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-3 rounded-xl shadow-lg shadow-indigo-600/15 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <span>Connect Google Drive</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Case 2: Explorer layout */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Workspace Explorer Area (Col span 3) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Folder Actions and Path Trail */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Path Breadcrumbs */}
              <div className="flex items-center space-x-1.5 flex-wrap text-xs text-slate-600 font-medium">
                {folderTrail.map((folder, index) => (
                  <React.Fragment key={folder.id}>
                    {index > 0 && <ChevronRight className="h-3 w-3 text-slate-300" />}
                    <button
                      onClick={() => handleTrailClick(index)}
                      className={`hover:text-indigo-600 transition-all font-semibold ${
                        index === folderTrail.length - 1 ? "text-slate-800 font-bold underline" : ""
                      }`}
                    >
                      {folder.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowFolderModal(true)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-100 transition-all"
                  title="Create new empty directory in current folder"
                >
                  <FolderPlus className="h-4 w-4" />
                  <span>New Folder</span>
                </button>

                <button
                  onClick={fetchFiles}
                  disabled={loadingFiles}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingFiles ? "animate-spin text-indigo-600" : ""}`} />
                  <span>Sync Files</span>
                </button>
              </div>
            </div>

            {/* Folder Filters & Search */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Filter Sub-Tabs */}
              <div className="flex overflow-x-auto gap-1">
                {(["all", "folders", "documents", "spreadsheets", "images"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setFileFilter(filter)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap cursor-pointer ${
                      fileFilter === filter
                        ? "bg-slate-800 text-white"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Search filter input */}
              <div className="relative w-full md:max-w-xs">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                </span>
                <input
                  type="text"
                  placeholder="Search file registries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-indigo-500"
                />
              </div>
            </div>

            {/* File List Grid / List */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden min-h-[380px] flex flex-col">
              
              {loadingFiles ? (
                <div className="m-auto text-center py-20 text-slate-400 text-xs">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-600 mb-2" />
                  Querying file node structures...
                </div>
              ) : filteredFiles.length > 0 ? (
                <div className="divide-y divide-slate-100 flex-1 overflow-x-auto">
                  
                  {/* Table headers */}
                  <table className="w-full min-w-[600px] text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-100">
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Last Modified</th>
                        <th className="py-3 px-4">Size</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFiles.map((file) => {
                        const isFolder = file.mimeType === "application/vnd.google-apps.folder";
                        const isSelected = selectedFile?.id === file.id;

                        return (
                          <tr
                            key={file.id}
                            className={`hover:bg-slate-50/50 transition-colors text-xs border-b border-slate-100 font-medium ${
                              isSelected ? "bg-indigo-50/20" : ""
                            }`}
                          >
                            <td 
                              className="py-3 px-4 cursor-pointer"
                              onClick={() => {
                                if (isFolder) {
                                  handleFolderClick(file);
                                } else {
                                  setSelectedFile(file);
                                }
                              }}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="p-1 rounded bg-slate-100/50 shrink-0">
                                  {getFileIcon(file.mimeType)}
                                </div>
                                <span className="text-slate-700 font-semibold truncate max-w-sm hover:text-indigo-600 transition-colors">
                                  {file.name}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">
                              {new Date(file.modifiedTime).toLocaleDateString()} at {new Date(file.modifiedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                              {isFolder ? "--" : formatBytes(file.size)}
                            </td>
                            <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                              {!isFolder && file.webViewLink && (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition-all"
                                  title="View on Google Drive in a new tab"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                              <button
                                onClick={() => handleDeleteFile(file)}
                                className="inline-flex p-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                                title="Delete file from storage"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="m-auto text-center py-20 text-slate-400 text-xs flex flex-col items-center p-6">
                  <Folder className="h-12 w-12 text-slate-200 mb-3 animate-bounce" />
                  <p className="font-semibold text-slate-500">Folder registry is empty</p>
                  <p className="text-[11px] max-w-xs mt-1 text-slate-400">
                    No files found matching filters. Drag and drop a file or click upload to seed this workspace.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Area (Col span 1) - File Info, Drag Upload & ERP Exports */}
          <div className="space-y-6">
            
            {/* drag & drop Upload Area */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center bg-white ${
                dragActive 
                  ? "border-indigo-600 bg-indigo-50/10 scale-[1.01]" 
                  : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileInputChange}
                disabled={uploadingFile}
              />
              <UploadCloud className={`h-8 w-8 mb-2 ${uploadingFile ? "animate-pulse text-indigo-500" : "text-slate-400"}`} />
              <span className="text-xs font-bold text-slate-700 block">
                {uploadingFile ? "Uploading File..." : "Upload local files"}
              </span>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[160px] leading-relaxed mx-auto">
                Drag and drop files here or click to browse local files.
              </p>
            </div>

            {/* Institutional ERP direct exports */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 space-y-4">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-2">
                ERP Monolith Exports
              </h3>
              
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Seamlessly export live school databases and ERP applications rosters directly to Google Drive as clean, structured CSV datasheets.
              </p>

              <div className="space-y-2">
                <button
                  onClick={handleExportStudents}
                  disabled={exportingStudents}
                  className="w-full inline-flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-150 hover:border-indigo-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-55"
                >
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    <span>Export Student SIS</span>
                  </div>
                  {exportingStudents ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </button>

                <button
                  onClick={handleExportAdmissions}
                  disabled={exportingAdmissions}
                  className="w-full inline-flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-150 hover:border-indigo-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-55"
                >
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
                    <span>Export Admissions applications</span>
                  </div>
                  {exportingAdmissions ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Selected File Metadata Details */}
            {selectedFile && (
              <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 space-y-4 relative">
                <button
                  onClick={() => setSelectedFile(null)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-2">
                  File Registry Metadata
                </h3>

                <div className="flex items-start space-x-3 pt-1">
                  <div className="p-2 rounded bg-slate-100/50 shrink-0">
                    {getFileIcon(selectedFile.mimeType)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-800 break-words leading-relaxed">
                      {selectedFile.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 block font-mono truncate mt-0.5">
                      ID: {selectedFile.id}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 text-[11px] border-t border-b border-slate-50 py-3 font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-400">File Type:</span>
                    <span className="text-slate-700 truncate max-w-[140px]" title={selectedFile.mimeType}>
                      {selectedFile.mimeType.split('/').pop()?.toUpperCase() || "BIN"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">File Size:</span>
                    <span className="text-slate-700 font-mono">
                      {formatBytes(selectedFile.size)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Modified:</span>
                    <span className="text-slate-700">
                      {new Date(selectedFile.modifiedTime).toLocaleDateString()}
                    </span>
                  </div>

                  {selectedFile.owners && selectedFile.owners[0] && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Owner:</span>
                      <span className="text-slate-700 truncate max-w-[140px]" title={selectedFile.owners[0].emailAddress}>
                        {selectedFile.owners[0].displayName || selectedFile.owners[0].emailAddress}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {selectedFile.webViewLink && (
                    <a
                      href={selectedFile.webViewLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all active:scale-[0.98]"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Open File</span>
                    </a>
                  )}

                  <button
                    onClick={() => handleDeleteFile(selectedFile)}
                    className="p-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                    title="Delete file"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* New Folder Modal Dialog */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
              <FolderPlus className="h-5 w-5 text-indigo-600 animate-bounce" />
              <span>Create New Folder</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Define the folder directory name below to keep your school dispatches and syllabus notes organized in Drive.
            </p>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g., SS3 Chemistry Resources"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-indigo-500 font-semibold"
              />
              <div className="flex justify-end space-x-2 pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowFolderModal(false);
                    setNewFolderName("");
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingFolder || !newFolderName.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md"
                >
                  {creatingFolder ? "Creating..." : "Create Folder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Custom simple disconnect icon (Logout)
function LogOutIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
