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
