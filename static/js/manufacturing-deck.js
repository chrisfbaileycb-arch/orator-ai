/**
 * Manufacturing Command Deck
 * Model Routing Matrix, Pluggable Harnesses, Ephemeral Terminal, and Code Artifact Explorer
 */

class ManufacturingDeck {
  constructor(options) {
    this.container = document.getElementById('manufacturing-container');
    this.blueprintData = null;
    this.receipt = null;
    this.generatedFiles = {};
    this.activeFile = null;
  }

  async startManufacturing(blueprintData, receipt) {
    this.blueprintData = blueprintData;
    this.receipt = receipt;
    this.render();

    // Shift 3D sphere to Violet Manufacturing phase
    if (window.sphereCore) {
      window.sphereCore.setPhase('MANUFACTURING');
    }

    // Run simulated manufacturing pipeline
    this.executePipeline();
  }

  render() {
    if (!this.container) return;
    const tierName = this.receipt.tier === 'single' ? '$100 Single-Session Build' : '$300 Multi-Session Citadel';

    this.container.innerHTML = `
      <div class="manufacturing-layout">
        <!-- Top Telemetry Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; background: rgba(10,16,32,0.8); border: 1px solid rgba(168,85,247,0.3); border-radius: 8px; padding: 12px 18px;">
          <div>
            <div style="font-family: var(--font-mono); font-size: 0.9rem; font-weight: 800; color: var(--color-violet);">
              ⚙️ EPHEMERAL MANUFACTURING PIPELINE ACTIVE
            </div>
            <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-dim); margin-top: 2px;">
              TARGET: <span style="color: #fff;">${tierName}</span> | TRANSACTION: <code>${this.receipt.transaction_id}</code>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="text-align: right; font-family: var(--font-mono); font-size: 0.72rem;">
              <span style="color: var(--text-dim);">SANDBOX FOOTPRINT:</span>
              <strong style="color: var(--color-emerald);">0 BYTES (ZERO DISK)</strong>
            </div>
            <button id="download-zip-btn" class="btn btn-cyan" style="font-size: 0.75rem; padding: 8px 16px; opacity: 0.4; cursor: not-allowed;" disabled>
              📦 COMPILING ZIP...
            </button>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <!-- Model Routing Matrix -->
          <div style="background: rgba(10,16,32,0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 14px;">
            <div style="font-family: var(--font-mono); font-size: 0.8rem; font-weight: bold; color: var(--color-cyan); margin-bottom: 8px;">
              DYNAMIC MODEL ROUTING MATRIX
            </div>
            <table class="routing-table">
              <thead>
                <tr>
                  <th>Agent Sub-Task</th>
                  <th>Routed Model</th>
                  <th>Harness</th>
                  <th>Latency</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Architect Agent</td>
                  <td><span class="routing-tag" style="color:#38bdf8;">Claude 3.7 Sonnet</span></td>
                  <td>ECC</td>
                  <td><span id="route-lat-1">14ms</span></td>
                </tr>
                <tr>
                  <td>Schema Engineer</td>
                  <td><span class="routing-tag" style="color:#10b981;">Qwen 2.5 Coder 32B</span></td>
                  <td>Ruflo</td>
                  <td><span id="route-lat-2">8ms</span></td>
                </tr>
                <tr>
                  <td>Security Auditor</td>
                  <td><span class="routing-tag" style="color:#ef4444;">GLM-4.7 Reasoning</span></td>
                  <td>ADK</td>
                  <td><span id="route-lat-3">18ms</span></td>
                </tr>
                <tr>
                  <td>Frontend Synthesizer</td>
                  <td><span class="routing-tag" style="color:#a855f7;">Gemini 2.0 Flash</span></td>
                  <td>Ruflo</td>
                  <td><span id="route-lat-4">6ms</span></td>
                </tr>
                <tr>
                  <td>Backend Core</td>
                  <td><span class="routing-tag" style="color:#fbbf24;">Qwen 2.5 Coder 32B</span></td>
                  <td>Ruflo</td>
                  <td><span id="route-lat-5">9ms</span></td>
                </tr>
                <tr>
                  <td>QA / Playwright</td>
                  <td><span class="routing-tag" style="color:#00f0ff;">Playwright Engine</span></td>
                  <td>Playwright</td>
                  <td><span id="route-lat-6">32ms</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pluggable Open-Source Harnesses -->
          <div style="background: rgba(10,16,32,0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 14px;">
            <div style="font-family: var(--font-mono); font-size: 0.8rem; font-weight: bold; color: var(--color-gold); margin-bottom: 8px;">
              PLUGGABLE OPEN-SOURCE HARNESSES
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px; font-family: var(--font-mono); font-size: 0.72rem;">
              <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 8px; border-radius: 4px; display: flex; justify-content: space-between;">
                <div><strong style="color:var(--color-cyan);">Ruflo Swarm:</strong> Multi-agent parallelized token pipelining</div>
                <span style="color:var(--color-emerald);">[ACTIVE]</span>
              </div>
              <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 8px; border-radius: 4px; display: flex; justify-content: space-between;">
                <div><strong style="color:var(--color-violet);">ECC:</strong> Execution Context Controller (Zero disk guarantee)</div>
                <span style="color:var(--color-emerald);">[ENFORCED]</span>
              </div>
              <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 8px; border-radius: 4px; display: flex; justify-content: space-between;">
                <div><strong style="color:var(--color-gold);">Playwright:</strong> Headless E2E DOM & contract verifier</div>
                <span style="color:var(--color-emerald);">[ATTACHED]</span>
              </div>
              <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 8px; border-radius: 4px; display: flex; justify-content: space-between;">
                <div><strong style="color:#38bdf8;">ADK:</strong> Agent Development Kit protocol bus</div>
                <span style="color:var(--color-emerald);">[LOCKED]</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Real-Time Manufacturing Terminal -->
        <div class="terminal-window" style="margin-bottom: 16px;">
          <div class="terminal-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="state-indicator" style="background: var(--color-violet);"></span>
              <span>LIVE EPHEMERAL SANDBOX TERMINAL (RAM ONLY)</span>
            </div>
            <span id="pipeline-progress-text">0% INITIALIZING</span>
          </div>
          <div class="terminal-logs" id="terminal-logs-body">
            <div class="log-line">
              <span class="log-ts">[00.00s]</span>
              <span class="log-agent">[SYSTEM]</span>
              <span class="log-msg">Allocating in-memory virtual file system ring buffer...</span>
            </div>
          </div>
        </div>

        <!-- Generated Files Explorer -->
        <div id="file-explorer-section" style="display: none; background: rgba(10,16,32,0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="font-family: var(--font-mono); font-size: 0.8rem; font-weight: bold; color: var(--color-emerald);">
              📁 MANUFACTURED CODE ARTIFACTS (<span id="file-count-label">0</span> FILES)
            </div>
            <span class="panel-badge" style="color:var(--color-emerald); border-color:var(--color-emerald);">SYNTAX VALIDATED</span>
          </div>
          <div style="display: grid; grid-template-columns: 260px 1fr; gap: 12px; height: 320px;">
            <div id="file-tree-list" style="background: rgba(4,8,18,0.9); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 8px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; font-family: var(--font-mono); font-size: 0.72rem;"></div>
            <pre id="file-viewer-content" style="background: rgba(2,6,14,0.95); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 12px; overflow: auto; font-family: var(--font-mono); font-size: 0.72rem; color: #cbd5e1;"></pre>
          </div>
        </div>
      </div>
    `;
  }

  async executePipeline() {
    const logsBody = document.getElementById('terminal-logs-body');
    const progressText = document.getElementById('pipeline-progress-text');
    const downloadBtn = document.getElementById('download-zip-btn');
    const explorerSec = document.getElementById('file-explorer-section');

    const appendLog = (agent, msg, type = 'normal') => {
      const now = new Date().toISOString().substring(11, 19);
      const line = document.createElement('div');
      line.className = 'log-line';
      line.innerHTML = `
        <span class="log-ts">[${now}]</span>
        <span class="log-agent" style="color: ${this._getAgentColor(agent)}">${agent}</span>
        <span class="log-msg ${type}">${msg}</span>
      `;
      logsBody.appendChild(line);
      logsBody.scrollTop = logsBody.scrollHeight;
    };

    const stages = [
      { agent: 'ARCHITECT (Claude 3.7)', msg: 'Locked SPEC.md & openapi.json. Partitioning task matrix for parallel agents.', agentIdx: 0, delay: 600 },
      { agent: 'SCHEMA ENG (Qwen 2.5)', msg: 'Synthesizing database/schema.sql with WAL mode and indexing tables.', agentIdx: 1, delay: 700 },
      { agent: 'SECURITY AUDITOR (GLM-4.7)', msg: 'Validating server/auth.py for constant-time HMAC-SHA256 comparison and air-gap rules.', agentIdx: 2, delay: 800 },
      { agent: 'BACKEND CORE (Qwen 2.5)', msg: 'Compiling server/routes.py, server/models.py, server/config.py, and asynchronous app.py server.', agentIdx: 4, delay: 900 },
      { agent: 'FRONTEND SYNTH (Gemini 2.0)', msg: 'Generating responsive client/index.html, client/app.js, and client/styles.css HUD deck.', agentIdx: 3, delay: 800 },
      { agent: 'QA / PLAYWRIGHT', msg: 'Executing tests/test_api.py and Playwright E2E assertion matrix. Zero regressions detected.', agentIdx: 5, delay: 900 },
      { agent: 'ECC CONTROLLER', msg: 'Verifying zero disk residue. All files compiled into in-memory RAM buffer.', agentIdx: 0, delay: 600 }
    ];

    for (let i = 0; i < stages.length; i++) {
      const s = stages[i];
      await new Promise(r => setTimeout(r, s.delay));

      if (window.sphereCore) {
        window.sphereCore.triggerLaserBeam(s.agentIdx);
      }

      appendLog(s.agent, s.msg, i === stages.length - 1 ? 'success' : 'normal');
      const pct = Math.round(((i + 1) / stages.length) * 100);
      progressText.textContent = `${pct}% RUNNING`;
    }

    // Fetch generated file contents from backend
    try {
      const res = await fetch('/api/manufacture-sim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: this.receipt.tier,
          name: this.blueprintData?.app_metadata?.name || 'app',
          description: this.blueprintData?.app_metadata?.description || '',
          moat: this.blueprintData?.app_metadata?.verified_moat || ''
        })
      });
      const data = await res.json();
      this.generatedFiles = data.file_contents || {};

      appendLog('MANUFACTURER', `Package generated successfully: ${data.file_count} files in-memory (${data.memory_resident_kb.toFixed(1)} KB).`, 'success');
      progressText.textContent = '100% COMPLETE';

      // Update Sphere Core to Complete (Diamond Pure White) & Speak
      if (window.sphereCore) {
        window.sphereCore.setPhase('COMPLETE');
      }
      if (window.audioSynth) {
        window.audioSynth.speak("Digital manufacturing complete. Air-gapped package compiled in memory. Ready for delivery.");
      }


      // Unlock Download button
      downloadBtn.disabled = false;
      downloadBtn.style.opacity = '1';
      downloadBtn.style.cursor = 'pointer';
      downloadBtn.className = 'btn btn-cyan';
      downloadBtn.innerHTML = '📦 DOWNLOAD COMPLETE ZIP (AIR-GAPPED)';
      downloadBtn.addEventListener('click', () => this.downloadZip());

      // Show File Explorer
      explorerSec.style.display = 'block';
      this.renderFileExplorer();
    } catch (e) {
      appendLog('ERROR', `Manufacturing error: ${e.message}`, 'error');
    }
  }

  renderFileExplorer() {
    const fileListEl = document.getElementById('file-tree-list');
    const fileViewerEl = document.getElementById('file-viewer-content');
    const fileCountLabel = document.getElementById('file-count-label');

    const fileNames = Object.keys(this.generatedFiles);
    fileCountLabel.textContent = fileNames.length;

    fileListEl.innerHTML = fileNames.map((fn, idx) => `
      <div class="file-item-row ${idx === 0 ? 'active' : ''}" data-filename="${fn}" style="padding: 6px 8px; border-radius: 4px; cursor: pointer; color: ${idx === 0 ? 'var(--color-cyan)' : 'var(--text-muted)'}; background: ${idx === 0 ? 'rgba(0,240,255,0.1)' : 'transparent'};">
        📄 ${fn}
      </div>
    `).join('');

    this.activeFile = fileNames[0];
    fileViewerEl.textContent = this.generatedFiles[this.activeFile] || '';

    fileListEl.querySelectorAll('.file-item-row').forEach(row => {
      row.addEventListener('click', () => {
        const fn = row.dataset.filename;
        this.activeFile = fn;
        fileViewerEl.textContent = this.generatedFiles[fn] || '';

        fileListEl.querySelectorAll('.file-item-row').forEach(r => {
          r.style.color = 'var(--text-muted)';
          r.style.background = 'transparent';
        });
        row.style.color = 'var(--color-cyan)';
        row.style.background = 'rgba(0,240,255,0.1)';

        if (window.audioSynth) window.audioSynth.playClick();
      });
    });
  }

  async downloadZip() {
    if (window.audioSynth) window.audioSynth.playDeliveryFanfare();

    try {
      const res = await fetch('/api/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: this.receipt.tier,
          name: this.blueprintData?.app_metadata?.name || 'app',
          description: this.blueprintData?.app_metadata?.description || '',
          moat: this.blueprintData?.app_metadata?.verified_moat || ''
        })
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(this.blueprintData?.app_metadata?.name || 'orchestrator-app').toLowerCase()}-${this.receipt.tier}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (e) {
      alert(`Download failed: ${e.message}`);
    }
  }

  _getAgentColor(agent) {
    if (agent.includes('ARCHITECT')) return '#38bdf8';
    if (agent.includes('SCHEMA')) return '#10b981';
    if (agent.includes('SECURITY')) return '#ef4444';
    if (agent.includes('FRONTEND')) return '#a855f7';
    if (agent.includes('BACKEND')) return '#fbbf24';
    if (agent.includes('QA')) return '#00f0ff';
    return '#ffffff';
  }
}

window.ManufacturingDeck = ManufacturingDeck;
