import { useEffect, useRef, useState } from "react";
import type { ForgePlan, IngestItem } from "../lib/types";
import { MindMapRenderer } from "../canvas/MindMapCanvas";
import { downloadZip } from "../lib/zip";

/** ---------- Delivery deck: mind map, audit, blueprint, sandbox, ZIP ---------- */

interface Props {
  plan: ForgePlan;
  auditScore: number;
  auditPassed: number;
  auditTotal: number;
  /** Attachments + connected repos carried from the inquest into the dossier. */
  ingest: IngestItem[];
  onNewForge: () => void;
}

type Tab = "map" | "audit" | "code" | "sandbox" | "dossier";

const TABS: { id: Tab; label: string }[] = [
  { id: "map", label: "MIND MAP" },
  { id: "audit", label: "22-PT AUDIT" },
  { id: "code", label: "BLUEPRINT" },
  { id: "sandbox", label: "SANDBOX" },
  { id: "dossier", label: "DELIVERY" },
];

const KIND_LEGEND: [string, string][] = [
  ["core", "#f2c14e"],
  ["system", "#35e0ff"],
  ["contract", "#8be9c3"],
  ["ops", "#7d95b2"],
];

export default function Deliverables({ plan, auditScore, auditPassed, auditTotal, ingest, onNewForge }: Props) {
  const fileCount = ingest.filter((i) => i.kind !== "repo").length;
  const repoCount = ingest.length - fileCount;
  const [tab, setTab] = useState<Tab>("map");
  const [activeFile, setActiveFile] = useState(0);
  const [tooltip, setTooltip] = useState<{ label: string; detail: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<MindMapRenderer | null>(null);

  useEffect(() => {
    if (tab !== "map" || !canvasRef.current) return;
    const renderer = new MindMapRenderer(canvasRef.current);
    renderer.setData(plan.mindMap);
    renderer.start();
    rendererRef.current = renderer;
    const poll = setInterval(() => setTooltip(renderer.getTooltip()), 120);
    return () => {
      clearInterval(poll);
      renderer.stop();
      rendererRef.current = null;
    };
  }, [tab, plan]);

  const file = plan.files[Math.min(activeFile, plan.files.length - 1)];

  const sandboxDoc = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{background:#070d18;color:#eaf6ff;font-family:monospace;padding:20px;line-height:1.6}
    h1{color:#35e0ff;font-size:16px;letter-spacing:.2em;margin:0 0 4px}
    .k{color:#f2c14e}.chip{display:inline-block;border:1px solid #16283f;border-radius:6px;padding:2px 8px;margin:2px;font-size:11px;color:#7d95b2}
  </style></head><body>
    <h1>${plan.appName}</h1>
    <div><span class="k">archetype:</span> ${plan.archetype} · <span class="k">stack:</span> ${plan.stack.join(" / ")}</div>
    <p>${plan.summary}</p>
    <div><span class="k">systems:</span> ${plan.mindMap.nodes.filter((n) => n.kind === "system").map((n) => n.label).join(", ")}</div>
    <div style="margin-top:6px"><span class="k">contracts:</span> ${plan.mindMap.nodes.filter((n) => n.kind === "contract").map((n) => `<span class="chip">${n.label}</span>`).join("")}</div>
    <p style="color:#7d95b2">jailed preview — sandbox attribute blocks scripts and host access</p>
  </body></html>`;

  return (
    <div className="relative mx-auto max-w-5xl px-4 pb-24 pt-24">
      {/* Summary plate */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono-hud text-[9px] tracking-[0.3em] text-forge-cyan/80">
            DELIVERY DECK // FORGE COMPLETE
          </div>
          <h2 className="mt-1 font-display text-2xl font-semibold text-pearl text-glow-cyan">{plan.appName}</h2>
          <p className="mt-1 max-w-xl text-[12.5px] text-forge-dim">{plan.summary}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hud-panel px-4 py-3 text-center">
            <div className="font-mono-hud text-[8.5px] tracking-[0.2em] text-forge-dim">AUDIT</div>
            <div className="font-mono-hud text-xl font-bold text-forge-cyan">{auditScore}%</div>
          </div>
          <div className="hud-panel px-4 py-3 text-center">
            <div className="font-mono-hud text-[8.5px] tracking-[0.2em] text-forge-dim">FILES</div>
            <div className="font-mono-hud text-xl font-bold text-pearl">{plan.files.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg border px-3.5 py-2 font-mono-hud text-[10px] tracking-[0.14em] transition-all ${
              tab === t.id
                ? "border-forge-cyan/60 bg-forge-cyan/10 text-forge-cyan"
                : "border-seam text-forge-dim hover:border-forge-cyan/40 hover:text-pearl"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="hud-panel corner-tick relative min-h-[420px] p-4">
        {/* MIND MAP */}
        {tab === "map" && (
          <div className="relative">
            <canvas ref={canvasRef} className="h-[420px] w-full" />
            <div className="pointer-events-none absolute left-2 top-2 flex gap-2">
              {KIND_LEGEND.map(([kind, color]) => (
                <span key={kind} className="flex items-center gap-1.5 font-mono-hud text-[9px] tracking-[0.14em] text-forge-dim">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
                  {kind.toUpperCase()}
                </span>
              ))}
            </div>
            {tooltip && (
              <div className="pointer-events-none absolute bottom-2 left-1/2 w-[min(90%,460px)] -translate-x-1/2 rounded-lg border border-forge-cyan/40 bg-abyss/90 px-3.5 py-2 text-center backdrop-blur">
                <div className="font-mono-hud text-[11px] font-bold text-forge-cyan">{tooltip.label}</div>
                <div className="mt-0.5 text-[11px] leading-snug text-forge-dim">{tooltip.detail}</div>
              </div>
            )}
            <div className="pointer-events-none absolute right-2 top-2 font-mono-hud text-[9px] tracking-[0.14em] text-forge-dim">
              PHOTON TRANSIT LIVE · HOVER NODES
            </div>
          </div>
        )}

        {/* AUDIT */}
        {tab === "audit" && (
          <div>
            <div className="mb-4 flex items-center gap-4 rounded-lg border border-seam bg-depth/60 px-4 py-3">
              <div className="relative h-14 w-14 shrink-0">
                <svg viewBox="0 0 40 40" className="h-14 w-14 -rotate-90">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="#16283f" strokeWidth="4" />
                  <circle
                    cx="20" cy="20" r="16" fill="none" stroke="#35e0ff" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${(auditScore / 100) * 2 * Math.PI * 16} ${2 * Math.PI * 16}`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-mono-hud text-[10px] font-bold text-forge-cyan">
                  {auditScore}
                </span>
              </div>
              <div className="font-mono-hud text-[10px] leading-relaxed tracking-[0.1em] text-forge-dim">
                <span className="text-pearl">{auditPassed}/{auditTotal}</span> INVARIANTS PASSED ·{" "}
                <span className="text-forge-gold">{auditTotal - auditPassed}</span> ADVISORY NOTES ·
                VERDICT: <span className="text-forge-cyan">SEALED FOR DELIVERY</span>
              </div>
            </div>
            <ol className="grid gap-1.5 sm:grid-cols-2">
              {plan.audit.findings.map((f) => (
                <li key={f.id} className="flex items-start gap-2.5 rounded-lg border border-seam/50 bg-depth/40 px-3 py-2">
                  <span className={`mt-0.5 font-mono-hud text-[10px] ${f.status === "pass" ? "text-forge-cyan" : "text-forge-gold"}`}>
                    {f.status === "pass" ? "✔" : "◆"}
                  </span>
                  <div>
                    <div className="font-mono-hud text-[10.5px] font-bold tracking-[0.04em] text-pearl">
                      {String(f.id).padStart(2, "0")} · {f.title}
                      <span className="ml-2 font-normal text-forge-dim">w{f.weight}</span>
                    </div>
                    <div className="mt-0.5 text-[10.5px] leading-snug text-forge-dim">{f.detail}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* BLUEPRINT */}
        {tab === "code" && (
          <div>
            <div className="mb-2 flex gap-1.5">
              {plan.files.map((f, i) => (
                <button
                  key={f.path}
                  onClick={() => setActiveFile(i)}
                  className={`rounded-md border px-3 py-1.5 font-mono-hud text-[10px] transition-colors ${
                    i === activeFile
                      ? "border-forge-cyan/60 text-forge-cyan"
                      : "border-seam text-forge-dim hover:text-pearl"
                  }`}
                >
                  {f.path}
                </button>
              ))}
            </div>
            <pre className="max-h-[380px] overflow-auto rounded-lg border border-seam bg-abyss/70 p-4 font-mono-hud text-[11px] leading-relaxed text-pearl/90">
              {file?.contents}
            </pre>
          </div>
        )}

        {/* SANDBOX */}
        {tab === "sandbox" && (
          <div>
            <div className="mb-2 font-mono-hud text-[9px] tracking-[0.2em] text-forge-dim">
              JAILED PREVIEW — sandbox="" blocks scripts, forms, and host access
            </div>
            <iframe
              title="Blueprint sandbox preview"
              sandbox=""
              srcDoc={sandboxDoc}
              className="h-[380px] w-full rounded-lg border border-seam bg-depth"
            />
          </div>
        )}

        {/* DELIVERY */}
        {tab === "dossier" && (
          <div className="flex h-full flex-col items-center justify-center py-10 text-center">
            <div className="font-mono-hud text-[10px] tracking-[0.3em] text-forge-gold">✦ SEALED DELIVERY ✦</div>
            <h3 className="mt-3 font-display text-xl font-semibold text-pearl">
              {plan.appName} is ready to leave the forge
            </h3>
            <p className="mx-auto mt-2 max-w-md text-[12px] leading-relaxed text-forge-dim">
              Deterministic ZIP, audit dossier {auditPassed}/{auditTotal}, quorum journal, and blueprint
              files — assembled in memory, checksummed on seal.
            </p>

            {/* Ingested context — attachments + connected repos persisted from the inquest */}
            <div className="mx-auto mt-6 max-w-lg text-left">
              <div className="mb-2 flex items-center justify-between border-b border-seam pb-1.5">
                <span className="font-mono-hud text-[9px] tracking-[0.22em] text-forge-dim">
                  DOSSIER CONTEXT · INGESTED DURING THE INQUEST
                </span>
                {ingest.length > 0 && (
                  <span className="font-mono-hud text-[9px] tracking-[0.1em] text-forge-cyan">
                    {fileCount} FILE{fileCount === 1 ? "" : "S"}{repoCount > 0 ? ` · ${repoCount} REPO${repoCount === 1 ? "" : "S"}` : ""}
                  </span>
                )}
              </div>
              {ingest.length === 0 ? (
                <div className="py-3 text-center font-mono-hud text-[9.5px] tracking-[0.14em] text-forge-dim/60">
                  NO CONTEXT ATTACHED — THE QUORUM FORGED FROM THE CONVERSATION ALONE
                </div>
              ) : (
                <ul className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
                  {ingest.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-2.5 rounded-lg border border-seam/60 bg-depth/50 px-3 py-2"
                    >
                      <span className="mt-0.5 font-mono-hud text-[10px]">{kindIcon(item.kind)}</span>
                      <div className="min-w-0">
                        <div className="truncate font-mono-hud text-[10.5px] font-bold tracking-[0.04em] text-pearl">
                          {item.name}
                        </div>
                        <div className="text-[9.5px] leading-relaxed text-forge-dim">{item.meta}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <button onClick={() => downloadZip(plan.files, plan.appName)} className="btn-forge btn-gold px-7 py-3.5 text-[11px]">
                ⬇ DOWNLOAD ZIP
              </button>
              <button onClick={onNewForge} className="btn-forge btn-ghost px-6 py-3.5 text-[11px]">
                NEW FORGE →
              </button>
            </div>
            <div className="mt-6 grid w-full max-w-lg grid-cols-4 divide-x divide-seam rounded-lg border border-seam bg-depth/60">
              {[
                ["QUORUM", `${plan.experts.length}`],
                ["PHASES", `${plan.phases.length}`],
                ["CONTEXT", `${ingest.length}`],
                ["VERDICT", "SEALED"],
              ].map(([k, v]) => (
                <div key={k} className="px-3 py-3">
                  <div className="font-mono-hud text-[8.5px] tracking-[0.2em] text-forge-dim">{k}</div>
                  <div className="mt-1 font-mono-hud text-[12px] font-bold text-forge-cyan">{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function kindIcon(kind: IngestItem["kind"]): string {
  switch (kind) {
    case "repo":
      return "🔗";
    case "image":
      return "🖼";
    case "code":
      return "⌨";
    default:
      return "📄";
  }
}
