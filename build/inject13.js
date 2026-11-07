  /* ---- accessibility pass: keyboard reach for clickable rows, names for fields, focus ring, reduced motion ---- */
  (function () {
    var st = document.createElement('style');
    st.textContent = 'input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 2px solid #1D6FEF !important; outline-offset: 2px; }' +
      '#gU:focus-visible, #gP:focus-visible { outline: none !important; }' +
      'div:has(> #gU:focus-visible), div:has(> #gP:focus-visible) { border-color: #1D6FEF !important; box-shadow: 0 0 0 1px #1D6FEF; }' +
      '[data-act][tabindex]:focus-visible { outline: 2px solid #1D6FEF; outline-offset: 2px; }' +
      '@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; scroll-behavior: auto !important; } }';
    document.head.appendChild(st);
    var NATIVE = /^(BUTTON|A|INPUT|SELECT|TEXTAREA|SUMMARY)$/;
    function pass() {
      var i, e, els;
      els = document.querySelectorAll('[data-act],[data-nb]');
      for (i = 0; i < els.length; i++) {
        e = els[i];
        if (NATIVE.test(e.tagName) && !(e.tagName === 'A' && !e.hasAttribute('href'))) continue;
        if (e.tabIndex < 0) e.setAttribute('tabindex', '0');
        if (e.tagName !== 'TR' && !e.getAttribute('role')) e.setAttribute('role', 'button');
      }
      els = document.querySelectorAll('input:not([type=hidden]),textarea,select');
      for (i = 0; i < els.length; i++) {
        e = els[i];
        if (e.getAttribute('aria-labelledby') || e.closest('label') || (e.id && document.querySelector('label[for="' + e.id + '"]'))) continue;
        if (e.getAttribute('aria-label') && !e.hasAttribute('data-a11yph')) continue;
        var t = e.getAttribute('placeholder') || e.getAttribute('title') || '';
        if (t) { e.setAttribute('aria-label', t); e.setAttribute('data-a11yph', '1'); }
      }
      els = document.querySelectorAll('button,a[href]');
      for (i = 0; i < els.length; i++) {
        e = els[i];
        if (e.getAttribute('aria-label') || (e.textContent || '').trim()) continue;
        if (e.getAttribute('title')) e.setAttribute('aria-label', e.getAttribute('title'));
      }
      els = document.querySelectorAll('img:not([alt])');
      for (i = 0; i < els.length; i++) els[i].setAttribute('alt', '');
    }
    var pend = 0;
    function later() { if (pend) return; pend = 1; setTimeout(function () { pend = 0; try { pass(); } catch (x) {} }, 120); }
    new MutationObserver(later).observe(document.body, { childList: true, subtree: true });
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      var e = ev.target;
      if (!e || !e.getAttribute || !(e.hasAttribute('data-act') || e.hasAttribute('data-nb'))) return;
      if (NATIVE.test(e.tagName) || e.closest('tr[data-id],tr[data-r]')) return;
      ev.preventDefault(); e.click();
    });
    later();
  })();
