import { useEffect, useMemo, useRef, useState } from "react";
import { INQUEST_QUESTIONS, phaseOf } from "../lib/inquest";
import { sanitizeAnswer, INPUT_LIMITS } from "../lib/security";
import { listen, listeningSupported, orate, strikeSound } from "../lib/voice";
import type { IngestItem, IngestKind } from "../lib/types";
import OrbOfTheOrator from "./OrbOfTheOrator";

/**
 * THE INQUEST — a stage, not a form.
 * The Orator Orb commands the visual field; its voice is projected beneath it
 * in clean type with a speaking pulse. You answer from a low-profile floating
 * dock — typing, chips, files (never video), a read-only repo, or your voice,
 * which is the natural, primary mode: tap the mic or strike the orb to speak.
 * Past exchanges fade out translucent above the orb; a slide-out sheet keeps
 * the full transcript one tap away.
 */

interface Props {
  answers: Record<string, string>;
  ingest: IngestItem[];
  onAnswer: (questionId: string, value: string) => void;
  onIngest: (item: IngestItem) => void;
  onComplete: () => void;
  onExit: () => void;
}

type Tone = "orator" | "user" | "attach" | "sys";
interface HistoryEntry {
  id: number;
  tone: Tone;
  text: string;
  sub?: string;
}

const ACKS = [
  "Sealed into the brief.",
  "The quorum notes that.",
  "Understood — writing it into the contract.",
  "Captured. The shape is sharpening.",
  "Good. The forge adapts.",
  "Noted with precision.",
  "Into the ledger it goes.",
  "The architects are listening.",
  "That refines the invariant set.",
  "Sealed. Moving the needle forward.",
  "The schema expert appreciates that.",
  "Locked into the build brief.",
  "Understood — the operations team concurs.",
  "V2 headroom noted.",
  "The final constraint is honored.",
];

const BLOCKED_VIDEO = /\.(mp4|mov|webm|mkv|avi|m4v|wmv|flv|3gp|mpeg|mpg)$/i;
const DOCK_BLUR = "backdrop-blur-xl";

export default function Inquest({ answers, ingest, onAnswer, onIngest, onComplete, onExit }: Props) {
  const doneCount = Object.keys(answers).length;
  const current = useMemo(
    () => (doneCount < INQUEST_QUESTIONS.length ? INQUEST_QUESTIONS[doneCount] : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [doneCount, answers]
  );

  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<"awaiting" | "thinking" | "sealing">("awaiting");
  const [ack, setAck] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [micState, setMicState] = useState<"idle" | "listening">("idle");
  const [micPartial, setMicPartial] = useState("");
  const [orbEnergy, setOrbEnergy] = useState(0.22);
  const [warn, setWarn] = useState<{ text: string; id: number } | null>(null);
  const [note, setNote] = useState<{ text: string; id: number } | null>(null);
  const [repoOpen, setRepoOpen] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [showSheet, setShowSheet] = useState(false);

  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const seed: HistoryEntry[] = [
      {
        id: 0,
        tone: "orator",
        text: "I am the Orator. Fifteen questions stand between your intent and a forged blueprint.",
      },
    ];
    let id = 1;
    for (const item of ingest) {
      seed.push({ id: id++, tone: "attach", text: ingestLabel(item), sub: item.meta });
    }
    for (let i = 0; i < doneCount; i++) {
      const q = INQUEST_QUESTIONS[i];
      seed.push({ id: id++, tone: "orator", text: q.prompt, sub: q.phase });
      const val = answers[q.id] ?? "";
      seed.push({ id: id++, tone: "user", text: val });
    }
    return seed;
  });
  const histId = useRef(history.length);
  const lastUserText = useMemo(() => {
    const last = [...history].reverse().find((h) => h.tone === "user");
    return last?.text ?? null;
  }, [history]);

  const timers = useRef<number[]>([]);
  const sealingRef = useRef(false);
  const spokeFirst = useRef(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const later = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const pushHist = (tone: Tone, text: string, sub?: string) =>
    setHistory((h) => [...h, { id: histId.current++, tone, text, sub }]);

  useEffect(() => {
    return () => timers.current.forEach((t) => window.clearTimeout(t));
  }, []);

  // Auto-scroll history sheet
  useEffect(() => {
    if (chatBottomRef.current && showSheet) chatBottomRef.current.scrollTop = chatBottomRef.current.scrollHeight;
  }, [history, showSheet]);

  // Orb energy tracks state
  useEffect(() => {
    setOrbEnergy(mode === "sealing" ? 1 : mode === "thinking" ? 0.85 : speaking ? 0.6 : micState === "listening" ? 0.7 : 0.22);
  }, [mode, speaking, micState]);

  // When a new question arrives, the Orator speaks it aloud (if voice is on)
  const qid = current?.id ?? null;
  useEffect(() => {
    if (!current) return;
    if (!spokeFirst.current) {
      spokeFirst.current = true;
      return; // resume/seed: no auto oration on arrival
    }
    setSpeaking(true);
    void orate(`${current.prompt} ${current.hint ?? ""}`).then(() => {
      later(280, () => setSpeaking(false));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qid]);

  const limitOf = (qid: string) => {
    const i = INQUEST_QUESTIONS.findIndex((x) => x.id === qid);
    return i % 5 === 0 ? INPUT_LIMITS.short : INPUT_LIMITS.long;
  };

  const flashWarn = (text: string) => setWarn({ text, id: Date.now() });
  const flashNote = (text: string) => setNote({ text, id: Date.now() });

  useEffect(() => {
    if (!warn) return;
    const t = window.setTimeout(() => setWarn(null), 3600);
    return () => window.clearTimeout(t);
  }, [warn]);
  useEffect(() => {
    if (!note) return;
    const t = window.setTimeout(() => setNote(null), 3800);
    return () => window.clearTimeout(t);
  }, [note]);

  const send = (raw: string) => {
    const q = current;
    if (!q || mode !== "awaiting" || sealingRef.current) return;
    const value = sanitizeAnswer(raw, limitOf(q.id));
    if (!value) {
      flashWarn("THE ORATOR REQUIRES AN ANSWER — EVEN A FRAGMENT WILL DO");
      return;
    }
    setDraft("");
    setAck(ACKS[Math.min(doneCount, ACKS.length - 1)]);
    setMode("thinking");
    pushHist("user", value);
    strikeSound(0.55);
    onAnswer(q.id, value);

    if (doneCount >= INQUEST_QUESTIONS.length - 1) {
      // Fifteenth answer — seal the inquest
      const t1 = window.setTimeout(() => {
        setAck("All fifteen answers sealed.");
        pushHist("sys", "ALL FIFTEEN ANSWERS SEALED — CONVENING THE QUORUM…");
      }, 700);
      timers.current.push(t1);
      const t2 = window.setTimeout(() => {
        setAck(null);
        setMode("sealing");
      }, 1350);
      timers.current.push(t2);
      const t3 = window.setTimeout(() => {
        if (!sealingRef.current) {
          sealingRef.current = true;
          onComplete();
        }
      }, 2500);
      timers.current.push(t3);
      return;
    }

    timers.current.push(window.setTimeout(() => {
      setAck(null);
      setMode("awaiting");
    }, 720));
  };

  const questionLimit = limitOf(current?.id ?? "q1");

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && mode === "awaiting") {
      e.preventDefault();
      send(draft);
    }
  };

  // ---- Voice: the primary mode ----
  const startListen = () => {
    if (micState === "listening" || mode !== "awaiting") return;
    setMicPartial("");
    setMicState("listening");
    listen((partial) => setMicPartial(partial))
      .then(({ text }) => {
        setMicState("idle");
        setMicPartial("");
        if (text) send(text);
      })
      .catch(() => {
        setMicState("idle");
        setMicPartial("");
        flashWarn("The microphone is shy — type instead.");
      });
  };

  // ---- Attachments (documents, code, images — video explicitly blocked) ----
  const onFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const files = Array.from(list);
    const blocked = files.filter((f) => f.type.startsWith("video/") || BLOCKED_VIDEO.test(f.name));
    if (blocked.length > 0) {
      flashWarn("VIDEO UPLOADS ARE BLOCKED — DOCUMENTS, CODE FILES, AND IMAGES ONLY");
      return;
    }
    files.forEach((f) => {
      const kind: IngestKind = f.type.startsWith("image/")
        ? "image"
        : f.name.match(/\.(py|ts|tsx|js|jsx|sql|html|css|json|md|txt)$/i)
        ? "code"
        : "document";
      const item: IngestItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        kind,
        name: f.name.slice(0, 120),
        meta: `${formatBytes(f.size)} · queued for read-only contextual analysis`,
        addedAt: Date.now(),
      };
      onIngest(item);
      pushHist("attach", ingestLabel(item), item.meta);
    });
    flashNote(`ATTACHED ${files.length} FILE${files.length === 1 ? "" : "S"} — VIDEO BLOCKED · READ-ONLY CONTEXT`);
    strikeSound(0.35);
  };

  // ---- Connect repository (READ-ONLY ingest) ----
  const connectRepo = () => {
    const url = repoUrl.trim();
    const ok = /^(https?:\/\/|git@|ssh:\/\/|git:\/\/)/i.test(url) && url.length >= 8 && !/\s/.test(url);
    if (!ok) {
      flashWarn("ENTER A VALID GIT URL — e.g. https://github.com/owner/repo");
      return;
    }
    const item: IngestItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind: "repo",
      name: url.replace(/^https?:\/\//, "").replace(/\.git$/i, "").slice(0, 160),
      meta: "READ-ONLY INGEST — no push, no write, no remote mutation. Context only.",
      addedAt: Date.now(),
    };
    onIngest(item);
    pushHist("attach", ingestLabel(item), item.meta);
    flashNote("REPOSITORY CONNECTED (READ-ONLY) — CONTEXT ONLY");
    setRepoUrl("");
    setRepoOpen(false);
    strikeSound(0.35);
  };

  const verseId = qid ?? "sealed";
  const busy = mode !== "awaiting";

  return (
    <div className="relative mx-auto flex min-h-screen w-full flex-col px-4 pb-52 pt-24 sm:px-6">
      {/* Celestial light emanating outward from the orb */}
      <div aria-hidden className="sanctum-aureole pointer-events-none fixed inset-0" />

      {/* Progress whisper */}
      <div className="relative z-10 mb-2 text-center font-mono-hud text-[9px] tracking-[0.3em] text-forge-dim/80">
        {current ? `${phaseOf(doneCount)} · QUESTION ${String(doneCount + 1).padStart(2, "0")} / 15` : "INQUEST SEALED"}
        <span className="mx-2 text-seam">|</span>
        {doneCount} ANSWERED
      </div>

      {/* Stage */}
      <div className="relative z-10 flex flex-1 flex-col items-center">
        {/* Translucent echo of the last exchange — history fades above the orb */}
        {lastUserText && !busy && current && (
          <div className="pointer-events-none mb-1 max-w-xl truncate text-center text-[11.5px] italic leading-relaxed text-forge-dim/45">
            ↳ you: {lastUserText}
          </div>
        )}

        {/* The Orator commands the field */}
        <OrbOfTheOrator
          className="mx-auto w-[min(76vw,520px)]"
          energy={orbEnergy}
          onStrike={() => {
            if (listeningSupported()) startListen();
          }}
          showWakeLine={false}
        />

        {/* Voice projection — clean, high-contrast, beneath the orb */}
        <div className="mt-6 min-h-[7.5rem] w-full max-w-3xl text-center sm:min-h-[8.5rem]">
          {mode === "sealing" ? (
            <div key="seal" className="orb-verse">
              <div className="speak-bars mx-auto mb-4 h-5">
                <span /><span /><span /><span /><span />
              </div>
              <div className="font-mono-hud text-[10px] tracking-[0.4em] text-forge-gold text-glow-gold">
                INQUEST SEALED
              </div>
              <h2 className="mt-3 font-display text-2xl font-semibold leading-snug text-pearl">
                The quorum convenes. The forge awakens.
              </h2>
            </div>
          ) : current ? (
            <div key={verseId} className="orb-verse">
              {/* Speaking pulse sits with the question */}
              <div className="mb-3 flex items-center justify-center gap-3">
                {speaking || mode === "thinking" ? (
                  <span className="speak-bars h-3.5" aria-label="The Orator is speaking">
                    <span /><span /><span /><span /><span />
                  </span>
                ) : (
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-forge-cyan animate-pulse-soft" />
                )}
              </div>
              <h2 className="mx-auto max-w-2xl font-display text-[22px] font-semibold leading-snug tracking-tight text-pearl sm:text-[30px]">
                {current.prompt}
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-[13px] leading-relaxed text-forge-dim">
                {current.hint}
              </p>
              {ack && mode === "thinking" && (
                <p key={ack} className="verse-ack mt-2 text-[12px] italic text-forge-cyan/70">
                  {ack}
                </p>
              )}
            </div>
          ) : (
            /* Answers complete — brief convergence beat before the seal */
            <div key="final" className="orb-verse">
              <div className="mb-3 flex items-center justify-center gap-3">
                <span className="speak-bars h-3.5" aria-label="The Orator is converging">
                  <span /><span /><span /><span /><span />
                </span>
              </div>
              <h2 className="mx-auto max-w-xl font-display text-[20px] font-semibold leading-snug tracking-tight text-pearl sm:text-[26px]">
                The Orator weighs your fifteenth answer…
              </h2>
              {ack && <p className="verse-ack mt-2 text-[12px] italic text-forge-cyan/70">{ack}</p>}
            </div>
          )}
        </div>
      </div>

      {/* ============ Floating response dock ============ */}
      <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 sm:bottom-6">
        <div className="w-full max-w-xl">
          {/* Quick-select chips float just above the pill */}
          {current && current.suggestions && current.suggestions.length > 0 && !busy && (
            <div className="mb-2 flex flex-wrap justify-center gap-1.5">
              {current.suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className={`rounded-full border border-seam/80 px-3.5 py-1.5 font-mono-hud text-[10px] text-forge-dim transition-colors hover:border-forge-cyan/50 hover:text-pearl ${DOCK_BLUR} bg-depth/50`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Repo inline connect */}
          {repoOpen && (
            <div className={`mb-2 flex items-center gap-2 rounded-2xl border border-seam/80 bg-depth/75 p-2 ${DOCK_BLUR}`}>
              <input
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") connectRepo();
                }}
                placeholder="https://github.com/owner/repo · git@github.com:owner/repo.git"
                className="input-forge !border-transparent !py-2 font-mono-hud text-[11px]"
                autoFocus
              />
              <button onClick={connectRepo} className="btn-forge btn-primary shrink-0 px-4 py-2 text-[9px]">
                INGEST (RO)
              </button>
            </div>
          )}

          {/* The pill */}
          <div className={`flex items-center gap-1.5 rounded-full border border-seam/90 bg-depth/80 py-1.5 pl-2 pr-2 shadow-[0_12px_48px_rgba(3,6,12,0.7)] ${DOCK_BLUR}`}>
            {/* Voice — primary mode */}
            {listeningSupported() ? (
              <button
                onClick={startListen}
                aria-label={micState === "listening" ? "Listening…" : "Answer with your voice"}
                title="Answer with your voice"
                className={`btn-forge shrink-0 rounded-full px-4 py-2.5 text-[10px] ${
                  micState === "listening" ? "btn-gold animate-pulse-soft" : "btn-gold"
                }`}
              >
                {micState === "listening" ? (
                  <span className="flex items-center gap-2">
                    <span className="speak-bars h-3"><span /><span /><span /></span>
                    HEARING
                  </span>
                ) : (
                  "🎙 SPEAK"
                )}
              </button>
            ) : (
              <span className="shrink-0 rounded-full px-2 font-mono-hud text-[9px] text-forge-dim/50">NO MIC</span>
            )}

            {/* Type pill */}
            <div className="relative min-w-0 flex-1">
              <input
                value={micState === "listening" && micPartial ? micPartial : draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={
                  micState === "listening"
                    ? "Speak now — the Orator hears you…"
                    : current?.placeholder ?? "The inquest is complete."
                }
                disabled={!current || busy}
                maxLength={current ? questionLimit : 600}
                className="w-full border-0 bg-transparent px-2 py-2 font-mono-hud text-[12px] text-pearl outline-none placeholder:text-forge-dim/60"
              />
            </div>

            {/* Transcript sheet */}
            <button
              onClick={() => setShowSheet((v) => !v)}
              aria-label="Conversation transcript"
              title="Conversation transcript"
              className={`shrink-0 rounded-full px-2.5 py-2 text-[12px] transition-colors ${
                showSheet ? "text-forge-cyan" : "text-forge-dim hover:text-forge-cyan"
              }`}
            >
              ☰
            </button>

            {/* Read-only repo connect */}
            <button
              onClick={() => setRepoOpen((o) => !o)}
              aria-label="Connect repository (read-only)"
              title="Connect repository — read-only, no push or write"
              className={`shrink-0 rounded-full px-2.5 py-2 text-[13px] transition-colors ${
                repoOpen ? "text-forge-gold" : "text-forge-dim hover:text-forge-gold"
              }`}
            >
              🔗
            </button>

            {/* Attach — no video */}
            <button
              onClick={() => fileRef.current?.click()}
              aria-label="Attach files or images (video blocked)"
              title="Attach documents, code, or images — video blocked"
              className="shrink-0 rounded-full px-2.5 py-2 text-[13px] text-forge-dim transition-colors hover:text-forge-cyan"
            >
              📎
            </button>
          </div>

          {/* Warnings / confirmations */}
          <div className="mt-2 flex min-h-[1.4rem] justify-center">
            {warn && (
              <span key={warn.id} className="animate-drift-up rounded-full border border-forge-alert/40 bg-forge-alert/10 px-3 py-1 font-mono-hud text-[9.5px] tracking-[0.08em] text-forge-alert">
                ⚠ {warn.text}
              </span>
            )}
            {note && !warn && (
              <span key={note.id} className="animate-drift-up rounded-full border border-forge-cyan/30 bg-forge-cyan/5 px-3 py-1 font-mono-hud text-[9.5px] tracking-[0.08em] text-forge-cyan/80">
                ✓ {note.text}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ============ Optional transcript sheet ============ */}
      {showSheet && (
        <div className="fixed bottom-36 right-3 top-24 z-40 w-[min(88vw,330px)] overflow-hidden rounded-2xl border border-seam/70 bg-abyss/80 shadow-[0_18px_60px_rgba(3,6,12,0.8)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-seam/70 px-4 py-2.5">
            <span className="font-mono-hud text-[9px] tracking-[0.22em] text-forge-dim">
              INQUEST TRANSCRIPT
            </span>
            <span className="font-mono-hud text-[9px] text-forge-cyan/80">{doneCount}/15</span>
          </div>
          <div ref={chatBottomRef} className="h-full space-y-2.5 overflow-y-auto px-4 py-3">
            {history.map((h) => (
              <div key={h.id}>
                {h.tone === "attach" ? (
                  <div className="rounded-lg border border-forge-gold/25 bg-forge-gold/5 px-3 py-1.5">
                    <div className="font-mono-hud text-[9.5px] font-bold text-forge-gold">{h.text}</div>
                    {h.sub && <div className="text-[9px] text-forge-dim">{h.sub}</div>}
                  </div>
                ) : h.tone === "sys" ? (
                  <div className="text-center font-mono-hud text-[8.5px] tracking-[0.14em] text-forge-dim">
                    {h.text}
                  </div>
                ) : h.tone === "orator" ? (
                  <div className="border-l-2 border-forge-cyan/40 pl-2.5">
                    <div className="text-[10.5px] leading-snug text-pearl/90">{h.text}</div>
                    {h.sub && <div className="mt-0.5 font-mono-hud text-[8px] tracking-[0.18em] text-forge-dim/70">{h.sub}</div>}
                  </div>
                ) : (
                  <div className="text-right text-[10.5px] italic leading-snug text-forge-cyan/85">
                    {h.text}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exit */}
      <button
        onClick={onExit}
        className="fixed bottom-3 left-3 z-30 font-mono-hud text-[9px] tracking-[0.18em] text-forge-dim/70 transition-colors hover:text-forge-alert"
        title="Abandon inquest"
      >
        ✕ ABANDON
      </button>

      <input
        ref={fileRef}
        type="file"
        multiple
        accept=".txt,.md,.json,.csv,.pdf,.doc,.docx,image/*,text/*,.py,.ts,.tsx,.js,.jsx,.sql,.html,.css"
        className="hidden"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** Bubble/note label for a persisted context item. */
function ingestLabel(item: IngestItem): string {
  const prefix =
    item.kind === "repo"
      ? "🔗 REPOSITORY"
      : item.kind === "image"
      ? "IMAGE"
      : item.kind === "code"
      ? "CODE FILE"
      : "DOCUMENT";
  return `${prefix} · ${item.name}`;
}
