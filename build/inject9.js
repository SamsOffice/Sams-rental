  /* ---- driver app tabs: Hoy (today + overdue) | Proximos dias (my later jobs) | Companeros (everyone else's jobs) ---- */
  function drvTodayKey() { var t = TODAYISO().split('-'); return (parseInt(t[1], 10) - 1) * 100 + parseInt(t[2], 10); }
  function drvDayKey(t) { return Math.floor(dKey(t) / 10000); }
  function drvTabs(cur, hid) {
    var T = [['hoy', 'Hoy'], ['prox', 'Próximos días'], ['comp', 'Compañeros']], h = '<div class="databs" role="tablist" style="display:flex;gap:6px;margin:10px 0">', k;
    for (k = 0; k < T.length; k++) {
      var on = cur === T[k][0];
      h += '<button role="tab" aria-selected="' + on + '" data-d="dtab" data-k="' + T[k][0] + '" style="flex:1;padding:12px 6px;border-radius:12px;font:600 15px inherit;font-family:inherit;cursor:pointer;border:2px solid #1D6FEF;' + (on ? 'background:#1D6FEF;color:#fff' : 'background:#fff;color:#1D6FEF') + '">' + T[k][1] + '</button>';
    }
    return h + '</div>';
  }
  function drvList(me, mine, onlyMine) {
    var all = [], k, j, items, h = '', last = '', tk0 = drvTodayKey();
    if (onlyMine) { for (k = 0; k < mine.length; k++) { if (drvDayKey(mine[k].time) > tk0 && dKey(mine[k].time) < 1e9) { mine[k].who = me; all.push(mine[k]); } } }
    else { for (k = 0; k < LNAMES.length; k++) { if (LNAMES[k] === me) continue; items = drvItems(LNAMES[k], false); for (j = 0; j < items.length; j++) { items[j].who = LNAMES[k]; all.push(items[j]); } } }
    all.sort(function (a, b) { return dKey(a.time) - dKey(b.time); });
    if (!all.length) return '<div class="daempty"><b>' + (onlyMine ? 'No tienes más trabajos' : 'Tus compañeros no tienen trabajos') + '</b>' + (onlyMine ? 'Aquí verás tus trabajos de los próximos días' : 'Aquí verás los trabajos de los demás') + '</div>';
    for (k = 0; k < all.length; k++) {
      var d = all[k], day = String(d.time || 'Sin fecha').split(',')[0], tk = drvDayKey(d.time);
      if (day !== last) { last = day; h += '<div class="dasec">' + invEsc(day) + (tk === tk0 ? ' (Hoy)' : '') + '</div>'; }
      var op = DAPP.open === d.key;
      h += '<div class="dacard" style="padding:0"><button data-d="dopen" data-k="' + d.key + '" aria-expanded="' + op + '" style="all:unset;box-sizing:border-box;display:block;width:100%;padding:16px;cursor:pointer"><b style="display:block;font-size:16px">' + invEsc(d.title) + '</b><small style="display:block;margin-top:4px;opacity:.75">' + (onlyMine ? '' : invEsc(d.who) + ' &middot; ') + invEsc(d.client) + ' &middot; ' + invEsc(d.time || '') + '</small><small style="display:block;margin-top:6px;color:#1D6FEF;font-weight:600">' + (op ? 'Toca para cerrar' : 'Toca para ver todo') + '</small></button>';
      if (op) {
        h += '<div style="padding:0 16px 16px"><div class="dacl">' + invEsc(d.client) + (d.ph ? ' &middot; ' + d.ph : '') + '</div><div class="daaddr">' + icon('pin') + '<span>' + invEsc(d.addr || 'Sin direcci\u00f3n') + '</span></div>' +
          '<div class="dacl" style="margin-top:8px">' + (onlyMine ? 'Tuyo' : 'Chofer: ' + invEsc(d.who)) + ' &middot; ' + invEsc(d.time || '') + '</div>' +
          (d.off ? '<div class="daoff"><b>Notas de la oficina</b>' + invEsc(d.off) + '</div>' : '') +
          (d.paid === null || d.paid === undefined ? '' : '<span class="dapay ' + (d.paid ? 'y' : 'n') + '">' + (d.paid ? 'PAGADO' : 'NO PAGADO') + '</span>') +
          (d.amt ? '<div class="dacl" style="margin-top:8px">Total: ' + money(d.amt) + '</div>' : '') +
          '<div class="dacalls"><a class="dacall" href="tel:' + d.ph + '">' + icon('phone') + 'Llamar</a><a class="damap" href="https://maps.google.com?q=' + encodeURIComponent(d.addr || '') + '" target="_blank" rel="noopener">' + icon('map') + 'Mapa</a></div></div>';
      }
      h += '</div>';
    }
    return h;
  }
  /* ---- live dispatch: real map of where the drivers are (pins from their phones) ---- */
  var LMAP = null, LMARK = {}, LLOAD = 0;
  function lvLoadLib(cb) {
    if (window.L) { cb(); return; }
    if (LLOAD === 1) { setTimeout(function () { lvLoadLib(cb); }, 400); return; }
    if (LLOAD === 2) return;
    LLOAD = 1;
    var c = document.createElement('link'); c.rel = 'stylesheet'; c.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'; document.head.appendChild(c);
    var s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    s.onload = function () { LLOAD = 3; cb(); }; s.onerror = function () { LLOAD = 2; var m = document.getElementById('lvmapL'); if (m) m.innerHTML = '<p class="note" style="padding:14px">The map could not load. The list below still shows each driver.</p>'; };
    document.head.appendChild(s);
  }
  function lvDrawMap() {
    var el = document.getElementById('lvmapL'); if (!el || !window.L) return;
    if (LMAP && LMAP._container !== el) { if (el.parentNode) { el.parentNode.replaceChild(LMAP._container, el); el = LMAP._container; } else { try { LMAP.remove(); } catch (e) {} LMAP = null; LMARK = {}; } }
    if (!LMAP) {
      LMAP = L.map(el, { zoomControl: true, attributionControl: true }).setView([40.7282, -73.7949], 13);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 19, attribution: '&copy; OpenStreetMap contributors &copy; CARTO' }).addTo(LMAP);
    }
    var pts = [], k, n, l;
    for (k = 0; k < LNAMES.length; k++) {
      n = LNAMES[k]; l = LOCS[n]; if (!l || typeof l.lat !== 'number') continue;
      var ic = L.divIcon({ className: '', html: '<div style="background:' + DCOL[n] + ';color:#fff;font:700 13px sans-serif;padding:4px 9px;border-radius:99px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);white-space:nowrap">' + invEsc(n) + '</div>', iconSize: [0, 0], iconAnchor: [0, 0] });
      if (LMARK[n]) { LMARK[n].setLatLng([l.lat, l.lng]); LMARK[n].setIcon(ic); } else { LMARK[n] = L.marker([l.lat, l.lng], { icon: ic }).addTo(LMAP); }
      pts.push([l.lat, l.lng]);
    }
    if (pts.length) { try { LMAP.fitBounds(pts, { padding: [50, 50], maxZoom: 15 }); } catch (e) {} }
    setTimeout(function () { if (LMAP) LMAP.invalidateSize(); }, 200);
  }
  function liveInner() {
    var rows = '', k, n, l, mins, any = false;
    for (k = 0; k < LNAMES.length; k++) {
      n = LNAMES[k]; l = LOCS[n]; var nx = drvItems(n, false)[0];
      if (l) { any = true; mins = Math.max(0, Math.round((Date.now() - new Date(l.at).getTime()) / 60000)); }
      rows += '<div class="lvrow"><span class="lvdot" style="background:' + DCOL[n] + '"></span><div class="grow"><b>' + invEsc(n) + '</b><span class="sub">' + (l ? 'Updated ' + (mins < 1 ? 'just now' : mins + ' min ago') : 'Not sharing yet') + (nx ? ' &middot; Next stop: ' + invEsc(nx.client) + ', ' + invEsc(nx.addr || '') : ' &middot; No active job') + '</span></div>' + (l ? '<a class="btn sm" target="_blank" rel="noopener" href="https://maps.apple.com/?ll=' + l.lat + ',' + l.lng + '&q=' + encodeURIComponent(n) + '">' + icon('map') + 'Open map</a>' : '') + '</div>';
    }
    if (any) setTimeout(function () { lvLoadLib(function () { try { lvDrawMap(); } catch (e) { var m = document.getElementById('lvmapL'); if (m) m.innerHTML = '<p class="note" style="padding:14px">The map could not draw. The list below still shows each driver.</p>'; } }); }, 60);
    return '<header><h2>Where the drivers are</h2>' + pillH(any ? 'From their phones' : 'Waiting', any ? 'good' : 'warn') + '</header>' +
      (any ? '<div id="lvmapL" style="height:300px;margin:0 14px 10px;border-radius:12px;overflow:hidden;background:#1b2433"></div>' : '<p class="note" style="padding:6px 14px">No drivers sharing right now.</p>') + rows +
      '<p class="note" style="padding:10px 14px">Each driver shares their place while the driver app is open on their phone. Pins update about every minute.</p>';
  }
  document.getElementById('dClose').addEventListener('click', function () { document.getElementById('detail').hidden = true; });

  function liveTick() { }
  /* ---- Dispatch: card with the driver app link and ready-to-send messages ---- */
  var DRV_LINK = 'https://samsoffice.github.io/Sams-rental/#conductores';
  var DRV_USERS = [['Sams', 'sams'], ['Gustavo', 'gustavo'], ['Jose Luis', 'jose luis']];
  function drvMsgText(lang, who) {
    if (lang === 'es') return 'Hola ' + who + '. Esta es la app de trabajo de Sams Office: ' + DRV_LINK + '\nAbre el enlace, toca tu nombre y escribe tu PIN. Te doy tu PIN por separado. Despues toca el boton de compartir y elige Agregar a pantalla de inicio para tenerla como una app. Cuando pida permiso para compartir tu ubicacion, toca Entendido. Luego toca Cambiar PIN y pon el tuyo.';
    return 'Hi ' + who + '. This is the Sams Office work app: ' + DRV_LINK + '\nOpen the link, tap your name and type your PIN. I will give you your PIN separately. Then tap the share button and choose Add to Home Screen to keep it as an app. When it asks to share your location, tap Entendido. Then tap Cambiar PIN and set your own.';
  }
  function driverLinkCard() {
    var rows = '', k;
    for (k = 0; k < DRV_USERS.length; k++) {
      rows += '<div class="lvrow"><span class="lvdot" style="background:' + DCOL[DRV_USERS[k][0]] + '"></span><div class="grow"><b>' + DRV_USERS[k][0] + '</b><span class="sub">Taps their name, then types their PIN</span></div>' +
        '<button class="btn sm" data-act="dlmsg" data-w="' + DRV_USERS[k][0] + '" data-l="es">Copy message (Spanish)</button> <button class="btn sm" data-act="dlmsg" data-w="' + DRV_USERS[k][0] + '" data-l="en">English</button></div>';
    }
    return '<div class="card"><header><h2>Send the driver app</h2><button class="btn sm primary" data-act="dlcopy">Copy link</button></header>' +
      '<p class="note" style="padding:10px 14px;word-break:break-all"><b>' + DRV_LINK + '</b></p>' + rows +
      '<p class="note" style="padding:10px 14px">Paste the copied message into a text. Give each driver their PIN in a separate message, never in the same one as the link.</p></div>';
  }

  /* ---- driver sign-in wording: the link ending in #conductores shows a Spanish, PIN-based sign-in ---- */
  function applyDriverGate() {
    var on = /^#(conductores|driver)$/i.test(location.hash || '');
    var set = function (id, t) { var e = document.getElementById(id); if (e) e.textContent = t; };
    if (!on) return;
    set('gT', 'Bienvenido a Sams Office'); set('gS', 'Toca tu nombre y escribe tu PIN.');
    set('gB', 'Continuar'); set('gPL', 'PIN'); set('gN', 'Esta app es para los conductores de Sams Construction Services LTD. Se queda abierta en tu tel\u00e9fono hasta que toques Cerrar sesi\u00f3n. Si olvidaste tu PIN, llama a la oficina.');
    var p = document.getElementById('gP'); if (p) { p.setAttribute('inputmode', 'numeric'); p.setAttribute('autocomplete', 'off'); }
    var u = document.getElementById('gU'), ul = document.getElementById('gUL');
    if (ul) ul.style.display = 'none'; if (u && u.parentNode) u.parentNode.style.display = 'none';
    if (document.getElementById('gNames') || !ul) return;
    var box = document.createElement('div'); box.id = 'gNames'; box.style.cssText = 'display:flex;flex-direction:column;gap:10px;margin-bottom:6px';
    var names = [['Sams', 'sams'], ['Gustavo', 'gustavo'], ['Jose Luis', 'jose luis']], k;
    for (k = 0; k < names.length; k++) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = names[k][0]; b.setAttribute('data-u', names[k][1]);
      b.style.cssText = 'height:60px;border:2px solid #2563EB;border-radius:10px;background:#fff;color:#2563EB;font-size:20px;font-weight:700;cursor:pointer';
      b.addEventListener('click', function (e) {
        var x = e.currentTarget, all = box.querySelectorAll('button'), q;
        for (q = 0; q < all.length; q++) { all[q].style.background = '#fff'; all[q].style.color = '#2563EB'; }
        x.style.background = '#2563EB'; x.style.color = '#fff';
        u.value = x.getAttribute('data-u'); u.dispatchEvent(new Event('input', { bubbles: true }));
        if (p) p.focus();
      });
      box.appendChild(b);
    }
    ul.parentNode.insertBefore(box, ul);
  }
  applyDriverGate(); window.addEventListener('hashchange', applyDriverGate);
