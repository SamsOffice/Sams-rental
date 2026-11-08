  /* ---- Driver link at the bottom of the office sign-in: takes drivers to the Spanish PIN sign-in ---- */
  (function () {
    function drvOn() { return /^#(conductores|driver)$/i.test(location.hash || ''); }
    function put() {
      var gn = document.getElementById('gN'), lk = document.getElementById('gDrv');
      if (!gn) return;
      if (drvOn()) { if (lk) lk.style.display = 'none'; return; }
      if (!lk) {
        lk = document.createElement('a'); lk.id = 'gDrv'; lk.href = location.pathname + '#conductores';
        lk.textContent = 'Soy chofer / I am a driver';
        lk.style.cssText = 'display:block;margin-top:22px;font-size:16px;font-weight:600;color:#2563EB;text-decoration:underline';
        lk.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#conductores'; try { window.scrollTo(0, 0); } catch (x) { } });
        gn.parentNode.insertBefore(lk, gn.nextSibling);
      }
      lk.style.display = 'block';
    }
    put(); window.addEventListener('hashchange', put);
  })();
  /* ---- Driver app: lift the location bar above Safari's floating toolbar so its text and button stay visible ---- */
  (function () {
    var LIFT = 76, busy = false;
    function standalone() { try { return !!(window.navigator.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)); } catch (x) { return false; } }
    function fix() {
      if (busy || standalone()) return;
      var el = document.getElementById('locBar'); if (!el) return;
      busy = true;
      var bgc = (el.style.background || el.style.backgroundColor || '').replace(/\s/g, '').toLowerCase();
      if (bgc.indexOf('#fef3c7') >= 0 || bgc.indexOf('rgb(254,243,199)') >= 0) { el.style.display = 'none'; busy = false; return; }
      var full = el.style.left === '0px' || el.style.left === '0';
      el.style.bottom = 'calc(' + LIFT + 'px + env(safe-area-inset-bottom,0px))';
      if (full) { el.style.left = '12px'; el.style.right = '12px'; el.style.borderRadius = '16px'; el.style.border = '1px solid rgba(0,0,0,.15)'; el.style.paddingBottom = '10px'; }
      var db = document.getElementById('drvBody'); if (db) db.style.paddingBottom = '190px';
      busy = false;
    }
    function watch() {
      var el = document.getElementById('locBar');
      if (!el) { setTimeout(watch, 800); return; }
      new MutationObserver(function () { setTimeout(fix, 0); }).observe(el, { attributes: true, attributeFilter: ['style'] });
      fix();
    }
    watch();
  })();
