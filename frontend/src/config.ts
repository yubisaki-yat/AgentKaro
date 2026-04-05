// Central API configuration
// Uses VITE_API_URL env var in production, falls back to localhost for dev
const rawUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Ensure it includes /api but doesn't double-append it
const API_BASE = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;

export default API_BASE;
