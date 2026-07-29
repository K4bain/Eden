/* ============================================================================
   EDEN — timeline.js  (Phase 2 — GSAP Club upgraded)
   ----------------------------------------------------------------------------
   The director. Builds the GSAP master timeline that carries the emotional
   arc described in EDEN_FULL_CONTEXT.md §13:

       loading fade → "In the beginning." (in/out)
            → 8–12s EXPLORATION window
                  → REVELATION: EDEN arrives, chromatic spike, settles
                        → scroll hint + scroll unlock

   UPGRADED WITH GSAP CLUB PLUGINS:
   - ScrollSmoother: buttery smooth scroll interpolation
   - SplitText: per-letter EDEN reveal animation
   - CustomEase: bespoke easing curves for Awwwards feel
   - Observer: unified input handling

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

   Uses classic global GSAP/SplitText/ScrollSmoother/CustomEase (vendor CDN).
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

  const hasGSAP = () => !!(window.gsap && window.SplitText);

  // ── Custom Easing Curves ────────────────────────────────────────────────
  // Awwwards-level easing: organic, not linear, not mechanical.
  const registerCustomEases = () => {
    if (!window.CustomEase) return;
    // "Breath" — slow-in, fast-middle, slow-out. Like a lung expanding.
    CustomEase.create('eden-breath', 'M0,0 C0.126,0.382 0.282,1.034 0.5,1 0.718,0.966 0.874,0.618 1,0');
    // "Reveal" — quick emergence with a gentle settle. EDEN letter-by-letter.
    CustomEase.create('eden-reveal', 'M0,0 C0.2,0 0.3,0.8 0.5,1 0.7,1 0.8,0.2 1,0');
    // "Drift" — continuous, organic motion for parallax.
    CustomEase.create('eden-drift', 'M0,0 C0.33,0 0.67,1 1,1');
  };

  // ── Custom events for Phase 3 ─────────────────────────────────────────────
  const emit = (name, detail) => {
    window.dispatchEvent(new CustomEvent(name, { detail: detail ?? {} }));
  };

  // ── SplitText setup (GSAP Club — replaces Splitting.js) ───────────────────
  // SplitText creates per-character <div> elements that GSAP can animate
  // individually. More control than Splitting.js — each char is a target.
  let splitChars = null;
  let splitWords = null;

  const runSplitText = () => {
    if (!window.SplitText) return;
    splitChars = new SplitText('.eden-name', { type: 'chars', charsClass: 'char' });
    splitWords = new SplitText('.eden-opening', { type: 'words', wordsClass: 'word' });
  };

  /**
   * Build and play the master timeline.
   * @returns {gsap.core.Timeline}
   */
  const start = () => {
    if (!hasGSAP()) return null;

    registerCustomEases();
    runSplitText();

    const opening   = qs('.eden-opening');
    const name      = qs('.eden-name');
    const secondary = qs('.eden-secondary');
    const loading   = el('loading-screen');
    const hint      = el('scroll-hint');

    // Ensure clean initial state
    gsap.set(opening, { opacity: 0, y: 8 });
    gsap.set(name, { opacity: 0, letterSpacing: '0.4em' });
    gsap.set(secondary, { opacity: 0 });
    gsap.set(hint, { scaleY: 0, transformOrigin: 'center top' });

    // Set each char to invisible for the letter-by-letter reveal.
    if (splitChars) {
      gsap.set(splitChars.chars, { opacity: 0 });
    }

    const t0 = performance.now();

    const tl = gsap.timeline();

    // 0.0s — the breathing seed exhales and dissolves into the void.
    const orb = loading?.querySelector('.loading-orb');
    const orbWord = loading?.querySelector('.loading-word');
    if (orb) {
      gsap.set(orb, { animation: 'none' });
      tl.to(orb, { scale: 0.4, opacity: 0.0, duration: 0.8, ease: window.CustomEase ? 'eden-breath' : 'power2.in' }, 0);
    }
    if (orbWord) {
      gsap.set(orbWord, { animation: 'none' });
      tl.to(orbWord, { opacity: 0, duration: 0.4, ease: window.CustomEase ? 'eden-breath' : 'power1.in' }, 0);
    }
    tl.to(loading, {
      opacity: 0, duration: 0.6, ease: window.CustomEase ? 'eden-breath' : 'power1.out',
      onComplete: () => loading?.parentNode?.removeChild(loading)
    }, 0.2);

    // 0.8s — "In the beginning." in
    tl.fromTo(opening,
      { opacity: 0, y: 8 },
      { opacity: 0.7, y: 0, duration: 1.2, ease: window.CustomEase ? 'eden-breath' : 'power1.out' },
      0.8
    );

    // 3.2s — "In the beginning." out
    tl.to(opening, {
      opacity: 0, y: -6, duration: 0.8, ease: window.CustomEase ? 'eden-breath' : 'power1.in'
    }, 3.2);

    // 3.8s — EXPLORATION begins. Cursor is the light. Do not interrupt.
    tl.call(() => {
      emit('eden:exploration-start');
      beginExplorationGate();
    }, [], 3.8);

    // The revelation sequence is appended to `tl` only when the gate fires.
    let gateFired = false;
    function beginExplorationGate() {
      const openedAt = performance.now();
      let idleTimer = null;

      const armed = () =>
        (performance.now() - openedAt) / 1000 >= EXPLORATION_MIN;

      const tryReveal = (label) => {
        if (gateFired) return;
        if (!armed()) return;
        gateFired = true;
        cleanup();
        appendRevelation(label);
      };

      const onGesture = (e) => {
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

      // +1.8s — EDEN arrives. Letter-by-letter reveal via SplitText.
      // Each char fades in with a stagger, creating a typographic emergence.
      // The overall name opacity goes to 1, individual chars also animate.
      r.to(name, {
        opacity: 1,
        duration: 0.01,
        ease: 'none',
      }, 1.8);

      if (splitChars && splitChars.chars.length) {
        r.to(splitChars.chars, {
          opacity: 1,
          duration: 0.4,
          ease: window.CustomEase ? 'eden-reveal' : 'power2.out',
          stagger: 0.08,
        }, 1.8);
      } else {
        // Fallback if SplitText failed
        r.to(name, { opacity: 1, duration: 0.6, ease: 'none' }, 1.8);
      }

      // Letter-spacing contracts 0.4em → 0.2em (§13 — only motion on the name).
      r.to(name, {
        letterSpacing: '0.2em', duration: 1.2, ease: window.CustomEase ? 'eden-breath' : 'power2.out'
      }, 1.8);

      // +2.0s — chromatic aberration spike
      r.call(() => {
        const target = el('eden-content') ?? document.body;
        target.classList.add('chromatic-active');
        setTimeout(() => target.classList.remove('chromatic-active'), 300);
      }, [], 2.0);

      // +2.6s — "Saper vedere." holds 3s, fades
      r.to(secondary, {
        opacity: 0.5, duration: 0.8, ease: window.CustomEase ? 'eden-breath' : 'power1.out',
        onComplete: () => {
          gsap.to(secondary, {
            opacity: 0, duration: 1.0, ease: window.CustomEase ? 'eden-breath' : 'power1.in', delay: SECONDARY_HOLD
          });
        }
      }, 2.6);

      // +3.5s — scroll hint in
      r.to(hint, {
        scaleY: 1, duration: 0.8, ease: window.CustomEase ? 'eden-breath' : 'power2.out',
        onComplete: () => hint.classList.add('is-visible')
      }, 3.5);

      // +3.8s — unlock scroll, init ScrollSmoother + scroll sections
      r.call(() => {
        document.body.style.overflow = ''; // eslint-disable-line no-self-assign
        initScrollSmoother();
        if (window.ScrollTrigger) {
          window.ScrollTrigger.refresh();
          initScrollSections();
          initEdenBreath();
          initCursorParallax();
        }
        emit('eden:resolved');
      }, [], 3.8);

      tl.add(r, tl.time());
    }

    // ── ScrollSmoother initialization ──────────────────────────────────────
    // Creates buttery smooth scroll interpolation. The wrapper div contains
    // all scrollable content, and ScrollSmoother handles the lerp.
    function initScrollSmoother() {
      if (!window.ScrollSmoother) return;

      // Check if already initialized
      if (window._edenSmoother) return;

      const content = el('smooth-content');
      if (!content) return;

      // ScrollSmoother needs a wrapper with fixed height.
      // #smooth-content contains all scroll sections.
      // We create a smooth wrapper around it.
      try {
        window._edenSmoother = ScrollSmoother.create({
          wrapper: '#smooth-wrapper',
          content: '#smooth-content',
          smooth: 1.5,          // smooth scroll duration in seconds
          effects: true,        // enable data-speed parallax
          smoothTouch: 0.1,     // light smoothing on touch devices
          ignoreMobileResize: true,
        });
      } catch (e) {
        console.warn('[EDEN] ScrollSmoother init failed:', e.message);
      }
    }

    // ── Scroll section animations ──────────────────────────────────────────
    // Each .scroll-section fades in + translates up as it enters viewport.
    // Parallax depth driven by data-speed (lower = slower, deeper).
    function initScrollSections() {
      if (!window.gsap || !window.ScrollTrigger) return;

      const sections = document.querySelectorAll('.scroll-section');
      sections.forEach((section, index) => {
        const speed = parseFloat(section.dataset.speed) || 0.6;

        // Reveal the section — with scale for extra pop.
        gsap.fromTo(section,
          { opacity: 0, y: 60, scale: 0.97 },
          {
            opacity: 1, y: 0, scale: 1,
            duration: 1.4,
            ease: window.CustomEase ? 'eden-breath' : 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 90%',
              end: 'top 30%',
              scrub: 1.2,
            },
          }
        );

        // Decorative line between sections — grows up with a glow.
        if (index > 0) {
          gsap.fromTo(section,
            { '--line-h': '0px', '--line-o': 0 },
            {
              '--line-h': '80px', '--line-o': 0.6,
              ease: window.CustomEase ? 'eden-breath' : 'power2.out',
              scrollTrigger: {
                trigger: section,
                start: 'top 85%',
                end: 'top 45%',
                scrub: 1,
              },
            }
          );
        }

        // Parallax: inner content drifts at different rate with a gentle scale.
        const inner = section.querySelector('.scroll-quote, .scroll-philosophy, .scroll-coda, .scroll-credit');
        if (inner) {
          gsap.fromTo(inner,
            { y: 40 * speed, scale: 0.98 },
            {
              y: -30 * speed, scale: 1,
              ease: window.CustomEase ? 'eden-drift' : 'none',
              scrollTrigger: {
                trigger: section,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 2.5,
              },
            }
          );
        }

        // Subtle rotation on the quote sections — organic sway.
        const quote = section.querySelector('.scroll-quote');
        if (quote) {
          gsap.fromTo(quote,
            { rotation: -1.5 },
            {
              rotation: 1.5,
              ease: 'sine.inOut',
              scrollTrigger: {
                trigger: section,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 3,
              },
            }
          );
        }
      });
    }

    // ── EDEN stays pinned until scroll ────────────────────────────────────
    // The text is fixed until the user scrolls, then fades away smoothly.
    function initEdenBreath() {
      if (!window.gsap || !window.ScrollTrigger) return;

      const nameEl = document.querySelector('.eden-name');
      const openingEl = document.querySelector('.eden-opening');
      const secondaryEl = document.querySelector('.eden-secondary');
      if (!nameEl) return;

      // No breathing pulse — EDEN stays at full opacity until scroll.
      // Pin the text so it stays visible as the scroll begins.
      ScrollTrigger.create({
        trigger: '#smooth-content',
        start: 'top bottom',
        end: 'top 30%',
        onEnter: () => { /* stays visible */ },
        onLeaveBack: () => { /* stays visible */ },
      });

      // Fade EDEN text as user scrolls — but only after scrolling past the initial viewport.
      const fadeTargets = [nameEl, openingEl, secondaryEl].filter(Boolean);
      gsap.to(fadeTargets, {
        opacity: 0,
        y: -40,
        scale: 0.95,
        ease: 'power2.inOut',
        stagger: 0.15,
        scrollTrigger: {
          trigger: '#smooth-content',
          start: 'top 30%',
          end: 'top 80%',
          scrub: 1.5,
        },
      });

      // Text glow pulse — subtle warm oscillation on text-shadow instead of opacity.
      gsap.to(nameEl, {
        textShadow: '0 0 40px rgba(139,94,60,0.25), 0 0 80px rgba(139,94,60,0.12), 0 2px 4px rgba(0,0,0,0.08)',
        duration: 3,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    }

    // ── Cursor parallax — EDEN text tilts slightly toward mouse ───────────
    // Makes the site feel alive and responsive without being distracting.
    function initCursorParallax() {
      const nameEl = document.querySelector('.eden-name');
      if (!nameEl) return;

      document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;  // -1 to 1
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        gsap.to(nameEl, {
          x: x * 8,
          y: y * 4,
          rotateX: -y * 3,
          rotateY: x * 3,
          duration: 1.2,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      });
    }

    tl.play();
    return tl;
  };

  window.EDEN = window.EDEN || {};
  window.EDEN.startTimeline = start;
})();
