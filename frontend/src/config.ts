// Central API configuration
// Uses VITE_API_URL env var in production, falls back to localhost for dev
let rawUrl = import.meta.env.VITE_API_URL;

// Smart Discovery: If on Render but VITE_API_URL is missing
if (!rawUrl && window.location.hostname.includes('onrender.com')) {
  // Strip '-frontend' to get backend URL
  rawUrl = window.location.origin.replace(/-frontend/i, "");
  
  // Also log so we can debug in browser console
  console.log("[AgentKaro] Auto-discovered backend URL:", rawUrl);
}

rawUrl = (rawUrl || "http://localhost:8000").replace(/\/+$/, "");

// Ensure it includes /api but doesn't double-append it
const API_BASE = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;

console.log("[AgentKaro] Using API_BASE:", API_BASE);

export default API_BASE;
