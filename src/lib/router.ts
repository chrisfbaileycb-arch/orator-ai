import type { ModelExpert, InquestAnswer, ForgePlan } from "./types";
import { INQUEST_QUESTIONS } from "./inquest";

/** ---------- 16-Model Mixture-of-Experts Router (deterministic demo mode) ----------
 *
 * The router selects the expert quorum for a forge run. In demo mode it rotates a
 * fixed roster of 16 experts across providers. When OPENROUTER_API_KEY is wired to
 * a server-side action, `LIVE_ROUTER` flips and quorum selection weights by tier.
 */

export const EXPERT_ROSTER: ModelExpert[] = [
  { id: "exp-arch-1", label: "ORATOR-Architect", provider: "openrouter", model: "openai/gpt-4o", role: "architect", tier: "paid" },
  { id: "exp-arch-2", label: "ORATOR-Architect-Lite", provider: "openrouter", model: "openai/gpt-4o-mini", role: "architect", tier: "free" },
  { id: "exp-schema-1", label: "SchemaSmith", provider: "openrouter", model: "google/gemini-1.5-pro", role: "schema", tier: "paid" },
  { id: "exp-schema-2", label: "SchemaSmith-Lite", provider: "openrouter", model: "google/gemini-1.5-flash", role: "schema", tier: "free" },
  { id: "exp-be-1", label: "BackendForge", provider: "openrouter", model: "openai/gpt-4o", role: "backend", tier: "paid" },
  { id: "exp-be-2", label: "BackendForge-Lite", provider: "openrouter", model: "openai/gpt-4o-mini", role: "backend", tier: "free" },
  { id: "exp-fe-1", label: "FacadeWeaver", provider: "openrouter", model: "anthropic/claude-3.5-sonnet", role: "frontend", tier: "paid" },
  { id: "exp-fe-2", label: "FacadeWeaver-Lite", provider: "openrouter", model: "anthropic/claude-3-haiku", role: "frontend", tier: "free" },
  { id: "exp-rev-1", label: "Adversary-Review", provider: "openrouter", model: "openai/gpt-4o", role: "review", tier: "paid" },
  { id: "exp-rev-2", label: "Adversary-Review-Lite", provider: "openrouter", model: "openai/gpt-4o-mini", role: "review", tier: "free" },
  { id: "exp-sec-1", label: "Aegis-Security", provider: "openrouter", model: "google/gemini-1.5-pro", role: "security", tier: "paid" },
  { id: "exp-sec-2", label: "Aegis-Security-Lite", provider: "openrouter", model: "google/gemini-1.5-flash", role: "security", tier: "free" },
  { id: "exp-perf-1", label: "Kinetic-Perf", provider: "openrouter", model: "openai/gpt-4o", role: "performance", tier: "paid" },
  { id: "exp-perf-2", label: "Kinetic-Perf-Lite", provider: "openrouter", model: "openai/gpt-4o-mini", role: "performance", tier: "free" },
  { id: "exp-core-1", label: "ORATOR-Core", provider: "openrouter", model: "openai/gpt-4o", role: "architect", tier: "paid" },
  { id: "exp-core-2", label: "ORATOR-Core-Lite", provider: "openrouter", model: "google/gemini-1.5-flash", role: "architect", tier: "free" },
];

/** Rotate quorum deterministically by client + question count so demo runs vary. */
export function selectQuorum(clientId: string, tier: "free" | "paid"): ModelExpert[] {
  const seed = Array.from(clientId).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const preferredTier = tier === "paid" ? "paid" : "free";
  const rotated = [...EXPERT_ROSTER].sort((a, b) => {
    const scoreA = (a.id.charCodeAt(4) * 31 + seed) % EXPERT_ROSTER.length;
    const scoreB = (b.id.charCodeAt(4) * 31 + seed) % EXPERT_ROSTER.length;
    if (scoreA !== scoreB) return scoreA - scoreB;
    return a.id.localeCompare(b.id);
  });
  // Paid tier leads with paid experts; free tier leads with lite experts.
  return rotated.sort((a, b) => {
    if (a.tier === preferredTier && b.tier !== preferredTier) return -1;
    if (b.tier === preferredTier && a.tier !== preferredTier) return 1;
    return 0;
  });
}

export interface RouterEvent {
  at: number;
  expert: string;
  action: string;
}

export function routerIntroLine(tier: "free" | "paid"): string {
  return tier === "paid"
    ? "MoE router engaged — high-reasoning quorum, 16 experts on standby."
    : "MoE router engaged — free-tier rotation, 16 experts on standby.";
}

/** Extract the archetype keyword used by the generator to theme the plan. */
export function archetypeFromAnswers(answers: Record<string, string>): string {
  const blob = Object.values(answers).join(" ").toLowerCase();
  const table: [RegExp, string][] = [
    [/(book|reserv|schedul|appointment)/, "booking"],
    [/(crm|lead|pipeline|contact)/, "crm"],
    [/(shop|store|ecommerce|commerce|cart|checkout)/, "commerce"],
    [/(habit|track|journal|streak)/, "tracker"],
    [/(chat|messag|social|forum)/, "social"],
    [/(dashboard|analytic|metric|report)/, "analytics"],
    [/(task|kanban|project|sprint)/, "tasks"],
    [/(learn|course|school|tutor|quiz)/, "learning"],
    [/(health|fitness|gym|workout)/, "fitness"],
    [/(file|document|note|wiki)/, "docs"],
  ];
  for (const [rx, archetype] of table) {
    if (rx.test(blob)) return archetype;
  }
  return "custom-tool";
}

export function appNameFromAnswers(answers: Record<string, string>): string {
  const raw = (answers["q1"] ?? "").trim();
  if (!raw) return "untitled-forge";
  const words = raw
    .replace(/[^\w\s-]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  return words.length ? words.join("-") : "untitled-forge";
}

export function inquestDigest(answers: Record<string, string>): string {
  return INQUEST_QUESTIONS.map((q) => {
    const v = answers[q.id];
    if (!v) return null;
    return `${q.id.toUpperCase()} ${q.prompt} → ${v}`;
  })
    .filter(Boolean)
    .join("\n")
    .slice(0, 2000);
}

export function planTelemetry(plan: ForgePlan): string {
  return `archetype=${plan.archetype} experts=${plan.experts.length} files=${plan.files.length} audit=${plan.audit.score}%`;
}
