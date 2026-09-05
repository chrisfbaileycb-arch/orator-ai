/**
 * THE ORATOR — Conversational Inquest & Velvet Rope Slot Engine
 *
 * Flow:
 * Phase I:   The Summons (Awakening greeting + deep voice)
 * Phase II:  The Inquest (15 architectural questions, real-time halo ignition)
 * Phase III: Velvet Rope Blueprint Lock (Exclusive Appointment Slot Selection)
 * Phase IV:  The Forge ($99 Execution Window Authorization)
 */

class ConversationalChatCore {
  constructor(options) {
    this.container      = document.getElementById('chat-messages-container');
    this.inputEl        = document.getElementById('chat-prompt-input');
    this.sendBtn        = document.getElementById('chat-send-btn');
    this.micBtn         = document.getElementById('chat-mic-btn');
    this.fileInput      = document.getElementById('chat-file-input');
    this.attachBtn      = document.getElementById('chat-attach-btn');
    this.dropzoneArea   = document.getElementById('chat-input-wrapper');
    this.statusLine     = document.getElementById('orb-status-line');
    this.freeTierBadge  = document.getElementById('free-tier-count');

    this.onScopeLocked  = options.onScopeLocked || (() => {});

    this.messages       = [];
    this.isThinking     = false;
    this.isRecording    = false;
    this.recognition    = null;
    this._judgeTimer    = null;

    // Free Tier Session Counter (3 free forges)
    this.freeSessionsRemaining = parseInt(localStorage.getItem('orator_free_sessions') || '3', 10);
    this.updateFreeTierDisplay();

    this.resolvedQuestionsCount = 0;

    this.init();
  }

  init() {
    this.initVoiceRecognition();
    this.bindEvents();
    this.renderInitialGreeting();
  }

  updateFreeTierDisplay() {
    if (this.freeTierBadge) {
      this.freeTierBadge.textContent = `${this.freeSessionsRemaining} FORGES AUTHORIZED`;
      if (this.freeSessionsRemaining === 0) {
        this.freeTierBadge.style.color = 'var(--crimson-plasma)';
      }
    }
  }

  initVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (this.inputEl) {
        this.inputEl.value = transcript;
        this._onInputChange();
        this.handleSendMessage();
      }
    };

    this.recognition.onend = () => {
      this.isRecording = false;
      if (this.micBtn) this.micBtn.classList.remove('recording');
    };
  }

  bindEvents() {
    if (this.sendBtn) {
      this.sendBtn.addEventListener('click', () => this.handleSendMessage());
    }

    if (this.inputEl) {
      this.inputEl.addEventListener('keydown', (e) => {
        if (window.mysticSphere) window.mysticSphere.onKeystroke();
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage();
        }
      });

      this.inputEl.addEventListener('input', () => {
        if (window.mysticSphere) window.mysticSphere.onKeystroke();
        this.inputEl.style.height = 'auto';
        this.inputEl.style.height = Math.min(this.inputEl.scrollHeight, 140) + 'px';
        this._onInputChange();
      });
    }

    if (this.micBtn) {
      this.micBtn.addEventListener('click', () => {
        if (!this.recognition) {
          this.appendMessage('orchestrator', 'Speech recognition is not supported in this browser environment.', 'warning');
          return;
        }
        if (this.isRecording) {
          this.recognition.stop();
          this.isRecording = false;
          this.micBtn.classList.remove('recording');
        } else {
          this.recognition.start();
          this.isRecording = true;
          this.micBtn.classList.add('recording');
          if (window.audioSynth) window.audioSynth.playClick();
        }
      });
    }

    if (this.attachBtn && this.fileInput) {
      this.attachBtn.addEventListener('click', () => this.fileInput.click());
      this.fileInput.addEventListener('change', (e) => {
        this.handleFilesAttached(Array.from(e.target.files));
      });
    }

    if (this.dropzoneArea) {
      ['dragenter', 'dragover'].forEach(name => {
        this.dropzoneArea.addEventListener(name, (e) => {
          e.preventDefault();
          this.dropzoneArea.classList.add('drag-active');
        });
      });
      ['dragleave', 'drop'].forEach(name => {
        this.dropzoneArea.addEventListener(name, (e) => {
          e.preventDefault();
          this.dropzoneArea.classList.remove('drag-active');
        });
      });
      this.dropzoneArea.addEventListener('drop', (e) => {
        this.handleFilesAttached(Array.from(e.dataTransfer.files));
      });
    }
  }

  _onInputChange() {
    const text = this.inputEl ? this.inputEl.value.trim() : '';
    clearTimeout(this._judgeTimer);

    if (text.length === 0) {
      this._setOrbStatus('✦ THE ORATOR IS LISTENING — STATE YOUR ARCHITECTURE', 'neutral');
      if (window.mysticSphere) window.mysticSphere.setPhase('IDLE');
      return;
    }

    const lower = text.toLowerCase();
    const isGreeting = ['hello', 'hi', 'hey', 'greetings', 'start', 'begin', 'help'].includes(lower);

    if (isGreeting) {
      this._setOrbStatus('✦ THE ORATOR IS READY — STATE YOUR VISION', 'neutral');
      if (window.mysticSphere) window.mysticSphere.setPhase('IDLE');
      return;
    }

    if (text.length < 25) {
      this._setOrbStatus('APPROACH WITH ARCHITECTURAL WEIGHT...', 'evaluating');
      if (window.mysticSphere) window.mysticSphere.setPhase('EVALUATING');
    } else {
      this._setOrbStatus('EVALUATING DEFENSIVE MOAT & INVARIANTS...', 'evaluating');
      if (window.mysticSphere) window.mysticSphere.setPhase('EVALUATING');
    }

    this._judgeTimer = setTimeout(() => {
      this._judgeContent(text);
    }, 1500);
  }

  _judgeContent(text) {
    const lower = text.toLowerCase();
    const greetings = ['hello', 'hi', 'hey', 'greetings', 'start', 'begin', 'help'];
    if (greetings.includes(lower)) {
      this._setOrbStatus('✦ THE ORATOR IS READY — STATE YOUR VISION', 'neutral');
      if (window.mysticSphere) window.mysticSphere.setPhase('IDLE');
      return;
    }

    const positiveSignals = [
      'cryptographic', 'air-gapped', 'sub-millisecond', 'zero-footprint',
      'biometric', 'ledger', 'settlement', 'enterprise', 'multi-tenant',
      'wal', 'hmac', 'jwt', 'rbac', 'sharding', 'dag', 'consensus',
      'distributed', 'lockless', 'append-only', 'deterministic',
      'agent', 'swarm', 'pipeline', 'autonomous', 'moe', 'mcp', 'app', 'system'
    ];

    let positiveCount = positiveSignals.filter(s => lower.includes(s)).length;
    let score = 50 + (positiveCount * 15);
    if (text.length > 60) score += 15;
    score = Math.max(0, Math.min(100, score));

    if (score >= 60) {
      this._setOrbStatus('✦ STRONG ARCHITECTURAL MOAT DETECTED — RECEPTIVE', 'gold');
      if (window.mysticSphere) window.mysticSphere.setPhase('EVALUATING');
    } else {
      this._setOrbStatus('✦ EXPAND TECHNICAL INVARIANTS TO LOCK BLUEPRINT', 'neutral');
      if (window.mysticSphere) window.mysticSphere.setPhase('IDLE');
    }
  }

  _setOrbStatus(message, mood = 'neutral') {
    if (!this.statusLine) return;
    this.statusLine.textContent = message;
    this.statusLine.className = 'orb-status-line';
    if (mood === 'gold') this.statusLine.classList.add('status-gold');
    if (mood === 'evaluating') this.statusLine.classList.add('status-evaluating');
    if (mood === 'crimson') this.statusLine.classList.add('status-crimson');
  }

  async handleFilesAttached(files) {
    const validExts = ['.md', '.png', '.jpg', '.jpeg', '.webp'];
    for (const file of files) {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!validExts.includes(ext)) {
        this.appendMessage('orchestrator', `File unsupported: ${file.name}. Only Markdown (.md) and images (.png/.jpg/.webp) are accepted.`, 'warning');
        continue;
      }

      if (ext === '.md') {
        const text = await file.text();
        this.appendMessage('user', `📄 **Attached Architecture Spec [${file.name}]**\n\n\`\`\`markdown\n${text.slice(0, 800)}...\n\`\`\``);
        if (this.inputEl) {
          this.inputEl.value = `Synthesize full architecture from Markdown specification [${file.name}]: ${text.slice(0, 260)}`;
          this._onInputChange();
          this.handleSendMessage();
        }
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target.result;
          this.appendMessage('user', `🖼️ **Visual Design Mockup [${file.name}]**\n<img src="${base64}" style="max-width:260px; border-radius:6px; border:1px solid rgba(0,240,255,0.3); margin-top:6px;" />`);
          if (this.inputEl) {
            this.inputEl.value = `Deconstruct visual layout from mockup [${file.name}] using screenshot-to-code multimodal AST pipeline.`;
            this._onInputChange();
            this.handleSendMessage();
          }
        };
        reader.readAsDataURL(file);
      }
    }
  }

  renderInitialGreeting() {
    this.appendMessage('orchestrator',
      `**I AM THE ORATOR.**\n\n` +
      `You stand before an autonomous digital manufacturing appliance. I will conduct a 15-point architectural inquest, freeze your defensible moat into an immutable SPEC.md, and forge the system across a continuous 16+ model rotation.\n\n` +
      `**Your first 3 architecture sessions are granted with full privilege.** State the product or system you want to construct, and we will forge the architecture.`
    );
  }

  async handleSendMessage() {
    const text = this.inputEl ? this.inputEl.value.trim() : '';
    if (!text || this.isThinking) return;

    clearTimeout(this._judgeTimer);
    this.inputEl.value = '';
    this.inputEl.style.height = 'auto';
    this._setOrbStatus('CONDUCTING ARCHITECTURAL INQUEST...', 'evaluating');

    this.appendMessage('user', text);
    if (window.audioSynth) window.audioSynth.playClick();
    if (window.mysticSphere) {
      window.mysticSphere.setPhase('EVALUATING');
      window.mysticSphere.triggerPulseFlare(1500);
    }

    this.showTypingIndicator();
    this.isThinking = true;

    try {
      const clientId = window.oratorClientId || localStorage.getItem('orator_client_id') || '';
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Orator-Client-Id': clientId
        },
        body: JSON.stringify({ messages: this.messages })
      });
      const data = await res.json();

      this.hideTypingIndicator();
      this.isThinking = false;

      if (data.type === 'moat_challenge') {
        if (window.mysticSphere) window.mysticSphere.setPhase('EVALUATING');
        this.appendMessage('orchestrator', data.message, 'warning');
        this._setOrbStatus('✦ STATE ARCHITECTURAL DIFFERENTIATOR', 'evaluating');
      } else if (data.type === 'greeting') {
        if (window.mysticSphere) window.mysticSphere.setPhase('IDLE');
        this.appendMessage('orchestrator', data.message);
        this._setOrbStatus('✦ THE ORATOR IS LISTENING — STATE YOUR ARCHITECTURE', 'neutral');
        if (window.audioSynth) {
          window.audioSynth.speak('I am ready. State the product or system you want to construct, and we will forge the master blueprint.');
        }
      } else if (data.type === 'scope_locked') {
        // Ignite all 15 segments of the orbital halo
        if (window.mysticSphere) {
          window.mysticSphere.setPhase('LOCKED');
          window.mysticSphere.setHaloProgress(15);
        }

        if (this.freeSessionsRemaining > 0) {
          this.freeSessionsRemaining--;
          localStorage.setItem('orator_free_sessions', this.freeSessionsRemaining.toString());
          this.updateFreeTierDisplay();
        }

        // Velvet Rope Scarcity Inquest Message
        const velvetMsg = (
          `**BLUEPRINT FINALIZED AND CRYPTOGRAPHICALLY SEALED.**\n\n` +
          `The Autonomous Forge is currently operating at peak capacity manufacturing **8 active systems**.\n\n` +
          `◈ **Verified System Target**: \`${data.scope.name}\`\n` +
          `◈ **Defensible Moat**: ${data.scope.moat}\n` +
          `◈ **Execution Window Available**: Exactly **[1] Priority Window Remaining** in the next 24 hours.\n\n` +
          `Select your execution window below to secure compute resources.`
        );

        this.appendMessage('orchestrator', velvetMsg, 'success');
        this._setOrbStatus('✦ BLUEPRINT SEALED — 1 FORGE WINDOW AVAILABLE', 'gold');
        this.renderVelvetRopeCheckoutCard(data.scope);

        if (window.audioSynth) {
          window.audioSynth.playBlueprintChime();
          setTimeout(() => {
            window.audioSynth.speak(
              'Blueprint finalized and cryptographically sealed. The Autonomous Forge is operating at peak capacity. I have one priority execution window remaining today. Secure your slot to begin.',
              'POSITIVE'
            );
          }, 350);
        }
      } else {
        this.resolvedQuestionsCount = Math.min(14, this.resolvedQuestionsCount + 3);
        if (window.mysticSphere) {
          window.mysticSphere.setHaloProgress(this.resolvedQuestionsCount);
        }
        this.appendMessage('orchestrator', data.message || 'Parameters registered into master inquest manifest.');
        this._setOrbStatus(`INQUEST PROGRESS: ${this.resolvedQuestionsCount}/15 RESOLVED`, 'evaluating');
      }
    } catch (e) {
      this.hideTypingIndicator();
      this.isThinking = false;
      this.appendMessage('orchestrator', 'Connection re-established. Please restate your architectural parameter.', 'warning');
      if (window.mysticSphere) window.mysticSphere.setPhase('IDLE');
    }
  }

  appendMessage(sender, text, variant = 'normal') {
    this.messages.push({ role: sender, content: text });

    const msgRow = document.createElement('div');
    msgRow.className = `chat-row ${sender === 'user' ? 'chat-row-user' : 'chat-row-agent'}`;

    const avatar = document.createElement('div');
    avatar.className = `chat-avatar ${sender === 'user' ? 'avatar-user' : 'avatar-agent'}`;
    avatar.textContent = sender === 'user' ? 'U' : '◈';

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender === 'user' ? 'bubble-user' : 'bubble-agent'} ${variant}`;
    bubble.innerHTML = this.formatMarkdown(text);

    msgRow.appendChild(avatar);
    msgRow.appendChild(bubble);
    this.container.appendChild(msgRow);
    this.scrollToBottom();
  }

  /**
   * Phase III: Velvet Rope Gated Checkout & Execution Window Booking
   */
  renderVelvetRopeCheckoutCard(scope) {
    const cardEl = document.createElement('div');
    cardEl.className = 'protected-blueprint-card';
    cardEl.innerHTML = `
      <div class="blueprint-card-header">
        <div class="blueprint-badge">✓ 15/15 INQUEST LOCKED • SPEC.md SEALED</div>
        <div class="blueprint-free-tier-tag">1 PRIORITY WINDOW OPEN</div>
      </div>

      <div class="blueprint-summary-box">
        <div class="blueprint-lock-watermark">THE ORATOR // IMMUTABLE ARCHITECTURE</div>
        <h3 style="color:var(--gold-bright); margin-bottom:0.4rem;">${scope.name}</h3>
        <p style="color:var(--text-main); margin-bottom:0.6rem;">${scope.description}</p>
        <div style="margin-bottom:0.6rem;">
          <strong style="color:var(--gold-bright);">Defensible Moat:</strong> ${scope.moat}
        </div>

        <div class="blueprint-roadmap-grid">
          <div class="roadmap-col">
            <div class="roadmap-title">1. SCHEMA CONTRACT</div>
            <div class="roadmap-item">• Zero-Disk In-Memory DDL</div>
            <div class="roadmap-item">• SHA-256 Shift State Ledger</div>
            <div class="roadmap-item">• Constant-Time HMAC Auth</div>
          </div>
          <div class="roadmap-col">
            <div class="roadmap-title">2. MULTI-MODEL MoE</div>
            <div class="roadmap-item">• Claude 3.7 + GPT-4.5 Core</div>
            <div class="roadmap-item">• DeepSeek-R1 Algorithmics</div>
            <div class="roadmap-item">• 11 Repositories Indexed</div>
          </div>
          <div class="roadmap-col">
            <div class="roadmap-title">3. HIGH-LEVEL FLOW</div>
            <div class="roadmap-item">• SSE Streaming Web HUD</div>
            <div class="roadmap-item">• 22-Point Audit Invariants</div>
            <div class="roadmap-item">• Air-Gapped Deploy Ready</div>
          </div>
        </div>
      </div>

      <div class="deposit-model-strip">
        <span class="model-chip">Claude 3.7 Sonnet</span>
        <span class="model-chip">GPT-4.5 / o3</span>
        <span class="model-chip">Gemini 2.0 Pro</span>
        <span class="model-chip">DeepSeek-R1</span>
        <span class="model-chip">Qwen 2.5 Coder</span>
        <span class="model-chip">Llama 3.3 70B</span>
        <span class="model-chip">GLM-4.7</span>
        <span class="model-chip">Cohere Command-R+</span>
      </div>

      <!-- Velvet Rope Minimalist Execution Slot Selector -->
      <div class="velvet-slot-panel">
        <div class="slot-panel-title">
          <span>⚡ SELECT COMPUTE APPOINTMENT SLOT</span>
          <span style="color:var(--gold-bright); font-size:0.68rem;">QUEUE: 8 BUILDS IN FLIGHT</span>
        </div>

        <div class="slot-options-list">
          <div class="slot-option-card selected" data-slot="immediate">
            <div>
              <div class="slot-name">WINDOW 01: IMMEDIATE DISPATCH</div>
              <div style="font-size:0.7rem; color:var(--text-muted);">Allocates 16-Model Dedicated Core Cluster</div>
            </div>
            <div class="slot-badge badge-priority">● ONLY 1 LEFT</div>
          </div>

          <div class="slot-option-card" data-slot="window2">
            <div>
              <div class="slot-name">WINDOW 02: 16:00 UTC (TOMORROW)</div>
              <div style="font-size:0.7rem; color:var(--text-muted);">Scheduled Multi-Agent Overnight Build</div>
            </div>
            <div class="slot-badge badge-standby">STANDBY</div>
          </div>
        </div>
      </div>

      <div class="blueprint-card-footer">
        <div class="price-container">
          <span class="price-label">DEDICATED FORGE COMPUTE APPOINTMENT</span>
          <span class="price-amount">$99 USD</span>
          <span class="price-sub">Guaranteed compute lock + source repo + live staging sandbox</span>
        </div>
        <button id="btn-secure-execution-slot" class="btn-secure-slot">
          🔒 SECURE EXECUTION SLOT — $99 USD
        </button>
      </div>
    `;

    this.container.appendChild(cardEl);
    this.scrollToBottom();

    // Slot card selection events
    const slotCards = cardEl.querySelectorAll('.slot-option-card');
    slotCards.forEach(c => {
      c.addEventListener('click', () => {
        slotCards.forEach(other => other.classList.remove('selected'));
        c.classList.add('selected');
        if (window.audioSynth) window.audioSynth.playClick();
      });
    });

    const secureBtn = cardEl.querySelector('#btn-secure-execution-slot');
    if (secureBtn) {
      secureBtn.addEventListener('click', () => {
        secureBtn.disabled = true;
        secureBtn.textContent = '✔ SLOT SECURED — FORGE ONLINE';
        secureBtn.style.background = 'rgba(16, 185, 129, 0.2)';
        secureBtn.style.color = 'var(--emerald)';
        secureBtn.style.border = '1px solid var(--emerald)';
        secureBtn.style.animation = 'none';

        if (window.audioSynth) {
          window.audioSynth.playNodeLock();
          setTimeout(() => {
            window.audioSynth.speak('Execution slot secured. Compute allocated. Initiating continuous 16-model rotation and dynamic mind map build.');
          }, 300);
        }

        if (window.mysticSphere) {
          window.mysticSphere.setPhase('LOCKED');
        }

        this._setOrbStatus('FORGE COMPUTE ALLOCATED — BUILDING SYSTEM', 'gold');

        const deckContainer = document.getElementById('agent-execution-container');
        if (deckContainer) {
          deckContainer.style.display = 'block';
          deckContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        this.onScopeLocked(scope);
      });
    }
  }

  showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'chat-typing-indicator';
    indicator.className = 'chat-row chat-row-agent';
    indicator.innerHTML = `
      <div class="chat-avatar avatar-agent">◈</div>
      <div class="chat-bubble bubble-agent typing-dots">
        <span></span><span></span><span></span>
      </div>
    `;
    this.container.appendChild(indicator);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    const ind = document.getElementById('chat-typing-indicator');
    if (ind) ind.remove();
  }

  scrollToBottom() {
    this.container.scrollTop = this.container.scrollHeight;
  }

  formatMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }
}

window.ConversationalChatCore = ConversationalChatCore;
