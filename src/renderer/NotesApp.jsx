import { useState } from "react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
// Na razie używamy fake danych — później zastąpimy prawdziwymi z SQLite
const MOCK_NOTES = [
  {
    id: "1",
    title: "Projekt FlowNote — setup",
    content: `## Projekt FlowNote\n\nUżywa Next.js na frontendzie, baza to Postgres przez Supabase. Autoryzacja przez Clerk — nie pisać własnego auth.\n\n### Action Items\n- [ ] Zapytać Marka o zmienne środowiskowe\n- [ ] Skonfigurować CI/CD\n- [x] Stworzyć repo na GitHub`,
    created_at: "2025-03-06T10:23:00Z",
    duration_seconds: 34,
    tags: ["projekt", "dev"],
  },
  {
    id: "2",
    title: "Meeting z klientem — wymagania",
    content: `## Meeting z klientem\n\nKlient chce dashboard z wykresami sprzedaży. Mobile first. Deadline koniec miesiąca.\n\n### Action Items\n- [ ] Przygotować mockupy do piątku\n- [ ] Wycenić backend`,
    created_at: "2025-03-05T14:10:00Z",
    duration_seconds: 52,
    tags: ["klient", "meeting"],
  },
  {
    id: "3",
    title: "Pomysły na monetyzację",
    content: `## Monetyzacja\n\nLifetime deal na AppSumo na start — szybki zastrzyk gotówki. Potem przejść na subskrypcję $7/mies.\n\nRozważyć też API access dla developerów jako osobny tier.`,
    created_at: "2025-03-04T09:05:00Z",
    duration_seconds: 28,
    tags: ["biznes"],
  },
  {
    id: "4",
    title: "Bug — autoryzacja JWT",
    content: `## Bug: JWT refresh token\n\nRefresh token wygasa za wcześnie po stronie klienta. Problem w middleware — nie odświeża jeśli delta < 5min.\n\n### Fix\nZmienić threshold na 10min w \`auth.middleware.ts\` linia 47.`,
    created_at: "2025-03-03T16:44:00Z",
    duration_seconds: 19,
    tags: ["bug", "dev"],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

function formatDuration(sec) {
  if (!sec) return null;
  return sec < 60 ? `${sec}s` : `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

// Render markdown-like content to simple HTML (bez zewnętrznej biblioteki)
function renderContent(content) {
  return content
    .split("\n")
    .map((line, i) => {
      if (line.startsWith("## ")) return <h2 key={i} style={{ fontSize: 15, fontWeight: 600, color: "#e8e8f0", margin: "16px 0 6px" }}>{line.slice(3)}</h2>;
      if (line.startsWith("### ")) return <h3 key={i} style={{ fontSize: 13, fontWeight: 600, color: "rgba(232,232,240,0.7)", margin: "12px 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{line.slice(4)}</h3>;
      if (line.startsWith("- [x] ")) return <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", margin: "3px 0" }}><span style={{ color: "#60efb8", flexShrink: 0, marginTop: 1 }}>✓</span><span style={{ fontSize: 13, color: "rgba(232,232,240,0.4)", textDecoration: "line-through" }}>{line.slice(6)}</span></div>;
      if (line.startsWith("- [ ] ")) return <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", margin: "3px 0" }}><span style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0, marginTop: 1 }}>○</span><span style={{ fontSize: 13, color: "rgba(232,232,240,0.75)" }}>{line.slice(6)}</span></div>;
      if (line.startsWith("- ")) return <div key={i} style={{ display: "flex", gap: 8, margin: "3px 0" }}><span style={{ color: "#60efb8", flexShrink: 0 }}>·</span><span style={{ fontSize: 13, color: "rgba(232,232,240,0.75)" }}>{line.slice(2)}</span></div>;
      if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;
      if (line.includes("`")) {
        const parts = line.split("`");
        return <p key={i} style={{ fontSize: 13, color: "rgba(232,232,240,0.75)", margin: "3px 0", lineHeight: 1.6 }}>
          {parts.map((p, j) => j % 2 === 1
            ? <code key={j} style={{ background: "rgba(96,239,184,0.1)", color: "#60efb8", padding: "1px 5px", borderRadius: 4, fontFamily: "monospace", fontSize: 12 }}>{p}</code>
            : p)}
        </p>;
      }
      return <p key={i} style={{ fontSize: 13, color: "rgba(232,232,240,0.75)", margin: "3px 0", lineHeight: 1.6 }}>{line}</p>;
    });
}

// ─── Tag Badge ────────────────────────────────────────────────────────────────
function Tag({ label }) {
  return (
    <span style={{
      fontSize: 10,
      padding: "2px 7px",
      borderRadius: 4,
      background: "rgba(96,239,184,0.08)",
      color: "rgba(96,239,184,0.6)",
      border: "1px solid rgba(96,239,184,0.12)",
      letterSpacing: "0.04em",
      fontFamily: "monospace",
    }}>
      {label}
    </span>
  );
}

// ─── Sidebar Note Row ─────────────────────────────────────────────────────────
function NoteRow({ note, isActive, onClick }) {
  const preview = note.content.replace(/#{1,3} /g, "").replace(/- \[.\] /g, "").slice(0, 80);

  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px 16px",
        cursor: "pointer",
        borderRadius: 10,
        background: isActive ? "rgba(96,239,184,0.07)" : "transparent",
        border: `1px solid ${isActive ? "rgba(96,239,184,0.15)" : "transparent"}`,
        transition: "all 0.15s ease",
        marginBottom: 2,
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: isActive ? "#e8e8f0" : "rgba(232,232,240,0.8)", flex: 1, marginRight: 8 }}>
          {note.title}
        </span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", flexShrink: 0, fontFamily: "monospace" }}>
          {formatDate(note.created_at)}
        </span>
      </div>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
        {preview}
      </p>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function NotesApp() {
  const [notes] = useState(MOCK_NOTES);
  const [activeId, setActiveId] = useState(MOCK_NOTES[0].id);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const activeNote = notes.find(n => n.id === activeId);
  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(activeNote.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #09090f; overflow: hidden; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:focus { outline: none; }
      `}</style>

      <div style={{
        display: "flex",
        height: "100vh",
        fontFamily: "'DM Sans', sans-serif",
        background: "#09090f",
        color: "#e8e8f0",
      }}>

        {/* ── Sidebar ── */}
        <div style={{
          width: 280,
          flexShrink: 0,
          borderRight: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          background: "rgba(255,255,255,0.015)",
        }}>

          {/* Sidebar header */}
          <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>🎙</span>
                <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.01em" }}>FlowNote</span>
              </div>
              <div style={{
                fontSize: 10,
                fontFamily: "monospace",
                padding: "3px 8px",
                borderRadius: 5,
                background: "rgba(96,239,184,0.08)",
                color: "rgba(96,239,184,0.6)",
                border: "1px solid rgba(96,239,184,0.1)",
              }}>
                ⌘⇧Space
              </div>
            </div>

            {/* Search */}
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "rgba(255,255,255,0.2)" }}>⌕</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search notes…"
                style={{
                  width: "100%",
                  padding: "8px 10px 8px 28px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#e8e8f0",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>

          {/* Notes count */}
          <div style={{ padding: "10px 16px 6px", fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "monospace" }}>
            {filtered.length} notes
          </div>

          {/* Notes list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px 16px" }}>
            {filtered.length === 0
              ? <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.2)" }}>No notes found</div>
              : filtered.map(note => (
                <NoteRow
                  key={note.id}
                  note={note}
                  isActive={note.id === activeId}
                  onClick={() => setActiveId(note.id)}
                />
              ))
            }
          </div>
        </div>

        {/* ── Main content ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Toolbar */}
          <div style={{
            padding: "14px 28px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div>
              <h1 style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 3 }}>
                {activeNote.title}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
                  {formatDate(activeNote.created_at)}
                </span>
                {activeNote.duration_seconds && (
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
                    🎙 {formatDuration(activeNote.duration_seconds)}
                  </span>
                )}
                <div style={{ display: "flex", gap: 4 }}>
                  {activeNote.tags.map(t => <Tag key={t} label={t} />)}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleCopy}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: copied ? "rgba(96,239,184,0.1)" : "rgba(255,255,255,0.04)",
                  color: copied ? "#60efb8" : "rgba(255,255,255,0.5)",
                  fontSize: 12,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  letterSpacing: "0.02em",
                }}
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
              <button
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,50,50,0.15)",
                  background: "rgba(255,50,50,0.05)",
                  color: "rgba(255,100,100,0.5)",
                  fontSize: 12,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,50,50,0.1)"; e.currentTarget.style.color = "rgba(255,100,100,0.8)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,50,50,0.05)"; e.currentTarget.style.color = "rgba(255,100,100,0.5)"; }}
              >
                Delete
              </button>
            </div>
          </div>

          {/* Note content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "28px 40px" }}>
            <div style={{ maxWidth: 680 }}>
              {renderContent(activeNote.content)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
