"use client";

export default function PersonSelector({
  persons,
  selectedId,
  onSelect,
  onCreate,
}) {
  return (
   <div className="flex items-center gap-2">
  <select
    className="max-w-xs rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 shadow-sm outline-none focus:ring-2 focus:ring-zinc-500 cursor-pointer"
    value={selectedId || ""}
    onChange={(e) => onSelect(e.target.value)}
  >
    <option value="" disabled className="bg-zinc-900 text-zinc-400">
      Select a person…
    </option>
    {persons.map((p) => (
      <option key={p._id} value={p._id} className="bg-zinc-900 text-zinc-100">
        {p.name} · {p.voiceId ? "voice ready" : "text only"}
      </option>
    ))}
  </select>
  <button
    onClick={onCreate}
    className="text-sm whitespace-nowrap text-zinc-400 hover:text-zinc-100 transition-colors px-2 py-1 rounded hover:bg-zinc-800"
  >
    + New person
  </button>
</div>
  );
}
