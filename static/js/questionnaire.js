/**
 * 15-Point Discovery & Architecture Questionnaire
 */

const ARCHITECTURE_PRESETS = {
  fintech: {
    name: 'Aether-Settlement-Engine',
    tier: 'single',
    description: 'Sub-millisecond air-gapped cryptographic ledger and double-entry transaction settlement appliance.',
    moat: 'Custom zero-allocation ring buffer ledger with continuous SHA-256 state chain verification.',
    auth: 'Stateless Air-Gapped JWT + Ed25519 Signatures',
    database: 'SQLite WAL with memory-mapped I/O',
    entities: 'Account(id, balance, nonce), LedgerEntry(id, debit_acc, credit_acc, amount, signature), AuditProof(id, block_hash)',
    routes: 'POST /api/v1/transfer, GET /api/v1/ledger/proof, GET /api/v1/accounts/{id}/balance'
  },
  swarm: {
    name: 'Swarm-Nexus-Deck',
    tier: 'single',
    description: 'Autonomous multi-agent orchestration console with dynamic sub-task routing and DAG visualization.',
    moat: 'Immutable execution contracts preventing context drift across isolated sub-agents.',
    auth: 'Ephemeral Session Tokens with Air-Gap Handshake',
    database: 'In-Memory Key-Value with SQLite WAL fallback',
    entities: 'AgentNode(id, role, status), TaskDAG(id, step_index, status), TelemetryEvent(id, token_rate)',
    routes: 'POST /api/v1/tasks/dispatch, GET /api/v1/agents/telemetry, GET /api/v1/dag/graph'
  },
  citadel: {
    name: 'Citadel-Enterprise-Cloud',
    tier: 'citadel',
    description: 'Multi-tenant high-throughput enterprise governance platform with row-level tenant isolation.',
    moat: 'Cryptographic tenant partition isolation with sub-millisecond distributed batch worker scheduling.',
    auth: 'Multi-Tenant JWT with Role Masking & RBAC/ABAC',
    database: 'PostgreSQL with Row Level Security (RLS)',
    entities: 'Tenant(id, slug, quota), User(id, tenant_id, role_mask), Task(id, tenant_id, status, payload)',
    routes: 'GET /api/v1/tenants, POST /api/v1/tasks, GET /api/v1/cluster/metrics'
  },
  medical: {
    name: 'Aegis-Biometrics-Vault',
    tier: 'single',
    description: 'Air-gapped biometric identity vault with zero external cloud telemetry and zero-footprint retention.',
    moat: 'Zero hard-drive footprint biometric hash matching with constant-time cryptographic verification.',
    auth: 'Hardware Key Air-gap Handshake',
    database: 'Encrypted In-Memory SQLite Vault',
    entities: 'SubjectIdentity(id, biometric_hash, clearance_level), AccessRecord(id, timestamp, clearance)',
    routes: 'POST /api/v1/verify/biometric, GET /api/v1/vault/audit, POST /api/v1/lockdown'
  }
};

class DiscoveryQuestionnaire {
  constructor(options) {
    this.onComplete = options.onComplete || (() => {});
    this.currentStep = 1;
    this.totalSteps = 15;
    this.formData = {};

    this.steps = [
      { id: 1, title: '1. Product Core & Appliance Name', field: 'name', type: 'text', placeholder: 'e.g. Aether-Settlement-Engine', default: 'Aether-Settlement-Engine' },
      { id: 2, title: '2. Target Architecture Tier', field: 'tier', type: 'select', options: [
        { value: 'single', label: '$100 Single-Session Build (Air-gapped, ~20-file complete ZIP)' },
        { value: 'citadel', label: '$300 Multi-Session Citadel (Multi-tenant enterprise platform)' }
      ]},
      { id: 3, title: '3. Technical Moat & Algorithmic Defensibility', field: 'moat', type: 'textarea', placeholder: 'Describe your proprietary algorithm, air-gap boundary, or speed moat...', default: 'Zero-allocation ring buffer ledger with continuous SHA-256 state chain verification.' },
      { id: 4, title: '4. Executive Summary & Problem Scope', field: 'description', type: 'textarea', placeholder: 'Core functionality and boundaries...', default: 'Sub-millisecond air-gapped cryptographic ledger and double-entry transaction settlement appliance.' },
      { id: 5, title: '5. Actor Personas & RBAC Hierarchy', field: 'rbac', type: 'text', placeholder: 'e.g. ROOT_ADMIN, SECURITY_AUDITOR, OPERATOR', default: 'ADMINISTRATOR, SECURITY_AUDITOR, OPERATOR' },
      { id: 6, title: '6. Domain Entities & Relational Schema', field: 'entities', type: 'textarea', placeholder: 'e.g. Account(id, balance), Transaction(id, amount, status)', default: 'Account(id, balance, nonce), LedgerEntry(id, debit_acc, credit_acc, amount), AuditProof(id, block_hash)' },
      { id: 7, title: '7. Authentication & Security Boundary', field: 'auth', type: 'select', options: [
        { value: 'Stateless Air-Gapped JWT', label: 'Stateless Air-Gapped JWT (Constant-Time HMAC)' },
        { value: 'Mutual TLS & Hardware Key', label: 'Mutual TLS & Hardware Key Signing' },
        { value: 'Multi-Tenant RBAC Masked JWT', label: 'Multi-Tenant RBAC Masked JWT (Citadel Tier)' }
      ]},
      { id: 8, title: '8. Primary API Routes & Contracts', field: 'routes', type: 'textarea', placeholder: 'e.g. GET /api/v1/health, POST /api/v1/transactions', default: 'GET /api/v1/health, POST /api/v1/auth/login, POST /api/v1/transfer, GET /api/v1/ledger/proof' },
      { id: 9, title: '9. Relational Storage & Database Engine', field: 'database', type: 'select', options: [
        { value: 'SQLite WAL', label: 'SQLite in WAL mode (Zero-dependency embedded speed)' },
        { value: 'PostgreSQL RLS', label: 'PostgreSQL with Row-Level-Security (Enterprise Citadel)' },
        { value: 'In-Memory Ring Buffer', label: 'In-Memory Ring Buffer (Zero Disk Retention)' }
      ]},
      { id: 10, title: '10. Realtime / Event Stream Architecture', field: 'realtime', type: 'text', placeholder: 'e.g. Server-Sent Events (SSE) telemetry broadcast', default: 'Server-Sent Events (SSE) sub-millisecond telemetry broadcast' },
      { id: 11, title: '11. UI Component Hierarchy & Design Tokens', field: 'ui_tokens', type: 'text', placeholder: 'e.g. Cybernetic HUD, Glassmorphism, Dark Mode', default: 'Cybernetic HUD, Glassmorphic panels, Dark Monospace Telemetry' },
      { id: 12, title: '12. State Management & Cache Invalidation', field: 'caching', type: 'text', placeholder: 'e.g. Optimistic UI with strict monotonic versioning', default: 'Optimistic UI with strict monotonic versioning & lockless ring buffer' },
      { id: 13, title: '13. Edge Cases & Concurrency Handling', field: 'concurrency', type: 'text', placeholder: 'e.g. Double-spend prevention, worker restart replay', default: 'Double-spend mutex lock, idempotency keys, WAL crash recovery' },
      { id: 14, title: '14. Automated Harness & Playwright Specs', field: 'testing', type: 'text', placeholder: 'e.g. Playwright E2E + Unit Tests + Route Fuzzing', default: 'Playwright E2E + Unit Tests + Route Fuzzing + Boundary Audit' },
      { id: 15, title: '15. Delivery & Zero-Footprint Verification', field: 'delivery', type: 'text', placeholder: 'e.g. In-memory ZIP compilation with zero disk retention', default: 'In-memory ZIP compilation with zero disk retention' }
    ];

    this.container = document.getElementById('questionnaire-container');
    this.render();
  }

  loadPreset(presetKey) {
    const preset = ARCHITECTURE_PRESETS[presetKey];
    if (!preset) return;

    this.formData = { ...this.formData, ...preset };
    this.currentStep = 1;
    this.render();

    if (window.audioSynth) window.audioSynth.playNodeLock();
  }

  render() {
    if (!this.container) return;
    const step = this.steps[this.currentStep - 1];

    this.container.innerHTML = `
      <div class="questionnaire-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-cyan);">
            STEP ${this.currentStep} OF ${this.totalSteps}
          </span>
          <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-dim);">
            ${Math.round((this.currentStep / this.totalSteps) * 100)}% COMPLETE
          </div>
        </div>

        <!-- Progress Bar -->
        <div style="height: 4px; background: rgba(255,255,255,0.06); border-radius: 2px; margin-bottom: 16px; overflow: hidden;">
          <div style="width: ${(this.currentStep / this.totalSteps) * 100}%; height: 100%; background: var(--color-cyan); box-shadow: 0 0 8px var(--color-cyan); transition: width 0.3s ease;"></div>
        </div>

        <h3 style="font-family: var(--font-mono); font-size: 0.95rem; color: var(--text-main); margin-bottom: 12px;">
          ${step.title}
        </h3>

        <div class="form-group">
          ${this._renderInput(step)}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
          <button id="q-prev-btn" class="btn btn-secondary" style="font-size: 0.75rem; padding: 8px 14px;" ${this.currentStep === 1 ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''}>
            ← PREV
          </button>
          
          <div style="display: flex; gap: 8px;">
            ${this.currentStep < this.totalSteps ? `
              <button id="q-next-btn" class="btn btn-cyan" style="font-size: 0.75rem; padding: 8px 16px;">
                NEXT STEP →
              </button>
            ` : `
              <button id="q-submit-btn" class="btn btn-gold" style="font-size: 0.75rem; padding: 8px 18px;">
                RESOLVE CLARITY (5-6) ❖
              </button>
            `}
          </div>
        </div>
      </div>
    `;

    this._bindStepEvents(step);
  }

  _renderInput(step) {
    const val = this.formData[step.field] !== undefined ? this.formData[step.field] : (step.default || '');
    if (step.type === 'select') {
      return `
        <select id="step-field-input" class="form-select">
          ${step.options.map(opt => `
            <option value="${opt.value}" ${val === opt.value ? 'selected' : ''}>${opt.label}</option>
          `).join('')}
        </select>
      `;
    } else if (step.type === 'textarea') {
      return `
        <textarea id="step-field-input" class="form-textarea" rows="4" placeholder="${step.placeholder || ''}">${val}</textarea>
      `;
    } else {
      return `
        <input type="text" id="step-field-input" class="form-input" value="${val}" placeholder="${step.placeholder || ''}" />
      `;
    }
  }

  _bindStepEvents(step) {
    const input = document.getElementById('step-field-input');
    const prevBtn = document.getElementById('q-prev-btn');
    const nextBtn = document.getElementById('q-next-btn');
    const submitBtn = document.getElementById('q-submit-btn');

    if (prevBtn && this.currentStep > 1) {
      prevBtn.addEventListener('click', () => {
        this._saveField(step, input);
        this.currentStep--;
        this.render();
        if (window.audioSynth) window.audioSynth.playClick();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this._saveField(step, input);
        this.currentStep++;
        this.render();
        if (window.audioSynth) window.audioSynth.playClick();
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        this._saveField(step, input);
        if (window.audioSynth) {
          window.audioSynth.playNodeLock();
          window.audioSynth.speak("Discovery intake locked. Analyzing architectural vectors for structural ambiguities.");
        }
        this.onComplete(this.formData);
      });
    }

  }

  _saveField(step, input) {
    if (input) {
      this.formData[step.field] = input.value;
    }
  }
}

window.DiscoveryQuestionnaire = DiscoveryQuestionnaire;
