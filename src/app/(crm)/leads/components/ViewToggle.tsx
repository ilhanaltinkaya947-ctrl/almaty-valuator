"use client";

export default function ViewToggle({
  view,
  onChange,
}: {
  view: "list" | "kanban";
  onChange: (v: "list" | "kanban") => void;
}) {
  const btn = (mode: "list" | "kanban", icon: string) => ({
    padding: "8px 14px",
    borderRadius: 16,
    border: `1px solid ${view === mode ? "#C8A44E" : "#1E2A3A"}`,
    background: view === mode ? "#C8A44E20" : "transparent",
    color: view === mode ? "#C8A44E" : "#8B95A8",
    fontSize: 14,
    fontWeight: 600 as const,
    cursor: "pointer" as const,
    display: "flex" as const,
    alignItems: "center" as const,
    gap: 4,
    transition: "transform 75ms, opacity 75ms" as const,
    WebkitTapHighlightColor: "transparent" as const,
  });

  return (
    <div style={{ display: "flex", gap: 4 }}>
      <button style={btn("list", "\u2261")} onClick={() => onChange("list")}>
        {"\u2261"}
      </button>
      <button style={btn("kanban", "\u25A5")} onClick={() => onChange("kanban")}>
        {"\u25A5"}
      </button>
    </div>
  );
}
