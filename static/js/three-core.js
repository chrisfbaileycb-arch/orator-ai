/**
 * THE ORATOR — Pearlescent Plasma Core & Emotional GLSL Shader Engine
 *
 * Visual Signature:
 * 1. Volumetric fluid-sheen mesh with chromatic dispersion & iridescent Fresnel
 * 2. Dynamic Emotional States:
 *    - IDLE / LISTENING: Deep oceanic teal (#053b48), luminous cyan (#00f0ff), violet rim (#8b5cf6)
 *    - EVALUATING / INQUEST: Electric amber (#ffb703), burning gold (#ffd700), vortex displacement
 *    - ARCHITECTURE LOCKED: Superheated pearl-white (#ffffff), radiant solar prominence flares
 * 3. Mouse-reactive dynamic vertex pull with spring physics
 * 4. Audio FFT input: Highs expand outer corona, Lows pulse dense inner core
 */

class MysticSphereCore {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.plasmaMesh = null;
    this.innerCoreMesh = null;
    this.particleHaloMesh = null;
    this.clock = (typeof THREE !== 'undefined') ? new THREE.Clock() : null;

    // Mouse spring physics
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0, vx: 0, vy: 0 };
    this.raycaster = (typeof THREE !== 'undefined') ? new THREE.Raycaster() : null;
    this.mouseWorldPos = (typeof THREE !== 'undefined') ? new THREE.Vector3(0, 0, 0) : null;

    // Emotional State Palettes (RGB)
    this.states = {
      IDLE: {
        coreColor: new THREE.Color(0x053b48),      // Deep Oceanic Teal
        midColor: new THREE.Color(0x00f0ff),       // Luminous Cyan
        rimColor: new THREE.Color(0x8b5cf6),       // Iridescent Violet
        flareColor: new THREE.Color(0x38bdf8),     // Electric Sky
        noiseScale: 0.22,
        noiseSpeed: 0.7,
        vortexStrength: 0.4,
        fresnelPower: 2.4,
        flareIntensity: 1.2
      },
      EVALUATING: {
        coreColor: new THREE.Color(0x7c2d12),      // Deep Burning Amber
        midColor: new THREE.Color(0xffb703),       // Electric Amber
        rimColor: new THREE.Color(0xffd700),       // Burning Gold
        flareColor: new THREE.Color(0xff2a5f),     // Plasma Crimson
        noiseScale: 0.38,
        noiseSpeed: 1.8,
        vortexStrength: 1.5,
        fresnelPower: 1.8,
        flareIntensity: 2.8
      },
      LOCKED: {
        coreColor: new THREE.Color(0xffffff),      // Superheated Pearl-White
        midColor: new THREE.Color(0xfff3a1),       // Radiant Solar Gold
        rimColor: new THREE.Color(0x00f0ff),       // Cyan Corona Sheen
        flareColor: new THREE.Color(0xffd700),     // Solar Prominence
        noiseScale: 0.45,
        noiseSpeed: 2.2,
        vortexStrength: 0.8,
        fresnelPower: 1.4,
        flareIntensity: 3.6
      },
      CRIMSON_CHALLENGE: {
        coreColor: new THREE.Color(0x4a0418),      // Dark Obsidian
        midColor: new THREE.Color(0xff2a5f),       // Crimson Plasma
        rimColor: new THREE.Color(0xff9900),       // Solar Flare
        flareColor: new THREE.Color(0xff0044),     // Searing Red
        noiseScale: 0.42,
        noiseSpeed: 2.2,
        vortexStrength: 1.8,
        fresnelPower: 1.6,
        flareIntensity: 3.4
      }
    };

    this.currentState = 'IDLE';
    this.targetState = 'IDLE';
    this.stateTransition = 1.0;
    this.haloResolvedCount = 0;

    this.init();
  }

  init() {
    this.initThree();
    this.initHalo();
    this.bindEvents();
    this.animate();
  }

  initThree() {
    if (typeof THREE === 'undefined') return;

    const width = this.container.clientWidth || 380;
    const height = this.container.clientHeight || 380;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.z = 220;

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.container.appendChild(this.renderer.domElement);

    this.createPearlescentPlasma();
    this.createDenseInnerCore();
    this.createAtmosphericHaloDust();
  }

  /**
   * Pearlescent Plasma Shell with GLSL Vertex Noise & Iridescent Dispersion
   */
  createPearlescentPlasma() {
    const geometry = new THREE.IcosahedronGeometry(50, 72);

    const vertexShader = `
      uniform float uTime;
      uniform float uNoiseScale;
      uniform float uNoiseSpeed;
      uniform float uVortexStrength;
      uniform float uBass;
      uniform float uMid;
      uniform float uTreble;
      uniform float uFlareIntensity;
      uniform vec3 uMousePos;
      uniform float uMouseInfluence;

      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying float vDisplacement;
      varying float vFresnel;

      // 3D Simplex noise
      vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
      vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

      float snoise(vec3 v){
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + 1.0 * C.xxx;
        vec3 x2 = x0 - i2 + 2.0 * C.xxx;
        vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
        i = mod(i, 289.0);
        vec4 p = permute(permute(permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z.xxxx);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      void main() {
        vNormal = normalize(normalMatrix * normal);

        // Fluid Simplex Noise Coordinates with Vortex Twisting
        float angle = length(position.xy) * 0.02 * uVortexStrength;
        mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
        vec3 twistedPos = vec3(rot * position.xy, position.z);

        vec3 noiseCoord1 = twistedPos * 0.045 + vec3(uTime * uNoiseSpeed * 0.4);
        vec3 noiseCoord2 = twistedPos * 0.090 - vec3(uTime * uNoiseSpeed * 0.6);
        float noiseVal = snoise(noiseCoord1) + snoise(noiseCoord2) * 0.5;

        // Audio Reactive Modulations
        float bassCorePulse = 1.0 + uBass * 0.45;
        float midWaveTurbulence = 1.0 + uMid * 1.6;
        float trebleCoronaFlares = uTreble * uFlareIntensity * 12.0;

        float displacement = noiseVal * (uNoiseScale * 22.0 * midWaveTurbulence) + trebleCoronaFlares;

        // Mouse Gravitational Pull
        vec3 worldP = (modelMatrix * vec4(position, 1.0)).xyz;
        float distToMouse = length(worldP - uMousePos);
        float mouseAttraction = smoothstep(120.0, 0.0, distToMouse) * uMouseInfluence * 14.0;
        vec3 mousePullDir = normalize(uMousePos - worldP);

        vec3 finalPos = position * bassCorePulse + normal * displacement + mousePullDir * mouseAttraction;

        vDisplacement = displacement;

        vec4 mvPos = modelViewMatrix * vec4(finalPos, 1.0);
        vViewPosition = -mvPos.xyz;
        vWorldPosition = (modelMatrix * vec4(finalPos, 1.0)).xyz;

        gl_Position = projectionMatrix * mvPos;
      }
    `;

    const fragmentShader = `
      uniform vec3 uCoreColor;
      uniform vec3 uMidColor;
      uniform vec3 uRimColor;
      uniform vec3 uFlareColor;
      uniform float uFresnelPower;
      uniform float uTime;
      uniform float uTreble;
      uniform float uBass;

      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying float vDisplacement;

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);

        // 1. Iridescent Fresnel Term
        float NdotV = max(0.0, dot(normal, viewDir));
        float fresnel = pow(1.0 - NdotV, uFresnelPower);

        // 2. Multi-Spectral Chromatic Dispersion (Pearlescent thin-film interference)
        vec3 chromatic = vec3(
          sin(fresnel * 3.1415 + uTime * 0.45) * 0.5 + 0.5,
          sin(fresnel * 3.1415 + uTime * 0.45 + 2.094) * 0.5 + 0.5,
          sin(fresnel * 3.1415 + uTime * 0.45 + 4.188) * 0.5 + 0.5
        );

        // 3. Fluid Color Gradient: Deep Core -> Mid Plasma -> Solar/Cyan Rim
        float dispFactor = clamp(vDisplacement * 0.08 + 0.45, 0.0, 1.0);
        vec3 basePlasma = mix(uCoreColor, uMidColor, dispFactor);
        vec3 iridescentRim = mix(basePlasma, uRimColor, fresnel * 0.9);

        // 4. Chromatic Pearl Overlay on Grazing Angles
        vec3 finalColor = mix(iridescentRim, chromatic, fresnel * 0.32);

        // 5. Audio Flare Prominences
        finalColor += uFlareColor * (uTreble * 0.65 + uBass * 0.25);

        // Glassmorphic Sheen Alpha
        float alpha = clamp(0.78 + fresnel * 0.22, 0.0, 1.0);

        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    const s = this.states.IDLE;
    const uniforms = {
      uTime: { value: 0 },
      uNoiseScale: { value: s.noiseScale },
      uNoiseSpeed: { value: s.noiseSpeed },
      uVortexStrength: { value: s.vortexStrength },
      uBass: { value: 0 },
      uMid: { value: 0 },
      uTreble: { value: 0 },
      uFlareIntensity: { value: s.flareIntensity },
      uMousePos: { value: new THREE.Vector3(0, 0, 0) },
      uMouseInfluence: { value: 0.0 },
      uCoreColor: { value: s.coreColor.clone() },
      uMidColor: { value: s.midColor.clone() },
      uRimColor: { value: s.rimColor.clone() },
      uFlareColor: { value: s.flareColor.clone() },
      uFresnelPower: { value: s.fresnelPower }
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      side: THREE.FrontSide
    });

    this.plasmaMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.plasmaMesh);
  }

  /**
   * Dense Internal Core (Pulses intensely on Low Frequencies)
   */
  createDenseInnerCore() {
    const geometry = new THREE.SphereGeometry(22, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });
    this.innerCoreMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.innerCoreMesh);
  }

  /**
   * Atmospheric Dust & Corona Particle Field
   */
  createAtmosphericHaloDust() {
    const count = 900;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const radius = 68;
    const phi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      positions[i * 3]     = x * (radius + (Math.random() - 0.5) * 16);
      positions[i * 3 + 1] = y * (radius + (Math.random() - 0.5) * 16);
      positions[i * 3 + 2] = z * (radius + (Math.random() - 0.5) * 16);

      colors[i * 3]     = 0.0;
      colors[i * 3 + 1] = 0.94;
      colors[i * 3 + 2] = 1.0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particleHaloMesh = new THREE.Points(geometry, material);
    this.scene.add(this.particleHaloMesh);
  }

  /**
   * 15-Question Segmented Orbital Progress Halo
   */
  initHalo() {
    const group = document.getElementById('halo-segments-group');
    if (!group) return;

    group.innerHTML = '';
    const cx = 220;
    const cy = 220;
    const r = 195;
    const totalSegments = 15;
    const gapDeg = 4;
    const segDeg = (360 / totalSegments) - gapDeg;

    for (let i = 0; i < totalSegments; i++) {
      const startAngle = (i * (segDeg + gapDeg) + gapDeg / 2) * (Math.PI / 180);
      const endAngle = startAngle + segDeg * (Math.PI / 180);

      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);

      const pathData = `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('class', 'halo-segment');
      path.setAttribute('id', `halo-seg-${i}`);
      path.dataset.index = i;
      group.appendChild(path);
    }
  }

  setHaloProgress(count) {
    this.haloResolvedCount = count;
    for (let i = 0; i < 15; i++) {
      const seg = document.getElementById(`halo-seg-${i}`);
      if (!seg) continue;
      if (i < count) {
        seg.classList.add('ignited');
      } else {
        seg.classList.remove('ignited');
      }
    }
    const badge = document.getElementById('halo-counter-badge');
    if (badge) {
      badge.textContent = `INQUEST: ${count}/15 RESOLVED`;
      if (count === 15) {
        badge.style.color = '#ffd700';
        badge.style.borderColor = 'rgba(255, 215, 0, 0.5)';
      }
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => this.onResize());

    window.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect();
      const mouseCanvasX = e.clientX - rect.left;
      const mouseCanvasY = e.clientY - rect.top;

      // Normalized coordinates (-1 to 1)
      this.mouse.targetX = (mouseCanvasX / rect.width) * 2 - 1;
      this.mouse.targetY = -(mouseCanvasY / rect.height) * 2 + 1;

      // Calculate world position for vertex attraction
      if (this.camera && this.mouseWorldPos) {
        const vector = new THREE.Vector3(this.mouse.targetX, this.mouse.targetY, 0.5);
        vector.unproject(this.camera);
        const dir = vector.sub(this.camera.position).normalize();
        const distance = -this.camera.position.z / dir.z;
        this.mouseWorldPos.copy(this.camera.position).add(dir.multiplyScalar(distance));
      }
    });
  }

  onResize() {
    if (!this.renderer || !this.camera || !this.container) return;
    const width = this.container.clientWidth || 380;
    const height = this.container.clientHeight || 380;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  setPhase(stateName) {
    if (!this.states[stateName]) return;
    this.targetState = stateName;
    this.stateTransition = 0;

    document.body.classList.remove('mood-gold', 'mood-evaluating', 'mood-crimson', 'mood-locked');
    if (stateName === 'EVALUATING') document.body.classList.add('mood-evaluating');
    if (stateName === 'LOCKED') document.body.classList.add('mood-locked');
    if (stateName === 'CRIMSON_CHALLENGE') document.body.classList.add('mood-crimson');
  }

  onKeystroke() {
    if (this.plasmaMesh) {
      this.plasmaMesh.rotation.y += 0.05;
      this.plasmaMesh.rotation.x += 0.025;
    }
  }

  triggerPulseFlare(durationMs = 1200) {
    if (this.plasmaMesh) {
      const orig = this.plasmaMesh.material.uniforms.uFlareIntensity.value;
      this.plasmaMesh.material.uniforms.uFlareIntensity.value = 5.0;
      setTimeout(() => {
        if (this.plasmaMesh) {
          this.plasmaMesh.material.uniforms.uFlareIntensity.value = orig;
        }
      }, durationMs);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (!this.plasmaMesh || !this.renderer) return;

    const time = this.clock ? this.clock.getElapsedTime() : Date.now() * 0.001;
    const uniforms = this.plasmaMesh.material.uniforms;
    uniforms.uTime.value = time;

    // Smooth Emotional State Transition
    if (this.stateTransition < 1.0) {
      this.stateTransition += 0.025;
      const t = Math.min(1.0, this.stateTransition);
      const cur = this.states[this.currentState] || this.states.IDLE;
      const target = this.states[this.targetState] || this.states.IDLE;

      uniforms.uCoreColor.value.lerpColors(cur.coreColor, target.coreColor, t);
      uniforms.uMidColor.value.lerpColors(cur.midColor, target.midColor, t);
      uniforms.uRimColor.value.lerpColors(cur.rimColor, target.rimColor, t);
      uniforms.uFlareColor.value.lerpColors(cur.flareColor, target.flareColor, t);

      uniforms.uNoiseScale.value = cur.noiseScale + (target.noiseScale - cur.noiseScale) * t;
      uniforms.uNoiseSpeed.value = cur.noiseSpeed + (target.noiseSpeed - cur.noiseSpeed) * t;
      uniforms.uVortexStrength.value = cur.vortexStrength + (target.vortexStrength - cur.vortexStrength) * t;
      uniforms.uFresnelPower.value = cur.fresnelPower + (target.fresnelPower - cur.fresnelPower) * t;
      uniforms.uFlareIntensity.value = cur.flareIntensity + (target.flareIntensity - cur.flareIntensity) * t;

      if (this.stateTransition >= 1.0) {
        this.currentState = this.targetState;
      }
    }

    // Audio Frequency Reactivity
    let bass = 0, mid = 0, treble = 0;
    if (window.audioSynth) {
      const freq = window.audioSynth.getFrequencyData();
      if (freq && freq.length >= 64) {
        let bSum = 0; for (let i = 0; i < 8; i++) bSum += freq[i];
        bass = bSum / (8 * 255);

        let mSum = 0; for (let i = 8; i < 32; i++) mSum += freq[i];
        mid = mSum / (24 * 255);

        let tSum = 0; for (let i = 32; i < 64; i++) tSum += freq[i];
        treble = tSum / (32 * 255);
      }
    }

    uniforms.uBass.value = bass;
    uniforms.uMid.value = mid;
    uniforms.uTreble.value = treble;

    // Mouse Spring Physics (Dampened tilt + vertex pull)
    const k = 0.08;
    const damp = 0.85;
    this.mouse.vx = (this.mouse.vx + (this.mouse.targetX - this.mouse.x) * k) * damp;
    this.mouse.vy = (this.mouse.vy + (this.mouse.targetY - this.mouse.y) * k) * damp;
    this.mouse.x += this.mouse.vx;
    this.mouse.y += this.mouse.vy;

    if (this.mouseWorldPos) {
      uniforms.uMousePos.value.copy(this.mouseWorldPos);
      uniforms.uMouseInfluence.value = 1.0;
    }

    this.plasmaMesh.rotation.y += 0.0035;
    this.plasmaMesh.rotation.x = this.mouse.y * 0.45;
    this.plasmaMesh.rotation.z = -this.mouse.x * 0.45;

    // Pulse Inner Core
    if (this.innerCoreMesh) {
      const innerScale = 1.0 + bass * 0.65;
      this.innerCoreMesh.scale.set(innerScale, innerScale, innerScale);
      this.innerCoreMesh.material.opacity = 0.35 + bass * 0.5;
    }

    // Atmospheric Dust Rotation
    if (this.particleHaloMesh) {
      this.particleHaloMesh.rotation.y -= 0.0015;
      this.particleHaloMesh.rotation.x = this.mouse.y * 0.25;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.MysticSphereCore = MysticSphereCore;
