"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import {useChat} from "../../hooks/useChat";
import Navbar from "../../components/Navbar";
import PersonSelector from "../../components/PersonSelector";
import CreatePersonModal from "../../components/CreatePersonModal";
import ChatBox from "../../components/ChatBox";
import UsageBadge from "../../components/UsageBadge";
import { listPersons } from "../../services/personService"
import { getUsage } from "../../services/usageService";
import { getItem, setItem } from "../../utils/storage";

const LAST_PERSON_KEY = "mva_last_person";

const KIND_TIPS = {
  network:
    "RECOMMENDED FIX: get a free Groq API key at https://console.groq.com/keys (no credit card, works in India without VPN). Add GROQ_API_KEY=... to backend/.env and restart. The app auto-failovers to Groq when OpenAI is unreachable. Otherwise: try mobile hotspot, a VPN, or set HTTPS_PROXY in backend/.env.",
  quota:
    "Your OpenAI free credits are gone. Either (a) add billing at https://platform.openai.com/account/billing, or (b) add a free GROQ_API_KEY in backend/.env — Groq's free tier is much more generous (1000 req/day).",
  rate_limit:
    "Per-minute rate limit hit. OpenAI free tier allows ~3 req/min, Groq free tier allows ~30 req/min. Wait ~20s and resend.",
  app_quota:
    "You've reached this app's daily soft limit. Raise it by setting DAILY_MESSAGE_LIMIT=200 (or higher) in backend/.env.",
  auth: "API key isn't valid. Check OPENAI_API_KEY (sk-…) or GROQ_API_KEY (gsk_…) in backend/.env.",
  billing:
    "Provider's monthly hard limit was reached. Raise it in your provider dashboard or wait for next month.",
  whisper:
    "Voice transcription failed. Set GROQ_API_KEY in backend/.env — Groq hosts Whisper too and is reachable from networks that block OpenAI.",
  tts: "Voice synthesis (ElevenLabs) failed but text reply still went through.",
};

export default function ChatPage() {
  const { user, loading: authLoading, logout } = useAuth({
    redirectIfMissing: true,
  });
  const router = useRouter();

  const [persons, setPersons] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingPersons, setLoadingPersons] = useState(true);
  const [pageError, setPageError] = useState("");
  const [planInfo, setPlanInfo] = useState(null);
  const [providersInfo, setProvidersInfo] = useState(null);

  const selectedPerson = persons.find((p) => p._id === selectedId) || null;
  const {
    messages,
    loading,
    sending,
    error,
    usage,
    setUsage,
    sendText,
    sendAudio,
    clearError,
  } = useChat(selectedId);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoadingPersons(true);

    Promise.all([
      listPersons().catch((e) => {
        setPageError(e.message);
        return [];
      }),
      getUsage().catch(() => null),
    ]).then(([list, usageData]) => {
      if (cancelled) return;
      setPersons(list);
      const lastId = getItem(LAST_PERSON_KEY);
      const initial = list.find((p) => p._id === lastId) || list[0];
      if (initial) setSelectedId(initial._id);
      if (usageData) {
        setUsage({
          used: usageData.used,
          limit: usageData.limit,
          remaining: usageData.remaining,
          resetsAt: usageData.resetsAt,
        });
        setPlanInfo({ current: usageData.plan?.current });
        setProvidersInfo(usageData.providers || null);
      }
      setLoadingPersons(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user, setUsage]);

  useEffect(() => {
    if (selectedId) setItem(LAST_PERSON_KEY, selectedId);
  }, [selectedId]);

  const handleCreated = (person) => {
    setPersons((prev) => [person, ...prev.filter((p) => p._id !== person._id)]);
    setSelectedId(person._id);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/60">
        Loading…
      </div>
    );
  }

  const tip = error?.kind ? KIND_TIPS[error.kind] : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} onLogout={logout} />

      <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto px-4 py-4 gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PersonSelector
            persons={persons}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onCreate={() => setShowModal(true)}
          />
          <div className="flex items-center gap-3">
            {selectedPerson && (
              <div className="text-xs text-white/50 hidden md:block">
                {selectedPerson.traits?.length
                  ? `Traits: ${selectedPerson.traits.join(", ")}`
                  : "No traits set"}
              </div>
            )}
            <UsageBadge usage={usage} plan={planInfo} providers={providersInfo} />
          </div>
        </div>

        {(pageError || error) && (
          <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 px-4 py-3 rounded-lg flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium mb-0.5">
                {error?.kind === "quota"
                  ? "Out of OpenAI credits"
                  : error?.kind === "rate_limit"
                  ? "Rate limit"
                  : error?.kind === "app_quota"
                  ? "Daily limit reached"
                  : error?.kind === "network"
                  ? "Can't reach OpenAI"
                  : error?.kind === "auth"
                  ? "Invalid API key"
                  : "Something went wrong"}
              </div>
              <div className="text-red-200/90 whitespace-pre-wrap break-words">
                {pageError || error?.message}
              </div>
              {tip && (
                <div className="text-xs text-red-200/70 mt-2 leading-relaxed">
                  {tip}
                </div>
              )}
              {error?.usage && (
                <div className="text-xs text-red-200/60 mt-1">
                  Used {error.usage.used}/{error.usage.limit} today · resets{" "}
                  {new Date(error.usage.resetsAt).toLocaleString()}
                </div>
              )}
              <div className="text-xs text-red-200/50 mt-1">
                Diagnose:{" "}
                <a
                  href={`${
                    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
                  }/api/health`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  /api/health
                </a>
              </div>
            </div>
            <button
              onClick={() => {
                setPageError("");
                clearError();
              }}
              className="text-red-200/70 hover:text-white"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex-1 glass rounded-2xl overflow-hidden min-h-[60vh]">
          {loadingPersons ? (
            <div className="h-full flex items-center justify-center text-white/50">
              Loading people…
            </div>
          ) : persons.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-white/60 p-6">
              <div className="text-5xl mb-3">👤</div>
              <p className="mb-4">
                You don't have any people yet. Create one to start chatting.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary"
              >
                + Create your first person
              </button>
            </div>
          ) : (
            <ChatBox
              person={selectedPerson}
              messages={messages}
              loading={loading}
              sending={sending}
              onSendText={sendText}
              onSendAudio={sendAudio}
            />
          )}
        </div>
      </div>

      {showModal && (
        <CreatePersonModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
