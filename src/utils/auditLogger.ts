export interface ActivityLog {
  id: string;
  timestamp: string;
  category: "SYS_TRIG" | "ATT_MON" | "CBT_SCORE" | "AUTH" | "EXPORT" | "ADMIN_OP";
  message: string;
  status: "OK" | "MONITORING" | "RELEASED" | "SUCCESS" | "WARNING" | "INFO";
  operator: string;
  tenantId?: string;
}

const LOCAL_STORAGE_KEY = "cbt_pro_activity_logs_v1";

const initialLogs: ActivityLog[] = [
  {
    id: "log-1",
    timestamp: "2026-07-10T02:15:30Z",
    category: "SYS_TRIG",
    message: "Student User STU2026001 mapped to u-3 student login.",
    status: "OK",
    operator: "SYSTEM"
  },
  {
    id: "log-2",
    timestamp: "2026-07-10T02:45:12Z",
    category: "ATT_MON",
    message: "Dr Charles Kolawole updated SS3 Science physical logs.",
    status: "MONITORING",
    operator: "Dr Charles Kolawole"
  },
  {
    id: "log-3",
    timestamp: "2026-07-10T03:02:44Z",
    category: "CBT_SCORE",
    message: "Tunde Folayan submitted SS3 Mathematics Assessment score: 100% (Pass).",
    status: "RELEASED",
    operator: "Tunde Folayan"
  },
  {
    id: "log-4",
    timestamp: "2026-07-10T03:12:00Z",
    category: "EXPORT",
    message: "Admin exported SS3 Attendance Trends to CSV file for historical record keeping.",
    status: "SUCCESS",
    operator: "Admin"
  },
  {
    id: "log-5",
    timestamp: "2026-07-10T03:22:15Z",
    category: "SYS_TRIG",
    message: "Gemini AI-assisted feedback summary compiled for Chief Folayan's parent report.",
    status: "OK",
    operator: "Gemini AI"
  }
];

// Load activity logs from LocalStorage or initialize with seeded data
export function getActivityLogs(): ActivityLog[] {
  if (typeof window === "undefined") return initialLogs;
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialLogs));
      return initialLogs;
    }
    return JSON.parse(stored);
  } catch (err) {
    console.error("Failed to parse activity logs:", err);
    return initialLogs;
  }
}

// Log a dynamic activity event
export function logActivity(
  category: ActivityLog["category"],
  message: string,
  status: ActivityLog["status"],
  operator: string = "SYSTEM",
  tenantId?: string
): ActivityLog[] {
  const current = getActivityLogs();
  
  let resolvedTenantId = tenantId;
  if (!resolvedTenantId && typeof window !== "undefined") {
    try {
      const storedUser = localStorage.getItem("authUser") || sessionStorage.getItem("authUser");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.tenantId) {
          resolvedTenantId = parsed.tenantId;
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  const newLog: ActivityLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    category,
    message,
    status,
    operator,
    tenantId: resolvedTenantId || "default"
  };
  
  const updated = [newLog, ...current];
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cbt-pro-log-change", { detail: updated }));
    }
  } catch (err) {
    console.error("Failed to write activity log to storage:", err);
  }
  return updated;
}

// Clear all logs or restore defaults
export function resetActivityLogs(): ActivityLog[] {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialLogs));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cbt-pro-log-change", { detail: initialLogs }));
    }
  } catch (err) {
    console.error("Failed to reset activity logs:", err);
  }
  return initialLogs;
}

// Export logs to downloadable JSON attachment
export function exportLogsToJSON(logs: ActivityLog[]) {
  const dataStr = JSON.stringify(logs, null, 2);
  const blob = new Blob([dataStr], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  const dateStr = new Date().toISOString().split("T")[0];
  link.setAttribute("href", url);
  link.setAttribute("download", `cbt_pro_activity_audit_logs_${dateStr}.json`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export logs to downloadable formatted text report
export function exportLogsToTXT(logs: ActivityLog[]) {
  const dateStr = new Date().toISOString();
  let txtContent = `==================================================\n`;
  txtContent += `       CBT PRO X - SYSTEM AUDIT REPORT             \n`;
  txtContent += `  Generated: ${dateStr}                            \n`;
  txtContent += `  Scope: All Administrative & System Activity Logs  \n`;
  txtContent += `==================================================\n\n`;

  logs.forEach((log, index) => {
    const formattedDate = new Date(log.timestamp).toLocaleString();
    txtContent += `[${index + 1}] DATE: ${formattedDate}\n`;
    txtContent += `    CATEGORY: ${log.category}\n`;
    txtContent += `    STATUS:   ${log.status}\n`;
    txtContent += `    OPERATOR: ${log.operator}\n`;
    txtContent += `    MESSAGE:  ${log.message}\n`;
    txtContent += `--------------------------------------------------\n`;
  });

  txtContent += `\n*** End of Administrative Audit Log File ***\n`;

  const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  const fileDateStr = new Date().toISOString().split("T")[0];
  link.setAttribute("href", url);
  link.setAttribute("download", `cbt_pro_activity_audit_logs_${fileDateStr}.txt`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export logs to downloadable CSV format for easier spreadsheet management
export function exportLogsToCSV(logs: ActivityLog[]) {
  const headers = ["ID", "Timestamp", "Category", "Status", "Operator", "Tenant ID", "Message"];
  
  // Clean values by wrapping in quotes and escaping existing quotes
  const cleanValue = (val: string | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val);
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const rows = logs.map(log => [
    cleanValue(log.id),
    cleanValue(log.timestamp),
    cleanValue(log.category),
    cleanValue(log.status),
    cleanValue(log.operator),
    cleanValue(log.tenantId || ""),
    cleanValue(log.message)
  ]);

  const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  const fileDateStr = new Date().toISOString().split("T")[0];
  link.setAttribute("href", url);
  link.setAttribute("download", `cbt_pro_activity_audit_logs_${fileDateStr}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

