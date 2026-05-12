import api from "./api";

export const createPerson = async (data) => {
  const res = await api.post("/person", data);
  return res.data.person;
};

export const listPersons = async () => {
  const res = await api.get("/person");
  return res.data.persons || [];
};

export const getPerson = async (id) => {
  const res = await api.get(`/person/${id}`);
  return res.data.person;
};

export const updatePerson = async (id, data) => {
  const res = await api.put(`/person/${id}`, data);
  return res.data.person;
};

export const deletePerson = async (id) => {
  const res = await api.delete(`/person/${id}`);
  return res.data;
};

/**
 * Upload audio files for voice cloning.
 * @param {File[]} files
 * @param {{personId?: string, name?: string}} options
 */
export const uploadVoice = async (
  files,
  { personId, name, fallbackVoiceId } = {}
) => {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  if (personId) form.append("personId", personId);
  if (name) form.append("name", name);
  if (fallbackVoiceId) form.append("fallbackVoiceId", fallbackVoiceId);

  const res = await api.post("/person/voice-upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const listVoices = async () => {
  const res = await api.get("/person/voices");
  return res.data.providers || {};
};
