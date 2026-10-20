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
const API_URL = "https://jetouss-api.onrender.com"
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

// Session gegen Server prüfen
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
