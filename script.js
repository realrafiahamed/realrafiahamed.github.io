// Global Selectors
const themeToggle = document.querySelector('.theme-toggle');
const menuButton = document.querySelector('.menu-button');
const mobileMenu = document.querySelector('.mobile-menu');
loaderDuration = 3000;

function applyTheme(theme) {
  const isLight = theme === 'light';
  document.body.classList.toggle('light', isLight);
  if (themeToggle) {
    themeToggle.setAttribute('aria-pressed', String(isLight));
    themeToggle.setAttribute('aria-label', `Switch to ${isLight ? 'dark' : 'light'} mode`);
  }
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

const savedTheme = localStorage.getItem('rafi-theme');
applyTheme(savedTheme || 'light');

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isCurrentlyLight = document.body.classList.contains('light');
    const nextTheme = isCurrentlyLight ? 'dark' : 'light';
    localStorage.setItem('rafi-theme', nextTheme);
    applyTheme(nextTheme);
  });
}

if (menuButton && mobileMenu) {
  menuButton.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('is-open');
    menuButton.classList.toggle('is-open', isOpen);
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });
}

window.setTimeout(() => {
  document.body.classList.remove('is-loading');
}, loaderDuration);

document.addEventListener('DOMContentLoaded', () => {
  const triggers = document.querySelectorAll('[data-tab]');
  const sections = document.querySelectorAll('.content-section');

  function getRouteName() {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    if (path && document.getElementById(path)) return path;

    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(hash)) return hash;

    return 'about';
  }

  function activateSection(targetTab, updateHistory = true) {
    const targetSection = document.getElementById(targetTab);
    if (!targetSection) return;

    sections.forEach(sec => {
      if (sec === targetSection) {
        sec.classList.add('tab-active');
      } else {
        sec.classList.remove('tab-active');
      }
    });

    triggers.forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-tab') === targetTab);
    });

    if (updateHistory) {
      const isFileProtocol = window.location.protocol === 'file:';
      const newUrl = isFileProtocol
        ? `${window.location.pathname.split('#')[0]}#${targetTab}`
        : `#${targetTab}`;
      history.pushState({ tab: targetTab }, '', newUrl);
    }

    if (mobileMenu && mobileMenu.classList.contains('is-open')) {
      mobileMenu.classList.remove('is-open');
      if (menuButton) {
        menuButton.classList.remove('is-open');
        menuButton.setAttribute('aria-expanded', 'false');
      }
    }
  }

  // Navbar clicks
  triggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      const targetTab = trigger.getAttribute('data-tab');
      const targetSection = document.getElementById(targetTab);
      if (targetSection) {
        e.preventDefault();
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        activateSection(targetTab, true);
      }
    });
  });

  // ===== Improved Observer (works on all devices) =====
  function createObserver() {
  const mainContent = document.querySelector('.main-content');
  const isDesktop = window.matchMedia('(min-width: 1025px)').matches;

  const observer = new IntersectionObserver((entries) => {
    // Only consider entries that are significantly visible
    const visibleEntries = entries
      .filter(entry => entry.isIntersecting && entry.intersectionRatio >= 0.35)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

    if (visibleEntries.length > 0) {
      // Pick the most visible section
      activateSection(visibleEntries[0].target.id, true);
    }
  }, {
    root: isDesktop ? mainContent : null,
    threshold: [0.2, 0.35, 0.5, 0.65],
    rootMargin: isDesktop 
      ? '-10% 0px -10% 0px' 
      : '-20% 0px -35% 0px'   // stricter on mobile → less flickering
  });

  sections.forEach(sec => observer.observe(sec));
  return observer;
}

  let currentObserver = createObserver();

  // Recreate observer on resize so it works correctly when switching between mobile/desktop
  window.addEventListener('resize', () => {
    if (currentObserver) currentObserver.disconnect();
    currentObserver = createObserver();
  });

  window.addEventListener('popstate', (e) => {
    const activeRoute = (e.state && e.state.tab) ? e.state.tab : getRouteName();
    const targetSec = document.getElementById(activeRoute);
    if (targetSec) {
      targetSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      activateSection(activeRoute, false);
    }
  });

  // Initial load
  // Initial load
  const initialRoute = getRouteName();
  const initialSec = document.getElementById(initialRoute);

  if (initialSec) {
    const isMobile = window.matchMedia('(max-width: 1024px)').matches;

    if (isMobile) {
      window.scrollTo(0, 0);
      activateSection({ top: 0, behavior: 'auto' });
    } else {
      setTimeout(() => {
        initialSec.scrollIntoView({ behavior: 'auto', block: 'start' });
        activateSection(initialRoute, false);
      }, 50);
    }
  }
});