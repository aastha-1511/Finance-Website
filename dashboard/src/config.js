// Central URL config — reads from REACT_APP_* env vars (set in .env or Vercel project settings)
// Local defaults keep dev working out-of-the-box with no changes needed

export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
export const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000';
