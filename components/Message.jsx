"use client";

import AudioPlayer from "./AudioPlayer";
import BrowserVoicePlayer from "./BrowserVoicePlayer";

export default function Message({
  message,
  personName,
  person,
  autoPlay = false,
}) {
  const isUser = message.role === "user";
  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  // Pick the playback path for AI replies:
  //   - if message has a server-generated audioUrl  → AudioPlayer
  //   - else if person is set to use browser TTS    → BrowserVoicePlayer
  //   - else nothing (text-only person)
  const useBrowserTts =
    !isUser &&
    !message.audioUrl &&
    (person?.voiceProvider === "browser" || message._useBrowserTts);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col`}
      >
        <div className="text-xs text-white/50 mb-1 px-1">
          {isUser ? "You" : personName || "AI"} {time && `· ${time}`}
        </div>
        <div
          className={`px-4 py-2.5 rounded-2xl ${
            isUser
              ? message._failed
                ? "bg-red-500/30 text-white rounded-tr-sm border border-red-500/50"
                : "bg-brand-600 text-white rounded-tr-sm"
              : "bg-white/10 text-white rounded-tl-sm"
          } ${message._pending ? "opacity-70" : ""}`}
        >
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
          {message.audioUrl && (
            <AudioPlayer src={message.audioUrl} autoPlay={autoPlay} />
          )}
          {useBrowserTts && (
            <BrowserVoicePlayer
              text={message.text}
              voiceName={person?.voiceId || ""}
              autoPlay={autoPlay}
              id={message._id || message.createdAt}
            />
          )}
        </div>
      </div>
    </div>
  );
}
