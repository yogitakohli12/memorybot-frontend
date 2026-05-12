"use client";

import { useState, useEffect, useMemo } from "react";
import {
  createPerson,
  uploadVoice,
  listVoices,
} from "../services/personService";
import useBrowserTTS from "../hooks/useBrowserTTS";

const TABS = [
  { id: "preset", label: "Pick a voice (free)" },
  { id: "clone", label: "Clone from audio (paid)" },
  { id: "none", label: "No voice (text only)" },
];

export default function CreatePersonModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [traits, setTraits] = useState("");
  const [description, setDescription] = useState("");
  const [sampleTexts, setSampleTexts] = useState("");

  const [tab, setTab] = useState("preset");

  // Server-side voice catalog
  const [voicesByProvider, setVoicesByProvider] = useState({});
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState(null);

  // Browser voices (Web Speech API, populated client-side)
  const { supported: browserTtsSupported, voices: browserVoices, speak } =
    useBrowserTTS();

  // Clone state
  const [files, setFiles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("");
  const [warning, setWarning] = useState("");

  useEffect(() => {
    let cancelled = false;
    setVoicesLoading(true);
    listVoices()
      .then((providers) => {
        if (cancelled) return;
        setVoicesByProvider(providers);
      })
      .catch((e) => setError(e.message))
      .finally(() => !cancelled && setVoicesLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Combined voice catalog: browser voices + any server-configured providers
  const allProviders = useMemo(() => {
    const out = { ...voicesByProvider };
    if (browserTtsSupported) {
      out.browser = {
        ...(out.browser || {}),
        name: out.browser?.name || "Browser (free, recommended)",
        note: out.browser?.note || "Uses your browser's built-in voices. Zero API calls, zero quota, works offline.",
        voices: browserVoices.map((v) => ({
          provider: "browser",
          voice_id: v.name,
          name: v.name,
          gender: "",
          accent: v.lang || "",
          description: v.localService ? "Local" : "Online",
        })),
      };
    }
    return out;
  }, [voicesByProvider, browserVoices, browserTtsSupported]);

  // Auto-select the first browser voice when available
  useEffect(() => {
    if (selectedVoice) return;
    const browserList = allProviders.browser?.voices || [];
    if (browserList.length > 0) {
      const v = browserList[0];
      setSelectedVoice({
        provider: v.provider,
        voice_id: v.voice_id,
        name: v.name,
      });
    } else {
      const elPresets = allProviders.elevenlabs?.voices?.[0];
      const oa = allProviders.openai?.voices?.[0];
      const v = elPresets || oa;
      if (v) {
        setSelectedVoice({
          provider: v.provider,
          voice_id: v.voice_id,
          name: v.name,
        });
      }
    }
  }, [allProviders, selectedVoice]);

  const previewVoice = (v) => {
    if (v.provider === "browser") {
      speak({
        text: `Hi, I'm ${v.name}. This is how I sound.`,
        voiceName: v.voice_id,
      });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setWarning("");
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setLoading(true);
    try {
      let voiceConfig = {};
      if (tab === "preset") {
        if (!selectedVoice) {
          setError("Please pick a voice.");
          setLoading(false);
          return;
        }
        voiceConfig = {
          voiceId: selectedVoice.voice_id,
          voiceProvider: selectedVoice.provider,
          voiceLabel: `${selectedVoice.name}${
            selectedVoice.provider === "browser" ? " (browser)" : " (preset)"
          }`,
        };
      }

      setStep("Creating person…");
      const person = await createPerson({
        name: name.trim(),
        traits: traits
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        sampleTexts: sampleTexts
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        description: description.trim(),
        ...voiceConfig,
      });

      let updated = person;

      if (tab === "clone" && files.length > 0) {
        setStep("Uploading audio & attempting clone (~30s)…");
        const fallbackPreset = allProviders.elevenlabs?.voices?.[0];
        const res = await uploadVoice(files, {
          personId: person._id,
          name: person.name,
          fallbackVoiceId: fallbackPreset?.voice_id,
        });
        updated = res.person || {
          ...person,
          voiceId: res.voiceId,
          voiceProvider: res.voiceProvider,
        };
        if (!res.cloned) {
          setWarning(
            res.fallbackMessage ||
              "Voice cloning isn't available on your ElevenLabs plan, so we set a free preset voice instead."
          );
        }
      }

      onCreated(updated);
      if (!warning) onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setStep("");
    }
  };

  const renderVoiceOption = (v) => {
    const isSelected =
      selectedVoice?.provider === v.provider &&
      selectedVoice?.voice_id === v.voice_id;
    return (
      <div
        key={`${v.provider}-${v.voice_id}`}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
          isSelected
            ? "border-brand-500 bg-brand-500/15"
            : "border-white/10 bg-white/5 hover:bg-white/10"
        }`}
      >
        <button
          type="button"
          onClick={() =>
            setSelectedVoice({
              provider: v.provider,
              voice_id: v.voice_id,
              name: v.name,
            })
          }
          className="flex-1 text-left min-w-0"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="font-medium text-sm truncate">{v.name}</div>
            <div className="text-[10px] uppercase tracking-wide opacity-60 shrink-0">
              {v.provider === "openai"
                ? "OpenAI"
                : v.provider === "elevenlabs"
                ? "ElevenLabs"
                : "Browser"}
            </div>
          </div>
          <div className="text-xs text-white/60 mt-0.5 truncate">
            {[v.gender, v.accent, v.description].filter(Boolean).join(" · ")}
          </div>
        </button>
        {v.provider === "browser" && (
          <button
            type="button"
            onClick={() => previewVoice(v)}
            className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80 shrink-0"
            title="Preview"
          >
            ▶
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="glass rounded-2xl max-w-2xl w-full p-6 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Create a Person</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm text-white/70 mb-1">Name *</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grandma Rose"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">
              Traits (comma separated)
            </label>
            <input
              className="input"
              value={traits}
              onChange={(e) => setTraits(e.target.value)}
              placeholder="warm, funny, old-school, loves cooking"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">
              Description
            </label>
            <textarea
              className="input min-h-[60px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Born in 1942, retired teacher, loves jazz…"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">
              Sample sentences (one per line)
            </label>
            <textarea
              className="input min-h-[60px]"
              value={sampleTexts}
              onChange={(e) => setSampleTexts(e.target.value)}
              placeholder={
                "Oh sweetheart, did you eat today?\nYou know what I always say…"
              }
            />
          </div>

          <div className="pt-2">
            <label className="block text-sm text-white/70 mb-2">Voice</label>
            <div className="flex gap-1 mb-3 bg-white/5 p-1 rounded-lg">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex-1 text-xs font-medium px-3 py-2 rounded-md transition-colors ${
                    tab === t.id
                      ? "bg-brand-600 text-white"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "preset" && (
              <div className="space-y-3">
                {voicesLoading ? (
                  <div className="text-sm text-white/50">Loading voices…</div>
                ) : Object.keys(allProviders).length === 0 ? (
                  <div className="text-sm text-yellow-200 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
                    No voice providers available. Open this app in Chrome /
                    Edge / Safari to use the free browser voices.
                  </div>
                ) : (
                  Object.entries(allProviders).map(([key, p]) => (
                    <div key={key}>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <h4 className="text-sm font-medium text-white/90">
                          {p.name}
                          {key === "browser" && (
                            <span className="ml-2 text-[10px] uppercase tracking-wide text-green-300">
                              free · recommended
                            </span>
                          )}
                        </h4>
                        <span className="text-[11px] text-white/40 max-w-[60%] text-right">
                          {p.note}
                        </span>
                      </div>
                      {p.voices && p.voices.length > 0 ? (
                        <div className="grid sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                          {p.voices.map(renderVoiceOption)}
                        </div>
                      ) : (
                        <div className="text-xs text-white/50 px-2 py-2">
                          No voices available from this provider.
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "clone" && (
              <div className="space-y-2">
                <div className="text-xs text-yellow-200 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
                  Voice cloning needs ElevenLabs Starter ($5/mo) or higher. If
                  cloning fails, we'll fall back to a free preset voice — you
                  won't lose any data.
                </div>
                <input
                  type="file"
                  accept=".mp3,.mp4,.m4a,.wav,.flac,.ogg,.opus,.webm,.aac,.mov"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                  className="block w-full text-sm text-white/80 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-600 file:text-white hover:file:bg-brand-700"
                />
                {files.length > 0 && (
                  <ul className="text-xs text-white/70 space-y-0.5">
                    {files.map((f, i) => (
                      <li key={i} className="flex justify-between gap-3">
                        <span className="truncate">{f.name}</span>
                        <span className="text-white/40 shrink-0">
                          {(f.size / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-white/50">
                  Best results: 30s–3min of clear, single-speaker audio.
                </p>
              </div>
            )}

            {tab === "none" && (
              <div className="text-xs text-white/60 bg-white/5 rounded-lg px-3 py-3">
                Replies will be text only. You can change this later by editing
                this person.
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
          {warning && (
            <div className="text-sm text-yellow-200 bg-yellow-500/10 border border-yellow-500/30 px-3 py-2 rounded-lg">
              {warning}
              <button
                type="button"
                onClick={onClose}
                className="ml-3 underline"
              >
                Got it, close
              </button>
            </div>
          )}
          {loading && step && (
            <div className="text-sm text-brand-100 bg-brand-500/10 px-3 py-2 rounded-lg">
              {step}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? "Working…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
