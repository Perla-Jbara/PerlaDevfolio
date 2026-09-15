/* =====================================================================
   PEARL PAGE TRANSITION (behavior)
   Pairs with pearl-transition.css. Include on every page that has a
   <div id="pearlTransition"><div class="pt-curtain"></div>
   <div class="pt-pearls"></div></div> in its markup.
   ===================================================================== */
(function () {
  var STORAGE_KEY = 'ptEntering';

  function getOverlay() {
    var wrap = document.getElementById('pearlTransition');
    if (!wrap) return null;
    return {
      wrap: wrap,
      curtain: wrap.querySelector('.pt-curtain'),
      pearlLayer: wrap.querySelector('.pt-pearls')
    };
  }

  function spawnPearls(container, direction, count) {
    if (!container) return;
    container.innerHTML = '';
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var p = document.createElement('div');
      p.className = 'pt-pearl ' + (direction === 'rise' ? 'pt-rise' : 'pt-fall');
      var size = Math.random() * 20 + 10;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = Math.random() * 100 + 'vw';
      var delay = Math.random() * (direction === 'rise' ? 0.5 : 0.35);
      var dur = Math.random() * 0.6 + (direction === 'rise' ? 1.0 : 0.9);
      p.style.setProperty('--pt-delay', delay + 's');
      p.style.setProperty('--pt-dur', dur + 's');
      frag.appendChild(p);
    }
    container.appendChild(frag);
  }

  // ---- Closing: rise + cover, then navigate ----
  window.runPearlTransition = function (destinationUrl) {
    var overlay = getOverlay();
    if (!overlay || !overlay.curtain) {
      window.location.href = destinationUrl;
      return;
    }
    var wrap = overlay.wrap, curtain = overlay.curtain, pearlLayer = overlay.pearlLayer;

    wrap.style.pointerEvents = 'auto';
    spawnPearls(pearlLayer, 'rise', 55);

    curtain.classList.remove('pt-opening', 'pt-covering');
    void curtain.offsetHeight; // force reflow so the transition reliably runs
    curtain.classList.add('pt-closing');

    setTimeout(function () {
      try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
      window.location.href = destinationUrl;
    }, 950);
  };

  // Used by project-card onclick="handleProjectClick(this)"
  window.handleProjectClick = function (card) {
    var destination = card.getAttribute('data-url');
    if (!destination) return;
    card.classList.add('spinning');
    window.runPearlTransition(destination);
  };

  // ---- Opening: if we arrived via a transition, drop the curtain to reveal ----
  function revealIfEntering() {
    var entering = false;
    try { entering = sessionStorage.getItem(STORAGE_KEY) === '1'; } catch (e) {}
    if (!entering) return;

    var overlay = getOverlay();
    if (!overlay || !overlay.curtain) return;
    var wrap = overlay.wrap, curtain = overlay.curtain, pearlLayer = overlay.pearlLayer;

    wrap.style.pointerEvents = 'auto';
    curtain.classList.add('pt-covering');

    setTimeout(function () {
      spawnPearls(pearlLayer, 'fall', 55);
      curtain.classList.remove('pt-covering');
      void curtain.offsetHeight;
      curtain.classList.add('pt-opening');

      setTimeout(function () {
        wrap.style.pointerEvents = 'none';
        curtain.classList.remove('pt-opening');
        if (pearlLayer) pearlLayer.innerHTML = '';
        document.documentElement.classList.remove('pt-entering');
        try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
      }, 950);
    }, 220);
  }

  // ---- Any link marked data-pt-link uses the transition instead of a plain jump ----
  function wireLinks() {
    document.querySelectorAll('[data-pt-link]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        var href = el.getAttribute('href') || el.getAttribute('data-url');
        if (!href) return;
        e.preventDefault();
        window.runPearlTransition(href);
      });
    });
  }

  function start() {
    revealIfEntering();
    wireLinks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
