/* =========================================================================
   SPRINGBOLT STUDIO — SHARED SCROLL/LOAD-IN BEHAVIOR
   Include this on every page (after the DOM, right before </body>) so
   heading mask-reveals and body/button fade-ups animate consistently
   site-wide. Pairs with the "SCROLL LOAD-IN TEXT EFFECTS" block in
   styles.css — see that comment for the markup pattern.
   ========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const targets = document.querySelectorAll('.reveal-heading, .char-reveal, .stagger, .fade-in-up');

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

  targets.forEach((el) => io.observe(el));

  // Anything already in the viewport on load (e.g. the hero) should
  // animate in immediately rather than waiting for a scroll event.
  requestAnimationFrame(() => {
    targets.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0){
        el.classList.add('is-visible');
      }
    });
  });

  // Simple tab groups — any ".tab-group" containing ".tab-btn[data-tab-target]"
  // buttons and ".tab-panel[data-tab]" panels. Click a button to show the
  // matching panel and hide the rest; first button/panel active by default
  // (set via "active" class already in the markup).
  document.querySelectorAll('.tab-group').forEach((group) => {
    const btns = group.querySelectorAll('.tab-btn');
    const panels = group.querySelectorAll('.tab-panel');
    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab-target');
        btns.forEach((b) => b.classList.remove('active'));
        panels.forEach((p) => p.classList.remove('active'));
        btn.classList.add('active');
        group.querySelector('.tab-panel[data-tab="' + target + '"]').classList.add('active');
      });
    });
  });

  // Mobile nav toggle — ".nav-toggle" button flips ".nav-open" on
  // .site-header, which the CSS mobile-breakpoint rules key off of.
  // Menu also closes automatically after a link is tapped, or if the
  // window is resized back above the mobile breakpoint while open.
  const header = document.querySelector('.site-header');
  const navToggle = document.querySelector('.nav-toggle');
  const closeAllDropdowns = () => {
    header.querySelectorAll('.has-dropdown.dropdown-open').forEach((li) => {
      li.classList.remove('dropdown-open');
      const btn = li.querySelector('.dropdown-toggle');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  };
  if (header && navToggle) {
    navToggle.addEventListener('click', () => {
      const isOpen = header.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      if (!isOpen) closeAllDropdowns();
    });
    header.querySelectorAll('.site-nav a').forEach((a) => {
      a.addEventListener('click', () => {
        header.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
        closeAllDropdowns();
      });
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 860) {
        header.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
        closeAllDropdowns();
      }
    });
  }

  // Mobile dropdown accordions — each "has-dropdown" li gets a chevron
  // button (touch-only; desktop keeps the existing hover reveal) that
  // toggles a "dropdown-open" class, expanding just that one submenu
  // instead of showing every submenu at once.
  document.querySelectorAll('.dropdown-toggle').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const li = btn.closest('.has-dropdown');
      if (!li) return;
      const isOpen = li.classList.toggle('dropdown-open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });
  });

  // Testimonial carousels — every ".testimonials" block on the page gets
  // its own independent rotation among its ".testimonial-slide" /
  // ".dots span" children. Supports more than one carousel per page.
  document.querySelectorAll('.testimonials').forEach((block) => {
    const slides = block.querySelectorAll('.testimonial-slide');
    const dots = block.querySelectorAll('.dots span');
    if (slides.length < 2) return;
    let i = 0;
    setInterval(() => {
      slides[i].classList.remove('active');
      if (dots[i]) dots[i].classList.remove('active');
      i = (i + 1) % slides.length;
      slides[i].classList.add('active');
      if (dots[i]) dots[i].classList.add('active');
    }, 6000);
  });
});
