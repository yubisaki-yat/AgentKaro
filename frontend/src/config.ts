// Central API configuration
// Uses VITE_API_URL env var in production, falls back to localhost for dev
let rawUrl = import.meta.env.VITE_API_URL;

// Smart Discovery: If on Render but VITE_API_URL is missing
if (!rawUrl && window.location.hostname.includes('onrender.com')) {
  // Try to replace -frontend with -backend automatically
  rawUrl = window.location.origin.replace('-frontend', '-backend');
}

rawUrl = (rawUrl || "http://localhost:8000").replace(/\/+$/, "");

// Ensure it includes /api but doesn't double-append it
const API_BASE = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;

export default API_BASE;
