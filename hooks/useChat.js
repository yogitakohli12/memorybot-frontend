"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  sendTextMessage,
  sendAudioMessage,
  getChatHistory,
} from "../services/chatService"
import { saveChatLocal, loadChatLocal } from "../utils/storage"

export  function useChat(personId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null); // { message, kind, usage }
  const [usage, setUsage] = useState(null);
  const personIdRef = useRef(personId);

  useEffect(() => {
    personIdRef.current = personId;
    if (!personId) {
      setMessages([]);
      return;
    }
    const cached = loadChatLocal(personId);
    if (cached.length) setMessages(cached);

    setLoading(true);
    getChatHistory(personId)
      .then((msgs) => {
        if (personIdRef.current === personId) {
          setMessages(msgs);
          saveChatLocal(personId, msgs);
        }
      })
      .catch((e) => setError({ message: e.message, kind: e.kind }))
      .finally(() => setLoading(false));
  }, [personId]);

  const handleResponse = useCallback((data) => {
    const {
      userMessage,
      aiMessage,
      aiError,
      aiKind,
      ttsError,
      speakInBrowser,
      browserVoiceId,
      usage: u,
    } = data || {};

    // If the backend tells us no audio was produced (TTS failed or person uses
    // browser voice), tag the AI message so Message.jsx will speak it via the
    // free browser SpeechSynthesis API.
    const enrichedAi = aiMessage
      ? {
          ...aiMessage,
          _useBrowserTts: !!speakInBrowser && !aiMessage.audioUrl,
          _browserVoiceId: browserVoiceId || null,
        }
      : null;

    setMessages((prev) => {
      const without = prev.filter((m) => !m._pending);
      const next = [...without];
      if (userMessage) next.push(userMessage);
      if (enrichedAi) next.push(enrichedAi);
      if (personIdRef.current) saveChatLocal(personIdRef.current, next);
      return next;
    });
    if (u) setUsage(u);

    if (aiError) {
      setError({ message: aiError, kind: aiKind, usage: u });
    } else if (ttsError && !speakInBrowser) {
      // Only surface TTS errors when there's no fallback. If speakInBrowser
      // is true the user will still hear the reply — no error needed.
      setError({ message: `Voice synthesis: ${ttsError}`, kind: "tts", usage: u });
    } else {
      setError(null);
    }
  }, []);

  const sendText = useCallback(
    async (text) => {
      if (!personId || !text?.trim()) return;
      setSending(true);
      setError(null);
      const optimistic = {
        role: "user",
        text,
        audioUrl: "",
        createdAt: new Date().toISOString(),
        _pending: true,
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        const data = await sendTextMessage(personId, text);
        handleResponse(data);
      } catch (e) {
        setError({ message: e.message, kind: e.kind, usage: e.usage });
        if (e.usage) setUsage(e.usage);
        setMessages((prev) =>
          prev.map((m) =>
            m === optimistic ? { ...m, _pending: false, _failed: true } : m
          )
        );
      } finally {
        setSending(false);
      }
    },
    [personId, handleResponse]
  );

  const sendAudio = useCallback(
    async (audioBlob) => {
      if (!personId || !audioBlob) return;
      setSending(true);
      setError(null);
      const optimistic = {
        role: "user",
        text: "🎙️ Voice message…",
        audioUrl: "",
        createdAt: new Date().toISOString(),
        _pending: true,
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        const data = await sendAudioMessage(personId, audioBlob);
        handleResponse(data);
      } catch (e) {
        setError({ message: e.message, kind: e.kind, usage: e.usage });
        if (e.usage) setUsage(e.usage);
        setMessages((prev) => prev.filter((m) => m !== optimistic));
      } finally {
        setSending(false);
      }
    },
    [personId, handleResponse]
  );

  return {
    messages,
    loading,
    sending,
    error,
    usage,
    setUsage,
    sendText,
    sendAudio,
    clearError: () => setError(null),
  };
}
export default useChat;
