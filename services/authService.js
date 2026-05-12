import api from "./api";

export const signup = async (data) => {
  const res = await api.post("/auth/signup", data);
  if (res.data.token) localStorage.setItem("mva_token", res.data.token);
  if (res.data.user)
    localStorage.setItem("mva_user", JSON.stringify(res.data.user));
  return res.data;
};

export const login = async (data) => {
  const res = await api.post("/auth/login", data);
  if (res.data.token) localStorage.setItem("mva_token", res.data.token);
  if (res.data.user)
    localStorage.setItem("mva_user", JSON.stringify(res.data.user));
  return res.data;
};

export const logout = async () => {
  try {
    await api.post("/auth/logout");
  } catch (_) {}
  localStorage.removeItem("mva_token");
  localStorage.removeItem("mva_user");
};

export const getCurrentUser = async () => {
  const res = await api.get("/auth/me");
  return res.data.user;
};

export const getStoredUser = () => {
  if (typeof window === "undefined") return null;
  try {
    const u = localStorage.getItem("mva_user");
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};
