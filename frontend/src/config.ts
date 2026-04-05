// Central API configuration
const RENDER_BACKEND = "https://agentskaro.onrender.com";

let rawUrl: string;

if (import.meta.env.VITE_API_URL) {
  rawUrl = import.meta.env.VITE_API_URL;
} else if (window.location.hostname.includes('onrender.com')) {
  // Use the known hardcoded Render backend URL
  rawUrl = RENDER_BACKEND;
} else {
  rawUrl = "http://localhost:8000";
}

rawUrl = rawUrl.replace(/\/+$/, "");

// Ensure it includes /api but doesn't double-append it
const API_BASE = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;

export default API_BASE;
