/**
 * Velvet Rope Anti-Slop Gatekeeper & Status Inversion Routine
 */

class VelvetRopeGatekeeper {
  constructor(options) {
    this.onPassed = options.onPassed || (() => {});
    this.onFailed = options.onFailed || (() => {});
    this.modalEl = document.getElementById('velvet-modal');
    this.challengeEl = document.getElementById('velvet-challenge-text');
    this.reasonEl = document.getElementById('velvet-reasons-list');
    this.defenseInput = document.getElementById('velvet-defense-input');
    this.submitDefenseBtn = document.getElementById('velvet-submit-defense-btn');

    this.currentPrompt = '';
    this.currentMoat = '';

    this.bindEvents();
  }

  bindEvents() {
    if (this.submitDefenseBtn) {
      this.submitDefenseBtn.addEventListener('click', () => this.submitDefense());
    }
  }

  async evaluate(promptText, moatText) {
    this.currentPrompt = promptText;
    this.currentMoat = moatText;

    try {
      const res = await fetch('/api/interrogate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, moat: moatText })
      });
      const data = await res.json();

      if (data.passed) {
        this.closeModal();
        if (window.sphereCore) {
          window.sphereCore.setPhase('BLUEPRINT');
        }
        this.onPassed({ prompt: promptText, moat: moatText, score: data.score });
      } else {
        this.triggerRejection(data);
      }
    } catch (e) {
      // Fallback local evaluation if offline
      const isSlop = promptText.toLowerCase().includes('golf tee') || promptText.toLowerCase().includes('uber for');
      if (isSlop) {
        this.triggerRejection({
          score: 35,
          flags: ['Generic clone archetype detected.'],
          challenge: 'This is the 50th golf tee app submitted today. What makes yours different?'
        });
      } else {
        this.onPassed({ prompt: promptText, moat: moatText, score: 90 });
      }
    }
  }

  triggerRejection(data) {
    // 1. Shift central sphere to menacing crimson
    if (window.sphereCore) {
      window.sphereCore.setPhase('INTERROGATION');
    }

    // 2. Play synthesized alarm & speak
    if (window.audioSynth) {
      window.audioSynth.playVelvetAlarm();
      window.audioSynth.speak(data.challenge || "Moat verification failed. What makes your algorithmic execution defensible against generic clones?");
    }

    // 3. Render challenge modal
    this.challengeEl.textContent = data.challenge || "Moat verification failed. Provide your algorithmic moat.";
    this.reasonEl.innerHTML = (data.flags || []).map(f => `<li>• ${f}</li>`).join('');
    this.modalEl.style.display = 'flex';

    this.onFailed(data);
  }

  submitDefense() {
    const defense = this.defenseInput.value.trim();
    if (!defense || defense.length < 15) {
      alert('Moat defense must provide specific algorithmic or technical depth (min 15 chars).');
      return;
    }

    this.currentMoat += ` | Moat Defense: ${defense}`;
    this.evaluate(this.currentPrompt, this.currentMoat);
  }

  closeModal() {
    if (this.modalEl) {
      this.modalEl.style.display = 'none';
    }
  }
}

window.VelvetRopeGatekeeper = VelvetRopeGatekeeper;
