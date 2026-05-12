"use client";

import { useRef, useState, useEffect } from "react";
import { apiBaseUrl } from "../services/api"

export default function AudioPlayer({ src, autoPlay = false }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);

  const fullSrc = src?.startsWith("http") ? src : `${apiBaseUrl}${src}`;

  useEffect(() => {
    if (autoPlay && ref.current) {
      ref.current.play().catch(() => {});
    }
  }, [autoPlay, src]);

  const toggle = () => {
    if (!ref.current) return;
    if (playing) {
      ref.current.pause();
    } else {
      ref.current.play().catch(() => {});
    }
  };

  if (!src) return null;

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        onClick={toggle}
        className="w-8 h-8 rounded-full bg-brand-600 hover:bg-brand-700 flex items-center justify-center text-white"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? (
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
      <audio
        ref={ref}
        src={fullSrc}
        controls
        className="h-8"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
    </div>
  );
}
