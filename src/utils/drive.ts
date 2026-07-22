import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const driveProvider = new GoogleAuthProvider();

// Add essential Google Drive scopes
driveProvider.addScope("https://www.googleapis.com/auth/drive");
driveProvider.addScope("https://www.googleapis.com/auth/drive.file");
driveProvider.addScope("https://www.googleapis.com/auth/drive.readonly");
driveProvider.addScope("https://www.googleapis.com/auth/drive.metadata");

// Force account selection to avoid auto-login with wrong accounts
driveProvider.setCustomParameters({
  prompt: "select_account"
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize Google Drive Auth State Listener
export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in via Google popup to get Drive access token
export const signInWithDrive = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, driveProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to retrieve Google OAuth access token from authentication result.");
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Drive authorization error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Log out and clear cached token
export const logoutDrive = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// List files from a Google Drive folder
export const listDriveFiles = async (
  token: string, 
  folderId: string = "root", 
  searchQuery: string = ""
): Promise<any[]> => {
  let q = `'${folderId}' in parents and trashed = false`;
  if (searchQuery) {
    const escapedSearch = searchQuery.replace(/'/g, "\\'");
    q = `trashed = false and name contains '${escapedSearch}'`;
  }
  
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=50&q=${encodeURIComponent(q)}&fields=nextPageToken,files(id,name,mimeType,modifiedTime,size,iconLink,webViewLink,owners)&orderBy=folder,name`;
  
  const res = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || "Failed to list files from Google Drive.");
  }
  
  const data = await res.json();
  return data.files || [];
};

// Upload a local file to a Google Drive folder
export const uploadDriveFile = async (
  token: string,
  file: File,
  folderId: string = "root"
): Promise<any> => {
  const metadata = {
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    parents: [folderId]
  };

  const boundary = "314159265358979323846";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const fileReader = new FileReader();
  
  const fileDataPromise = new Promise<string | ArrayBuffer>((resolve, reject) => {
    fileReader.onload = () => resolve(fileReader.result!);
    fileReader.onerror = () => reject(fileReader.error);
    fileReader.readAsBinaryString(file);
  });

  const fileContent = await fileDataPromise;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${metadata.mimeType}\r\n` +
    'Content-Transfer-Encoding: binary\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || "Failed to upload file to Google Drive.");
  }

  return res.json();
};

// Create a new folder inside Google Drive
export const createDriveFolder = async (
  token: string,
  name: string,
  parentFolderId: string = "root"
): Promise<any> => {
  const metadata = {
    name,
    mimeType: "application/vnd.google-apps.folder",
    parents: [parentFolderId]
  };

  const res = await fetch("https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(metadata)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || "Failed to create folder in Google Drive.");
  }

  return res.json();
};

// Delete a file or folder from Google Drive
export const deleteDriveFile = async (token: string, fileId: string): Promise<void> => {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || "Failed to delete file from Google Drive.");
  }
};

// Helper to save documents (like CSV lists) directly to Google Drive
export const uploadTextFileToDrive = async (
  token: string,
  fileName: string,
  content: string,
  mimeType: string = "text/csv",
  folderId: string = "root"
): Promise<any> => {
  const metadata = {
    name: fileName,
    mimeType,
    parents: [folderId]
  };

  const boundary = "314159265358979323846";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content +
    closeDelimiter;

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || "Failed to save document to Google Drive.");
  }

  return res.json();
};
