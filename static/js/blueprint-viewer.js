/**
 * Master Ground-Truth Blueprint Viewer (SPEC.md / BLUEPRINT.json / Schema ERD / Task DAG)
 */

class BlueprintViewer {
  constructor(options) {
    this.onProceed = options.onProceed || (() => {});
    this.container = document.getElementById('blueprint-container');
    this.activeTab = 'spec'; // 'spec' | 'json' | 'erd' | 'dag'
    this.blueprintData = null;
  }

  async loadBlueprint(intakeData, clarityAnswers) {
    this.container.innerHTML = `
      <div style="text-align: center; padding: 24px; color: var(--color-gold); font-family: var(--font-mono); font-size: 0.85rem;">
        <span class="state-indicator" style="display:inline-block; margin-right: 8px;"></span>
        SYNTHESIZING IMMUTABLE MASTER BLUEPRINT & CRYPTOGRAPHIC CONTRACT...
      </div>
    `;

    try {
      const res = await fetch('/api/blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...intakeData, clarity_answers: clarityAnswers })
      });
      this.blueprintData = await res.json();
      this.render();

      if (window.sphereCore) {
        window.sphereCore.setPhase('BLUEPRINT');
      }
    } catch (e) {
      console.error('[BlueprintViewer] Error generating blueprint:', e);
    }
  }

  render() {
    if (!this.container || !this.blueprintData) return;
    const bp = this.blueprintData;

    this.container.innerHTML = `
      <div class="blueprint-deck">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div>
            <div style="font-family: var(--font-mono); font-size: 0.9rem; font-weight: bold; color: var(--color-gold);">
              MASTER GROUND-TRUTH BLUEPRINT
            </div>
            <div style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-dim); margin-top: 2px;">
              HASH: <span style="color: var(--color-cyan);">${bp.hash.substring(0, 24)}...</span> (ZERO DRIFT IMMUTABLE)
            </div>
          </div>
          <button id="bp-proceed-btn" class="btn btn-cyan" style="font-size: 0.78rem; padding: 8px 16px;">
            SELECT TIER & MANUFACTURE ➔
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="blueprint-tabs">
          <button class="bp-tab ${this.activeTab === 'spec' ? 'active' : ''}" data-tab="spec">📄 SPEC.md</button>
          <button class="bp-tab ${this.activeTab === 'json' ? 'active' : ''}" data-tab="json">⚙️ BLUEPRINT.json</button>
          <button class="bp-tab ${this.activeTab === 'erd' ? 'active' : ''}" data-tab="erd">🗄️ Relational Schema ERD</button>
          <button class="bp-tab ${this.activeTab === 'dag' ? 'active' : ''}" data-tab="dag">⚡ Task DAG Matrix</button>
        </div>

        <!-- Tab Content -->
        <div class="blueprint-content" id="bp-content-body">
          ${this._renderTabContent()}
        </div>
      </div>
    `;

    // Bind tab clicks
    const tabs = this.container.querySelectorAll('.bp-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.activeTab = tab.dataset.tab;
        if (window.audioSynth) window.audioSynth.playClick();
        this.render();
      });
    });

    const proceedBtn = document.getElementById('bp-proceed-btn');
    if (proceedBtn) {
      proceedBtn.addEventListener('click', () => {
        if (window.audioSynth) window.audioSynth.playNodeLock();
        this.onProceed(this.blueprintData);
      });
    }
  }

  _renderTabContent() {
    const bp = this.blueprintData;
    if (this.activeTab === 'spec') {
      return `<pre style="font-family: var(--font-mono); font-size: 0.78rem; line-height: 1.5; color: #e2e8f0;">${this._escapeHtml(bp.spec_md)}</pre>`;
    } else if (this.activeTab === 'json') {
      return `<pre style="font-family: var(--font-mono); font-size: 0.78rem; color: #38bdf8;">${this._escapeHtml(JSON.stringify(bp.blueprint_json, null, 2))}</pre>`;
    } else if (this.activeTab === 'erd') {
      return `
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div style="color: var(--color-emerald); font-size: 0.8rem; font-weight: bold;">
            RELATIONAL DATA SCHEMAS & ATTRIBUTES:
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
            ${(bp.entities || []).map(ent => `
              <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 6px; padding: 12px;">
                <div style="font-weight: bold; color: var(--color-emerald); font-size: 0.85rem; margin-bottom: 6px;">
                  ◈ ${ent.name}
                </div>
                <div style="font-size: 0.72rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 3px;">
                  ${ent.fields.map(f => `<span>• <code>${f}</code></span>`).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (this.activeTab === 'dag') {
      return `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="color: var(--color-violet); font-size: 0.8rem; font-weight: bold;">
            MULTI-AGENT ISOLATED EXECUTION DAG:
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); padding: 10px; border-radius: 6px;">
              <strong style="color:#a855f7;">STAGE 1: Architectural Ingestion & Spec Lock</strong>
              <div style="font-size:0.72rem; color:var(--text-muted);">Assigned to: Claude 3.7 Sonnet (Architect) ➔ Output: SPEC.md, openapi.json</div>
            </div>
            <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); padding: 10px; border-radius: 6px;">
              <strong style="color:#38bdf8;">STAGE 2: Schema & Auth Boundary Synthesis</strong>
              <div style="font-size:0.72rem; color:var(--text-muted);">Assigned to: Qwen 2.5 Coder + GLM-4.7 ➔ Output: database/schema.sql, server/auth.py</div>
            </div>
            <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); padding: 10px; border-radius: 6px;">
              <strong style="color:#fbbf24;">STAGE 3: Core API Endpoints & State Controller</strong>
              <div style="font-size:0.72rem; color:var(--text-muted);">Assigned to: Qwen 2.5 Coder ➔ Output: server/routes.py, server/app.py</div>
            </div>
            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 10px; border-radius: 6px;">
              <strong style="color:#10b981;">STAGE 4: Frontend Command Deck & Telemetry</strong>
              <div style="font-size:0.72rem; color:var(--text-muted);">Assigned to: Gemini 2.0 Flash ➔ Output: client/index.html, client/app.js, styles.css</div>
            </div>
            <div style="background: rgba(0, 240, 255, 0.1); border: 1px solid rgba(0, 240, 255, 0.3); padding: 10px; border-radius: 6px;">
              <strong style="color:#00f0ff;">STAGE 5: Playwright Harness & Cryptographic Boundary Audit</strong>
              <div style="font-size:0.72rem; color:var(--text-muted);">Assigned to: Playwright Agent + ECC ➔ Output: tests/test_api.py, tests/playwright_e2e.py</div>
            </div>
          </div>
        </div>
      `;
    }
    return '';
  }

  _escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

window.BlueprintViewer = BlueprintViewer;
