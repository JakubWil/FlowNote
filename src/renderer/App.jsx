import { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";

// ─── Waveform Bar ─────────────────────────────────────────────────────────────
function WaveBar({ delay, isActive }) {
  return (
    <div
      style={{
        width: 3,
        borderRadius: 2,
        background: isActive ? "#60efb8" : "#2a2a3a",
        animationName: isActive ? "wave" : "none",
        animationDuration: "0.8s",
        animationTimingFunction: "ease-in-out",
        animationIterationCount: "infinite",
        animationDelay: delay,
        height: 28,
        transition: "background 0.3s ease",
      }}
    />
  );
}

// ─── Overlay Component ────────────────────────────────────────────────────────
function Overlay({ state, onStateChange }) {
  const bars = Array.from({ length: 28 });

  const stateConfig = {
    idle: { label: "⌘ Shift Space to record", sublabel: null, showWave: false },
    recording: { label: "Recording…", sublabel: "Press again to stop", showWave: true },
    processing: { label: "Thinking…", sublabel: "Structuring your note", showWave: false },
    done: { label: "Note saved ✓", sublabel: null, showWave: false },
  };

  const cfg = stateConfig[state];

  return (
    <div
      style={{
        width: 380,
        background: "rgba(12, 12, 18, 0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(96,239,184,0.08)",
        padding: "18px 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        fontFamily: "'DM Mono', 'SF Mono', monospace",
      }}
    >
      {/* Mic icon / pulse */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: state === "recording"
              ? "rgba(96,239,184,0.15)"
              : state === "processing"
              ? "rgba(96,180,239,0.12)"
              : "rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            transition: "background 0.3s ease",
            animationName: state === "recording" ? "pulse" : "none",
            animationDuration: "1.8s",
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
          }}
        >
          {state === "processing" ? "✦" : state === "done" ? "✓" : "🎙"}
        </div>
      </div>

      {/* Center content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: state === "recording" ? "#60efb8"
              : state === "done" ? "#60efb8"
              : state === "processing" ? "#60b4ef"
              : "rgba(255,255,255,0.5)",
            letterSpacing: "0.02em",
            transition: "color 0.3s ease",
            marginBottom: cfg.sublabel ? 2 : 0,
          }}
        >
          {cfg.label}
        </div>
        {cfg.sublabel && (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.01em" }}>
            {cfg.sublabel}
          </div>
        )}

        {/* Processing spinner bar */}
        {state === "processing" && (
          <div style={{ marginTop: 6, height: 2, borderRadius: 1, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: "40%",
                background: "linear-gradient(90deg, transparent, #60b4ef, transparent)",
                animationName: "shimmer",
                animationDuration: "1.2s",
                animationTimingFunction: "ease-in-out",
                animationIterationCount: "infinite",
              }}
            />
          </div>
        )}
      </div>

      {/* Waveform */}
      <div style={{ display: "flex", alignItems: "center", gap: 2.5, height: 36, flexShrink: 0 }}>
        {bars.map((_, i) => (
          <WaveBar
            key={i}
            delay={`${(i * 0.04).toFixed(2)}s`}
            isActive={state === "recording"}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────
function ResultCard({ visible }) {
  const note = `## Projekt FlowNote

Używa Next.js na frontendzie, baza to Postgres przez Supabase.
Autoryzacja przez Clerk — nie pisać własnego auth.

### Action Items
- [ ] Zapytać Marka o zmienne środowiskowe na produkcji
- [ ] Skonfigurować CI/CD na GitHub Actions
- [ ] Dodać testy do modułu ai.js`;

  return (
    <div
      style={{
        width: 480,
        background: "rgba(12, 12, 18, 0.96)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
        padding: "24px 28px",
        fontFamily: "'DM Mono', 'SF Mono', monospace",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.97)",
        transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#60efb8" }} />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Note ready
          </span>
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>just now</span>
      </div>

      {/* Note content */}
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.7,
          color: "rgba(255,255,255,0.75)",
          whiteSpace: "pre-wrap",
          borderRadius: 10,
          background: "rgba(255,255,255,0.03)",
          padding: "14px 16px",
          marginBottom: 16,
          maxHeight: 200,
          overflowY: "auto",
        }}
      >
        {note}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          style={{
            flex: 1,
            padding: "9px 0",
            borderRadius: 10,
            border: "1px solid rgba(96,239,184,0.25)",
            background: "rgba(96,239,184,0.08)",
            color: "#60efb8",
            fontSize: 12,
            fontFamily: "inherit",
            cursor: "pointer",
            letterSpacing: "0.03em",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => e.target.style.background = "rgba(96,239,184,0.15)"}
          onMouseLeave={e => e.target.style.background = "rgba(96,239,184,0.08)"}
        >
          Save note
        </button>
        <button
          style={{
            flex: 1,
            padding: "9px 0",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.5)",
            fontSize: 12,
            fontFamily: "inherit",
            cursor: "pointer",
            letterSpacing: "0.03em",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.08)"}
          onMouseLeave={e => e.target.style.background = "rgba(255,255,255,0.04)"}
        >
          Copy & dismiss
        </button>
      </div>
    </div>
  );
}

// ─── Demo App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [state, setState] = useState("idle");
  const [showResult, setShowResult] = useState(false);
  const timerRef = useRef(null);

  const handleClick = () => {
    if (state === "idle") {
      setState("recording");
    } else if (state === "recording") {
      setState("processing");
      setShowResult(false);
      timerRef.current = setTimeout(() => {
        setState("done");
        setShowResult(true);
      }, 2000);
    } else if (state === "done") {
      setState("idle");
      setShowResult(false);
    }
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
        @keyframes wave {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(96,239,184,0.3); }
          50% { box-shadow: 0 0 0 10px rgba(96,239,184,0); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-200%); }
          100% { transform: translateX(400%); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #07070f; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 80%, rgba(96,239,184,0.04) 0%, transparent 60%), #07070f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 40,
      }}>

        {/* Label */}
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          color: "rgba(255,255,255,0.2)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}>
          FlowNote — UI Preview
        </div>

        {/* Result card — appears above overlay */}
        <ResultCard visible={showResult} />

        {/* Overlay */}
        <div onClick={handleClick} style={{ cursor: "pointer" }}>
          <Overlay state={state} />
        </div>

        {/* State buttons */}
        <div style={{
          display: "flex",
          gap: 8,
          marginTop: 24,
          fontFamily: "'DM Mono', monospace",
        }}>
          {["idle", "recording", "processing", "done"].map(s => (
            <button
              key={s}
              onClick={() => { setState(s); if (s !== "done") setShowResult(false); else setShowResult(true); }}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: `1px solid ${state === s ? "rgba(96,239,184,0.4)" : "rgba(255,255,255,0.08)"}`,
                background: state === s ? "rgba(96,239,184,0.08)" : "transparent",
                color: state === s ? "#60efb8" : "rgba(255,255,255,0.3)",
                fontSize: 11,
                fontFamily: "inherit",
                cursor: "pointer",
                letterSpacing: "0.04em",
                transition: "all 0.2s",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          color: "rgba(255,255,255,0.15)",
          marginTop: 4,
        }}>
          click overlay or buttons to preview states
        </div>
      </div>
    </>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);
