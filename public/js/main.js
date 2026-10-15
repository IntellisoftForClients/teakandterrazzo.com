/* Teak & Terrazzo — interactions + motion (Terion-style) */

(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.getElementById('siteHeader');
  const menuToggle = document.getElementById('menuToggle');
  const navOverlay = document.getElementById('navOverlay');
  const hero = document.getElementById('hero');

  /* ----- Smooth scroll (Lenis) ----- */
  let lenis = null;
  if (!reduceMotion && typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
      wheelMultiplier: 1,
    });
    document.documentElement.classList.add('lenis');

    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const id = anchor.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -80 });
      });
    });
  }

  /* ----- Mobile / overlay menu ----- */
  if (menuToggle && navOverlay) {
    const setMenuOpen = (open) => {
      navOverlay.classList.toggle('open', open);
      menuToggle.classList.toggle('active', open);
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
      if (header) {
        header.classList.toggle('menu-open', open);
        header.classList.toggle('on-dark', open);
        if (open) header.classList.remove('scrolled', 'on-hero');
      }
      if (lenis) {
        if (open) lenis.stop();
        else lenis.start();
      }
      if (!open) updateHeader();
    };

    menuToggle.addEventListener('click', () => {
      setMenuOpen(!navOverlay.classList.contains('open'));
    });

    navOverlay.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenuOpen(false));
    });
  }

  /* ----- Header scroll state ----- */
  function updateHeader() {
    if (!header) return;
    const overlayOpen = navOverlay?.classList.contains('open');
    if (overlayOpen) {
      header.classList.add('menu-open', 'on-dark');
      header.classList.remove('scrolled', 'on-hero');
      return;
    }

    const y = window.scrollY || window.pageYOffset || 0;
    const heroH = hero ? hero.offsetHeight - 80 : 400;
    const onHero = y < heroH;

    header.classList.remove('menu-open', 'on-dark');
    header.classList.toggle('scrolled', !onHero && y > 40);
    header.classList.toggle('on-hero', onHero);
    if (onHero) header.classList.remove('scrolled');
  }

  window.addEventListener('scroll', updateHeader, { passive: true });
  if (lenis) lenis.on('scroll', updateHeader);
  updateHeader();

  /* ----- Soft page enter (all public pages) ----- */
  Array.from(document.body.children).forEach((el) => {
    if (el.classList.contains('site-header')) return;
    if (el.classList.contains('nav-overlay')) return;
    if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
    el.classList.add('page-fade');
  });

  /* ----- Hero / page-hero entrance ----- */
  requestAnimationFrame(() => {
    document.body.classList.add('is-ready');
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) heroContent.classList.add('hero-in');
    const pageHero = document.querySelector('.page-hero');
    if (pageHero) pageHero.classList.add('hero-in');
  });

  /* ----- Soft page navigation (View Transitions) ----- */
  function isSoftNavLink(anchor) {
    if (!anchor || !anchor.href) return false;
    if (anchor.hasAttribute('download')) return false;
    if (anchor.target && anchor.target !== '_self') return false;
    if (anchor.getAttribute('rel')?.includes('external')) return false;

    let url;
    try {
      url = new URL(anchor.href, window.location.href);
    } catch {
      return false;
    }

    if (url.origin !== window.location.origin) return false;
    if (url.pathname.startsWith('/admin')) return false;
    if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) {
      return false;
    }
    if (url.href === window.location.href) return false;
    return true;
  }

  if (!reduceMotion && typeof document.startViewTransition === 'function') {
    document.addEventListener(
      'click',
      (e) => {
        if (e.defaultPrevented) return;
        if (e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        const anchor = e.target.closest('a[href]');
        if (!isSoftNavLink(anchor)) return;

        e.preventDefault();
        const href = anchor.href;

        const transition = document.startViewTransition(() => {
          window.location.assign(href);
          return new Promise(() => {});
        });

        if (transition && transition.finished) {
          transition.finished.catch(() => {});
        }
      },
      true
    );
  }

  /* ----- Reveal on scroll ----- */
  // Stagger siblings in grids / lists (like Framer)
  document
    .querySelectorAll('.stats-grid, .services-list, .works-grid, .works-side, .blog-grid')
    .forEach((group) => {
      const kids = group.querySelectorAll(
        ':scope > .reveal, :scope > .reveal-item, :scope > .work-card, :scope > .service-card, :scope > .service-stack-item > .service-card, :scope > .blog-card, :scope > .stat-card'
      );
      kids.forEach((el, i) => {
        el.classList.add('reveal');
        el.style.setProperty('--reveal-delay', `${Math.min(i * 0.1, 0.4)}s`);
      });
    });

  const markVisible = (el) => {
    el.classList.add('visible');
  };

  const revealEls = document.querySelectorAll('.reveal');

  if (reduceMotion) {
    revealEls.forEach(markVisible);
  } else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          markVisible(entry.target);
          io.unobserve(entry.target);
        });
      },
      // Fire earlier / more reliably than a tight -8% + high threshold
      { threshold: 0.05, rootMargin: '0px 0px -48px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach(markVisible);
  }

  /* ----- Animated counters ----- */
  const counters = document.querySelectorAll('[data-count]');
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const duration = 1600;
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + target.toFixed(decimals) + suffix;
    };
    requestAnimationFrame(tick);
  };

  if (counters.length && 'IntersectionObserver' in window) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          cio.unobserve(entry.target);
        });
      },
      { threshold: 0.35, rootMargin: '0px 0px -40px 0px' }
    );
    counters.forEach((c) => cio.observe(c));
  } else if (reduceMotion) {
    counters.forEach((el) => {
      const target = parseFloat(el.dataset.count);
      el.textContent =
        (el.dataset.prefix || '') +
        target.toFixed(parseInt(el.dataset.decimals || '0', 10)) +
        (el.dataset.suffix || '');
    });
  }

  /* ----- Process accordion + media crossfade ----- */
  const steps = document.querySelectorAll('.process-step');
  const slides = document.querySelectorAll('.process-visual .slide');
  const processVisual = document.querySelector('.process-visual');

  const syncProcessMedia = (idx) => {
    slides.forEach((slide, i) => {
      const active = String(i) === String(idx);
      slide.classList.toggle('active', active);
      const video = slide.querySelector('video');
      if (video) {
        if (active) video.play().catch(() => {});
        else {
          video.pause();
          video.currentTime = 0;
        }
      }
    });
  };

  const revealProcessImage = () => {
    if (!processVisual || !window.matchMedia('(max-width: 1100px)').matches) return;
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 80;
    const top = processVisual.getBoundingClientRect().top;
    if (top < navH + 8 || top > window.innerHeight * 0.45) {
      const y = window.scrollY + processVisual.getBoundingClientRect().top - navH - 12;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  };

  steps.forEach((step) => {
    step.addEventListener('click', () => {
      const idx = step.dataset.step;
      steps.forEach((s) => s.classList.remove('active'));
      step.classList.add('active');
      syncProcessMedia(idx);
      revealProcessImage();
    });
  });
  if (steps.length) syncProcessMedia(0);

  /* ----- Testimonials: infinite loop + drag to scroll ----- */
  const track = document.getElementById('testimonialTrack');
  const viewport =
    document.getElementById('testimonialViewport') ||
    track?.closest('.testimonial-viewport') ||
    track?.parentElement;

  if (track && viewport) {
    const originals = Array.from(track.querySelectorAll('.testimonial-card'));
    const count = originals.length;

    if (count > 0) {
      const copies = count === 1 ? 4 : 3;
      for (let c = 0; c < copies - 1; c += 1) {
        originals.forEach((card) => {
          const clone = card.cloneNode(true);
          clone.setAttribute('aria-hidden', 'true');
          track.appendChild(clone);
        });
      }

      let offset = 0;
      let setWidth = 0;
      let rafId = 0;
      let lastTs = 0;
      let dragging = false;
      let dragMoved = false;
      let pointerId = null;
      let startX = 0;
      let startOffset = 0;
      let lastX = 0;
      let lastMoveTs = 0;
      let velocity = 0; // px/ms
      const AUTO_SPEED = reduceMotion ? 0 : 0.035;
      const FRICTION = 0.95;

      const measure = () => {
        const card = track.querySelector('.testimonial-card');
        if (!card) return;
        const styles = getComputedStyle(track);
        const gap = parseFloat(styles.columnGap || styles.gap) || 24;
        const w = card.getBoundingClientRect().width;
        setWidth = (w + gap) * count;
        track.style.transition = 'none';
      };

      const wrapOffset = () => {
        if (setWidth <= 0) return;
        while (offset >= setWidth) offset -= setWidth;
        while (offset < 0) offset += setWidth;
      };

      const paint = () => {
        wrapOffset();
        track.style.transform = `translate3d(${-offset}px, 0, 0)`;
      };

      const tick = (ts) => {
        if (!lastTs) lastTs = ts;
        const dt = Math.min(48, ts - lastTs);
        lastTs = ts;

        if (!dragging && !document.hidden) {
          if (Math.abs(velocity) > 0.02) {
            offset += velocity * dt;
            velocity *= Math.pow(FRICTION, dt / 16);
            if (Math.abs(velocity) < 0.02) velocity = 0;
          } else if (AUTO_SPEED > 0) {
            offset += AUTO_SPEED * dt;
          }
        }

        paint();
        rafId = requestAnimationFrame(tick);
      };

      const onPointerDown = (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        dragging = true;
        dragMoved = false;
        pointerId = e.pointerId;
        startX = e.clientX;
        lastX = e.clientX;
        startOffset = offset;
        lastMoveTs = performance.now();
        velocity = 0;
        viewport.classList.add('is-dragging');
        try {
          viewport.setPointerCapture(e.pointerId);
        } catch (_) {
          /* ignore */
        }
      };

      const onPointerMove = (e) => {
        if (!dragging || e.pointerId !== pointerId) return;
        const x = e.clientX;
        const dx = x - startX;
        if (Math.abs(dx) > 4) dragMoved = true;
        offset = startOffset - dx;

        const now = performance.now();
        const dt = Math.max(1, now - lastMoveTs);
        velocity = ((lastX - x) / dt); // drag left => positive offset (same as auto)
        lastX = x;
        lastMoveTs = now;
        paint();
      };

      const onPointerUp = (e) => {
        if (!dragging || (pointerId != null && e.pointerId !== pointerId)) return;
        dragging = false;
        pointerId = null;
        viewport.classList.remove('is-dragging');
        // Clamp runaway flick speed
        velocity = Math.max(-2.2, Math.min(2.2, velocity));
        lastTs = 0;
        try {
          if (e.pointerId != null) viewport.releasePointerCapture(e.pointerId);
        } catch (_) {
          /* ignore */
        }
      };

      // Prevent click text-selection quirks after a drag
      viewport.addEventListener(
        'click',
        (e) => {
          if (dragMoved) {
            e.preventDefault();
            e.stopPropagation();
            dragMoved = false;
          }
        },
        true
      );

      viewport.addEventListener('pointerdown', onPointerDown);
      viewport.addEventListener('pointermove', onPointerMove);
      viewport.addEventListener('pointerup', onPointerUp);
      viewport.addEventListener('pointercancel', onPointerUp);
      viewport.addEventListener('lostpointercapture', onPointerUp);

      document.addEventListener('visibilitychange', () => {
        lastTs = 0;
        if (document.hidden) velocity = 0;
      });

      window.addEventListener('resize', () => {
        const ratio = setWidth > 0 ? offset / setWidth : 0;
        measure();
        offset = ratio * setWidth;
        paint();
      });

      measure();
      paint();
      rafId = requestAnimationFrame(tick);

      window.addEventListener(
        'beforeunload',
        () => {
          if (rafId) cancelAnimationFrame(rafId);
        },
        { once: true }
      );
    }
  }

  /* ----- Subtle hero parallax ----- */
  const heroMedia = document.querySelector('.hero-media img, .hero-media video');
  if (heroMedia && !reduceMotion) {
    const onScroll = () => {
      const y = window.scrollY || 0;
      if (y > (hero?.offsetHeight || 900)) return;
      heroMedia.style.transform = `scale(1.08) translate3d(0, ${y * 0.18}px, 0)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    if (lenis) lenis.on('scroll', onScroll);
    onScroll();
  }

  /* ----- Services sticky heading + card stack ----- */
  const stackSection = document.querySelector('.services-stack');
  const stackHead = document.querySelector('.services-stack .section-head');
  const stackItems = document.querySelectorAll('.services-stack .service-stack-item');
  if (stackSection && stackHead && stackItems.length && !reduceMotion) {
    const lastItem = stackItems[stackItems.length - 1];
    const lastIndex = stackItems.length - 1;
    const smoothstep = (t) => t * t * (3 - 2 * t);

    const updateStack = () => {
      const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 80;
      /* offsetHeight ignores transform — stable while heading slides away */
      const naturalHeadH = Math.ceil(stackHead.offsetHeight) || 110;
      const lastStep = Math.min(lastIndex, 4) * 14;

      /*
        Scroll-linked release: as the last card approaches its sticky slot,
        ease the heading up + fade, and shrink the sticky offset for cards.
      */
      const stickLine = navH + lastStep;
      const releaseDistance = Math.max(naturalHeadH + 120, 200);
      const lastTop = lastItem.getBoundingClientRect().top;
      let progress = (stickLine + releaseDistance - lastTop) / releaseDistance;
      progress = Math.min(1, Math.max(0, progress));
      const eased = smoothstep(progress);

      const lift = eased * (naturalHeadH + 28);
      stackHead.style.transform = `translate3d(0, ${-lift}px, 0)`;
      stackHead.style.opacity = String(1 - eased);
      stackHead.style.pointerEvents = eased > 0.9 ? 'none' : '';
      stackHead.classList.toggle('is-released', eased > 0.95);

      const headH = Math.round(naturalHeadH * (1 - eased));
      stackSection.style.setProperty('--services-head-h', `${headH}px`);
      const stickyBase = navH + headH;

      stackItems.forEach((item, i) => {
        const step = Math.min(i, 4) * 14;
        item.style.top = `${stickyBase + step}px`;
        item.style.zIndex = String(10 + i);
        const next = stackItems[i + 1];
        if (!next) {
          item.classList.remove('is-stacked');
          return;
        }
        const nextTop = next.getBoundingClientRect().top;
        item.classList.toggle('is-stacked', nextTop <= stickyBase + step + 24);
      });
    };

    window.addEventListener('scroll', updateStack, { passive: true });
    window.addEventListener('resize', updateStack);
    if (lenis) lenis.on('scroll', updateStack);
    updateStack();
  }
})();
