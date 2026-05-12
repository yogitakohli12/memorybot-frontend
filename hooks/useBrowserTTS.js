"use client";

import { useEffect, useState, useCallback, useRef } from "react";

/**
 * Wrapper around the browser's `window.speechSynthesis` API.
 * - Free, no API call, no quota, works offline (mostly).
 * - Voices vary by OS / browser. We refresh the list on `voiceschanged`.
 */
export default function useBrowserTTS() {
  const [voices, setVoices] = useState([]);
  const [supported, setSupported] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const refresh = () => {
      const list = synth.getVoices();
      setVoices(list);
    };
    refresh();
    synth.addEventListener?.("voiceschanged", refresh);
    return () => synth.removeEventListener?.("voiceschanged", refresh);
  }, []);

  const speak = useCallback(
    ({ text, voiceName, rate = 1, pitch = 1, id }) => {
      if (typeof window === "undefined") return;
      const synth = window.speechSynthesis;
      if (!synth || !text) return;

      // Cancel any in-flight utterance so we don't queue them up
      synth.cancel();

      const u = new SpeechSynthesisUtterance(text);
      const v = voiceName
        ? voices.find((vv) => vv.name === voiceName) ||
          voices.find((vv) => vv.voiceURI === voiceName)
        : null;
      if (v) u.voice = v;
      u.rate = rate;
      u.pitch = pitch;

      u.onstart = () => setSpeakingId(id || "default");
      u.onend = () => setSpeakingId((cur) => (cur === (id || "default") ? null : cur));
      u.onerror = () => setSpeakingId(null);

      utteranceRef.current = u;
      synth.speak(u);
    },
    [voices]
  );

  const stop = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis?.cancel();
    setSpeakingId(null);
  }, []);

  return { supported, voices, speak, stop, speakingId };
}
