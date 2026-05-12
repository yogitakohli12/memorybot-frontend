"use client";

import { useRef, useState, useEffect } from "react";

/**
 * Voice input that PREFERS the browser's free Web Speech API for transcription.
 * - No API call, no network dependency, no Whisper key needed.
 * - Works in Chrome, Edge, Safari (the user is on Edge or Chrome here).
 *
 * If the browser doesn't support it, falls back to the old MediaRecorder path
 * which uploads the audio to the backend for Whisper transcription.
 *
 * Props:
 *   onText(text)         called with the transcribed text (preferred path)
 *   onAudio(blob)        called with audio blob (fallback path)
 *   disabled
 */
export default function VoiceRecorder({ onText, onAudio, disabled }) {
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");

  // Fallback (MediaRecorder) refs — only used if SpeechRecognition is missing.
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  useEffect(() => {
    const SR =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    setSupported(!!SR);
  }, []);

  const startWebSpeech = () => {
    setError("");
    setInterim("");
    finalTranscriptRef.current = "";

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = navigator.language || "en-US";
    rec.interimResults = true;
    rec.continuous = true;

    rec.onresult = (e) => {
      let interimTxt = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalTranscriptRef.current += r[0].transcript;
        else interimTxt += r[0].transcript;
      }
      setInterim(interimTxt);
    };

    rec.onerror = (e) => {
      const code = e.error || "unknown";
      const messages = {
        "no-speech": "Didn't hear anything — try again.",
        "audio-capture": "Microphone not available.",
        "not-allowed": "Microphone permission denied.",
        network: "Browser STT couldn't reach speech servers — try again or type your message.",
      };
      setError(messages[code] || `Speech error: ${code}`);
      setRecording(false);
    };

    rec.onend = () => {
      setRecording(false);
      const text = finalTranscriptRef.current.trim();
      setInterim("");
      if (text && onText) onText(text);
    };

    recognitionRef.current = rec;
    try {
      rec.start();
      setRecording(true);
    } catch (e) {
      setError(e.message || "Could not start microphone.");
    }
  };

  const stopWebSpeech = () => {
    try {
      recognitionRef.current?.stop();
    } catch (_) {}
    setRecording(false);
  };

  // --- Fallback (MediaRecorder + Whisper on server) -----------------
  const startFallback = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "",
      });
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mr.mimeType || "audio/webm",
        });
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        if (blob.size > 0 && onAudio) onAudio(blob);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch (e) {
      setError(e.message || "Microphone access denied");
    }
  };

  const stopFallback = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const start = supported ? startWebSpeech : startFallback;
  const stop = supported ? stopWebSpeech : stopFallback;

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={recording ? stop : start}
        disabled={disabled}
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
          recording
            ? "bg-red-500 hover:bg-red-600 animate-pulse-slow"
            : "bg-white/10 hover:bg-white/20"
        } disabled:opacity-50`}
        title={
          recording
            ? "Stop recording"
            : supported
            ? "Speak (browser transcription, free)"
            : "Record (Whisper transcription)"
        }
      >
        {recording ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" />
            <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V21a1 1 0 0 0 2 0v-3.08A7 7 0 0 0 19 11z" />
          </svg>
        )}
      </button>
      {recording && interim && (
        <span className="text-[10px] text-white/60 mt-1 max-w-[140px] truncate italic">
          {interim}
        </span>
      )}
      {error && (
        <span className="text-xs text-red-400 mt-1 max-w-[140px] truncate">
          {error}
        </span>
      )}
    </div>
  );
}
