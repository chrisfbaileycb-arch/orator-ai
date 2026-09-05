/**
 * Transaction Engine ($100 Single-Session vs $300 Multi-Session Citadel)
 * Sunk-Cost Commitment Proof & Manufacturing Pipeline Authorization
 */

class TransactionEngine {
  constructor(options) {
    this.onAuthorized = options.onAuthorized || (() => {});
    this.container = document.getElementById('transaction-container');
    this.selectedTier = 'single';
    this.receipt = null;
  }

  render(blueprintData) {
    this.blueprintData = blueprintData;
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="transaction-deck">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-family: var(--font-mono); font-size: 1.1rem; font-weight: 800; color: var(--text-main); letter-spacing: 1px;">
            COMMISSION DIGITAL MANUFACTURING RUN
          </div>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
            Select execution tier to authorize in-memory code compilation. Zero hard-drive retention.
          </p>
        </div>

        <div class="tier-grid">
          <!-- Tier 1: $100 Single-Session Build -->
          <div class="tier-card ${this.selectedTier === 'single' ? 'selected' : ''}" id="tier-single-card">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span class="panel-badge" style="color:var(--color-cyan); border-color:var(--color-cyan);">AIR-GAPPED APPLIANCE</span>
                <span style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-dim);">~20 FILES</span>
              </div>
              <div class="tier-price">$100</div>
              <div style="font-weight: bold; font-size: 0.95rem; color: #f8fafc; margin-bottom: 8px;">
                Single-Session Build
              </div>
              <p style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 12px;">
                Complete single-tenant software package. Self-contained SQLite WAL database, cryptographic JWT auth, OpenAPI 3.1 contract, Playwright tests, and Docker orchestrator.
              </p>
              <ul style="list-style: none; font-size: 0.72rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;">
                <li>✓ Full ~20-file production source code</li>
                <li>✓ Zero external SaaS dependency lock-in</li>
                <li>✓ Ephemeral in-memory ZIP delivery</li>
                <li>✓ 100% runnable standalone executable</li>
              </ul>
            </div>
            <div style="margin-top: 16px;">
              <button class="btn ${this.selectedTier === 'single' ? 'btn-cyan' : 'btn-secondary'}" style="width: 100%; font-size: 0.78rem;">
                ${this.selectedTier === 'single' ? '● SELECTED PLAN' : 'SELECT $100 BUILD'}
              </button>
            </div>
          </div>

          <!-- Tier 2: $300 Citadel Multi-Tenant -->
          <div class="tier-card citadel-tier ${this.selectedTier === 'citadel' ? 'selected' : ''}" id="tier-citadel-card">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span class="panel-badge" style="color:var(--color-violet); border-color:var(--color-violet);">ENTERPRISE PLATFORM</span>
                <span style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-dim);">30+ FILES</span>
              </div>
              <div class="tier-price">$300</div>
              <div style="font-weight: bold; font-size: 0.95rem; color: #f8fafc; margin-bottom: 8px;">
                Multi-Session Citadel
              </div>
              <p style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 12px;">
                Multi-tenant enterprise citadel with isolated tenant context, distributed asynchronous worker queue, Row-Level Security (RLS) PostgreSQL schema, Helm charts & metrics telemetry.
              </p>
              <ul style="list-style: none; font-size: 0.72rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;">
                <li>✓ Multi-tenant Gateway & Tenant Isolator</li>
                <li>✓ Distributed In-Memory Worker Pool</li>
                <li>✓ Row Level Security (RLS) Database</li>
                <li>✓ Full Kubernetes Helm & Docker Compose</li>
              </ul>
            </div>
            <div style="margin-top: 16px;">
              <button class="btn ${this.selectedTier === 'citadel' ? 'btn-cyan' : 'btn-secondary'}" style="width: 100%; font-size: 0.78rem; ${this.selectedTier === 'citadel' ? 'background: linear-gradient(135deg, rgba(168,85,247,0.4), rgba(56,189,248,0.5)); border-color:var(--color-violet);' : ''}">
                ${this.selectedTier === 'citadel' ? '● SELECTED PLAN' : 'SELECT $300 CITADEL'}
              </button>
            </div>
          </div>
        </div>

        <!-- Sunk-Cost Commitment & Authorization Box -->
        <div style="margin-top: 24px; background: rgba(4, 8, 18, 0.85); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 8px; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-family: var(--font-mono); font-size: 0.82rem; font-weight: bold; color: var(--color-cyan);">
                COMMITMENT AUTHORIZATION: <span style="color:#fff;">${this.selectedTier === 'single' ? '$100.00 USD' : '$300.00 USD'}</span>
              </div>
              <div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 2px;">
                Locks in model routing tokens across Qwen, GLM-4.7, Claude & Gemini.
              </div>
            </div>
            <button id="authorize-run-btn" class="btn btn-cyan" style="font-size: 0.82rem; padding: 12px 24px;">
              ⚡ AUTHORIZE & START MANUFACTURING
            </button>
          </div>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const singleCard = document.getElementById('tier-single-card');
    const citadelCard = document.getElementById('tier-citadel-card');
    const authBtn = document.getElementById('authorize-run-btn');

    if (singleCard) {
      singleCard.addEventListener('click', () => {
        this.selectedTier = 'single';
        if (window.audioSynth) window.audioSynth.playClick();
        this.render(this.blueprintData);
      });
    }

    if (citadelCard) {
      citadelCard.addEventListener('click', () => {
        this.selectedTier = 'citadel';
        if (window.audioSynth) window.audioSynth.playClick();
        this.render(this.blueprintData);
      });
    }

    if (authBtn) {
      authBtn.addEventListener('click', () => {
        const receipt = {
          tier: this.selectedTier,
          amount: this.selectedTier === 'single' ? '$100.00' : '$300.00',
          transaction_id: `tx_orch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: new Date().toISOString()
        };
        this.receipt = receipt;
        if (window.audioSynth) {
          window.audioSynth.playNodeLock();
          window.audioSynth.speak("Manufacturing run authorized. Allocating zero-disk RAM sandbox and routing model matrix.");
        }
        this.onAuthorized(receipt);
      });
    }
  }
}


window.TransactionEngine = TransactionEngine;
