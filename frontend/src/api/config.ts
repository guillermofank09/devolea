// In production: VITE_API_URL = deployed backend URL (e.g. https://devolea-api.vercel.app)
// In development: empty string — Vite proxy forwards /api calls to localhost:3001
export const API_BASE = (import.meta.env.VITE_API_URL as string) ?? "";
