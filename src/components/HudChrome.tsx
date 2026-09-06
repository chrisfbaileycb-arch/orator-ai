import type { ScarcityAlert } from "../lib/telemetry";
import type { ScarcityTelemetry } from "../lib/types";
import VoiceConduit from "./VoiceConduit";

interface Props {
  telemetry: ScarcityTelemetry;
  alerts: ScarcityAlert[];
  remainingFree: number;
  isChartered: boolean;
  onBook: () => void;
  onBench: () => void;
}

/** Persistent top HUD bar with live forge telemetry, plus scarcity toast stack. */
export default function HudChrome({ telemetry, alerts, remainingFree, isChartered, onBook, onBench }: Props) {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-seam/80 bg-abyss/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <svg width="26" height="26" viewBox="0 0 32 32" className="shrink-0">
              <circle cx="16" cy="16" r="13" fill="none" stroke="#35e0ff" strokeWidth="1.6" opacity="0.85" />
              <circle cx="16" cy="16" r="5" fill="#f2c14e" />
            </svg>
            <div className="leading-tight">
              <div className="font-mono-hud text-[13px] font-bold tracking-[0.18em] text-pearl">
                ORATOR<span className="text-forge-cyan">.AI</span>
              </div>
              <div className="hidden font-mono-hud text-[9px] tracking-[0.28em] text-forge-dim sm:block">
                SOFTWARE FORGE
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-2 font-mono-hud text-[10px] tracking-[0.14em] text-forge-dim md:flex">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${telemetry.slotsRemaining > 1 ? "bg-forge-cyan animate-pulse-soft" : "bg-forge-alert animate-pulse-soft"}`} />
            <span>
              FORGE CAPACITY: <span className={telemetry.capacityPct >= 90 ? "text-forge-alert" : "text-forge-cyan"}>{telemetry.capacityPct}%</span>
              <span className="mx-2 text-seam">|</span>
              ACTIVE BUILDS: <span className="text-pearl">{telemetry.activeBuilds}/{telemetry.maxBuilds}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={onBench} className="btn-forge btn-ghost px-3 py-1.5 text-[10px]" title="MCP tool bench">
              ⚙ MCP BENCH
            </button>
            <VoiceConduit />
            <span className="hidden rounded-md border border-seam px-2.5 py-1 font-mono-hud text-[10px] tracking-[0.12em] text-forge-dim sm:block">
              {isChartered ? (
                <span className="text-forge-gold">CHARTERED ✦</span>
              ) : (
                <>PRACTICE BUILDS: <span className="text-pearl">{remainingFree}/3</span></>
              )}
            </span>
            <button onClick={onBook} className="btn-forge btn-ghost px-3 py-1.5 text-[10px]">
              BOOK SLOT
            </button>
          </div>
        </div>
      </header>

      {/* Scarcity toasts */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex w-[min(88vw,340px)] flex-col gap-2">
        {alerts.map((a) => (
          <div
            key={a.id}
            className="hud-panel animate-drift-up border-l-2 border-l-forge-gold px-3.5 py-2.5 font-mono-hud text-[10px] leading-relaxed tracking-[0.08em] text-forge-gold/90"
          >
            ⚠ {a.message}
          </div>
        ))}
      </div>
    </>
  );
}
