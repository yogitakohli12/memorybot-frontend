"use client";

import { useEffect, useRef } from "react";
import useBrowserTTS from "../hooks/useBrowserTTS"

/**
 * Plays an AI message using the browser's built-in speech synthesis.
 * Auto-plays when `autoPlay` becomes true. Has a manual play/stop toggle.
 */
export default function BrowserVoicePlayer({
  text,
  voiceName,
  autoPlay = false,
  id,
}) {
  const { supported, speak, stop, speakingId } = useBrowserTTS();
  const playedRef = useRef(false);
  const isSpeaking = speakingId === id;

  useEffect(() => {
    if (!supported || !autoPlay || !text) return;
    if (playedRef.current) return;
    playedRef.current = true;
    // Tiny delay so the message renders before audio starts
    const t = setTimeout(() => speak({ text, voiceName, id }), 80);
    return () => clearTimeout(t);
  }, [autoPlay, text, voiceName, supported, speak, id]);

  if (!supported) {
    return (
      <div className="mt-2 text-[11px] text-yellow-200/80">
        Browser voice not supported — open in Chrome / Edge / Safari to hear
        replies.
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        type="button"
        onClick={() =>
          isSpeaking ? stop() : speak({ text, voiceName, id })
        }
        className="w-8 h-8 rounded-full bg-brand-600 hover:bg-brand-700 flex items-center justify-center text-white"
        aria-label={isSpeaking ? "Stop" : "Play"}
        title={isSpeaking ? "Stop" : "Speak with browser voice"}
      >
        {isSpeaking ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" />
            <rect x="14" y="5" width="4" height="14" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <span className="text-[11px] text-white/50">
        {isSpeaking ? "Speaking…" : "Browser voice"}
      </span>
    </div>
  );
}
