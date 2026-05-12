import api from "./api";

export const sendTextMessage = async (personId, text) => {
  const res = await api.post("/chat/send", { personId, text });
  return res.data;
};

export const sendAudioMessage = async (personId, audioBlob) => {
  const form = new FormData();
  form.append("personId", personId);
  form.append(
    "audio",
    audioBlob,
    `recording-${Date.now()}.webm`
  );
  const res = await api.post("/chat/send", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getChatHistory = async (personId) => {
  const res = await api.get(`/chat/${personId}`);
  return res.data.messages || [];
};

export const clearChatHistory = async (personId) => {
  const res = await api.delete(`/chat/${personId}`);
  return res.data;
};
