// Core SPA-like behavior, Firebase Authentication, route protection,
// and API helpers for all FarmSathi pages.

import { firebaseConfig, API_BASE_URL } from "./firebase-config.js";

// Firebase JS SDK v9 (modular) loaded from CDN so this works in a plain browser.
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Utility: current page identifier from body[data-page]
const currentPage = document.body.dataset.page || "index";

// Keep track of where user should be redirected after login
const REDIRECT_KEY = "farmsathi_redirect_path";

// ------- UI Helpers -------

// Map Firebase error codes to user-friendly messages
function getAuthErrorMessage(error) {
  const errorCode = error.code || "";
  const errorMessage = error.message || "";

  // Common Firebase Auth error codes
  const errorMessages = {
    "auth/email-already-in-use": "This email is already registered. Please use a different email or try logging in.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/operation-not-allowed": "This sign-in method is not enabled. Please contact support.",
    "auth/weak-password": "Password is too weak. Please use at least 6 characters.",
    "auth/user-disabled": "This account has been disabled. Please contact support.",
    "auth/user-not-found": "No account found with this email. Please check your email or sign up.",
    "auth/wrong-password": "Incorrect password. Please try again or reset your password.",
    "auth/invalid-credential": "Invalid email or password. Please check your credentials and try again.",
    "auth/invalid-verification-code": "Invalid verification code. Please try again.",
    "auth/invalid-verification-id": "Verification session expired. Please try again.",
    "auth/code-expired": "Verification code has expired. Please request a new one.",
    "auth/credential-already-in-use": "This account is already linked to another user.",
    "auth/email-already-exists": "This email is already in use. Please use a different email.",
    "auth/phone-number-already-exists": "This phone number is already in use.",
    "auth/popup-closed-by-user": "Sign-in popup was closed. Please try again.",
    "auth/popup-blocked": "Popup was blocked by your browser. Please allow popups for this site and try again.",
    "auth/unauthorized-domain": "This domain is not authorized. Please contact support or try from an authorized domain.",
    "auth/network-request-failed": "Network error. Please check your internet connection and try again.",
    "auth/too-many-requests": "Too many failed attempts. Please try again later or reset your password.",
    "auth/requires-recent-login": "For security, please log out and log in again to perform this action.",
    "auth/account-exists-with-different-credential": "An account already exists with the same email but different sign-in method. Please use the correct sign-in method.",
    "auth/timeout": "Request timed out. Please check your connection and try again.",
    "auth/cancelled-popup-request": "Sign-in was cancelled. Please try again.",
  };

  // Check if we have a custom message for this error code
  if (errorMessages[errorCode]) {
    return errorMessages[errorCode];
  }

  // For unknown errors, provide a generic message
  if (errorCode.startsWith("auth/")) {
    return "Authentication error occurred. Please try again or contact support if the problem persists.";
  }

  // Fallback to original message if it's not a Firebase auth error
  return errorMessage || "An unexpected error occurred. Please try again.";
}

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("visible");
  }, 10);
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function openModal() {
  const modal = document.getElementById("authModal");
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  const modal = document.getElementById("authModal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const tabLogin = document.getElementById("tabLogin");
  const tabSignup = document.getElementById("tabSignup");
  if (!loginForm || !signupForm || !tabLogin || !tabSignup) return;

  if (tab === "login") {
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
    tabLogin.classList.add("active");
    tabSignup.classList.remove("active");
  } else {
    signupForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    tabSignup.classList.add("active");
    tabLogin.classList.remove("active");
  }
}

function setRedirectPath(path) {
  try {
    localStorage.setItem(REDIRECT_KEY, path);
  } catch {
    // ignore
  }
}

function consumeRedirectPath() {
  try {
    const path = localStorage.getItem(REDIRECT_KEY);
    if (path) {
      localStorage.removeItem(REDIRECT_KEY);
      return path;
    }
  } catch {
    // ignore
  }
  return null;
}

// ------- Auth Functions -------

async function signupWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

async function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

async function logout() {
  await signOut(auth);
}

// ------- DOM Wiring for Auth Modal & Nav -------

function setupAuthModalHandlers() {
  const btnGetStarted = document.getElementById("btnGetStarted");
  const btnGetStartedHero = document.getElementById("btnGetStartedHero");
  const modal = document.getElementById("authModal");

  const openAuth = () => {
    setRedirectPath("dashboard.html");
    openModal();
  };

  if (btnGetStarted) btnGetStarted.addEventListener("click", openAuth);
  if (btnGetStartedHero) btnGetStartedHero.addEventListener("click", openAuth);

  if (!modal) return;

  modal.addEventListener("click", (e) => {
    if (e.target.matches("[data-close-modal]")) {
      closeModal();
    }
  });

  const authError = document.getElementById("authError");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const googleBtn = document.getElementById("googleSignInBtn");

  const clearError = () => {
    if (authError) authError.textContent = "";
  };

  if (document.getElementById("tabLogin")) {
    document
      .getElementById("tabLogin")
      .addEventListener("click", () => switchAuthTab("login"));
  }
  if (document.getElementById("tabSignup")) {
    document
      .getElementById("tabSignup")
      .addEventListener("click", () => switchAuthTab("signup"));
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearError();
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;
      try {
        await loginWithEmail(email, password);
        closeModal();
      } catch (err) {
        if (authError) {
          authError.textContent = getAuthErrorMessage(err);
        }
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearError();
      const email = document.getElementById("signupEmail").value.trim();
      const password = document.getElementById("signupPassword").value;
      try {
        await signupWithEmail(email, password);
        closeModal();
      } catch (err) {
        if (authError) {
          authError.textContent = getAuthErrorMessage(err);
        }
      }
    });
  }

  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      clearError();
      try {
        await signInWithGoogle();
        closeModal();
      } catch (err) {
        if (authError) {
          authError.textContent = getAuthErrorMessage(err);
        }
      }
    });
  }
}

function updateNavForUser(user) {
  const navUserSection = document.getElementById("navUserSection");
  const protectedLinks = document.querySelectorAll(".nav-protected");
  if (user) {
    protectedLinks.forEach((el) => el.classList.remove("disabled"));
    if (navUserSection) {
      navUserSection.innerHTML = `
        <span class="nav-username">Hello, ${
          user.displayName || user.email
        }</span>
        <button id="btnLogout" class="btn btn-ghost">Sign Out</button>
      `;
      const btnLogout = document.getElementById("btnLogout");
      if (btnLogout) {
        btnLogout.addEventListener("click", async () => {
          await logout();
        });
      }
    }
  } else {
    protectedLinks.forEach((el) => el.classList.add("disabled"));
    if (navUserSection) {
      // On index we already have Get Started button in HTML, so don't overwrite if present
      if (currentPage === "index") {
        // no-op
      } else {
        navUserSection.innerHTML =
          '<button id="btnLoginNav" class="btn btn-primary">Get Started</button>';
        const loginNav = document.getElementById("btnLoginNav");
        if (loginNav) {
          loginNav.addEventListener("click", () => {
            setRedirectPath(window.location.pathname.split("/").pop());
            openModal();
          });
        }
      }
    }
  }
}

// ------- Route Protection -------

function isProtectedPage(page) {
  return [
    "dashboard",
    "crop-recommend",
    "fertilizer-recommend",
    "disease-detect",
    "survey",
    "feedback",
    "contact",
  ].includes(page);
}

function handleProtectedRoute(user) {
  if (!isProtectedPage(currentPage)) {
    return;
  }
  if (!user) {
    // Save current path so we can come back after login
    const filename = window.location.pathname.split("/").pop();
    setRedirectPath(filename || "dashboard.html");
    openModal();
  }
}

// Redirect after login if user had tried to access a protected page
function handlePostLoginRedirect() {
  const redirect = consumeRedirectPath();
  if (redirect) {
    if (window.location.pathname.endsWith(redirect)) {
      return;
    }
    window.location.href = redirect;
  } else if (currentPage === "index") {
    window.location.href = "dashboard.html";
  }
}

// ------- API Wrappers -------

async function postCropRecommend(formData) {
  const resp = await fetch(`${API_BASE_URL}/crop-recommend`, {
    method: "POST",
    body: formData,
  });
  if (!resp.ok) throw new Error("Failed to get crop recommendation");
  return resp.json();
}

async function postFertilizerRecommend(formData) {
  const resp = await fetch(`${API_BASE_URL}/fertilizer-recommend`, {
    method: "POST",
    body: formData,
  });
  if (!resp.ok) throw new Error("Failed to get fertilizer recommendation");
  return resp.json();
}

async function postChatbot(query) {
  const data = new FormData();
  data.append("query", query);
  try {
    const resp = await fetch(`${API_BASE_URL}/chatbot`, {
      method: "POST",
      body: data,
    });
    if (!resp.ok) {
      const errorText = await resp.text().catch(() => "Unknown error");
      throw new Error(`Chatbot request failed: ${resp.status} - ${errorText}`);
    }
    // Try to parse as JSON first, fallback to text
    const contentType = resp.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const json = await resp.json();
      return json.response || json.message || JSON.stringify(json);
    }
    return await resp.text();
  } catch (err) {
    console.error("Chatbot API error:", err);
    throw err;
  }
}

async function uploadDiseaseImage(file) {
  const data = new FormData();
  data.append("file", file);
  const resp = await fetch(`${API_BASE_URL}/predict-disease`, {
    method: "POST",
    body: data,
  });
  if (!resp.ok) throw new Error("Disease prediction failed");
  return resp.json();
}

// Expose chatbot helper globally so chatbot-widget.js can use it
window.FarmSathiAPI = {
  postChatbot,
};

// ------- Page-specific Setup -------

function setupDashboardSidebar() {
  const toggle = document.querySelector(".sidebar-toggle");
  const menu = document.getElementById("sidebarMenu");
  if (!toggle || !menu) return;
  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    menu.classList.toggle("open");
  });
}

function setupCropPage() {
  const form = document.getElementById("cropForm");
  const resultBox = document.getElementById("cropResult");
  if (!form || !resultBox) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    try {
      resultBox.classList.remove("hidden");
      resultBox.textContent = "Loading recommendation...";
      const data = await postCropRecommend(formData);
      resultBox.innerHTML = `
        <h3>Recommended Crop</h3>
        <p class="highlight">${data.recommended_crop || data.crop || "Result available"}</p>
        ${
          data.details
            ? `<p class="muted-text">${data.details}</p>`
            : ""
        }
      `;
    } catch (err) {
      resultBox.classList.remove("hidden");
      resultBox.textContent = err.message;
      showToast(err.message, "error");
    }
  });
}

function setupFertilizerPage() {
  const form = document.getElementById("fertilizerForm");
  const resultBox = document.getElementById("fertilizerResult");
  if (!form || !resultBox) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    try {
      resultBox.classList.remove("hidden");
      resultBox.textContent = "Loading recommendation...";
      const data = await postFertilizerRecommend(formData);
      resultBox.innerHTML = `
        <h3>Fertilizer Recommendation</h3>
        <p class="highlight">${data.recommended_fertilizer || data.fertilizer || "Result available"}</p>
        ${
          data.details
            ? `<p class="muted-text">${data.details}</p>`
            : ""
        }
      `;
    } catch (err) {
      resultBox.classList.remove("hidden");
      resultBox.textContent = err.message;
      showToast(err.message, "error");
    }
  });
}

function setupDiseasePage() {
  const form = document.getElementById("diseaseForm");
  const fileInput = document.getElementById("leafImage");
  const preview = document.getElementById("imagePreview");
  const resultBox = document.getElementById("diseaseResult");
  if (!form || !fileInput || !preview || !resultBox) return;

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) {
      preview.classList.add("hidden");
      return;
    }
    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file.", "error");
      fileInput.value = "";
      preview.classList.add("hidden");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      preview.src = reader.result;
      preview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const file = fileInput.files[0];
    if (!file) {
      showToast("Please select an image first.", "error");
      return;
    }
    try {
      resultBox.classList.remove("hidden");
      resultBox.textContent = "Analyzing image...";
      const data = await uploadDiseaseImage(file);
      resultBox.innerHTML = `
        <h3>Disease Detection Result</h3>
        <p><strong>Disease:</strong> ${
          data.predicted_disease || data.disease || "Unknown"
        }</p>
        ${
          data.confidence
            ? `<p><strong>Confidence:</strong> ${(data.confidence * 100).toFixed(
                1
              )}%</p>`
            : ""
        }
        ${
          data.recommendation
            ? `<p><strong>Recommendation:</strong> ${data.recommendation}</p>`
            : ""
        }
      `;
    } catch (err) {
      resultBox.classList.remove("hidden");
      resultBox.textContent = err.message;
      showToast(err.message, "error");
    }
  });
}

// EmailJS Configuration
const EMAILJS_CONFIG = {
  serviceId: "service_gwh8xex",
  templateId: "template_8alll9h",
  publicKey: "Z62dfooXbDLswpQqV",
};

// Initialize EmailJS
function initEmailJS() {
  if (typeof emailjs !== "undefined") {
    emailjs.init(EMAILJS_CONFIG.publicKey);
  }
}

// Send email via EmailJS
async function sendEmailViaEmailJS(templateParams) {
  if (typeof emailjs === "undefined") {
    throw new Error("EmailJS library not loaded");
  }
  try {
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );
    return response;
  } catch (error) {
    console.error("EmailJS error:", error);
    throw new Error("Failed to send email. Please try again later.");
  }
}

function setupEmailForm(formId, emailTemplateParams, successMessage) {
  const form = document.getElementById(formId);
  if (!form) return;
  
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : "";
    
    // Disable submit button
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";
    }
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Validation
    for (const [k, v] of Object.entries(data)) {
      if (form.querySelector(`[name="${k}"]`)?.hasAttribute("required") && String(v).trim() === "") {
        showToast("Please fill all required fields.", "error");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
        return;
      }
    }
    
    try {
      // Build template params
      const templateParams = emailTemplateParams(data);
      await sendEmailViaEmailJS(templateParams);
      form.reset();
      showToast(successMessage, "success");
    } catch (err) {
      showToast(err.message || "Failed to send message. Please try again.", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  });
}

function setupSimpleForm(formId, storageKey, successMessage) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    // Simple client-side validation
    for (const [k, v] of Object.entries(data)) {
      if (String(v).trim() === "") {
        showToast("Please fill all required fields.", "error");
        return;
      }
    }
    try {
      const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
      existing.push({ ...data, createdAt: new Date().toISOString() });
      localStorage.setItem(storageKey, JSON.stringify(existing));
    } catch {
      // ignore storage errors in demo
    }
    form.reset();
    showToast(successMessage, "success");
  });
}

// ------- Auth State Listener -------

onAuthStateChanged(auth, (user) => {
  updateNavForUser(user);
  if (user) {
    handlePostLoginRedirect();
  } else {
    handleProtectedRoute(null);
  }
});

// ------- Init on DOM Ready -------

document.addEventListener("DOMContentLoaded", () => {
  setupAuthModalHandlers();

  if (currentPage === "dashboard") {
    setupDashboardSidebar();
  }
  if (currentPage === "crop-recommend") {
    setupCropPage();
  }
  if (currentPage === "fertilizer-recommend") {
    setupFertilizerPage();
  }
  if (currentPage === "disease-detect") {
    setupDiseasePage();
  }
  if (currentPage === "survey") {
    setupSimpleForm("surveyForm", "farmsathi_survey", "Survey submitted.");
  }
  if (currentPage === "feedback") {
    initEmailJS();
    setupEmailForm(
      "feedbackForm",
      (data) => ({
        from_name: data.feedbackName || "Anonymous",
        from_email: data.feedbackEmail || "no-email@example.com",
        message: `Feedback from FarmSathi:\n\n${data.feedbackMessage || "No message provided"}`,
        subject: "New Feedback from FarmSathi",
      }),
      "Feedback submitted successfully! We'll get back to you soon."
    );
  }
  if (currentPage === "contact") {
    initEmailJS();
    setupEmailForm(
      "contactForm",
      (data) => ({
        from_name: data.contactName || "Anonymous",
        from_email: data.contactEmail || "no-email@example.com",
        phone: data.contactPhone || "Not provided",
        message: data.contactMessage || "No message provided",
        subject: "New Contact Message from FarmSathi",
      }),
      "Message sent successfully! We'll get back to you soon."
    );
  }
});


