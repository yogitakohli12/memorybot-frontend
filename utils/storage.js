const CHAT_PREFIX = "mva_chat_";

export const saveChatLocal = (personId, messages) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${CHAT_PREFIX}${personId}`,
      JSON.stringify(messages.slice(-100))
    );
  } catch (_) {}
};

export const loadChatLocal = (personId) => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${CHAT_PREFIX}${personId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const clearChatLocal = (personId) => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${CHAT_PREFIX}${personId}`);
};

export const setItem = (key, value) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
};

export const getItem = (key, fallback = null) => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
