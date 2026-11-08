  /* ---- Settings: Appearance (light/dark) and owner-editable next invoice numbers ---- */
  (function () {
    var X = {
      'Appearance': 'Apariencia', 'Light': 'Claro', 'Dark': 'Oscuro',
      'Next invoice numbers': 'Próximos números de factura',
      'Next dump invoice number': 'Próximo número de factura de contenedor',
      'Next rental invoice number': 'Próximo número de factura de renta',
      'Save numbers': 'Guardar números', 'Tap again to confirm': 'Toca otra vez para confirmar',
      'Set where numbering starts. The number must be higher than any already used.': 'Define dónde empieza la numeración. Debe ser mayor que cualquier número ya usado.',
      'Numbers saved': 'Números guardados', 'Could not load the numbers.': 'No se pudieron cargar los números.',
      'Owner and office staff': 'Dueño y personal de oficina', 'One shared login': 'Un solo acceso compartido',
      'Remind me on this date': 'Recordarme en esta fecha', 'Reminders': 'Recordatorios', 'Reminder': 'Recordatorio', 'Reminder done': 'Recordatorio hecho', 'Mark done': 'Marcar como hecho', 'Done': 'Hecho', 'Overdue': 'Atrasado', 'Due today': 'Para hoy',
      'Accept': 'Aceptar', 'Decline': 'Rechazar', 'Arrived': 'Llegó', 'On The Way': 'En camino', 'Waiting': 'En espera',
      'Attach receipt': 'Adjuntar recibo', 'Change my password': 'Cambiar mi contraseña', 'Closed': 'Cerrado', 'Closed now': 'Cerrado ahora',
      'Right now': 'Ahora mismo', 'Saturday': 'Sábado', 'Sunday': 'Domingo', 'Copy link': 'Copiar enlace',
      'Copy message (Spanish)': 'Copiar mensaje (español)', 'Confirmations': 'Confirmaciones', 'AMOUNT': 'MONTO', 'CLIENT': 'CLIENTE',
      'CONFIRMED AT': 'CONFIRMADO EL', 'DUE DATE': 'FECHA LÍMITE', 'EQUIPMENT': 'EQUIPO', 'STATUS': 'ESTADO',
      'Leave a note': 'Dejar una nota', 'Log a dump': 'Registrar un viaje al vertedero', 'Map': 'Mapa', 'Map token or key': 'Clave del mapa',
      'Overcharges': 'Cargos extra', 'Profit': 'Ganancia', 'Profit per container': 'Ganancia por contenedor',
      'What dump sites charge you': 'Lo que te cobran los vertederos', 'Your account': 'Tu cuenta', 'Your prices': 'Tus precios',
      'Dumps': 'Viajes', 'Dumpster': 'Contenedor', 'Building': 'Edificio', 'Pin': 'Marcador', 'Star': 'Estrella', 'Tractor': 'Tractor',
      'Taps their name, then types their PIN': 'Toca su nombre y luego escribe su PIN', 'Open map': 'Abrir mapa',
      'Paste it here': 'Pégalo aquí', 'Street, city': 'Calle, ciudad', 'Yard 1': 'Patio 1',
      'Write what you need to remember for this day...': 'Escribe lo que necesitas recordar este día...'
    }, k;
    for (k in X) { if (X.hasOwnProperty(k)) ES_X[k] = X[k]; }
    var MATS = { 'Clean concrete': 'Concreto limpio', 'Dirt / mix': 'Tierra / mezcla', 'Garbage': 'Basura', 'Dirt, rocks, bricks': 'Tierra, piedras, ladrillos', 'Cement, 25 yd container': 'Cemento, contenedor de 25 yd' };
    var DAYS = { Monday: 'el lunes', Tuesday: 'el martes', Wednesday: 'el miércoles', Thursday: 'el jueves', Friday: 'el viernes', Saturday: 'el sábado', Sunday: 'el domingo' };
    function tonsEs(t) { return t ? ' (' + t + ' toneladas incl.)' : ''; }
    ES_P.push([/^(Clean concrete|Dirt \/ mix|Garbage) (\d+) yd(?: \((\d+) tons incl\.\))?$/, function (a, m, n, t) { return MATS[m] + ' ' + n + ' yd' + tonsEs(t); }]);
    ES_P.push([/^(\d+) yd (Clean concrete|Dirt \/ mix|Garbage)(?: \((\d+) tons incl\.\))?$/, function (a, n, m, t) { return n + ' yd ' + MATS[m] + tonsEs(t); }]);
    ES_P.push([/^(.+) · (Garbage|Dirt \/ mix|Clean concrete|Dirt, rocks, bricks|Cement, 25 yd container)$/, function (a, site, m) { return site + ' · ' + MATS[m]; }]);
    ES_P.push([/^Closed\. Opens (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday) at (.+)$/, function (a, d, t) { return 'Cerrado. Abre ' + DAYS[d] + ' a las ' + t; }]);
    ES_P.push([/^Not sharing yet · Next stop: (.+)$/, function (a, t) { return 'Aún no comparte · Próxima parada: ' + t; }]);
    ES_P.push([/^Call (.+)$/, function (a, t) { return 'Llamar a ' + t; }]);
    ES_P.push([/^Profit in (\w+)$/, function (a, m) { return 'Ganancia en ' + (ES_MON[m] || m); }]);
    ES_P.push([/^(\$[\d,.]+) \/ (ton|trip)$/, function (a, m, u) { return m + ' / ' + (u === 'ton' ? 'tonelada' : 'viaje'); }]);
    ES_P.push([/^(\d+) (bill|bills)$/, function (a, n) { return n + (n === '1' ? ' cuenta' : ' cuentas'); }]);
    ES_P.push([/^(\d+) (dump|dumps)$/, function (a, n) { return n + (n === '1' ? ' viaje' : ' viajes'); }]);
    var st = document.createElement('style');
    st.textContent = '#themeBtn { display: none !important; }';
    document.head.appendChild(st);
    function curTheme() {
      var t = document.documentElement.getAttribute('data-theme');
      if (t) return t;
      return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    function appearanceCard() {
      var d = curTheme() === 'dark';
      return '<div class="card"><header><h2>Appearance</h2></header><div style="padding:14px;display:flex;gap:8px;flex-wrap:wrap">' +
        '<button class="btn' + (d ? '' : ' primary') + '" data-ap="light">Light</button>' +
        '<button class="btn' + (d ? ' primary' : '') + '" data-ap="dark">Dark</button></div></div>';
    }
    var INP = 'padding:10px;border:1px solid #CBD5E1;border-radius:10px;font:16px system-ui;width:100%;box-sizing:border-box;background:var(--card,#fff);color:inherit';
    function numbersCard() {
      if (!ME || ME.role !== 'owner') return '';
      return '<div class="card"><header><h2>Next invoice numbers</h2></header><div style="padding:14px;display:grid;gap:12px">' +
        '<p class="note" style="margin:0">Set where numbering starts. The number must be higher than any already used.</p>' +
        '<label style="display:grid;gap:6px;font-weight:600">Next dump invoice number<input id="nxD" inputmode="numeric" autocomplete="off" style="' + INP + '"><small id="nxDh" class="note" style="font-weight:400"></small></label>' +
        '<label style="display:grid;gap:6px;font-weight:600">Next rental invoice number<input id="nxR" inputmode="numeric" autocomplete="off" style="' + INP + '"><small id="nxRh" class="note" style="font-weight:400"></small></label>' +
        '<div><button class="btn primary" id="nxSave">Save numbers</button></div><div id="nxMsg" class="note" role="status"></div></div></div>';
    }
    var vSettings0 = vSettings;
    vSettings = function () {
      var h = vSettings0();
      h = h.replace('<div class="formrow"><span>Office</span><b>Secretary</b></div>', '');
      h = h.replace('<span>Keilah</span><b>Owner</b>', '<span>Owner and office staff</span><b>One shared login</b>');
      return h + appearanceCard() + numbersCard();
    };
    function nxMsg(t) { var m = document.getElementById('nxMsg'); if (m) m.textContent = t || ''; }
    function nxFill(n) {
      var d = document.getElementById('nxD'), r = document.getElementById('nxR');
      if (!d || !r || !n) return;
      d.value = n.dump_invoice; r.value = n.rental_invoice;
      document.getElementById('nxDh').textContent = 'Lowest allowed now: ' + n.dump_min;
      document.getElementById('nxRh').textContent = 'Lowest allowed now: ' + n.rental_min;
    }
    function nxLoad() {
      if (!document.getElementById('nxD')) return;
      if (!SB || !SB.rpc) return;
      SB.rpc('get_next_numbers').then(function (res) {
        if (res.error || !res.data) { nxMsg('Could not load the numbers.'); return; }
        nxFill(res.data);
      });
    }
    var setView1 = setView;
    setView = function (v) {
      var r = setView1.apply(this, arguments);
      if (v === 'settings') setTimeout(nxLoad, 80);
      return r;
    };
    /* show / hide toggle for password and PIN fields (the sign-in screen has its own) */
    ES_X['Show'] = 'Mostrar'; ES_X['Hide'] = 'Ocultar';
    function addEyes() {
      var ins = document.querySelectorAll('input[type=password]:not([data-eye]):not(#gP)'), i, el, b;
      for (i = 0; i < ins.length; i++) {
        el = ins[i]; el.setAttribute('data-eye', '1');
        b = document.createElement('button');
        b.type = 'button'; b.className = 'btn sm'; b.setAttribute('data-eyebtn', '1'); b.textContent = 'Show';
        b.setAttribute('aria-label', 'Show or hide what you typed');
        b.style.cssText = 'margin-top:6px;justify-self:start;align-self:flex-start';
        el.parentNode.insertBefore(b, el.nextSibling);
      }
    }
    var eyeT = 0;
    new MutationObserver(function () { clearTimeout(eyeT); eyeT = setTimeout(function () { try { addEyes(); } catch (x) {} }, 80); }).observe(document.body, { childList: true, subtree: true });
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-eyebtn]'); if (!b) return;
      var el = b.previousElementSibling; if (!el || el.tagName !== 'INPUT') return;
      var show = el.type === 'password';
      el.type = show ? 'text' : 'password';
      b.textContent = show ? 'Hide' : 'Show';
    });
    var armT = 0;
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ap]');
      if (b) {
        var t = b.getAttribute('data-ap');
        document.documentElement.setAttribute('data-theme', t);
        try { localStorage.setItem('so-theme', t); } catch (x) {}
        var all = document.querySelectorAll('[data-ap]'), i;
        for (i = 0; i < all.length; i++) all[i].classList.toggle('primary', all[i] === b);
        return;
      }
      var s = e.target.closest('#nxSave');
      if (!s) return;
      if (!s.getAttribute('data-armed')) {
        s.setAttribute('data-armed', '1'); s.textContent = (LANG === 'es') ? 'Toca otra vez para confirmar' : 'Tap again to confirm';
        clearTimeout(armT); armT = setTimeout(function () { s.removeAttribute('data-armed'); s.textContent = (LANG === 'es') ? 'Guardar números' : 'Save numbers'; }, 5000);
        return;
      }
      s.removeAttribute('data-armed'); s.textContent = 'Save numbers';
      var a = parseInt(document.getElementById('nxD').value, 10), c = parseInt(document.getElementById('nxR').value, 10);
      if (!(a > 0) || !(c > 0)) { nxMsg('Enter whole numbers.'); return; }
      SB.rpc('set_next_numbers', { p_dump_invoice: a, p_rental_invoice: c }).then(function (res) {
        if (res.error) {
          var m = /(dump|rental)_min:(\d+)/.exec(res.error.message || '');
          nxMsg(m ? ('The ' + m[1] + ' invoice number must be at least ' + m[2] + ', because lower numbers are already used.') : 'Could not save. Check the numbers and try again.');
          return;
        }
        nxFill(res.data); nxMsg(''); toast('Numbers saved');
      });
    });
  })();
