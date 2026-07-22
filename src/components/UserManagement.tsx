import React, { useState, useEffect } from "react";
import { 
  Sliders, 
  Search, 
  Shield, 
  User, 
  Key, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Eye, 
  EyeOff, 
  Filter,
  UserCheck,
  UserPlus,
  School,
  Mail,
  Info,
  Trash2
} from "lucide-react";
import { logActivity } from "../utils/auditLogger";

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  isActive: boolean;
}

interface TenantRecord {
  id: string;
  name: string;
  subdomain: string;
}

interface UserManagementProps {
  token: string;
  currentUser: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
  };
}

export default function UserManagement({ token, currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("all");
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>("all");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Subtab navigation: "directory" vs "create"
  const [activeSubTab, setActiveSubTab] = useState<"directory" | "create">("directory");

  // Create account form state
  const [createEmail, setCreateEmail] = useState("");
  const [createName, setCreateName] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createStandardRoles, setCreateStandardRoles] = useState<string[]>(["TEACHER"]);
  const [createCustomRole, setCreateCustomRole] = useState("");
  const [createTenantId, setCreateTenantId] = useState("default");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  // Edit modal state
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [editStandardRoles, setEditStandardRoles] = useState<string[]>([]);
  const [editCustomRole, setEditCustomRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isSuperAdmin = currentUser.role === "ADMIN" && currentUser.tenantId === "default";
  const isSchoolAdmin = currentUser.role === "ADMIN" && currentUser.tenantId !== "default";

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setErrorMsg("");
      const response = await fetch("/api/user-management/users", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error("Failed to load platform users database.");
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while fetching users list.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await fetch("/api/tenants", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setTenants(data);
        }
      }
    } catch (err) {
      console.error("Failed to load school list for assignment:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    if (isSuperAdmin) {
      fetchTenants();
    }
  }, [token, isSuperAdmin]);

  const handleOpenEdit = (user: UserRecord) => {
    setEditingUser(user);
    setNewName(user.name);
    setNewPassword("");
    setShowPassword(false);
    setErrorMsg("");
    setSuccessMsg("");

    const rolesList = user.role ? user.role.split(",").map(r => r.trim()) : [];
    const standards = ["ADMIN", "TEACHER", "STUDENT", "PARENT"];
    const currentStandards = rolesList.filter(r => standards.includes(r));
    const currentCustoms = rolesList.filter(r => !standards.includes(r));

    setEditStandardRoles(currentStandards);
    setEditCustomRole(currentCustoms.join(", "));
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === currentUser.id) {
      alert("For security and safety reasons, you cannot delete your own active administrator account.");
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete the user account for "${userName}"? This action cannot be reversed.`)) {
      return;
    }
    try {
      setIsLoading(true);
      setErrorMsg("");
      setSuccessMsg("");
      const res = await fetch(`/api/user-management/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete user account.");
      }
      setSuccessMsg(`Account for "${userName}" has been successfully deleted.`);
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while deleting the user.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;
    if (selectedUserIds.includes(currentUser.id)) {
      alert("Your selected users contain your own account. For safety, please deselect your own account before performing bulk deletion.");
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete all ${selectedUserIds.length} selected user account(s)?`)) {
      return;
    }
    try {
      setIsLoading(true);
      setErrorMsg("");
      setSuccessMsg("");
      const res = await fetch("/api/user-management/users/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ userIds: selectedUserIds })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to bulk delete accounts.");
      }
      setSuccessMsg(data.message || "Bulk deletion completed successfully.");
      setSelectedUserIds([]);
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during bulk deletion.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkEdit = async (field: "role" | "tenantId", val: string) => {
    if (selectedUserIds.length === 0 || !val) return;
    try {
      setIsLoading(true);
      setErrorMsg("");
      setSuccessMsg("");
      const payload: any = { userIds: selectedUserIds };
      if (field === "role") payload.role = val;
      if (field === "tenantId") payload.tenantId = val;

      const res = await fetch("/api/user-management/users/bulk-edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to bulk update accounts.");
      }
      setSuccessMsg(data.message || "Bulk update completed successfully.");
      setSelectedUserIds([]);
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during bulk editing.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createEmail.trim() || !createName.trim() || !createPassword.trim()) {
      setCreateError("All input fields are required to register a user.");
      return;
    }

    const combinedRoles = [...createStandardRoles];
    if (createCustomRole.trim()) {
      const customs = createCustomRole.split(",").map(r => r.trim()).filter(Boolean);
      combinedRoles.push(...customs);
    }

    if (combinedRoles.length === 0) {
      setCreateError("At least one system permission role or custom designation must be assigned.");
      return;
    }

    const finalRoleStr = combinedRoles.join(",");

    try {
      setIsCreating(true);
      setCreateError("");
      setCreateSuccess("");

      const response = await fetch("/api/user-management/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          email: createEmail.trim(),
          name: createName.trim(),
          password: createPassword.trim(),
          role: finalRoleStr,
          tenantId: isSuperAdmin ? createTenantId : currentUser.tenantId
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || "Failed to provision user account.");
      }

      setCreateSuccess(`Account for "${createName}" (${finalRoleStr}) created successfully!`);
      
      // Log the admin operations inside our global system activity tracker
      const selectedTenant = isSuperAdmin ? createTenantId : currentUser.tenantId;
      logActivity(
        "ADMIN_OP", 
        `Administrator created new account "${createName}" with roles [${finalRoleStr}] for tenant/school code "${selectedTenant}".`, 
        "SUCCESS", 
        currentUser.name, 
        selectedTenant
      );

      // Reset form fields
      setCreateEmail("");
      setCreateName("");
      setCreatePassword("");
      setCreateStandardRoles(["TEACHER"]);
      setCreateCustomRole("");
      setCreateTenantId("default");

      // Refresh users list
      fetchUsers();
      
      // Navigate to directory view after 1.5 seconds
      setTimeout(() => {
        setActiveSubTab("directory");
        setCreateSuccess("");
      }, 1500);

    } catch (err: any) {
      setCreateError(err.message || "An error occurred while creating user.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!newName.trim()) {
      setErrorMsg("Display Name field cannot be empty.");
      return;
    }

    const combinedRoles = [...editStandardRoles];
    if (editCustomRole.trim()) {
      const customs = editCustomRole.split(",").map(r => r.trim()).filter(Boolean);
      combinedRoles.push(...customs);
    }

    if (combinedRoles.length === 0) {
      setErrorMsg("At least one system permission role or custom designation must be assigned.");
      return;
    }

    const finalRoleStr = combinedRoles.join(",");

    try {
      setIsSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      const response = await fetch(`/api/user-management/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newName,
          password: newPassword.trim() || undefined,
          role: finalRoleStr
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || "Failed to update user profile.");
      }

      setSuccessMsg(`Successfully updated credentials for user ${editingUser.email}!`);
      
      // Log the admin operations inside our global system activity tracker
      const isSelf = currentUser.id === editingUser.id;
      const opMessage = isSelf 
        ? `User updated their own profile name/password (ID: ${editingUser.id}).`
        : `Administrator updated credentials & roles [${finalRoleStr}] for user "${editingUser.name}" with tenant ID "${editingUser.tenantId}".`;
      
      logActivity(
        "ADMIN_OP", 
        opMessage, 
        "SUCCESS", 
        currentUser.name, 
        editingUser.tenantId
      );

      // Refresh users list
      fetchUsers();
      
      // Close modal
      setTimeout(() => {
        setEditingUser(null);
        setSuccessMsg("");
      }, 1500);

    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while updating user.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const tenantName = tenants.find(t => t.id === user.tenantId)?.name || "";
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.tenantId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRoleFilter === "all" || 
      (user.role && user.role.split(",").map(r => r.trim()).includes(selectedRoleFilter));

    const matchesSchool = selectedSchoolFilter === "all" || user.tenantId === selectedSchoolFilter;
    
    return matchesSearch && matchesRole && matchesSchool;
  });

  return (
    <div className="space-y-6" id="user-management-module">
      
      {/* Module Title Section */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="h-5 w-5 text-indigo-600" />
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              User Accounts & Security Settings
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isSuperAdmin 
              ? "Super Admin Console: Create accounts, assign school roles, reset login passwords, and modify display profiles across all institutions."
              : isSchoolAdmin 
                ? "Tenant Admin Console: Provision teacher, student, and parent logins. Reset passwords and configure login details for your school."
                : "Manage your personal profile display name and set a new secure access account password."}
          </p>
        </div>
        
        {(isSuperAdmin || isSchoolAdmin) && (
          <button
            onClick={fetchUsers}
            className="self-start sm:self-center flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Records</span>
          </button>
        )}
      </div>

      {/* Navigation Sub-Tabs for Accounts */}
      {(isSuperAdmin || isSchoolAdmin) && (
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveSubTab("directory")}
            className={`px-5 py-3 border-b-2 text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeSubTab === "directory"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Accounts Directory & Edit Registry</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab("create")}
            className={`px-5 py-3 border-b-2 text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeSubTab === "create"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <UserPlus className="h-4 w-4" />
            <span>Create New User Account</span>
          </button>
        </div>
      )}

      {/* Directory Tab View */}
      {activeSubTab === "directory" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Profile Card Summary */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 self-start space-y-4">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-600 font-extrabold text-lg">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                  {currentUser.role}
                </span>
                <h2 className="text-sm font-black text-slate-800 mt-1">{currentUser.name}</h2>
                <span className="text-[10px] text-slate-400 font-mono font-bold block">{currentUser.email}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-50 font-mono">
                <span className="text-slate-400 font-semibold">ACCOUNT ID:</span>
                <span className="text-slate-700 font-bold">{currentUser.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 font-mono">
                <span className="text-slate-400 font-semibold">TENANT INSTANCE:</span>
                <span className="text-slate-700 font-bold uppercase">
                  {currentUser.tenantId === "default" ? "⚙️ Platform Core" : `🏫 ${currentUser.tenantId}`}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  const selfRecord = users.find(u => u.id === currentUser.id);
                  if (selfRecord) {
                    handleOpenEdit(selfRecord);
                  } else {
                    handleOpenEdit({
                      id: currentUser.id,
                      name: currentUser.name,
                      email: currentUser.email,
                      role: currentUser.role as any,
                      tenantId: currentUser.tenantId,
                      isActive: true
                    });
                  }
                }}
                className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Key className="h-3.5 w-3.5" />
                <span>Change My Profile / Password</span>
              </button>
            </div>
          </div>

          {/* Directory Listing (Visible to Admins) */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            
            {/* Header & Filters */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-3">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                User Directory & Credentials Registry
              </span>
              
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Query accounts by Name, Email, School, or Unique ID..."
                      className="w-full bg-white border border-slate-250 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:border-indigo-500 outline-none transition-all shadow-3xs"
                    />
                  </div>

                  {/* Role filter */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    <select
                      value={selectedRoleFilter}
                      onChange={(e) => setSelectedRoleFilter(e.target.value)}
                      className="bg-white border border-slate-250 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-600 outline-none cursor-pointer focus:border-indigo-500 shadow-3xs"
                    >
                      <option value="all">🛡️ All Roles</option>
                      <option value="ADMIN">🏫 Admins</option>
                      <option value="TEACHER">🧑‍🏫 Teachers</option>
                      <option value="PARENT">👪 Parents</option>
                      <option value="STUDENT">🎓 Students</option>
                    </select>
                  </div>

                  {/* School filter */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <School className="h-3.5 w-3.5 text-slate-400" />
                    <select
                      value={selectedSchoolFilter}
                      onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                      className="bg-white border border-slate-250 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-600 outline-none cursor-pointer focus:border-indigo-500 shadow-3xs"
                    >
                      <option value="all">🏫 All Schools</option>
                      <option value="default">⚙️ Platform Core</option>
                      {tenants.map(t => (
                        <option key={t.id} value={t.id}>🏫 {t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bulk Actions Panel */}
                {selectedUserIds.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50/80 border border-indigo-150 p-4 rounded-xl animate-fade-in">
                    <div className="flex items-center space-x-2">
                      <div className="bg-indigo-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-md font-mono">
                        {selectedUserIds.length} Selected
                      </div>
                      <span className="text-xs font-bold text-indigo-950">Bulk actions for selected accounts:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Bulk edit role */}
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleBulkEdit("role", e.target.value);
                            e.target.value = "";
                          }
                        }}
                        className="bg-white border border-indigo-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 outline-none"
                      >
                        <option value="">⚙️ Bulk Change Role...</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="TEACHER">TEACHER</option>
                        <option value="PARENT">PARENT</option>
                        <option value="STUDENT">STUDENT</option>
                      </select>

                      {/* Bulk edit school / tenant (only for super admin) */}
                      {isSuperAdmin && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleBulkEdit("tenantId", e.target.value);
                              e.target.value = "";
                            }
                          }}
                          className="bg-white border border-indigo-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 outline-none"
                        >
                          <option value="">🏫 Bulk Move to School...</option>
                          <option value="default">Platform Core</option>
                          {tenants.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      )}

                      {/* Bulk delete button */}
                      <button
                        onClick={handleBulkDelete}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-lg transition-all cursor-pointer animate-pulse"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete ({selectedUserIds.length})</span>
                      </button>

                      {/* Clear selection */}
                      <button
                        onClick={() => setSelectedUserIds([])}
                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-all"
                      >
                        Deselect
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Table Directory Grid */}
            <div className="flex-1 overflow-x-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-12 space-y-3 text-slate-400">
                  <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
                  <span className="text-xs font-semibold">Decrypting accounts registry...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 text-center text-slate-400 border-dashed border-2 border-slate-100 m-4 rounded-xl">
                  <User className="h-10 w-10 text-slate-300 mb-2" />
                  <span className="text-xs font-bold">No user accounts found matching query.</span>
                  <span className="text-[10px] text-slate-400 mt-1 font-mono">Verify spelling or filter constraints.</span>
                </div>
              ) : (
                <table className="w-full text-left border-collapse" id="users-directory-table">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 font-mono text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="p-4 pl-6 text-center w-12">
                        <input 
                          type="checkbox"
                          checked={filteredUsers.length > 0 && filteredUsers.every(u => selectedUserIds.includes(u.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const allFilteredIds = filteredUsers.map(u => u.id);
                              setSelectedUserIds(allFilteredIds);
                            } else {
                              setSelectedUserIds([]);
                            }
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                        />
                      </th>
                      <th className="p-4">Profile Info</th>
                      <th className="p-4">Authorization Role</th>
                      <th className="p-4">Tenant / School</th>
                      <th className="p-4 text-center">Account Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-semibold">
                    {filteredUsers.map((userItem) => {
                      const isSelfItem = userItem.id === currentUser.id;
                      const userRolesList = userItem.role ? userItem.role.split(",").map(r => r.trim()).filter(Boolean) : [];
                      const userTenant = tenants.find(t => t.id === userItem.tenantId);
                      const tenantNameDisp = userTenant 
                        ? userTenant.name 
                        : (userItem.tenantId === "default" ? "⚙️ Platform Core" : `🏫 ${userItem.tenantId}`);

                      return (
                        <tr key={userItem.id} className={`transition-colors ${selectedUserIds.includes(userItem.id) ? 'bg-indigo-50/20' : 'hover:bg-slate-50/50'}`}>
                          <td className="p-4 pl-6 text-center">
                            <input 
                              type="checkbox"
                              checked={selectedUserIds.includes(userItem.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUserIds(prev => [...prev, userItem.id]);
                                } else {
                                  setSelectedUserIds(prev => prev.filter(id => id !== userItem.id));
                                }
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                            />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-black font-mono shrink-0">
                                {userItem.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-800 block truncate">
                                  {userItem.name} {isSelfItem && <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-black font-mono ml-1.5">YOU</span>}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block truncate">{userItem.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-xs font-semibold text-slate-600">
                            <div className="flex flex-wrap gap-1.5 max-w-xs">
                              {userRolesList.length === 0 ? (
                                <span className="text-[9px] font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                  No Roles
                                </span>
                              ) : (
                                userRolesList.map((roleStr) => {
                                  let style = "text-slate-600 bg-slate-50 border border-slate-200";
                                  if (roleStr === "ADMIN") style = "text-rose-700 bg-rose-50 border border-rose-150";
                                  else if (roleStr === "TEACHER") style = "text-amber-700 bg-amber-50 border border-amber-150";
                                  else if (roleStr === "PARENT") style = "text-indigo-700 bg-indigo-50 border border-indigo-150";
                                  else if (roleStr === "STUDENT") style = "text-emerald-700 bg-emerald-50 border border-emerald-150";
                                  
                                  return (
                                    <span key={roleStr} className={`inline-flex items-center text-[9px] font-extrabold rounded-md px-2 py-0.5 uppercase tracking-wider ${style}`}>
                                      {roleStr}
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-700 block max-w-xs truncate">
                                {tenantNameDisp}
                              </span>
                              <span className="font-mono text-[9px] text-slate-400 uppercase tracking-tight block">
                                ID: {userItem.tenantId}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleOpenEdit(userItem)}
                                className="inline-flex items-center space-x-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/50 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer active:scale-95"
                                title="Edit user details or reset password"
                              >
                                <Key className="h-3 w-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteUser(userItem.id, userItem.name)}
                                disabled={isSelfItem}
                                className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all border active:scale-95 ${
                                  isSelfItem
                                    ? "text-slate-300 bg-slate-50 border-slate-100 cursor-not-allowed"
                                    : "text-rose-600 hover:text-rose-800 bg-rose-50/50 hover:bg-rose-50 border-rose-100/50 cursor-pointer"
                                }`}
                                title={isSelfItem ? "You cannot delete your own logged-in profile" : "Permanently delete this user account"}
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Create Account Form Tab View */}
      {activeSubTab === "create" && (
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-black text-slate-800">
                Provision a New Platform Account
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Configure and deploy access credentials for school administrators, teachers, students, or guardians instantly.
            </p>
          </div>

          <form onSubmit={handleCreateUser} className="p-6 space-y-5">
            {createError && (
              <div className="flex items-start space-x-2.5 p-3.5 bg-rose-50 border border-rose-150 rounded-xl text-rose-700 text-xs">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-500" />
                <p className="font-semibold">{createError}</p>
              </div>
            )}

            {createSuccess && (
              <div className="flex items-start space-x-2.5 p-3.5 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-700 text-xs">
                <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-500" />
                <p className="font-semibold">{createSuccess}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                  Full Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. Dr. Florence Adebayo"
                    className="w-full bg-white border border-slate-250 rounded-xl pl-9.5 pr-4 py-2.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 outline-none transition-all shadow-3xs"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                  Account Email (Username)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="e.g. teacher@eduos.com"
                    className="w-full bg-white border border-slate-250 rounded-xl pl-9.5 pr-4 py-2.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 outline-none transition-all shadow-3xs"
                  />
                </div>
              </div>

              {/* Secure Password */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                  Access Account Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showCreatePassword ? "text" : "password"}
                    required
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="Set login password..."
                    className="w-full bg-white border border-slate-250 rounded-xl pl-9.5 pr-10 py-2.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 outline-none transition-all shadow-3xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* System Permission Roles Checklist */}
              <div className="space-y-2 sm:col-span-2">
                <label className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                  Assign System Permission Roles
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                  {[
                    { id: "ADMIN", label: "School Admin", emoji: "🏫" },
                    { id: "TEACHER", label: "Teacher", emoji: "🧑‍🏫" },
                    { id: "STUDENT", label: "Student", emoji: "🎓" },
                    { id: "PARENT", label: "Parent/Guardian", emoji: "👪" }
                  ].map((role) => {
                    const isChecked = createStandardRoles.includes(role.id);
                    return (
                      <label
                        key={role.id}
                        className={`flex items-center space-x-2.5 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? "bg-white border-indigo-200 text-indigo-700 shadow-3xs"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateStandardRoles([...createStandardRoles, role.id]);
                            } else {
                              setCreateStandardRoles(createStandardRoles.filter((r) => r !== role.id));
                            }
                          }}
                          className="h-4 w-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          <span>{role.emoji}</span>
                          <span>{role.label}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Custom Roles Input */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                  Additional Custom Designations / Secondary Roles (Comma-separated)
                </label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={createCustomRole}
                    onChange={(e) => setCreateCustomRole(e.target.value)}
                    placeholder="e.g. Club Coordinator, Department Head, Basketball Coach..."
                    className="w-full bg-white border border-slate-250 rounded-xl pl-9.5 pr-4 py-2.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 outline-none transition-all shadow-3xs"
                  />
                </div>
              </div>

              {/* School Instance / Tenant Selection Dropdown */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                  Assign School Instance / Tenant
                </label>
                <div className="relative">
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  {isSuperAdmin ? (
                    <select
                      value={createTenantId}
                      onChange={(e) => setCreateTenantId(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded-xl pl-9.5 pr-4 py-2.5 text-xs font-bold text-slate-700 focus:border-indigo-500 outline-none transition-all shadow-3xs cursor-pointer"
                    >
                      <option value="default">⚙️ Platform Core (Super Admin Instance)</option>
                      {tenants.map(t => (
                        <option key={t.id} value={t.id}>
                          🏫 {t.name} (subdomain: {t.subdomain})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={`School Locked: ${currentUser.tenantId}`}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9.5 pr-4 py-2.5 text-xs font-bold text-slate-400 cursor-not-allowed select-none"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Informational Hint about Student/Parent auto-linkage */}
            {(createStandardRoles.includes("STUDENT") || createStandardRoles.includes("PARENT")) && (
              <div className="flex items-start space-x-2.5 p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl text-indigo-700 text-xs">
                <Info className="h-4.5 w-4.5 shrink-0 text-indigo-500 mt-0.5" />
                <p className="font-semibold leading-relaxed">
                  {createStandardRoles.includes("STUDENT") && createStandardRoles.includes("PARENT")
                    ? "Educational & Guardian Sync: Creating Student and Parent accounts simultaneously provisions SIS Student and associated Parent/Guardian profiles."
                    : createStandardRoles.includes("STUDENT")
                      ? "Educational Sync: Creating a Student account automatically provisions a matching SIS Student Profile record in the selected class."
                      : "Guardian Link: Creating a Parent account automatically provisions a linked Parent record associated with student registries."}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-150">
              <button
                type="button"
                onClick={() => setActiveSubTab("directory")}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isCreating}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="animate-spin h-3.5 w-3.5 mr-1" />
                    <span>Deploying Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Create & Register Account</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Accounts Edit / Password Reset Modal Overlay */}
      {editingUser && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] transition-all">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col" id="user-edit-modal">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded uppercase tracking-wider block">
                  Modify Account Credentials
                </span>
                <h3 className="text-base font-black text-slate-800 mt-1">
                  {currentUser.id === editingUser.id ? "Edit My Profile Details" : `Reset Credentials: ${editingUser.name}`}
                </h3>
              </div>
              <button 
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveUser} className="p-5 space-y-4">
              
              {/* Notification Banners */}
              {errorMsg && (
                <div className="flex items-start space-x-2.5 p-3.5 bg-rose-50 border border-rose-150 rounded-xl text-rose-700 text-xs">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-500" />
                  <p className="font-semibold">{errorMsg}</p>
                </div>
              )}

              {successMsg && (
                <div className="flex items-start space-x-2.5 p-3.5 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-700 text-xs animate-pulse">
                  <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-500" />
                  <p className="font-semibold">{successMsg}</p>
                </div>
              )}

              {/* Account details readout (Readonly email) */}
              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Account Email Username</span>
                <input
                  type="text"
                  value={editingUser.email}
                  disabled
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-400 select-none cursor-not-allowed"
                />
              </div>

              {/* Edit display name */}
              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Account Display Name</span>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    placeholder="Enter display name (e.g. Dr. John Doe)"
                    className="w-full bg-white border border-slate-250 rounded-xl pl-9.5 pr-4 py-2.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 outline-none transition-all shadow-3xs"
                  />
                </div>
              </div>

              {/* Password Reset Field */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                    Reset Account Password
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold font-mono">
                    Leave blank to preserve current password
                  </span>
                </div>
                
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new secure account login password..."
                    className="w-full bg-white border border-slate-250 rounded-xl pl-9.5 pr-10 py-2.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 outline-none transition-all shadow-3xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Edit Roles Selection (Visible ONLY to administrators) */}
              {(isSuperAdmin || isSchoolAdmin) && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                    Update Account System Permission Roles
                  </span>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-150">
                    {[
                      { id: "ADMIN", label: "Admin", emoji: "🏫" },
                      { id: "TEACHER", label: "Teacher", emoji: "🧑‍🏫" },
                      { id: "STUDENT", label: "Student", emoji: "🎓" },
                      { id: "PARENT", label: "Parent/Guardian", emoji: "👪" }
                    ].map((role) => {
                      const isChecked = editStandardRoles.includes(role.id);
                      return (
                        <label
                          key={role.id}
                          className={`flex items-center space-x-2 p-2 rounded-lg border transition-all cursor-pointer select-none ${
                            isChecked
                              ? "bg-white border-indigo-200 text-indigo-700 shadow-4xs"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50/50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditStandardRoles([...editStandardRoles, role.id]);
                              } else {
                                setEditStandardRoles(editStandardRoles.filter((r) => r !== role.id));
                              }
                            }}
                            className="h-3.5 w-3.5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="text-[11px] font-bold flex items-center gap-1">
                            <span>{role.emoji}</span>
                            <span>{role.label}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                      Update Custom Designations (Comma-separated)
                    </span>
                    <input
                      type="text"
                      value={editCustomRole}
                      onChange={(e) => setEditCustomRole(e.target.value)}
                      placeholder="e.g. Club Coordinator, Department Head, Basketball Coach..."
                      className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 outline-none transition-all shadow-3xs"
                    />
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 pt-3.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-350 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="animate-spin h-3.5 w-3.5 mr-1" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>Save Account Configurations</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
