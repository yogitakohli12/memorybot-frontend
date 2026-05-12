import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  // Treat 207 (Multi-Status, used for "AI failed but user msg saved") as success
  validateStatus: (s) => (s >= 200 && s < 300) || s === 207,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("mva_token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const data = err.response?.data || {};
    const msg =
      data.message ||
      data.error ||
      err.message ||
      "Request failed";
    const e = new Error(msg);
    e.kind = data.kind || null;
    e.status = err.response?.status || null;
    e.usage = data.usage || null;
    e.rateLimit = data.rateLimit || null;
    return Promise.reject(e);
  }
);

export const apiBaseUrl = API_URL;
export default api;
