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

export const provider = new GoogleAuthProvider();
// Request Gmail Scopes
provider.addScope("https://www.googleapis.com/auth/gmail.send");
provider.addScope("https://www.googleapis.com/auth/gmail.readonly");
provider.addScope("https://www.googleapis.com/auth/gmail.compose");
provider.addScope("https://www.googleapis.com/auth/gmail.modify");

// Force account selection to avoid auto-login with wrong accounts
provider.setCustomParameters({
  prompt: "select_account"
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize Auth State Listener
export const initGmailAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Read any cached session from session memory (or prompt on fresh flow)
  const sessionToken = sessionStorage.getItem("cbt_gmail_access_token");
  if (sessionToken) {
    cachedAccessToken = sessionToken;
  }

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
      sessionStorage.removeItem("cbt_gmail_access_token");
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in via Google popup to get Gmail access token
export const signInWithGmail = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to retrieve Google OAuth access token from authentication result.");
    }

    cachedAccessToken = credential.accessToken;
    // Keep in session storage for refreshing within the active browser session, but not localStorage
    sessionStorage.setItem("cbt_gmail_access_token", cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Gmail authorization error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Log out and clear cached token
export const logoutGmail = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  sessionStorage.removeItem("cbt_gmail_access_token");
};

// Helper: base64url encoding for MIME messages
const base64urlEncode = (str: string) => {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

// Send an Email via Gmail API
export const sendGmailMessage = async (
  token: string,
  to: string,
  subject: string,
  bodyHtml: string
): Promise<any> => {
  const mimeParts = [
    `To: ${to}`,
    "Content-Type: text/html; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: ${subject}`,
    "",
    bodyHtml
  ];
  
  const mimeMessage = mimeParts.join("\r\n");
  const rawMessage = base64urlEncode(mimeMessage);

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ raw: rawMessage })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || "Failed to send email via Gmail API.");
  }

  return res.json();
};

// Fetch Gmail Messages
export const listGmailMessages = async (token: string, maxResults = 15): Promise<any[]> => {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error("Failed to retrieve messages from Gmail.");
  }

  const data = await res.json();
  if (!data.messages) return [];

  // Fetch detail for each message in parallel
  const messageDetails = await Promise.all(
    data.messages.map(async (msg: { id: string }) => {
      try {
        const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (detailRes.ok) {
          return detailRes.json();
        }
      } catch (e) {
        console.error("Error fetching message detail:", e);
      }
      return null;
    })
  );

  return messageDetails.filter(msg => msg !== null);
};

// Parse email header values
export const getHeaderValue = (headers: any[], name: string): string => {
  const header = headers?.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : "";
};

// Simple MIME body decoder
export const decodeEmailBody = (payload: any): string => {
  if (!payload) return "";
  
  // If text or html is directly in the payload body
  if (payload.body?.data) {
    try {
      return decodeURIComponent(
        escape(atob(payload.body.data.replace(/-/g, "+").replace(/_/g, "/")))
      );
    } catch (e) {
      return "";
    }
  }

  // If nested in parts
  if (payload.parts) {
    for (const part of payload.parts) {
      const decoded = decodeEmailBody(part);
      if (decoded) return decoded;
    }
  }

  return "";
};
