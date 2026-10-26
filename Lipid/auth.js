// ================== Popup (CKD-Stil) ==================
function showPopup(title, text, icon = "info") {
  if (typeof Swal === "undefined") {
    alert(`${title}\n\n${text}`);
    return Promise.resolve();
  }
  return Swal.fire({
    title,
    text,
    icon,
    confirmButtonText: "OK",
    confirmButtonColor: "#2563eb",
    background: "#fff",
    color: "#1f2937",
    allowOutsideClick: true,
    allowEscapeKey: true,
  });
}

async function confirmPopup(title, text, confirmText = "Ja, löschen") {
  if (typeof Swal === "undefined") {
    return confirm(`${title}\n\n${text}`);
  }
  const result = await Swal.fire({
    title,
    text,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Abbrechen",
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#6b7280",
    background: "#fff",
    color: "#1f2937",
    allowOutsideClick: true,
    allowEscapeKey: true,
  });
  return result.isConfirmed;
}

// ================== API ==================
//const API_URL = "https://lipidapi.de.deplexo.com";
const API_URL = "https://jetouss-api.onrender.com";

// ================== Base Path ==================
function getBasePath() {
  return window.location.pathname.includes("/Risiko/") ? "../" : "";
}

// ================== Token / Session ==================
function getToken() {
  return localStorage.getItem("access_token");
}

function isLoggedIn() {
  return !!getToken();
}

function isGuest() {
  return localStorage.getItem("is_guest") === "true";
}

function getUsername() {
  return localStorage.getItem("username") || "";
}

function authHeaders() {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

// ================== Login ==================
async function loginUser(username, password) {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  const response = await fetch(`${API_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Benutzername oder Passwort falsch.");
  }

  const data = await response.json();
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("username", username);
  localStorage.removeItem("is_guest");
  return data;
}

function loginAsGuest() {
  localStorage.setItem("is_guest", "true");
  localStorage.removeItem("access_token");
  localStorage.removeItem("username");
  window.location.href = getBasePath() + "index.html";
}

function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("is_guest");
  localStorage.removeItem("username");
  window.location.href = getBasePath() + "login.html";
}

function requireLogin() {
  if (!isLoggedIn()) {
    showPopup(
      "Anmeldung erforderlich",
      "Bitte loggen Sie sich ein, um auf diese Seite zuzugreifen.",
      "warning",
    ).then(() => {
      window.location.href = getBasePath() + "login.html";
    });
    return false;
  }
  return true;
}

function requireSession() {
  if (!isLoggedIn() && !isGuest()) {
    showPopup(
      "Zugriff verweigert",
      "Bitte melden Sie sich an, um fortzufahren.",
      "error",
    ).then(() => {
      window.location.href = getBasePath() + "login.html";
    });
    return false;
  }
  return true;
}

async function checkSession() {
  const token = getToken();
  if (!token) return false;
  try {
    const r = await fetch(`${API_URL}/me`, { headers: authHeaders() });
    return r.ok;
  } catch {
    return false;
  }
}

// ================== KEEP-ALIVE (Backend wach halten) ==================
(function keepAlive() {
  const PING_INTERVAL = 10 * 60 * 1000;

  function ping() {
    fetch(`${API_URL}/me`, {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    }).catch(() => {});
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ping, { once: true });
  } else {
    ping();
  }

  setInterval(() => {
    if (!document.hidden) ping();
  }, PING_INTERVAL);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) ping();
  });
})();

// ================== Backend-Wächter ==================
// Blockiert Page-Logik, solange das Backend nicht antwortet.
// Andere Seiten awaiten `window.__backendReady` bevor sie starten.

const BACKEND_PING_TIMEOUT = 5000;
const BACKEND_RETRY_DELAY = 3000;
const BACKEND_GIVE_UP_MS = 120000;

function isLoginPage() {
  return /login\.html$/i.test(location.pathname);
}

function backendSleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function pingBackendOnce(timeoutMs = BACKEND_PING_TIMEOUT) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    await fetch(`${API_URL}/me`, {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
      signal: ctrl.signal,
    });
    // Jede Antwort (auch 401/500) → Backend erreichbar
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function showStartupPopup() {
  if (typeof Swal === "undefined") return;
  Swal.fire({
    title: "Backend fährt hoch",
    html:
      "Der Server startet gerade.<br>" +
      "Sobald er antwortet, geht es automatisch weiter.<br><br>" +
      "<b>Bitte warten…</b>",
    icon: "info",
    allowOutsideClick: false,
    allowEscapeKey: false,
    allowEnterKey: false,
    showConfirmButton: false,
    didOpen: () => Swal.showLoading(),
  });
}

function closeBackendPopup() {
  if (typeof Swal !== "undefined") Swal.close();
}

// Initialer Guard: blockiert die Seite bis Backend da ist.
// Erfolg → reload (frischer State).
// 2 Min ohne Antwort → login.html.
window.__backendReady = (async () => {
  if (isLoginPage()) return true;
  if (await pingBackendOnce()) return true;

  showStartupPopup();

  const start = Date.now();
  while (Date.now() - start < BACKEND_GIVE_UP_MS) {
    await backendSleep(BACKEND_RETRY_DELAY);
    if (await pingBackendOnce()) {
      closeBackendPopup();
      location.reload();
      return new Promise(() => {});
    }
  }

  closeBackendPopup();
  window.location.href = getBasePath() + "login.html";
  return new Promise(() => {});
})();

// Wiedereinstieg nach langer Tab-Pause: Backend checken,
// bei Ausfall Popup (Seite bleibt stehen, kein Reload).
let hiddenAt = 0;
document.addEventListener("visibilitychange", async () => {
  if (isLoginPage()) return;

  if (document.hidden) {
    hiddenAt = Date.now();
    return;
  }

  if (!hiddenAt || Date.now() - hiddenAt < BACKEND_GIVE_UP_MS) {
    hiddenAt = 0;
    return;
  }
  hiddenAt = 0;

  if (await pingBackendOnce()) return;

  showStartupPopup();
  const start = Date.now();
  while (Date.now() - start < BACKEND_GIVE_UP_MS) {
    await backendSleep(BACKEND_RETRY_DELAY);
    if (await pingBackendOnce()) {
      closeBackendPopup();
      return;
    }
  }
  closeBackendPopup();
  showPopup(
    "Backend nicht erreichbar",
    "Der Server antwortet nicht. Bitte laden Sie die Seite neu.",
    "error",
  );
});
