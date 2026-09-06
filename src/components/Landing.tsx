import { useState } from "react";
import type { SessionApi } from "../lib/session";
import type { ScarcityTelemetry } from "../lib/types";
import OrbOfTheOrator from "./OrbOfTheOrator";
import { SKILL_CODEX } from "../lib/skills";
import { MCP_BENCH } from "../lib/mcp";

/** ---------- Landing: the Orator convenes the 15-Question Inquest ---------- */

interface Props {
  session: SessionApi;
  telemetry: ScarcityTelemetry;
  onBegin: () => void;
  onBook: () => void;
  onCharter: () => void;
}

const APPRAISALS = [
  "The plasma remembers every blueprint it has forged.",
  "Strike once for passage — the quorum is listening.",
  "Sixteen minds orbit a single sphere of intent.",
  "What you whisper to the orb, the forge builds.",
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "The Conversation",
    body: "No forms, no rigid wizards. The Orator asks fifteen questions in sequence — speak, type, tap a chip, attach documents, or connect a repo for read-only context.",
  },
  {
    step: "02",
    title: "The Forge",
    body: "A 16-expert quorum shapes your blueprint phase by phase. You direct: approve, redirect, or let auto-run take the watch.",
  },
  {
    step: "03",
    title: "The Gate Opens",
    body: "Before a single line renders, the output runs the 22-point invariant audit and the backend skill codex. Code ships only past the gate.",
  },
  {
    step: "04",
    title: "Sealed & Delivered",
    body: "The audited dossier — blueprint, mind map, code — seals into a deterministic ZIP. Nothing touched your disk until you say so.",
  },
];

const PIPELINE = [
  "16-EXPERT MoE QUORUM",
  "BACKEND SKILL CODEX",
  "MCP TOOL BENCH",
  "22-POINT INVARIANT AUDIT",
  "THE GATE",
  "ZIP SEAL → RENDER",
];

const INVARIANT_PILLARS = [
  { t: "Contract immutability", d: "Entities frozen unless explicitly versioned." },
  { t: "Secret hygiene", d: "No credentials in the bundle; env indirection enforced." },
  { t: "Zero-disk runtime", d: "All artifacts in memory until you seal them." },
  { t: "Sandbox isolation", d: "Generated code runs jailed, with no host access." },
  { t: "Deterministic replay", d: "Same inquest, same plan hash, every time." },
  { t: "Sealed delivery", d: "ZIP checksums reproducible and verified." },
];

export default function Landing({ session, telemetry, onBegin, onBook, onCharter }: Props) {
  const remaining = session.remainingFree;
  const chartered = session.isChartered;
  const [appraisal, setAppraisal] = useState(0);

  return (
    <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-24">
      {/* ============ HERO — THE 15-QUESTION INQUEST WITH THE ORATOR ============ */}
      <section className="relative text-center">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-seam bg-hull/60 px-4 py-1.5 font-mono-hud text-[10px] tracking-[0.22em] text-forge-dim backdrop-blur-sm">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                telemetry.slotsRemaining > 1 ? "bg-forge-cyan" : "bg-forge-alert"
              } animate-pulse-soft`}
            />
            ORATOR.AI · CONVERSATIONAL SOFTWARE FORGING
          </div>
        </div>

        <OrbOfTheOrator
          className="mx-auto mt-12 w-[min(74vw,430px)]"
          caption="LISTENING…"
          sub="STRIKE THE ORB — THE CONVERSATION BEGINS"
          energy={0}
          onStrike={() => setAppraisal((a) => (a + 1) % APPRAISALS.length)}
        />

        <div className="mx-auto mt-10 max-w-3xl">
          <div className="font-mono-hud text-[10px] tracking-[0.34em] text-forge-cyan/90">
            THE PRIMARY EVENT
          </div>
          <h1 className="mt-3 text-4xl font-bold leading-[1.06] tracking-tight text-pearl sm:text-6xl">
            The 15-Question Inquest
            <br />
            <span className="text-glow-cyan text-forge-cyan">with the Orator</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-forge-dim">
            A conversation, not a form. The Orator conducts fifteen questions — you speak, type,
            attach, or connect a repo. Then a quorum of sixteen experts forges your blueprint.
            It renders only after the{" "}
            <span className="text-pearl">22-point invariant audit</span> opens the gate.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button onClick={onBegin} className="btn-forge btn-primary px-9 py-4 text-xs">
              BEGIN THE INQUEST →
            </button>
            <button onClick={onBook} className="btn-forge btn-ghost px-6 py-4 text-xs">
              BOOK A SLOT
            </button>
            {!chartered && (
              <button onClick={onCharter} className="btn-forge btn-gold px-6 py-4 text-xs">
                CHARTER $99
              </button>
            )}
          </div>

          <div className="mt-5 font-mono-hud text-[10px] tracking-[0.16em] text-forge-dim">
            {chartered ? (
              <span className="text-forge-gold">✦ CHARTERED — UNLIMITED INQUESTS ACTIVE</span>
            ) : (
              <>{remaining} PRACTICE INQUEST{remaining === 1 ? "" : "S"} REMAINING</>
            )}
          </div>
        </div>

        <div key={appraisal} className="mt-8 font-mono-hud text-[10px] tracking-[0.3em] text-forge-dim/70 animate-drift-up">
          {APPRAISALS[appraisal]}
        </div>
      </section>

      {/* ============ THE JOURNEY ============ */}
      <section className="mt-24">
        <div className="mb-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-seam to-seam" />
          <h2 className="font-mono-hud text-[11px] font-bold tracking-[0.3em] text-forge-dim">
            THE JOURNEY
          </h2>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-seam to-seam" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((h) => (
            <article key={h.step} className="hud-panel hud-panel-hover corner-tick relative p-5">
              <div className="font-mono-hud text-[10px] font-bold tracking-[0.24em] text-forge-gold/90">
                {h.step}
              </div>
              <h3 className="mt-2 font-display text-[15px] font-semibold text-pearl">{h.title}</h3>
              <p className="mt-2 text-[12px] leading-relaxed text-forge-dim">{h.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ============ THE QUALITY GATE (the elite automated pipeline) ============ */}
      <section className="mt-24">
        <div className="mb-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-seam to-seam" />
          <h2 className="font-mono-hud text-[11px] font-bold tracking-[0.3em] text-forge-dim">
            THE QUALITY GATE
          </h2>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-seam to-seam" />
        </div>

        <div className="hud-panel corner-tick relative overflow-hidden p-6 sm:p-8">
          {/* Pipeline */}
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3">
            {PIPELINE.map((p, i) => (
              <div key={p} className="flex items-center gap-2">
                <span
                  className={`rounded-full border px-3.5 py-1.5 font-mono-hud text-[9px] tracking-[0.14em] ${
                    p === "THE GATE"
                      ? "border-forge-gold/70 bg-forge-gold/10 text-forge-gold text-glow-gold"
                      : i >= 3
                      ? "border-forge-cyan/40 bg-forge-cyan/5 text-forge-cyan"
                      : "border-seam bg-depth/60 text-forge-dim"
                  }`}
                >
                  {p}
                </span>
                {i < PIPELINE.length - 1 && <span className="font-mono-hud text-[10px] text-seam">→</span>}
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <h3 className="font-display text-2xl font-bold tracking-tight text-pearl">
              Code renders only after the <span className="text-glow-gold text-forge-gold">gate opens</span>.
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-[13px] leading-relaxed text-forge-dim">
              Every blueprint the forge produces is run through the automated 22-point invariant
              audit and cross-checked against the backend skill codex — the elite quality pipeline
              — before a single file is packaged. Failures hold the gate; nothing half-built ever
              reaches your hands.
            </p>
          </div>

          {/* Invariant pillars */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INVARIANT_PILLARS.map((x) => (
              <div key={x.t} className="rounded-lg border border-seam/70 bg-depth/50 px-4 py-3">
                <div className="font-mono-hud text-[10.5px] font-bold tracking-[0.08em] text-forge-cyan">
                  ✔ {x.t.toUpperCase()}
                </div>
                <div className="mt-1 text-[11px] leading-relaxed text-forge-dim">{x.d}</div>
              </div>
            ))}
          </div>

          {/* Codex + bench stats */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-seam px-3.5 py-1.5 font-mono-hud text-[9px] tracking-[0.14em] text-forge-dim">
              BACKEND SKILL CODEX · {SKILL_CODEX.length} PLAYBOOKS
            </span>
            <span className="rounded-full border border-seam px-3.5 py-1.5 font-mono-hud text-[9px] tracking-[0.14em] text-forge-dim">
              MCP TOOL BENCH · {MCP_BENCH.length} SERVERS
            </span>
            <span className="rounded-full border border-forge-gold/40 px-3.5 py-1.5 font-mono-hud text-[9px] tracking-[0.14em] text-forge-gold">
              22-POINT INVARIANT AUDIT — FINAL GATE
            </span>
          </div>
        </div>
      </section>

      {/* ============ SESSION PLATE ============ */}
      <section className="hud-panel corner-tick relative mx-auto mt-20 max-w-3xl p-7 text-center">
        <div className="font-mono-hud text-[10px] tracking-[0.26em] text-forge-dim">CLIENT ID</div>
        <div className="mt-2 font-mono-hud text-sm tracking-[0.2em] text-forge-cyan">{session.session.clientId}</div>
        <div className="mx-auto mt-4 grid max-w-md grid-cols-3 divide-x divide-seam rounded-lg border border-seam bg-depth/70">
          {[
            ["INQUESTS USED", String(session.session.sessionsUsed)],
            ["FREE REMAINING", String(remaining)],
            ["STATUS", chartered ? "CHARTERED" : "PRACTICE"],
          ].map(([k, v]) => (
            <div key={k} className="px-3 py-3">
              <div className="font-mono-hud text-[8.5px] tracking-[0.2em] text-forge-dim">{k}</div>
              <div className={`mt-1 font-mono-hud text-[12px] font-bold ${chartered ? "text-forge-gold" : "text-pearl"}`}>{v}</div>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-5 max-w-md text-[12px] leading-relaxed text-forge-dim">
          Your identity is a random client ID stored only on this device. No accounts, no tracking,
          no keys in the browser — conversation and audit evidence are sealed locally, never uploaded.
        </p>
      </section>
    </div>
  );
}
