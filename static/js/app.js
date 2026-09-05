/**
 * THE ORATOR — Main Application Bootstrap & Velvet Rope Telemetry Loop
 *
 * Coordinates:
 * - Web Audio unlock & persistent 30Hz sub-bass drone
 * - 3D Pearlescent Plasma Core & 15-Segment Progress Halo
 * - Conversational Inquest Engine (Phase I -> II -> III)
 * - Velvet Rope Telemetry Jitter & Intermittent Toast Notifications
 * - Phase IV: The Forge Dynamic Mind Map & Live Multi-Agent Manufacturing
 */

// Persistent Client ID for Free/Paid Tier tracking
let oratorClientId = localStorage.getItem('orator_client_id');
if (!oratorClientId) {
  oratorClientId = 'orator_' + Math.random().toString(36).substring(2) + Date.now();
  localStorage.setItem('orator_client_id', oratorClientId);
}
window.oratorClientId = oratorClientId;

document.addEventListener('DOMContentLoaded', () => {

  // 1. Audio unlock on first user gesture
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  let audioUnlocked = false;

  const unlockAudio = () => {
    if (!audioUnlocked && window.audioSynth) {
      window.audioSynth.init();
      audioUnlocked = true;
    }
  };

  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });

  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      unlockAudio();
      const isEnabled = window.audioSynth.toggle();
      soundToggleBtn.classList.toggle('active', isEnabled);
      soundToggleBtn.textContent = isEnabled ? 'AUDIO: ON 🔊' : 'AUDIO: MUTED 🔇';
    });
  }

  // 2. Initialize 3D Pearlescent Plasma Core & 15-Segment Halo
  const mysticSphere = new window.MysticSphereCore('mystic-sphere-container');
  window.mysticSphere = mysticSphere;
  window.sphereCore = mysticSphere;

  // 3. Initialize Phase IV: The Forge & Dynamic Mind Map Deck
  const agentDeck = new window.AgentOrchestratorDeck();
  window.agentDeck = agentDeck;

  // 4. Initialize Conversational Inquest & Velvet Rope Slot Engine
  const chatCore = new window.ConversationalChatCore({
    onScopeLocked: (scope) => {
      console.log('[THE ORATOR] Execution slot authorized. Allocating compute for:', scope.name);
      if (window.mysticSphere) {
        window.mysticSphere.setPhase('LOCKED');
      }
      agentDeck.startBuildPipeline(scope);
    }
  });
  window.chatCore = chatCore;

  // 5. Velvet Rope HUD Scarcity Telemetry Jitter Loop
  setInterval(() => {
    const capEl = document.getElementById('telemetry-capacity');
    const buildsEl = document.getElementById('telemetry-builds');
    if (capEl) {
      const capPct = Math.floor(Math.random() * 8) + 89; // 89% - 96%
      capEl.textContent = `${capPct}%`;
    }
    if (buildsEl) {
      const activeCount = Math.floor(Math.random() * 2) + 8; // 8/10 or 9/10
      buildsEl.textContent = `${activeCount}/10`;
    }
  }, 4500);

  // 6. Velvet Rope Intermittent Scarcity Toast Alerts
  const toastContainer = document.getElementById('velvet-toast-container');
  const scarcityNotifications = [
    "[System] Asset compilation finished for Thread-992. 1 Forge slot opening soon.",
    "[System] Orchestration complete for Ticket #8842. Slot opening in 45m.",
    "[System] 22-Point audit passed for Citadel-Cluster-04. 1 Execution window available.",
    "[System] High-throughput MoE rotation active: 8 of 10 compute nodes allocated."
  ];
  let toastIndex = 0;

  const triggerVelvetToast = (msg) => {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'velvet-toast';
    toast.textContent = msg;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 6000);
  };

  // First toast after 10s of landing
  setTimeout(() => {
    triggerVelvetToast(scarcityNotifications[0]);
  }, 10000);

  // Subsequent toasts every 50 seconds
  setInterval(() => {
    toastIndex = (toastIndex + 1) % scarcityNotifications.length;
    triggerVelvetToast(scarcityNotifications[toastIndex]);
  }, 50000);

});
