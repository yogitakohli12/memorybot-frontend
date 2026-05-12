"use client";

export default function UsageBadge({ usage, plan, providers }) {
  if (!usage) return null;
  const { used, limit, remaining, resetsAt } = usage;
  const pct = Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  const danger = pct >= 90;
  const warn = pct >= 70 && !danger;

  const resetTxt = resetsAt
    ? new Date(resetsAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "midnight UTC";

  const colors = danger
    ? "bg-red-500/15 text-red-200 border-red-500/40"
    : warn
    ? "bg-yellow-500/15 text-yellow-200 border-yellow-500/40"
    : "bg-brand-500/15 text-brand-100 border-brand-500/30";

  const configured = providers?.configured || [];
  const activeName =
    configured[0] && providers?.details?.[configured[0]]?.name;

  const tooltipParts = [];
  tooltipParts.push(`This app: ${used}/${limit} messages today.`);
  tooltipParts.push(`Resets at ${resetTxt}.`);
  if (configured.length === 0) {
    tooltipParts.push("⚠️ No AI provider configured. Set OPENAI_API_KEY or GROQ_API_KEY in backend/.env.");
  } else {
    tooltipParts.push(`Active providers (failover order): ${configured.join(" → ")}.`);
    configured.forEach((p) => {
      const d = providers.details[p];
      tooltipParts.push(`${d.name}: ~${d.rpm}/min, ~${d.rpd}/day. ${d.freeNote}`);
    });
  }
  if (plan?.current?.note) tooltipParts.push(plan.current.note);

  return (
    <div
      className={`text-xs px-3 py-1.5 rounded-full border ${colors} flex items-center gap-2 cursor-help`}
      title={tooltipParts.join("\n")}
    >
      <span className="font-medium">
        {used}/{limit} today
      </span>
      <span className="opacity-60">·</span>
      <span className="opacity-80">{remaining} left</span>
      {activeName && (
        <>
          <span className="opacity-60 hidden sm:inline">·</span>
          <span className="opacity-70 hidden sm:inline">via {activeName}</span>
        </>
      )}
      <span className="opacity-60 hidden md:inline">· resets {resetTxt}</span>
    </div>
  );
}
