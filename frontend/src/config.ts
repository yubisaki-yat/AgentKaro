// Central API configuration
const RENDER_BACKEND = "https://agentskaro-backend.onrender.com";

let rawUrl: string;

if (import.meta.env.VITE_API_URL) {
  rawUrl = import.meta.env.VITE_API_URL;
} else if (window.location.hostname.includes('onrender.com') || window.location.hostname.includes('agentskaro.co.in')) {
  rawUrl = RENDER_BACKEND;
} else {
  // Use 127.0.0.1 instead of localhost to avoid IPv6 resolution issues on some Windows machines
  const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
  rawUrl = `http://${host}:8000`;
}

rawUrl = rawUrl.replace(/\/+$/, "");

// Ensure it includes /api but doesn't double-append it
const API_BASE = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;

export default API_BASE;
