/* =====================================================================
   PROJECT PAGE ENHANCEMENTS (behavior)
   Pairs with project-enhance.css
   ===================================================================== */
(function () {
  function initReveal() {
    var selectors = '.section-title, .feature-card, .collab-row, .content-text, .tech-row, .btn-row';
    var els = document.querySelectorAll(selectors);

    els.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = (Math.min(i % 4, 3) * 0.08) + 's';
    });

    if (!('IntersectionObserver' in window)) {
      // Fallback: just show everything if the browser can't observe.
      els.forEach(function (el) { el.classList.add('in-view'); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    els.forEach(function (el) { observer.observe(el); });
  }

  function initSpotlight() {
    document.querySelectorAll('.feature-card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty('--spot-x', (e.clientX - rect.left) + 'px');
        card.style.setProperty('--spot-y', (e.clientY - rect.top) + 'px');
      });
    });
  }

  // Re-run reveal whenever a tab is switched, so content inside a
  // previously-hidden tab (display:none) animates in instead of
  // just popping into place.
  function watchTabs() {
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setTimeout(function () {
          initReveal();
          initGalleries();
          window.dispatchEvent(new Event('scroll'));
        }, 30);
      });
    });
  }

  function initScrollspy() {
    var sections = document.querySelectorAll('section[id]');
    var navLinks = document.querySelectorAll('.nav-link');
    if (!sections.length || !navLinks.length) return;

    function onScroll() {
      var current = '';
      sections.forEach(function (section) {
        // Skip sections that are hidden (e.g. an inactive tab on Antonie Motors)
        if (section.offsetParent === null) return;
        if (window.pageYOffset >= section.offsetTop - 200) {
          current = section.getAttribute('id');
        }
      });

      var match = null;
      navLinks.forEach(function (link) {
        if (link.getAttribute('href') === '#' + current) match = link;
      });

      if (match) {
        navLinks.forEach(function (link) { link.classList.remove('active'); });
        match.classList.add('active');
      }
    }

    window.addEventListener('scroll', onScroll);
    onScroll();
  }

  /* ================= GALLERY: INFINITE LOOP + LIGHTBOX ================= */
  var lightboxEl = null;
  var lbState = { images: [], index: 0 };

  function renderLightbox() {
    var img = lightboxEl.querySelector('.pt-lb-img');
    var item = lbState.images[lbState.index];
    img.src = item.src;
    img.alt = item.alt;
  }

  function stepLightbox(dir) {
    var n = lbState.images.length;
    lbState.index = (lbState.index + dir + n) % n;
    renderLightbox();
  }

  function closeLightbox() {
    if (!lightboxEl) return;
    lightboxEl.classList.remove('open');
    document.body.classList.remove('pt-lb-lock');
  }

  function buildLightbox() {
    if (lightboxEl) return lightboxEl;
    lightboxEl = document.createElement('div');
    lightboxEl.className = 'pt-lightbox';
    lightboxEl.innerHTML =
      '<button type="button" class="pt-lb-close" aria-label="Close">&times;</button>' +
      '<button type="button" class="pt-lb-prev" aria-label="Previous image">&#8249;</button>' +
      '<img class="pt-lb-img" alt="">' +
      '<button type="button" class="pt-lb-next" aria-label="Next image">&#8250;</button>';
    document.body.appendChild(lightboxEl);

    lightboxEl.querySelector('.pt-lb-close').addEventListener('click', closeLightbox);
    lightboxEl.addEventListener('click', function (e) {
      if (e.target === lightboxEl) closeLightbox();
    });
    lightboxEl.querySelector('.pt-lb-prev').addEventListener('click', function (e) {
      e.stopPropagation();
      stepLightbox(-1);
    });
    lightboxEl.querySelector('.pt-lb-next').addEventListener('click', function (e) {
      e.stopPropagation();
      stepLightbox(1);
    });
    document.addEventListener('keydown', function (e) {
      if (!lightboxEl.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') stepLightbox(-1);
      if (e.key === 'ArrowRight') stepLightbox(1);
    });

    return lightboxEl;
  }

  function openLightbox(images, startIdx) {
    buildLightbox();
    lbState.images = images;
    lbState.index = startIdx;
    renderLightbox();
    lightboxEl.classList.add('open');
    document.body.classList.add('pt-lb-lock');
  }

  function initGalleries() {
    document.querySelectorAll('.gallery-container').forEach(function (container) {
      var strip = container.querySelector('.gallery-strip');
      if (!strip) return;

      var cards = strip.querySelectorAll('.gallery-card');
      if (!cards.length) return;

      if (!strip.dataset.ptLightboxWired) {
        strip.dataset.ptLightboxWired = '1';

        // Wire the lightbox on every card that actually has an image
        // (skips text-only placeholder cards like "Screenshots Coming").
        var images = [];
        cards.forEach(function (card) {
          var img = card.querySelector('img');
          if (!img) return;
          images.push({ src: img.src, alt: img.alt || '' });
        });

        cards.forEach(function (card) {
          var img = card.querySelector('img');
          if (!img) return;
          var myIndex = images.findIndex(function (i) { return i.src === img.src; });
          card.style.cursor = 'zoom-in';
          card.addEventListener('click', function () {
            openLightbox(images, myIndex);
          });
        });
      }

      if (container.dataset.ptLooped) return;

      // Fewer than 2 real images isn't worth looping.
      if (cards.length < 2) return;

      // If this gallery is inside a currently-hidden tab, scrollWidth reads
      // as 0 — skip for now without marking it done, so it's retried once
      // the tab becomes visible (see watchTabs()).
      if (strip.scrollWidth <= 0) return;

      container.dataset.ptLooped = '1';

      var clone = strip.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.removeAttribute('id');
      container.appendChild(clone);

      var half = strip.scrollWidth;
      window.addEventListener('resize', function () { half = strip.scrollWidth; });

      var autoScroll = true;
      var SPEED = 0.35;
      var scrollAccum = 0;
      var resumeTimer = null;

      function wrap() {
        if (half <= 0) return;
        if (container.scrollLeft >= half) container.scrollLeft -= half;
        else if (container.scrollLeft < 0) container.scrollLeft += half;
      }

      function tick() {
        if (autoScroll) {
          scrollAccum += SPEED;
          if (scrollAccum >= 1) {
            var whole = Math.floor(scrollAccum);
            container.scrollLeft += whole;
            scrollAccum -= whole;
          }
          wrap();
        }
        requestAnimationFrame(tick);
      }
      tick();

      function pause(ms) {
        autoScroll = false;
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(function () { autoScroll = true; }, ms || 2500);
      }

      container.addEventListener('pointerdown', function () { pause(3000); });
      container.addEventListener('wheel', function () { pause(1500); });
      container.addEventListener('scroll', function () { wrap(); });
      container.addEventListener('mouseenter', function () { autoScroll = false; });
      container.addEventListener('mouseleave', function () { autoScroll = true; });

      var wrapperEl = container.closest('.gallery-wrapper');
      if (wrapperEl) {
        wrapperEl.querySelectorAll('.scroll-arrow').forEach(function (btn) {
          btn.addEventListener('click', function () { pause(3000); });
        });
      }
    });
  }

  function start() {
    initReveal();
    initSpotlight();
    watchTabs();
    initScrollspy();
    initGalleries();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
