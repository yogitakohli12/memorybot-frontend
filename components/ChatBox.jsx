"use client";

import { useState, useEffect, useRef } from "react";
import Message from "./Message";
import VoiceRecorder from "./VoiceRecorder";
import TypingIndicator from "./TypingIndicator";

export default function ChatBox({
  person,
  messages,
  loading,
  sending,
  onSendText,
  onSendAudio,
}) {
  const [text, setText] = useState("");
  const scrollRef = useRef(null);
  const initializedRef = useRef(false);
  const lastAiAudioIdRef = useRef(null);
  const [autoPlayId, setAutoPlayId] = useState(null);

  // Find the latest AI message that should be auto-played:
  // (a) has a server-generated audioUrl
  // (b) is flagged for browser TTS (person uses browser voice OR server TTS
  //     failed and the message was tagged _useBrowserTts as fallback)
  const usesBrowserTtsByPerson = person?.voiceProvider === "browser";
  let lastAiAudioIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "ai") continue;
    if (m.audioUrl || m._useBrowserTts || usesBrowserTtsByPerson) {
      lastAiAudioIdx = i;
      break;
    }
  }
  const lastAudioMsg = lastAiAudioIdx >= 0 ? messages[lastAiAudioIdx] : null;
  const lastAudioId = lastAudioMsg
    ? lastAudioMsg._id ||
      (lastAudioMsg.audioUrl || "browser") + lastAudioMsg.createdAt
    : null;

  // On first render after a person change, baseline the ref so we don't
  // auto-play historical messages. Only NEW arrivals afterward should play.
  useEffect(() => {
    initializedRef.current = false;
    lastAiAudioIdRef.current = null;
    setAutoPlayId(null);
  }, [person?._id]);

  useEffect(() => {
    if (!initializedRef.current) {
      lastAiAudioIdRef.current = lastAudioId;
      initializedRef.current = true;
      return;
    }
    if (lastAudioId && lastAudioId !== lastAiAudioIdRef.current) {
      lastAiAudioIdRef.current = lastAudioId;
      setAutoPlayId(lastAudioId);
    }
  }, [lastAudioId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const submit = (e) => {
    e?.preventDefault?.();
    if (!text.trim() || sending) return;
    onSendText(text.trim());
    setText("");
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {!person ? (
          <div className="h-full flex items-center justify-center text-white/50">
            Select or create a person to start chatting.
          </div>
        ) : loading && messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-white/50">
            Loading conversation…
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/50">
            <div className="text-5xl mb-3">💬</div>
            <p>Say hello to {person.name}</p>
            {!person.voiceProvider && (
              <p className="text-xs mt-2 text-yellow-200/80 max-w-sm text-center">
                Replies will be text-only. Edit this person to assign a voice.
              </p>
            )}
          </div>
        ) : (
          <>
            {!person.voiceProvider && (
              <div className="mb-3 text-xs text-yellow-200 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
                <strong>{person.name}</strong> has no voice configured. Replies
                will be text-only. Edit this person to enable voice.
              </div>
            )}
            {messages.map((m, i) => {
              const id =
                m._id || (m.audioUrl || "browser") + m.createdAt;
              const shouldAutoPlay =
                m.role === "ai" &&
                (!!m.audioUrl ||
                  m._useBrowserTts ||
                  usesBrowserTtsByPerson) &&
                id === autoPlayId;
              return (
                <Message
                  key={m._id || i}
                  message={m}
                  person={person}
                  personName={person.name}
                  autoPlay={shouldAutoPlay}
                />
              );
            })}
            {sending && <TypingIndicator name={person.name} />}
          </>
        )}
      </div>

      <form
        onSubmit={submit}
        className="border-t border-white/10 px-3 py-3 flex items-end gap-2"
      >
        <textarea
          className="input min-h-[44px] max-h-[160px] resize-none flex-1"
          placeholder={
            person ? `Message ${person.name}…` : "Select a person first"
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          disabled={!person || sending}
          rows={1}
        />
        <VoiceRecorder
          onText={(t) => onSendText(t)}
          onAudio={(blob) => onSendAudio(blob)}
          disabled={!person || sending}
        />
        <button
          type="submit"
          className="btn-primary h-11"
          disabled={!person || sending || !text.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
