// ==========================================================================
// Rafi Ahamed — Personal Portfolio Interactive Controller
// Features:
// - White/Light mode default on both desktop and mobile (Obsidian/Graphite Dark Mode alternative)
// - Original 3100ms signature intro on pure black stage
// - Embedded CV PDF viewer with Blob URL upgrade, Download & Print/Save PDF actions
// - Slowed-down, controlled smooth scrolling for Inspect Full CV & section navigation
// - Controlled desktop mouse-wheel pace smoothing + IntersectionObserver section reveals
// ==========================================================================

(function () {
  'use strict';

  const themeToggleButtons = document.querySelectorAll('.theme-toggle, [data-action="toggle-theme"]');
  const menuButton = document.querySelector('.menu-button');
  const mobileMenu = document.querySelector('.mobile-menu');
  const progressIndicator = document.querySelector('.scroll-progress span');
  const toastEl = document.getElementById('toast-notification');
  const cvModalBackdrop = document.getElementById('cv-modal-backdrop');
  const cvPdfFrame = document.getElementById('cv-pdf-frame');
  const cvDownloadBtn = document.getElementById('cv-download-btn');
  const topNav = document.getElementById('top-nav');
  const portfolioLayout = document.getElementById('portfolio-layout');
  const notFoundView = document.getElementById('not-found-view');
  const floatingDockWrap = document.querySelector('.floating-dock-wrap');

  // Exact original signature loader timing
  const loaderDuration = 3100;

  function prefersReducedMotion() {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function getStoredTheme() {
    try {
      return window.localStorage.getItem('rafi-theme');
    } catch (_) {
      return null;
    }
  }

  function setStoredTheme(value) {
    try {
      window.localStorage.setItem('rafi-theme', value);
    } catch (_) {
      // Ignore storage errors in sandboxed iframes
    }
  }

  function applyTheme(theme) {
    const isLight = theme === 'light';
    document.body.classList.toggle('light', isLight);
    themeToggleButtons.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(isLight));
      btn.setAttribute('aria-label', `Switch to ${isLight ? 'dark' : 'light'} mode`);
    });
  }

  // Default theme is white/light mode on both desktop and mobile
  const initialTheme = getStoredTheme() || 'light';
  applyTheme(initialTheme);

  themeToggleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const isCurrentlyLight = document.body.classList.contains('light');
      const nextTheme = isCurrentlyLight ? 'dark' : 'light';
      setStoredTheme(nextTheme);
      applyTheme(nextTheme);
    });
  });

  window.setTimeout(() => {
    document.body.classList.remove('is-loading');
  }, loaderDuration);

  function closeMobileMenu() {
    if (mobileMenu && mobileMenu.classList.contains('is-open')) {
      mobileMenu.classList.remove('is-open');
      if (menuButton) {
        menuButton.classList.remove('is-open');
        menuButton.setAttribute('aria-expanded', 'false');
      }
    }
  }

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('is-open');
      menuButton.classList.toggle('is-open', isOpen);
      menuButton.setAttribute('aria-expanded', String(isOpen));
    });
  }

  let toastTimer = null;
  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toastEl.classList.remove('is-visible');
    }, 2600);
  }

  function copyTextToClipboard(text, label) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => showToast(`Copied ${label}: ${text}`),
        () => fallbackCopy(text, label)
      );
    } else {
      fallbackCopy(text, label);
    }
  }

  function fallbackCopy(text, label) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast(`Copied ${label}: ${text}`);
    } catch (_) {
      showToast(`Email: ${text}`);
    }
    document.body.removeChild(textarea);
  }

  document.querySelectorAll('[data-copy-email]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const email = btn.getAttribute('data-copy-email') || 'rafiahamed2021@gmail.com';
      const label = btn.getAttribute('data-copy-label') || 'email';
      copyTextToClipboard(email, label);
    });
  });

  // ==========================================================================
  // Unified Smooth Scroll & Controlled Wheel Pace Engine (Requirements 22 & 23)
  // ==========================================================================
  let activeScrollAnim = null;
  let wheelAnim = null;
  let wheelTargetY = window.scrollY;

  function cancelProgrammaticScroll() {
    if (activeScrollAnim) {
      window.cancelAnimationFrame(activeScrollAnim);
      activeScrollAnim = null;
    }
  }

  function cancelWheelSmoothing() {
    if (wheelAnim) {
      window.cancelAnimationFrame(wheelAnim);
      wheelAnim = null;
    }
    wheelTargetY = window.scrollY;
  }

  function getMaxScrollY() {
    return Math.max(0, document.documentElement.scrollHeight - document.documentElement.clientHeight);
  }

  function getDocumentOffsetTop(el) {
    let top = 0;
    let node = el;
    while (node) {
      top += node.offsetTop || 0;
      node = node.offsetParent;
    }
    return top;
  }

  function getSectionScrollTop(targetEl) {
    if (!targetEl || targetEl.id === 'about') return 0;
    const headerHeight = topNav ? topNav.offsetHeight : 70;
    const isMobile = Boolean(window.matchMedia && window.matchMedia('(max-width: 640px)').matches);
    const extraOffset = isMobile ? 22 : 30;
    const rawTop = getDocumentOffsetTop(targetEl) - (headerHeight + extraOffset);
    return Math.min(getMaxScrollY(), Math.max(0, Math.round(rawTop)));
  }

  function computeScrollDuration(distancePx, slowMode = false) {
    const absDist = Math.abs(distancePx);
    if (slowMode) {
      return Math.min(1520, Math.max(1050, Math.round(820 + absDist * 0.42)));
    }
    return Math.min(1380, Math.max(880, Math.round(700 + absDist * 0.36)));
  }

  // Smooth sinusoidal-cubic blend: gentle acceleration, steady readable middle, soft landing
  function easeSmoothEditorial(t) {
    const sine = -(Math.cos(Math.PI * t) - 1) / 2;
    const cubic = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    return sine * 0.45 + cubic * 0.55;
  }

  function smoothScrollToY(targetY, customDuration, onComplete) {
    cancelProgrammaticScroll();
    cancelWheelSmoothing();

    const clampedTarget = Math.min(getMaxScrollY(), Math.max(0, Math.round(targetY)));
    if (prefersReducedMotion()) {
      window.scrollTo({ top: clampedTarget, behavior: 'instant' });
      wheelTargetY = clampedTarget;
      if (typeof onComplete === 'function') onComplete();
      return;
    }

    const startY = window.scrollY;
    const delta = clampedTarget - startY;
    if (Math.abs(delta) < 2) {
      window.scrollTo({ top: clampedTarget, behavior: 'instant' });
      wheelTargetY = clampedTarget;
      if (typeof onComplete === 'function') onComplete();
      return;
    }

    const duration = typeof customDuration === 'number' && customDuration > 0
      ? customDuration
      : computeScrollDuration(delta, false);
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeSmoothEditorial(progress);
      const nextY = Math.round(startY + delta * eased);
      window.scrollTo({ top: nextY, behavior: 'instant' });
      wheelTargetY = nextY;

      if (progress < 1) {
        activeScrollAnim = window.requestAnimationFrame(step);
      } else {
        window.scrollTo({ top: clampedTarget, behavior: 'instant' });
        wheelTargetY = clampedTarget;
        activeScrollAnim = null;
        if (typeof onComplete === 'function') onComplete();
      }
    }

    activeScrollAnim = window.requestAnimationFrame(step);
  }

  // Controlled desktop mouse-wheel pace smoothing to prevent abrupt/runaway page jumps
  window.addEventListener(
    'wheel',
    (e) => {
      if (activeScrollAnim) {
        cancelProgrammaticScroll();
      }
      if (
        prefersReducedMotion() ||
        e.ctrlKey ||
        e.metaKey ||
        e.defaultPrevented ||
        (cvModalBackdrop && cvModalBackdrop.classList.contains('is-open')) ||
        (notFoundView && !notFoundView.hidden)
      ) {
        return;
      }

      // Only smooth discrete or fast vertical mouse-wheel deltas; leave horizontal or micro trackpad ticks native
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const rawDeltaY = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * 320 : e.deltaY;
      if (Math.abs(rawDeltaY) < 42 && !wheelAnim) {
        wheelTargetY = window.scrollY;
        return;
      }

      e.preventDefault();
      if (!wheelAnim) {
        wheelTargetY = window.scrollY;
      }

      // Damp excessive wheel spikes so scrolling remains comfortable and easy to follow
      const dampedDelta = Math.sign(rawDeltaY) * Math.min(Math.abs(rawDeltaY) * 0.68, 96);
      wheelTargetY = Math.min(getMaxScrollY(), Math.max(0, wheelTargetY + dampedDelta));

      if (!wheelAnim) {
        const stepWheel = () => {
          const currentY = window.scrollY;
          const diff = wheelTargetY - currentY;
          if (Math.abs(diff) < 1) {
            window.scrollTo({ top: Math.round(wheelTargetY), behavior: 'instant' });
            wheelAnim = null;
            return;
          }
          const nextY = currentY + diff * 0.14;
          window.scrollTo({ top: Math.round(nextY), behavior: 'instant' });
          wheelAnim = window.requestAnimationFrame(stepWheel);
        };
        wheelAnim = window.requestAnimationFrame(stepWheel);
      }
    },
    { passive: false }
  );

  window.addEventListener(
    'touchstart',
    () => {
      cancelProgrammaticScroll();
      cancelWheelSmoothing();
    },
    { passive: true }
  );

  // ==========================================================================
  // Embedded Actual CV PDF Viewer & Slowed Inspect Full CV Transition (Req 1 & 22)
  // ==========================================================================
  let pdfBlobUrl = null;
  function ensurePdfViewerReady() {
    if (!cvPdfFrame) return;
    const rawSrc = cvPdfFrame.getAttribute('src') || '';
    if (rawSrc.startsWith('data:application/pdf;base64,') && !pdfBlobUrl) {
      try {
        const base64Part = rawSrc.split(',')[1].split('#')[0];
        const binary = window.atob(base64Part);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i += 1) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        pdfBlobUrl = URL.createObjectURL(blob);
        cvPdfFrame.setAttribute('src', `${pdfBlobUrl}#view=FitH`);
        if (cvDownloadBtn) {
          cvDownloadBtn.setAttribute('href', pdfBlobUrl);
        }
      } catch (_) {
        // Keep data URI fallback if Blob creation is restricted
      }
    }
  }

  function openCvModal() {
    if (!cvModalBackdrop) return;
    ensurePdfViewerReady();
    closeMobileMenu();

    // Requirement 22: Smooth, controlled alignment to credentials section + unhurried modal reveal
    const eduSection = document.getElementById('education');
    if (eduSection && (!notFoundView || notFoundView.hidden)) {
      const targetY = getSectionScrollTop(eduSection);
      const dist = Math.abs(targetY - window.scrollY);
      if (dist > 16) {
        smoothScrollToY(targetY, computeScrollDuration(dist, true));
      }
    }

    cvModalBackdrop.classList.add('is-open');
    cvModalBackdrop.setAttribute('aria-hidden', 'false');
  }

  function closeCvModal() {
    if (!cvModalBackdrop) return;
    cvModalBackdrop.classList.remove('is-open');
    cvModalBackdrop.setAttribute('aria-hidden', 'true');
  }

  document.querySelectorAll('[data-action="open-cv"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openCvModal();
    });
  });

  document.querySelectorAll('[data-action="close-cv"]').forEach((btn) => {
    btn.addEventListener('click', closeCvModal);
  });

  if (cvModalBackdrop) {
    cvModalBackdrop.addEventListener('click', (e) => {
      if (e.target === cvModalBackdrop) closeCvModal();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCvModal();
      closeMobileMenu();
    }
  });

  document.querySelectorAll('[data-action="print-cv"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      ensurePdfViewerReady();
      if (cvPdfFrame && cvPdfFrame.contentWindow) {
        try {
          cvPdfFrame.contentWindow.focus();
          cvPdfFrame.contentWindow.print();
          return;
        } catch (_) {
          // Fallback below
        }
      }
      const targetPdf = pdfBlobUrl || (cvDownloadBtn ? cvDownloadBtn.getAttribute('href') : 'CV_Rafi_Ahamed_2026.pdf');
      window.open(targetPdf, '_blank', 'noopener,noreferrer');
    });
  });

  // Project Domain Filtering
  const filterButtons = document.querySelectorAll('[data-filter]');
  const filterableProjects = document.querySelectorAll('[data-category]');
  const projectCountEl = document.getElementById('project-count-label');

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-filter') || 'all';
      filterButtons.forEach((b) => b.classList.toggle('active', b === btn));

      let visibleCount = 0;
      filterableProjects.forEach((item) => {
        const cats = (item.getAttribute('data-category') || '').split(/\s+/);
        const matches = category === 'all' || cats.includes(category);
        item.classList.toggle('is-filtered-out', !matches);
        if (matches) visibleCount += 1;
      });

      if (projectCountEl) {
        projectCountEl.textContent = `Showing ${visibleCount} of ${filterableProjects.length} repositories`;
      }
    });
  });

  // Expandable Leadership / Extracurricular Accordions
  document.querySelectorAll('.leadership-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const parent = trigger.closest('.leadership-item');
      if (!parent) return;
      const isOpen = parent.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', String(isOpen));
    });
  });

  // Requirement 15: Show/Hide Custom 404 View
  function setNotFoundMode(isNotFound) {
    if (!notFoundView || !portfolioLayout) return;
    if (isNotFound) {
      portfolioLayout.style.display = 'none';
      if (floatingDockWrap) floatingDockWrap.style.display = 'none';
      notFoundView.hidden = false;
      window.scrollTo({ top: 0, behavior: 'instant' });
      wheelTargetY = 0;
    } else {
      notFoundView.hidden = true;
      portfolioLayout.style.display = '';
      if (floatingDockWrap) floatingDockWrap.style.display = '';
    }
  }

  document.querySelectorAll('[data-action="return-home"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      setNotFoundMode(false);
      smoothScrollToY(0, 920);
      try {
        history.replaceState({ tab: 'about' }, '', '#about');
      } catch (_) {}
    });
  });

  // Deterministic rAF Scroll-Spy, Entrance Reveal & Controlled Anchor Navigation
  document.addEventListener('DOMContentLoaded', () => {
    const navTriggers = document.querySelectorAll('[data-tab]');
    const sections = Array.from(document.querySelectorAll('.content-section'));

    if ('IntersectionObserver' in window && !prefersReducedMotion()) {
      const entranceObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-inview');
            }
          });
        },
        { root: null, threshold: 0.1, rootMargin: '0px 0px -6% 0px' }
      );
      sections.forEach((sec, idx) => {
        if (idx === 0) sec.classList.add('is-inview');
        entranceObserver.observe(sec);
      });
    } else {
      sections.forEach((sec) => sec.classList.add('is-inview'));
    }

    function activateSection(targetId, updateHistory = false) {
      const targetSection = document.getElementById(targetId);
      if (!targetSection) return;

      setNotFoundMode(false);
      targetSection.classList.add('is-inview');

      sections.forEach((sec) => {
        sec.classList.toggle('tab-active', sec.id === targetId);
      });

      navTriggers.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('data-tab') === targetId);
      });

      if (updateHistory) {
        try {
          history.replaceState({ tab: targetId }, '', `#${targetId}`);
        } catch (_) {
          // Ignore history errors inside sandboxed iframes
        }
      }
    }

    let ticking = false;
    function syncScrollState() {
      ticking = false;
      if (notFoundView && !notFoundView.hidden) return;
      const maxScroll = getMaxScrollY();
      if (progressIndicator) {
        const pct = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
        progressIndicator.style.width = `${Math.min(100, Math.max(0, pct))}%`;
      }

      const headerHeight = topNav ? topNav.offsetHeight : 70;
      const triggerLine = headerHeight + 56;
      let currentId = sections.length ? sections[0].id : 'about';

      for (const sec of sections) {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= triggerLine) {
          currentId = sec.id;
        }
      }

      if (maxScroll > 0 && window.scrollY >= maxScroll - 24 && sections.length) {
        currentId = sections[sections.length - 1].id;
      }

      activateSection(currentId, false);
    }

    function onScrollOrResize() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(syncScrollState);
      }
    }

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      if (anchor.hasAttribute('data-action')) return;
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href') || '';
        const targetId = href.replace(/^#\/?/, '');
        if (!targetId) return;
        const targetEl = document.getElementById(targetId);
        if (targetEl && targetEl.classList.contains('content-section')) {
          e.preventDefault();
          closeMobileMenu();
          setNotFoundMode(false);
          targetEl.classList.add('is-inview');
          const topY = getSectionScrollTop(targetEl);
          const duration = computeScrollDuration(topY - window.scrollY, false);
          smoothScrollToY(topY, duration, () => {
            const alignedY = getSectionScrollTop(targetEl);
            if (Math.abs(window.scrollY - alignedY) > 2) {
              window.scrollTo({ top: alignedY, behavior: 'instant' });
              wheelTargetY = alignedY;
            }
          });
          activateSection(targetId, true);
        } else {
          e.preventDefault();
          closeMobileMenu();
          setNotFoundMode(true);
        }
      });
    });

    function handleHashRoute() {
      const rawHash = window.location.hash.replace(/^#\/?/, '');
      if (!rawHash) return;
      const targetEl = document.getElementById(rawHash);
      if (targetEl && targetEl.classList.contains('content-section')) {
        setNotFoundMode(false);
        targetEl.classList.add('is-inview');
        const targetTop = getSectionScrollTop(targetEl);
        window.scrollTo({ top: targetTop, behavior: 'instant' });
        wheelTargetY = targetTop;
        activateSection(rawHash, false);
      } else {
        setNotFoundMode(true);
      }
    }

    window.addEventListener('hashchange', handleHashRoute);
    if (window.location.hash) {
      window.setTimeout(handleHashRoute, 60);
    }

    syncScrollState();
  });
})();
