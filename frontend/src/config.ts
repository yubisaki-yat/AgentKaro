// Central API configuration
// Uses VITE_API_URL env var in production, falls back to localhost for dev
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "http://localhost:8000/api";

export default API_BASE;
