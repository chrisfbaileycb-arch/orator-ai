/**
 * 5-6 Clarity Follow-ups Ambiguity Analysis & Resolution Engine
 */

class ClarityEngine {
  constructor(options) {
    this.onResolved = options.onResolved || (() => {});
    this.container = document.getElementById('clarity-container');
    this.questions = [];
    this.answers = {};
  }

  async loadQuestions(intakeData) {
    this.intakeData = intakeData;
    this.container.innerHTML = `
      <div style="text-align: center; padding: 24px; color: var(--color-gold); font-family: var(--font-mono); font-size: 0.85rem;">
        <span class="state-indicator" style="display:inline-block; margin-right: 8px;"></span>
        ANALYZING ARCHITECTURAL VECTORS FOR STRUCTURAL AMBIGUITIES...
      </div>
    `;

    try {
      const res = await fetch('/api/clarity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intakeData)
      });
      const data = await res.json();
      this.questions = data.followups || [];
      this.render();
    } catch (e) {
      // Fallback questions
      this.questions = [
        {
          id: 'q1_concurrency',
          question: 'How should worker backpressure be handled during high burst spikes (>5,000 req/sec)?',
          options: [
            'In-memory lockless ring buffer with hard backpressure reject (HTTP 429)',
            'Pipelined async batching with priority queue shed',
            'Direct synchronous execution with zero queue buffering'
          ],
          recommendation: 'In-memory lockless ring buffer with hard backpressure reject (HTTP 429)'
        },
        {
          id: 'q2_isolation',
          question: 'How should cryptographic key rotation be scheduled without session disruption?',
          options: [
            'Dual-key signing window with 24-hour overlap grace period',
            'Ephemeral per-session symmetric handshake with zero persistence',
            'Master air-gapped RSA-4096 key pair with manual rotation'
          ],
          recommendation: 'Dual-key signing window with 24-hour overlap grace period'
        },
        {
          id: 'q3_failover',
          question: 'What is the recovery strategy for unexpected worker panics?',
          options: [
            'Zero-downtime worker restart with state reconstitution from write-ahead log',
            'Immediate process termination with fail-closed air-gap lock',
            'Fallback to read-only degraded telemetry mode'
          ],
          recommendation: 'Zero-downtime worker restart with state reconstitution from write-ahead log'
        },
        {
          id: 'q4_schema',
          question: 'How should relational schema migrations be validated?',
          options: [
            'Forward-only immutable SQL delta migrations with strict checksum verification',
            'Dynamic runtime table sync with automatic column inference',
            'Pre-compiled embedded binary schema definitions'
          ],
          recommendation: 'Forward-only immutable SQL delta migrations with strict checksum verification'
        },
        {
          id: 'q5_harness',
          question: 'Which test harness suite gates in-memory ZIP package delivery?',
          options: [
            'Full Playwright E2E + Cryptographic Boundary Audit + API Fuzzing',
            'Unit Test Matrix + Static Route Contract Validation only',
            'Zero-dependency container startup test with smoke assertions'
          ],
          recommendation: 'Full Playwright E2E + Cryptographic Boundary Audit + API Fuzzing'
        }
      ];
      this.render();
    }
  }

  render() {
    if (!this.container) return;

    // Default to recommended options
    this.questions.forEach(q => {
      if (!this.answers[q.id]) {
        this.answers[q.id] = q.recommendation || q.options[0];
      }
    });

    this.container.innerHTML = `
      <div class="clarity-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-gold); font-weight: bold;">
            ❖ 5-6 ARCHITECTURAL CLARITY FOLLOW-UPS
          </div>
          <span class="panel-badge">ZERO CONTEXT DRIFT</span>
        </div>

        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 16px; line-height: 1.4;">
          The Orchestrator resolves structural edge cases before code generation begins, eliminating conversational hallucination loops and code rot.
        </div>

        <div class="clarity-list" style="display: flex; flex-direction: column; gap: 14px; max-height: 440px; overflow-y: auto; padding-right: 4px;">
          ${this.questions.map((q, idx) => `
            <div class="clarity-item" style="background: rgba(10, 16, 32, 0.7); border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 8px; padding: 14px;">
              <div style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-main); font-weight: 600; margin-bottom: 10px;">
                ${idx + 1}. ${q.question}
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                ${q.options.map(opt => {
                  const isChecked = this.answers[q.id] === opt;
                  const isRec = opt === q.recommendation;
                  return `
                    <label style="display: flex; align-items: flex-start; gap: 8px; font-family: var(--font-mono); font-size: 0.72rem; color: ${isChecked ? 'var(--color-gold)' : 'var(--text-muted)'}; cursor: pointer; padding: 6px 8px; background: ${isChecked ? 'rgba(251, 191, 36, 0.1)' : 'transparent'}; border-radius: 4px; border: 1px solid ${isChecked ? 'rgba(251, 191, 36, 0.3)' : 'transparent'};">
                      <input type="radio" name="${q.id}" value="${opt}" ${isChecked ? 'checked' : ''} style="margin-top: 2px;" />
                      <span>${opt} ${isRec ? '<strong style="color:var(--color-emerald)">[RECOMMENDED]</strong>' : ''}</span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>

        <div style="margin-top: 18px; display: flex; justify-content: flex-end; gap: 10px;">
          <button id="synthesize-blueprint-btn" class="btn btn-gold" style="font-size: 0.8rem; padding: 10px 20px;">
            GENERATE MASTER BLUEPRINT (SPEC.MD) ➔
          </button>
        </div>
      </div>
    `;

    // Bind selection events
    this.questions.forEach(q => {
      const radios = this.container.querySelectorAll(`input[name="${q.id}"]`);
      radios.forEach(r => {
        r.addEventListener('change', (e) => {
          this.answers[q.id] = e.target.value;
          if (window.audioSynth) window.audioSynth.playClick();
          this.render();
        });
      });
    });

    const synthBtn = document.getElementById('synthesize-blueprint-btn');
    if (synthBtn) {
      synthBtn.addEventListener('click', () => {
        if (window.audioSynth) {
          window.audioSynth.playBlueprintChime();
          window.audioSynth.speak("Ground truth blueprint synthesized. Cryptographic contract locked. Sub-agents isolated.");
        }
        this.onResolved(this.answers);
      });
    }
  }
}


window.ClarityEngine = ClarityEngine;
