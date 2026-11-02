// shared/fx-jit.js — Just-In-Time Media Manager for HEXA Studio
// ---------------------------------------------------------------------------
// Tracks the active camera stop (the same "key" index that FX.experience
// uses) and keeps only the media for the current stop plus the next stop in
// memory. Everything else is unloaded and freed.
//
// Why: 26 CLIPS/*.mp4 assets plus room textures cannot all live in memory.
// The production experience streams nothing per-room today; this module is
// the drop-in engine for room screens / ambient media (Phase 2) and for any
// future heavy asset, without touching the minified scene logic.
//
// API (all safe to call before init — every call is null-guarded):
//   FX.JIT.config({ ahead, behind, missing })   tune look-ahead and blacklist
//   FX.JIT.pool(key, items)                     register media for a stop
//   FX.JIT.tick(key)                            call on every camera stop
//   FX.JIT.dispose(key)                         release one stop's media now
//   FX.JIT.flush()                              release everything
//   FX.JIT.stats()                              { current, held, loaded, skipped }
//
// Skip rules: stops whose media is blacklisted (clip12.mp4, clip24.mp4 are
// missing/binary in this release) are never enqueued.
// ---------------------------------------------------------------------------
!function () {
  'use strict';
  window.FX = window.FX || {};

  const DEFAULTS = {
    ahead: 1,          // stops ahead to prebuffer
    behind: 0,         // stops behind kept warm
    missing: ['12', '24'], // known-bad binary gaps: never load these
    maxVideos: 3,      // hard ceiling on live video elements
  };
  const EXT_HOOK = /\.(mp4|webm)$/i; // kinds we can dispose with pause+src reset

  function create(options) {
    const cfg = Object.assign({}, DEFAULTS, options || {});
    const pools = new Map();   // stop key (string) -> { list, state: 'cold'|'loading'|'ready' }
    const live = new Set();    // stop keys currently holding media
    let current = null;

    function isMissing(key) {
      return cfg.missing.some((m) => String(key).endsWith(m));
    }

    function makeMedia(item) {
      if (EXT_HOOK.test(item.src)) {
        const v = document.createElement('video');
        v.preload = item.lazy ? 'none' : 'auto';
        v.playsinline = true;
        v.muted = item.muted !== false; // ambient media must be muted by default
        v.loop = true;
        v.crossOrigin = 'anonymous';
        if (item.poster) v.poster = item.poster;
        v.jitKey = String(item._key);
        v.src = item.src;
        return v;
      }
      // Other asset kinds: audio or plain fetch prebuffer
      if (/\.mp3$|\.ogg$|\.wav$/i.test(item.src)) {
        const a = new Audio();
        a.preload = item.lazy ? 'none' : 'auto';
        a.src = item.src;
        return a;
      }
      // Images/textures: warm the HTTP cache, no element retained
      if (typeof fetch !== 'undefined') {
        fetch(item.src, { method: 'GET', priority: 'high' }).catch(() => undefined);
      }
      return null;
    }

    function ensure(key) {
      if (key == null || isMissing(key)) return;
      if (live.has(key) && live.size < cfg.maxVideos + 1) return;
      const pool = pools.get(String(key));
      if (!pool) return;
      if (pool.state === 'ready') { live.add(String(key)); return; }
      pool.list.forEach((item) => {
        if (item.el) return; // already materialised
        item.el = makeMedia(item);
      });
      pool.state = 'ready';
      live.add(String(key));
      if (live.size > cfg.maxVideos) releaseFurthest();
    }

    function releaseFurthest() {
      let worst = null;
      live.forEach((k) => {
        if (k === current) return;
        const d = Math.abs(Number(k) - Number(current == null ? -999 : current));
        if (!worst || d > worst.d) worst = { k, d };
      });
      if (worst) dispose(Number(worst.k));
    }

    function dispose(key) {
      if (key == null) return;
      const pool = pools.get(String(key));
      if (pool && pool.list) {
        pool.list.forEach((item) => {
          const el = item.el;
          if (!el) return;
          if (EXT_HOOK.test(item.src)) {
            try { el.pause(); el.removeAttribute('src'); el.load(); } catch (e) { /* noop */ }
            el.remove();
          } else if (typeof el.dispose === 'function') {
            el.dispose(); // THREE.Texture-like
          }
          item.el = null;
        });
        pool.state = 'cold';
      }
      live.delete(String(key));
      current === key && (current = null);
    }

    function tick(key) {
      const k = String(key);
      if (k === String(current)) return stats();
      const prev = current;
      current = k;
      ensure(Number(k) || k);
      for (let a = 1; a <= cfg.ahead; a++) ensure(Number(key) + a);
      // release everything within cfg.behind_beyond of the walk-back window
      const keep = new Set([String(key)]);
      for (let b = 1; b <= cfg.behind; b++) keep.add(String(Number(key) - b));
      for (let a = 1; a <= cfg.ahead; a++) keep.add(String(Number(key) + a));
      live.forEach((k2) => { if (!keep.has(k2)) dispose(Number(k2)); });
      return stats(prev);
    }

    function pool(key, items) {
      pools.set(String(key), {
        list: (items || []).map((item) => Object.assign({ el: null, _key: String(key) }, item)),
        state: 'cold',
      });
    }

    function flush() {
      live.forEach((k) => dispose(Number(k)));
      live.clear();
      current = null;
    }

    function stats(prev) {
      return { current: current, previous: prev == null ? undefined : prev, held: live.size, pools: pools.size, cfg: cfg };
    }

    return {
      config(next) { Object.assign(cfg, next || {}); return cfg; },
      pool: pool,
      tick: tick,
      ensure,
      dispose,
      flush,
      stats,
    };
  }

  window.FX.JIT = create(); // for unit tests / isolated lanes there is also
  window.FX.JIT.create = create; // FX.JIT.create({}) returning a fresh lane
}();
