// shared/fx-time.js — Day/Night post-processing mood toggle for HEXA Studio
// ---------------------------------------------------------------------------
// Animates __rig.P (post-processing params) between a daylight baseline and a
// cool night mood using gsap. Toggles via a pill button appended to .topbar.
// Persists the choice in localStorage('timeofday'). Every DOM/rig access is
// null-guarded so it never throws headless or before __rig exists.
//
// API (safe to call before init — every call is null-guarded):
//   FX.Time.create()          fresh lane (for tests / isolated lanes)
//   lane.mode()               'day' | 'night'
//   lane.day()                daylight baseline snapshot (captured at install)
//   lane.toggle()             switch mode (gsap-tweened unless reduced motion)
//   lane.setMode(m, instant)  force a mode
//   lane.install()            append button, wait for rig, snapshot, apply stored
//
// The module self-installs a singleton on DOMContentLoaded (or immediately if
// the DOM is already ready) and exposes the factory as FX.Time.create.
//
// Night mood (post-processing only — the sky HDR cannot be swapped):
//   exposure ~0.55, saturation ~0.85, tint slightly cool, fadeCol/paperCol
//   dark cool, grain bumped. Day is the snapshot of __rig.P taken at install.
// ---------------------------------------------------------------------------
!function () {
  'use strict';
  window.FX = window.FX || {};

  const NUMERIC_KEYS = ['exposure', 'saturation', 'tint', 'grain'];
  const COLOR_KEYS = ['fadeCol', 'paperCol'];
  const ALL_KEYS = NUMERIC_KEYS.concat(COLOR_KEYS);

  const NIGHT = {
    exposure: 0.55,
    saturation: 0.85,
    tint: -0.06,
    fadeCol: [0.07, 0.08, 0.12],
    paperCol: [0.07, 0.08, 0.12],
    grain: 0.035,
  };

  function create(options) {
    const cfg = Object.assign({ duration: 1.6, ease: 'power2.inOut' }, options || {});
    let day = null;          // daylight baseline snapshot (captured at install)
    let mode = 'day';        // 'day' | 'night'
    let tweens = [];         // active gsap tweens
    let installed = false;
    let btn = null;          // topbar pill button

    function rig() {
      return window.__rig && window.__rig.P ? window.__rig.P : null;
    }

    function reducedMotion() {
      return typeof matchMedia !== 'undefined'
        && matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // clone the keys we modify from the live rig params
    function snapshot() {
      const p = rig();
      if (!p) return null;
      const snap = {};
      ALL_KEYS.forEach(function (k) {
        if (p[k] !== undefined) {
          snap[k] = Array.isArray(p[k]) ? p[k].slice() : p[k];
        }
      });
      return snap;
    }

    function killTweens() {
      tweens.forEach(function (t) { if (t) t.kill(); });
      tweens = [];
    }

    // write target values straight into the rig (no animation)
    function applyInstantly(target) {
      const p = rig();
      if (!p) return;
      killTweens();
      NUMERIC_KEYS.forEach(function (k) {
        if (target[k] !== undefined) p[k] = target[k];
      });
      COLOR_KEYS.forEach(function (k) {
        if (target[k]) p[k] = target[k].slice();
      });
    }

    // gsap-animate numeric keys on the rig, color keys via temp channel objects
    function animateTween(target) {
      const p = rig();
      if (!p) return;
      killTweens();
      const time = { duration: cfg.duration, ease: cfg.ease, overwrite: true };
      const numeric = {};
      NUMERIC_KEYS.forEach(function (k) {
        if (target[k] !== undefined) numeric[k] = target[k];
      });
      tweens.push(gsap.to(p, Object.assign({}, time, numeric)));
      COLOR_KEYS.forEach(function (k) {
        if (!target[k]) return;
        const tmp = { r: p[k][0], g: p[k][1], b: p[k][2] };
        const n = target[k];
        tweens.push(gsap.to(tmp, Object.assign({}, time, {
          r: n[0], g: n[1], b: n[2],
          onUpdate: function () { p[k] = [tmp.r, tmp.g, tmp.b]; },
        })));
      });
    }

    function setMode(next, instant) {
      if (next !== 'day' && next !== 'night') return;
      const p = rig();
      if (!p) return;
      const target = next === 'night' ? NIGHT : day;
      if (!target) return;
      const goInstant = instant || reducedMotion() || typeof gsap === 'undefined';
      if (goInstant) applyInstantly(target);
      else animateTween(target);
      mode = next;
      document.documentElement.dataset.timeofday = next;
      updateButton();
      persist(next);
    }

    function toggle() {
      setMode(mode === 'day' ? 'night' : 'day', false);
    }

    function persist(m) {
      try { localStorage.setItem('timeofday', m); } catch (e) { /* noop */ }
    }

    function updateButton() {
      if (!btn) return;
      const isNight = mode === 'night';
      btn.textContent = isNight ? 'Day' : 'Night';
      btn.setAttribute('aria-pressed', String(isNight));
      btn.setAttribute('aria-label', isNight ? 'Switch to day view' : 'Switch to night view');
    }

    function appendButton() {
      const bar = document.querySelector('.topbar');
      if (!bar) return;
      if (document.getElementById('fx-time-toggle')) return;
      btn = document.createElement('button');
      btn.id = 'fx-time-toggle';
      btn.type = 'button';
      btn.className = 'pill';
      btn.textContent = 'Night';
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', 'Switch to night view');
      btn.style.marginLeft = '12px';
      btn.addEventListener('click', toggle);
      bar.appendChild(btn);
    }

    function waitForRig() {
      return new Promise(function (resolve) {
        let attempts = 0;
        const maxAttempts = 60; // ~3s at 50ms
        function poll() {
          if (window.__rig && window.__rig.P) { resolve(); return; }
          attempts += 1;
          if (attempts >= maxAttempts) { resolve(); return; }
          setTimeout(poll, 50);
        }
        poll();
      });
    }

    function install() {
      if (installed) return Promise.resolve();
      installed = true;
      appendButton();
      return waitForRig().then(function () {
        day = snapshot();
        let stored;
        try { stored = localStorage.getItem('timeofday'); } catch (e) { stored = null; }
        if (stored !== 'day' && stored !== 'night') stored = 'day';
        mode = stored;
        setMode(stored, true); // instant on init, no tween
      });
    }

    // self-install: DOMContentLoaded, or immediately if already ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', install);
    } else {
      install();
    }

    return {
      mode: function () { return mode; },
      day: function () { return day; },
      toggle: toggle,
      setMode: function (m, instant) { setMode(m, instant); },
      snapshot: snapshot,
      rig: rig,
      install: install,
    };
  }

  window.FX.Time = create();
  window.FX.Time.create = create;
}();
