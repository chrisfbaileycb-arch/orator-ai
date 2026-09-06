import { useEffect, useMemo, useState } from "react";
import PlasmaBackdrop from "./components/PlasmaBackdrop";
import HudChrome from "./components/HudChrome";
import Landing from "./components/Landing";
import Inquest from "./components/Inquest";
import ForgeDirector from "./components/ForgeDirector";
import VerificationGate from "./components/VerificationGate";
import Deliverables from "./components/Deliverables";
import BookingModal from "./components/BookingModal";
import CharterModal from "./components/CharterModal";
import McpBenchModal from "./components/McpBenchModal";
import { useSession } from "./lib/session";
import { useScarcityAlerts, computeTelemetry } from "./lib/telemetry";
import { buildPlan } from "./lib/generator";
import { runAudit } from "./lib/audit";
import { inquestDigest } from "./lib/router";
import { redactSecrets } from "./lib/security";
import { orate, hush, startDrone, setDroneEnergy } from "./lib/voice";
import type { ForgePlan } from "./lib/types";

/** ---------- ORATOR.AI application shell ---------- */

export default function App() {
  const session = useSession();
  const [showBooking, setShowBooking] = useState(false);
  const [showCharter, setShowCharter] = useState(false);
  const [showBench, setShowBench] = useState(false);
  const [plan, setPlan] = useState<ForgePlan | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const audit = useMemo(() => (plan ? runAudit(plan) : null), [plan]);

  const telemetry = useMemo(() => computeTelemetry(session.session.sessionsUsed), [session.session.sessionsUsed]);
  const alerts = useScarcityAlerts(session.session.status === "landing" || session.session.status === "inquest");

  // Route guards: session status drives the deck shown
  const status = session.session.status;

  // Ambient drone: begins on first user gesture (browser autoplay policy),
  // follows build energy across the app.
  useEffect(() => {
    const ignite = () => {
      startDrone();
      setDroneEnergy(0.15);
      window.removeEventListener("pointerdown", ignite);
      window.removeEventListener("keydown", ignite);
    };
    window.addEventListener("pointerdown", ignite);
    window.addEventListener("keydown", ignite);
    return () => {
      window.removeEventListener("pointerdown", ignite);
      window.removeEventListener("keydown", ignite);
    };
  }, []);

  // Greet on first arrival; hush when the app unmounts.
  useEffect(() => {
    if (session.session.status === "landing" && session.session.sessionsUsed === 0) {
      void orate("The Orator is listening. Strike the orb to wake the forge.");
    }
    return () => hush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status === "forging" && !plan) {
      // Missing plan (e.g. stale persisted state) — send back to inquest
      session.resetSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const startInquest = () => {
    if (!session.canForge) {
      session.requirePayment();
      setShowCharter(true);
      return;
    }
    session.beginInquest();
  };

  const handleInquestComplete = () => {
    if (!session.canForge) {
      session.requirePayment();
      setShowCharter(true);
      return;
    }
    setPlan(
      buildPlan(session.session.answers, session.session.clientId, session.isChartered ? "paid" : "free")
    );
    session.beginForging();
  };

  const handleForgeComplete = (finished: ForgePlan) => {
    // Journal + dossier texts pass through redaction before persisting anywhere.
    redactSecrets(JSON.stringify(finished));
    // The 22-point invariant audit runs NOW — the final gate before delivery.
    setGateOpen(true);
  };

  const handleGateSealed = () => {
    setGateOpen(false);
    session.markDelivered();
  };

  const handleBook = (slotISO: string) => {
    session.markBooked(slotISO);
    setShowBooking(false);
  };

  const handleCharterAccept = () => {
    session.payCharter();
    setShowCharter(false);
  };

  const newForge = () => {
    session.resetSession();
    setPlan(null);
    setGateOpen(false);
  };

  const tier: "free" | "paid" = session.isChartered ? "paid" : "free";

  return (
    <div className="abyss-vignette isolate relative min-h-screen">
      <PlasmaBackdrop />
      <div className="grid-lines pointer-events-none fixed inset-0" />
      <div className="scanline" />

      <HudChrome
        telemetry={telemetry}
        alerts={alerts}
        remainingFree={session.remainingFree}
        isChartered={session.isChartered}
        onBook={() => setShowBooking(true)}
        onBench={() => setShowBench(true)}
      />

      <main>
        {(status === "landing" || status === "booked" || status === "payment_required") && (
          <Landing
            session={session}
            telemetry={telemetry}
            onBegin={startInquest}
            onBook={() => setShowBooking(true)}
            onCharter={() => setShowCharter(true)}
          />
        )}

        {status === "inquest" && (
          <Inquest
            answers={session.session.answers}
            ingest={session.session.ingest}
            onAnswer={session.recordAnswer}
            onIngest={session.recordIngest}
            onComplete={handleInquestComplete}
            onExit={session.resetSession}
          />
        )}

        {status === "forging" && plan && !gateOpen && (
          <ForgeDirector plan={plan} tier={tier} onComplete={handleForgeComplete} />
        )}

        {status === "forging" && plan && gateOpen && audit && (
          <VerificationGate audit={audit} onSeal={handleGateSealed} />
        )}

        {status === "delivered" && plan && (
          <Deliverables
            plan={plan}
            auditScore={audit?.score ?? 0}
            auditPassed={audit?.passed ?? 0}
            auditTotal={audit?.total ?? 0}
            ingest={session.session.ingest}
            onNewForge={newForge}
          />
        )}
      </main>

      <footer className="relative z-10 border-t border-seam/60 py-6 text-center font-mono-hud text-[9px] tracking-[0.22em] text-forge-dim">
        ORATOR.AI // CLOSED-LOOP MANUFACTURING · 16-EXPERT MoE · ZERO-DISK RUNTIME · SECRETS STAY SERVER-SIDE
      </footer>

      {showBooking && (
        <BookingModal
          slotsRemaining={telemetry.slotsRemaining}
          onBook={handleBook}
          onClose={() => setShowBooking(false)}
        />
      )}
      {showCharter && (
        <CharterModal
          sessionsUsed={session.session.sessionsUsed}
          onAccept={handleCharterAccept}
          onClose={() => setShowCharter(false)}
        />
      )}
      {showBench && <McpBenchModal onClose={() => setShowBench(false)} />}
    </div>
  );
}
