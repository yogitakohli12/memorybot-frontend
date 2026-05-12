export default function TypingIndicator({ name }) {
  return (
    <div className="flex justify-start mb-3">
      <div className="flex flex-col items-start max-w-[75%]">
        <div className="text-xs text-white/50 mb-1 px-1">
          {name || "AI"} is thinking…
        </div>
        <div className="px-4 py-3 rounded-2xl bg-white/10 rounded-tl-sm">
          <span className="typing-dot"></span>
          <span className="typing-dot"></span>
          <span className="typing-dot"></span>
        </div>
      </div>
    </div>
  );
}
