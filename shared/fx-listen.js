// shared/fx-listen.js — Procedural Spatial Audio for HEXA Studio
// ---------------------------------------------------------------------------
// No audio assets ship with the site — every room tone is synthesised in code.
// Graph: (per-stop voice) -> master gain -> StereoPanner -> destination.
// A voice is a looping 2s pink-ish noise buffer through a BiquadFilter whose
// frequency/Q are seeded by the camera-stop key, plus a seeded 55-80Hz sine
// hum. Voices crossfade (~1.2s) when the stop key changes; the panner follows
// camera yaw relative to a per-stop reference angle. Master ducks to 0.5x
// during 'go' transitions and to 0.15 while the #file dossier is open.
//
// Autoplay policy: the AudioContext starts suspended and is resumed on the
// first pointerdown/keydown. Everything is guarded — headless (no window.__rig)
// this is an idle no-op and never throws; no AudioContext => silent degrade.
//
// API (all calls guarded):
//   FX.Listen.create(config)   fresh isolated instance { autoStart, pollMs }
//   FX.Listen.seed(key)        deterministic uint32 seed for a stop key
//   FX.Listen.toneParams(key)  { cutoff, q, hum, angle } — pure function of key
//   instance.enable()/disable()/toggle()/isEnabled()
//   instance.poll()            one manual tick (tests)
//   instance.start()/destroy() begin/end the 250ms poll + free audio nodes
//   instance.stats()           { enabled, key, phase, target, pan, running, degraded }
// Persistence: localStorage 'sound' = 'on' | 'off' (default on).
// ---------------------------------------------------------------------------
!function () {
  'use strict';
  window.FX = window.FX || {};

  const DEFAULTS = { autoStart: true, pollMs: 250, fade: 1.2, level: 0.6 };
  const GO_DUCK = 0.5;   // master multiplier while phase === 'go'
  const DOSSIER = 0.15;  // master while the #file dossier is open

  // Deterministic FNV-1a style hash: same stop key => same seed, always.
  function seed(key) {
    const s = String(key);
    let h = 1779033703 ^ s.length;
    for (let i = 0; i < s.length; i += 1) {
      h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^ (h >>> 16)) >>> 0;
  }

  // mulberry32 PRNG — tiny and deterministic, for tone parameters only.
  function rng(s) {
    let a = s >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  // Per-stop tone parameters — a pure function of the key, never random at
  // runtime: cutoff (lowpass Hz), q (resonance), hum (sub sine Hz), angle
  // (reference yaw used for StereoPanner panning).
  function toneParams(key) {
    const r = rng(seed(key));
    return {
      cutoff: 320 + r() * 1800,
      q: 0.6 + r() * 6,
      hum: 55 + r() * 25,
      angle: r() * Math.PI * 2,
    };
  }

  function create(config) {
    const cfg = Object.assign({}, DEFAULTS, config || {});
    let ctx = null;        // AudioContext (null until first poll/start)
    let master = null;     // master gain
    let panner = null;     // StereoPanner (falls back to direct connect)
    let noiseBuf = null;   // cached 2s noise buffer, reused by every voice
    let enabled = true;    // user preference, persisted to localStorage 'sound'
    let key = null;        // current stop key (opaque number from mapScroll)
    let phase = 'hold';    // 'hold' | 'go'
    let voice = null;      // live voice { gain, sources, nodes, angle }
    let timer = null;      // poll interval id
    let degraded = false;  // no AudioContext available
    let lastTarget = 0;    // last computed master target (for stats/tests)
    let lastPan = 0;       // last computed pan value (for stats/tests)
    const pending = new Set(); // cleanup timeouts, cleared on destroy()

    // --- preference --------------------------------------------------------
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem('sound') === 'off') enabled = false;
    } catch (e) { /* private mode / blocked storage — keep default */ }

    // --- audio graph (lazy, fully guarded) ---------------------------------
    function ensureCtx() {
      if (ctx || degraded) return ctx;
      try {
        const AC = (typeof AudioContext !== 'undefined' && AudioContext) || window.webkitAudioContext || null;
        if (!AC) { degraded = true; return null; }
        ctx = new AC(); // starts suspended — autoplay policy
        master = ctx.createGain();
        master.gain.value = 0; // silent until a poll confirms audibility
        if (ctx.createStereoPanner) {
          panner = ctx.createStereoPanner();
          master.connect(panner);
          panner.connect(ctx.destination);
        } else {
          master.connect(ctx.destination);
        }
        armGesture();
      } catch (e) { degraded = true; ctx = null; }
      return ctx;
    }

    // Resume the context on the first real user gesture (once, either kind).
    function armGesture() {
      if (!ctx || typeof window.addEventListener !== 'function') return;
      function detach() {
        try {
          window.removeEventListener('pointerdown', wake);
          window.removeEventListener('keydown', wake);
        } catch (e) { /* noop */ }
      }
      function wake() {
        try {
          if (ctx && ctx.state !== 'running' && ctx.resume) {
            const p = ctx.resume();
            if (p && p.catch) p.catch(function () { /* noop */ });
          }
        } catch (e) { /* noop */ }
        detach();
      }
      try {
        window.addEventListener('pointerdown', wake);
        window.addEventListener('keydown', wake);
      } catch (e) { /* noop */ }
    }

    // 2 seconds of pink-ish noise: white through a one-pole lowpass, with a
    // little white blended back on top. Built once, reused by every voice.
    function ensureNoise() {
      if (noiseBuf) return noiseBuf;
      const sr = ctx.sampleRate || 44100;
      const len = Math.floor(sr * 2);
      noiseBuf = ctx.createBuffer(1, len, sr);
      const d = noiseBuf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i += 1) {
        const w = Math.random() * 2 - 1;
        last += 0.04 * (w - last);        // one-pole lowpass => brown/pink-ish
        d[i] = (last * 6 + w * 0.2) * 0.5; // blend a little white back in
      }
      return noiseBuf;
    }

    // Build the room-tone voice for a stop key. All parameters come from
    // toneParams(key) — deterministic per stop, never random at runtime.
    function startVoice(k) {
      if (!ensureCtx()) return null;
      const p = toneParams(k);
      const v = { gain: ctx.createGain(), sources: [], nodes: [], angle: p.angle };
      v.gain.gain.value = 0;
      try { // noise -> seeded lowpass -> voice gain
        const src = ctx.createBufferSource();
        src.buffer = ensureNoise();
        src.loop = true;
        const filt = ctx.createBiquadFilter();
        filt.type = 'lowpass';
        filt.frequency.value = p.cutoff;
        filt.Q.value = p.q;
        src.connect(filt);
        filt.connect(v.gain);
        src.start(ctx.currentTime);
        v.sources.push(src);
        v.nodes.push(filt);
      } catch (e) { /* degrade this layer only */ }
      try { // very low seeded sine hum
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = p.hum;
        const humG = ctx.createGain();
        humG.gain.value = 0.05;
        osc.connect(humG);
        humG.connect(v.gain);
        osc.start(ctx.currentTime);
        v.sources.push(osc);
        v.nodes.push(humG);
      } catch (e) { /* noop */ }
      v.gain.connect(master);
      return v;
    }

    function disconnectVoice(v) {
      v.sources.concat(v.nodes).concat([v.gain]).forEach(function (n) {
        try { n.disconnect(); } catch (e) { /* noop */ }
      });
    }

    // Retire a voice cleanly: cancel scheduled values, ramp to 0, stop the
    // sources after the fade, then disconnect once the fade window closes.
    function fadeOut(v, now) {
      try {
        const g = v.gain.gain;
        g.cancelScheduledValues(now);
        g.setValueAtTime(g.value, now);
        g.linearRampToValueAtTime(0, now + cfg.fade);
        v.sources.forEach(function (s) {
          try { s.stop(now + cfg.fade + 0.05); } catch (e) { /* noop */ }
        });
      } catch (e) { /* noop */ }
      const t = setTimeout(function () {
        pending.delete(t);
        disconnectVoice(v);
      }, (cfg.fade + 0.25) * 1000);
      pending.add(t);
    }

    function swapVoice(k) {
      key = k;
      if (!ctx) return; // degraded: track the key, build nothing
      if (!enabled) return; // silent pref: track the key, build nothing
      const now = ctx.currentTime;
      if (voice) fadeOut(voice, now);
      voice = startVoice(k);
      if (voice) { // new tone fades in over the same window
        try {
          const g = voice.gain.gain;
          g.cancelScheduledValues(now);
          g.setValueAtTime(0, now);
          g.linearRampToValueAtTime(1, now + cfg.fade);
        } catch (e) { /* noop */ }
      }
    }

    // --- audibility gating --------------------------------------------------
    function dossierOpen() {
      try {
        if (typeof document.getElementById !== 'function') return false;
        const el = document.getElementById('file');
        return !!(el && typeof el.getAttribute === 'function' && el.getAttribute('aria-hidden') === 'false');
      } catch (e) { return false; }
    }

    // Audible only when: context resumed AND user enabled AND a voice exists.
    // Ducked during 'go' (0.5x) and while the dossier is open (0.15 absolute).
    function applyLevel() {
      if (!ctx || !master) { lastTarget = 0; return; }
      let target = 0;
      if (enabled && ctx.state === 'running' && voice) {
        target = cfg.level;
        if (phase === 'go') target *= GO_DUCK;
        if (dossierOpen()) target = DOSSIER;
      }
      lastTarget = target;
      try {
        const g = master.gain;
        const now = ctx.currentTime;
        g.cancelScheduledValues(now);
        g.setValueAtTime(g.value, now);
        g.linearRampToValueAtTime(target, now + 0.18); // gentle, click-free
      } catch (e) { /* noop */ }
    }

    // pan = clamp(sin(cameraYaw - seedAngle), -1, 1); no camera => 0.
    function applyPan() {
      let yaw = null;
      try {
        const rig = window.__rig;
        const cam = rig && rig.camera;
        if (cam) {
          if (cam.rotation && typeof cam.rotation.y === 'number') yaw = cam.rotation.y;
          else if (cam.quaternion) {
            const q = cam.quaternion;
            yaw = Math.atan2(2 * (q.w * q.y + q.x * q.z), 1 - 2 * (q.y * q.y + q.z * q.z));
          }
        }
      } catch (e) { yaw = null; }
      const pan = yaw === null ? 0 : clamp(Math.sin(yaw - (voice ? voice.angle : 0)), -1, 1);
      lastPan = pan;
      if (!ctx || !panner) return;
      try { panner.pan.setTargetAtTime(pan, ctx.currentTime, 0.12); } // smooth
      catch (e) { try { panner.pan.value = pan; } catch (e2) { /* noop */ } }
    }

    // --- poll loop (250ms) --------------------------------------------------
    function poll() {
      try {
        ensureCtx();
        const rig = window.__rig;
        if (rig && typeof rig.mapScroll === 'function') {
          const m = rig.mapScroll(typeof rig.sD === 'number' ? rig.sD : 0);
          if (m) {
            if (m.phase === 'go' || m.phase === 'hold') phase = m.phase;
            if (m.key != null && m.key !== key) swapVoice(m.key);
          else if (m.key != null && enabled && !voice) swapVoice(m.key); // re-enabled: rebuild the voice
          }
          applyPan();
          applyLevel();
        } // no rig (headless): idle no-op
      } catch (e) { /* never throw */ }
      return stats();
    }

    // --- preference + topbar pill ------------------------------------------
    function setEnabled(v) {
      enabled = !!v;
      try {
        if (typeof localStorage !== 'undefined') localStorage.setItem('sound', enabled ? 'on' : 'off');
      } catch (e) { /* noop */ }
      if (!enabled && ctx && voice) { // user muted: retire the live voice (poll rebuilds on re-enable)
        try { fadeOut(voice, ctx.currentTime); } catch (e) { /* noop */ }
        voice = null;
      }
      if (button) {
        try { button.setAttribute('aria-pressed', enabled ? 'true' : 'false'); } catch (e) { /* noop */ }
      }
      applyLevel();
      return enabled;
    }

    function mountButton() {
      try {
        if (typeof document.querySelector !== 'function' || typeof document.createElement !== 'function') return;
        if (document.getElementById && document.getElementById('fx-listen-toggle')) return; // once only
        const bar = document.querySelector('.topbar');
        if (!bar) return;
        const btn = document.createElement('button');
        btn.id = 'fx-listen-toggle';
        btn.type = 'button';
        btn.className = 'pill'; // matches the site's mono-label aesthetic
        btn.textContent = 'Sound';
        btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        btn.setAttribute('aria-label', 'Toggle spatial audio');
        btn.style.marginLeft = '12px';
        btn.addEventListener('click', function () { setEnabled(!enabled); });
        bar.appendChild(btn);
        button = btn;
      } catch (e) { button = null; }
    }

    let button = null;

    // --- lifecycle ----------------------------------------------------------
    function start() {
      ensureCtx();
      mountButton();
      if (timer == null && cfg.pollMs > 0) timer = setInterval(poll, cfg.pollMs);
      poll();
    }

    function destroy() {
      if (timer != null) { clearInterval(timer); timer = null; }
      pending.forEach(function (t) { clearTimeout(t); });
      pending.clear();
      if (voice) { // hard stop: silence sources before disconnecting (no spinning buffers)
        voice.sources.forEach(function (s) { try { s.stop(); } catch (e) { /* noop */ } });
        disconnectVoice(voice);
        voice = null;
      }
      key = null;
    }

    function stats() {
      return {
        enabled: enabled,
        key: key,
        phase: phase,
        target: lastTarget,
        pan: lastPan,
        running: !!(ctx && ctx.state === 'running'),
        degraded: degraded,
      };
    }

    const api = {
      enable: function () { return setEnabled(true); },
      disable: function () { return setEnabled(false); },
      toggle: function () { return setEnabled(!enabled); },
      isEnabled: function () { return enabled; },
      poll: poll,
      start: start,
      destroy: destroy,
      stats: stats,
    };
    if (cfg.autoStart) start();
    return api;
  }

  window.FX.Listen = create(); // default self-starting instance for the page
  window.FX.Listen.create = create; // FX.Listen.create({}) for isolated lanes
  window.FX.Listen.seed = seed; // deterministic per-stop seed (tests)
  window.FX.Listen.toneParams = toneParams; // pure tone params per key (tests)
}();
