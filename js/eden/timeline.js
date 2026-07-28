/* ============================================================================
   EDEN — timeline.js  (Phase 2)
   ----------------------------------------------------------------------------
   The director. Builds the GSAP master timeline that carries the emotional
   arc described in EDEN_FULL_CONTEXT.md §13:

       loading fade → "In the beginning." (in/out)
            → 8–12s EXPLORATION window
                  → REVELATION: EDEN arrives, chromatic spike, settles
                        → scroll hint + scroll unlock

   CRITICAL DESIGN RULES (from the brief — do not violate):
     - The exploration window MUST NOT be interrupted. No hints, no popups.
       (§18 #11, §3 "Death of the Author") Revelation can only begin on a
       deliberate visitor gesture (scroll/click) OR a generous idle timeout.
     - EDEN arrives with linear opacity, no y/scale/bounce. The ONLY motion on
       the name is letter-spacing contracting 0.4em → 0.2em. (§13)
     - The chromatic aberration is brief and spikes then settles — that spike
       IS the dread; the settle IS the beauty. (§3 "Beauty in Dread")
     - Events 'eden:exploration-start' and 'eden:revelation' are dispatched
       on window so Phase 3's Three.js scene can react (PointLight rise,
       particle surge, background bloom).

   Uses classic global GSAP/Splitting (CDN, deferred). No ES modules yet.
   ========================================================================== */

(function () {
  'use strict';

  // ── Tuning (all seconds) ──────────────────────────────────────────────────
  const EXPLORATION_TIMEOUT = 12;   // idle seconds before revelation auto-fires
  const EXPLORATION_MIN     = 8;    // never reveal before this, even on gesture
  const SECONDARY_HOLD      = 3;    // "Saper vedere." visible duration

  // ── Element refs ─────────────────────────────────────────────────────────
  const el = (id) => document.getElementById(id);
  const qs = (s)  => document.querySelector(s);

  const hasGSAP = () => !!(window.gsap && window.Splitting);

  // ── Custom events for Phase 3 ─────────────────────────────────────────────
  const emit = (name, detail) => {
    window.dispatchEvent(new CustomEvent(name, { detail: detail ?? {} }));
  };

  // ── Splitting.js setup (wrapped in fonts.ready upstream) ─────────────────
  // EDEN letter-spacing animation works on the whole element; we split for the
  // optional per-letter reveal polish. "In the beginning." splits by word.
  const runSplitting = () => {
    if (!window.Splitting) return;
    Splitting({ target: '.eden-name', by: 'chars' });
    Splitting({ target: '.eden-opening', by: 'words' });
  };

  /**
   * Build and play the master timeline.
   * @returns {gsap.core.Timeline}
   */
  const start = () => {
    if (!hasGSAP()) return null;

    runSplitting();

    const opening   = qs('.eden-opening');
    const name      = qs('.eden-name');
    const secondary = qs('.eden-secondary');
    const loading   = el('loading-screen');
    const hint      = el('scroll-hint');

    // Ensure clean initial state (style.css also sets these, but be explicit
    // so nothing flashes if CSS load order shifts).
    gsap.set(opening, { opacity: 0, y: 8 });
    gsap.set(name, { opacity: 0, letterSpacing: '0.4em' });
    gsap.set(secondary, { opacity: 0 });
    gsap.set(hint, { scaleY: 0, transformOrigin: 'center top' });

    const t0 = performance.now();

    const tl = gsap.timeline();

    // 0.0s — the breathing seed exhales and dissolves into the void.
    // The orb collapses gently (scale 1→0.4) while its word fades, then the
    // whole screen lifts. Feels like the light being absorbed, not switched off.
    const orb = loading?.querySelector('.loading-orb');
    const orbWord = loading?.querySelector('.loading-word');
    if (orb) {
      gsap.set(orb, { animation: 'none' });      // freeze the CSS breath
      tl.to(orb, { scale: 0.4, opacity: 0.0, duration: 0.8, ease: 'power2.in' }, 0);
    }
    if (orbWord) {
      gsap.set(orbWord, { animation: 'none' });
      tl.to(orbWord, { opacity: 0, duration: 0.4, ease: 'power1.in' }, 0);
    }
    tl.to(loading, {
      opacity: 0, duration: 0.6, ease: 'power1.out',
      onComplete: () => loading?.parentNode?.removeChild(loading)
    }, 0.2);

    // 0.8s — "In the beginning." in
    tl.fromTo(opening,
      { opacity: 0, y: 8 },
      { opacity: 0.7, y: 0, duration: 1.2, ease: 'power1.out' },
      0.8
    );

    // 3.2s — "In the beginning." out
    tl.to(opening, {
      opacity: 0, y: -6, duration: 0.8, ease: 'power1.in'
    }, 3.2);

    // 3.8s — EXPLORATION begins. Cursor is the light. Do not interrupt.
    // (Phase 3 listens for this to raise the PointLight.)
    tl.call(() => {
      emit('eden:exploration-start');
      beginExplorationGate();
    }, [], 3.8);

    // The revelation sequence is appended to `tl` only when the gate fires,
    // so the timeline's playhead can't run ahead of the visitor's intent.
    let gateFired = false;
    function beginExplorationGate() {
      const openedAt = performance.now();
      let idleTimer = null;

      const armed = () =>
        (performance.now() - openedAt) / 1000 >= EXPLORATION_MIN;

      const tryReveal = (label) => {
        if (gateFired) return;
        if (!armed()) return;            // honor the minimum exploration window
        gateFired = true;
        cleanup();
        appendRevelation(label);
      };

      const onGesture = (e) => {
        // Scroll = the strongest "I'm ready / I want more" signal. Click too.
        if (['scroll', 'click', 'wheel', 'keydown'].includes(e.type)) {
          tryReveal(`gesture:${e.type}`);
        }
      };

      const cleanup = () => {
        clearTimeout(idleTimer);
        window.removeEventListener('scroll', onGesture);
        window.removeEventListener('wheel', onGesture);
        window.removeEventListener('click', onGesture);
        window.removeEventListener('keydown', onGesture);
      };

      // Idle timeout — the kind fallback for visitors who simply wait.
      idleTimer = setTimeout(() => {
        tryReveal(`idle:${EXPLORATION_TIMEOUT}s`);
      }, EXPLORATION_TIMEOUT * 1000);

      window.addEventListener('scroll', onGesture, { passive: true });
      window.addEventListener('wheel', onGesture, { passive: true });
      window.addEventListener('click', onGesture);
      window.addEventListener('keydown', onGesture);
    }

    function appendRevelation(reason) {
      emit('eden:revelation', { reason });

      const r = gsap.timeline();
      // +0.0s — particles surge (Phase 3 reacts to the event; here we just
      // leave space). Background bloom handled by Phase 3 too.
      // +1.8s — EDEN arrives. Linear opacity, no y/scale. Letter-spacing is
      // the only motion on the name. (§13)
      r.fromTo(name,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: 'none' },
        1.8
      );
      r.to(name, {
        letterSpacing: '0.2em', duration: 1.2, ease: 'power2.out'
      }, 1.8);

      // +2.0s — chromatic aberration spike (CSS class drives a keyframe on
      // the canvas/content). Phase 4 will swap this for the ShaderPass.
      r.call(() => {
        const target = el('eden-content') ?? document.body;
        target.classList.add('chromatic-active');
        setTimeout(() => target.classList.remove('chromatic-active'), 300);
      }, [], 2.0);

      // +2.6s — optional secondary line ("Saper vedere."), holds 3s, fades.
      r.to(secondary, {
        opacity: 0.5, duration: 0.8, ease: 'power1.out',
        onComplete: () => {
          gsap.to(secondary, {
            opacity: 0, duration: 1.0, ease: 'power1.in', delay: SECONDARY_HOLD
          });
        }
      }, 2.6);

      // +3.5s — scroll hint in. GSAP grows scaleY; the looping fall animation
      // is CSS and starts once we add .is-visible (after the grow completes).
      r.to(hint, {
        scaleY: 1, duration: 0.8, ease: 'power2.out',
        onComplete: () => hint.classList.add('is-visible')
      }, 3.5);

      // +3.8s — unlock scroll, then refresh ScrollTrigger (Gotcha #12)
      r.call(() => {
        document.body.style.overflow = ''; // eslint-disable-line no-self-assign
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
        emit('eden:resolved');
      }, [], 3.8);

      tl.add(r, tl.time());
    }

    tl.play();
    return tl;
  };

  window.EDEN = window.EDEN || {};
  window.EDEN.startTimeline = start;
})();
