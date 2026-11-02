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
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(LMAP);
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
    setTimeout(lvStart, 60);
    return '<header><h2>Where the drivers are</h2>' + pillH(any ? 'From their phones' : 'Waiting', any ? 'good' : 'warn') + '</header>' +
      '<div id="lvmapL" style="height:300px;margin:0 14px 10px;border-radius:12px;overflow:hidden;background:#1b2433"></div>' + (any ? '' : '<p class="note" style="padding:0 14px 6px">No drivers sharing right now. Pins show up here when a driver signs in and taps Entendido.</p>') + rows +
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
    set('gT', 'Bienvenido'); set('gS', 'Toca tu nombre y escribe tu PIN.');
    set('gB', 'Continuar'); set('gPL', 'PIN'); set('gN', 'Esta app es solo para el personal autorizado. Se queda abierta en tu tel\u00e9fono hasta que toques Cerrar sesi\u00f3n. Si olvidaste tu PIN, llama a la oficina.');
    var p = document.getElementById('gP'); if (p) { p.setAttribute('inputmode', 'numeric'); p.setAttribute('autocomplete', 'off'); }
    var u = document.getElementById('gU'), ul = document.getElementById('gUL');
    if (ul) ul.style.display = 'none'; if (u && u.parentNode) u.parentNode.style.display = 'none';
    var gn = document.getElementById('gN');
    if (gn && !document.getElementById('gOffice')) { var lk = document.createElement('a'); lk.id = 'gOffice'; lk.textContent = 'Soy de la oficina / Office staff'; lk.href = location.pathname + '?o=1'; lk.style.cssText = 'display:block;margin-top:18px;font-size:15px;color:#2563EB;text-decoration:underline'; gn.parentNode.insertBefore(lk, gn.nextSibling); }
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
  setInterval(function () { var g = document.getElementById('gate'); if (g && g.hidden && document.title !== 'Office') document.title = 'Office'; }, 1000);

  /* ---- Google Maps (used when the owner saves a Google map key in Settings; otherwise the free map above is used) ---- */
  var MAPKEY = '', GLOAD = 0, GMAP = null, GMARK = {};
  function lvFail(msg) { var m = document.getElementById('lvmapL'); if (m) m.innerHTML = '<p class="note" style="padding:14px">' + msg + ' The list below still shows each driver.</p>'; }
  function lvStart() {
    try {
      if (MAPKEY) { lvLoadG(function () { try { lvDrawG(); } catch (e) { lvFail('The map could not draw.'); } }); }
      else { lvLoadLib(function () { try { lvDrawMap(); } catch (e) { lvFail('The map could not draw.'); } }); }
    } catch (e2) { lvFail('The map could not load.'); }
  }
  function lvLoadG(cb) {
    if (window.google && google.maps && google.maps.Map) { cb(); return; }
    if (GLOAD === 1) { setTimeout(function () { lvLoadG(cb); }, 400); return; }
    if (GLOAD === 2) { lvFail('Google would not load the map.'); return; }
    GLOAD = 1;
    window.gm_authFailure = function () { GLOAD = 2; lvFail('Google rejected the map key. Check the key in Settings.'); };
    window.__gmInit = function () { GLOAD = 3; cb(); };
    var sc = document.createElement('script'); sc.async = true; sc.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(MAPKEY) + '&callback=__gmInit';
    sc.onerror = function () { GLOAD = 2; lvFail('Google would not load the map.'); };
    document.head.appendChild(sc);
  }
  function lvDrawG() {
    var el = document.getElementById('lvmapL'); if (!el || !window.google) return;
    if (GMAP && GMAP.getDiv() !== el) { if (el.parentNode) { el.parentNode.replaceChild(GMAP.getDiv(), el); el = GMAP.getDiv(); } else { GMAP = null; GMARK = {}; } }
    if (!GMAP) {
      GMAP = new google.maps.Map(el, { center: { lat: 40.7282, lng: -73.7949 }, zoom: 13, disableDefaultUI: true, zoomControl: true, gestureHandling: 'greedy',
        styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }, { featureType: 'transit', stylers: [{ visibility: 'off' }] }, { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] }] });
    }
    var b = new google.maps.LatLngBounds(), cnt = 0, k, n, l, pos;
    for (k = 0; k < LNAMES.length; k++) {
      n = LNAMES[k]; l = LOCS[n]; if (!l || typeof l.lat !== 'number') continue;
      pos = { lat: l.lat, lng: l.lng };
      if (GMARK[n]) { GMARK[n].setPosition(pos); }
      else { GMARK[n] = new google.maps.Marker({ position: pos, map: GMAP, title: n, label: { text: n.charAt(0), color: '#fff', fontWeight: '700' }, icon: { path: google.maps.SymbolPath.CIRCLE, scale: 15, fillColor: DCOL[n], fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 } }); }
      b.extend(pos); cnt++;
    }
    if (cnt) { GMAP.fitBounds(b, 60); if (cnt === 1) { var z = GMAP.getZoom(); if (z > 15) GMAP.setZoom(15); } }
  }
  function mapKeyCard() {
    return '<div class="card"><header><h2>Map</h2></header><div style="padding:0 14px 14px"><p class="note" style="padding:6px 0">' + (MAPKEY ? 'A Google map key is saved. The live map uses Google Maps.' : 'The live map uses the free map. To use Google Maps, paste your Google map key here.') + '</p>' +
      '<div class="fld"><label for="fMapKey">Google map key</label><input id="fMapKey" type="password" autocomplete="off" autocapitalize="none" placeholder="' + (MAPKEY ? 'Saved. Paste a new one to replace it.' : 'Paste the key here') + '"></div>' +
      '<div class="actions"><button class="btn primary" data-act="mapkey">Save map key</button>' + (MAPKEY ? '<button class="btn" data-act="mapkeyrm">Remove key</button>' : '') + '</div></div></div>';
  }

  /* ---- Mapbox (token starting with pk.) + yard pins. Without a key the basic backup map is shown. ---- */
  var MBMAP = null, MBMARK = {}, MBYM = [], MBLOAD = 0, YARDS = [];
  var YCOL = ['#7C3AED', '#0D9488', '#D97706', '#DB2777', '#4B5563', '#0891B2'];
  function isMB() { return /^pk\./.test(MAPKEY || ''); }
  function lvStart() {
    try {
      if (MAPKEY && isMB()) { lvLoadMB(function () { try { lvDrawMB(); } catch (e) { lvFail('The map could not draw.'); } }); }
      else if (MAPKEY) { lvLoadG(function () { try { lvDrawG(); } catch (e) { lvFail('The map could not draw.'); } }); }
      else { lvLoadLib(function () { try { lvDrawMap(); } catch (e) { lvFail('The map could not draw.'); } }); }
    } catch (e2) { lvFail('The map could not load.'); }
  }
  function lvLoadMB(cb) {
    if (window.mapboxgl) { cb(); return; }
    if (MBLOAD === 1) { setTimeout(function () { lvLoadMB(cb); }, 400); return; }
    if (MBLOAD === 2) { lvFail('Mapbox would not load.'); return; }
    MBLOAD = 1;
    var c = document.createElement('link'); c.rel = 'stylesheet'; c.href = 'https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css'; document.head.appendChild(c);
    var sc = document.createElement('script'); sc.src = 'https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js';
    sc.onload = function () { MBLOAD = 3; cb(); }; sc.onerror = function () { MBLOAD = 2; lvFail('Mapbox would not load.'); };
    document.head.appendChild(sc);
  }
  function mbPill(txt, col, sq) {
    var d = document.createElement('div');
    d.style.cssText = 'background:' + col + ';color:#fff;font:700 13px sans-serif;padding:4px 9px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);white-space:nowrap;border-radius:' + (sq ? '6px' : '99px');
    d.textContent = txt; return d;
  }
  function lvDrawMB() {
    var el = document.getElementById('lvmapL'); if (!el || !window.mapboxgl) return;
    if (MBMAP && MBMAP.getContainer() !== el) { if (el.parentNode) { el.parentNode.replaceChild(MBMAP.getContainer(), el); el = MBMAP.getContainer(); try { MBMAP.resize(); } catch (e) {} } else { try { MBMAP.remove(); } catch (e2) {} MBMAP = null; MBMARK = {}; MBYM = []; } }
    if (!MBMAP) {
      mapboxgl.accessToken = MAPKEY;
      MBMAP = new mapboxgl.Map({ container: el, style: 'mapbox://styles/mapbox/streets-v12', center: [-73.7949, 40.7282], zoom: 12 });
      MBMAP.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
      MBMAP.on('error', function (ev) { var st = ev && ev.error && ev.error.status; if (st === 401 || st === 403) lvFail('Mapbox rejected the token. Check it in Settings.'); });
    }
    var pts = [], k, n, l, i, y;
    for (i = 0; i < MBYM.length; i++) { try { MBYM[i].remove(); } catch (e3) {} }
    MBYM = [];
    for (i = 0; i < YARDS.length; i++) {
      y = YARDS[i]; if (typeof y.lat !== 'number') continue;
      MBYM.push(new mapboxgl.Marker({ element: mbPill(y.name, YCOL[i % YCOL.length], true) }).setLngLat([y.lng, y.lat]).addTo(MBMAP)); pts.push([y.lng, y.lat]);
    }
    for (k = 0; k < LNAMES.length; k++) {
      n = LNAMES[k]; l = LOCS[n]; if (!l || typeof l.lat !== 'number') continue;
      if (MBMARK[n]) { MBMARK[n].setLngLat([l.lng, l.lat]); }
      else { MBMARK[n] = new mapboxgl.Marker({ element: mbPill(n, DCOL[n], false) }).setLngLat([l.lng, l.lat]).addTo(MBMAP); }
      pts.push([l.lng, l.lat]);
    }
    if (pts.length) { var b = new mapboxgl.LngLatBounds(pts[0], pts[0]); for (i = 1; i < pts.length; i++) b.extend(pts[i]); try { MBMAP.fitBounds(b, { padding: 60, maxZoom: 14, duration: 0 }); } catch (e4) {} }
  }
  function yardAdd() {
    var nm = ((document.getElementById('fYName') || {}).value || '').trim(), ad = ((document.getElementById('fYAddr') || {}).value || '').trim();
    if (!nm || !ad) { toast('Type the yard name and address'); return; }
    if (!isMB()) { toast('Save a Mapbox token first'); return; }
    toast('Finding the address...');
    fetch('https://api.mapbox.com/geocoding/v5/mapbox.places/' + encodeURIComponent(ad) + '.json?limit=1&country=us&proximity=-73.79,40.73&access_token=' + encodeURIComponent(MAPKEY))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var f = j && j.features && j.features[0]; if (!f) { toast('Could not find that address'); return; }
        YARDS.push({ name: nm, addr: ad, lat: f.center[1], lng: f.center[0] }); toast('Yard added'); setView('settings'); syncSoon();
      }).catch(function () { toast('Could not look up the address'); });
  }
  function yardRm(i) { YARDS.splice(i, 1); toast('Yard removed'); setView('settings'); syncSoon(); }
  function mapKeyCard() {
    var kind = !MAPKEY ? '' : (isMB() ? 'Mapbox' : 'Google');
    var h = '<div class="card"><header><h2>Map</h2></header><div style="padding:0 14px 14px"><p class="note" style="padding:6px 0">' + (MAPKEY ? 'A ' + kind + ' key is saved. The live map uses ' + kind + '.' : 'The live map is using the basic backup map. Paste a Mapbox token (starts with pk.) or a Google map key to switch.') + '</p>' +
      '<div class="fld"><label for="fMapKey">Map token or key</label><input id="fMapKey" type="password" autocomplete="off" autocapitalize="none" placeholder="' + (MAPKEY ? 'Saved. Paste a new one to replace it.' : 'Paste it here') + '"></div>' +
      '<div class="actions"><button class="btn primary" data-act="mapkey">Save</button>' + (MAPKEY ? '<button class="btn" data-act="mapkeyrm">Remove</button>' : '') + '</div></div></div>';
    var rows = '', i;
    for (i = 0; i < YARDS.length; i++) rows += '<div class="lvrow"><span class="lvdot" style="background:' + YCOL[i % YCOL.length] + '"></span><div class="grow"><b>' + invEsc(YARDS[i].name) + '</b><span class="sub">' + invEsc(YARDS[i].addr) + '</span></div><button class="btn sm" data-act="yardrm" data-i="' + i + '">Remove</button></div>';
    h += '<div class="card"><header><h2>Yards on the map</h2></header>' + rows + '<div style="padding:0 14px 14px"><p class="note" style="padding:6px 0">' + (YARDS.length ? '' : 'No yards yet. ') + 'Add each yard with its address. It shows as a labeled pin on the Dispatch map (needs a Mapbox token).</p>' +
      '<div class="fld"><label for="fYName">Yard name</label><input id="fYName" placeholder="Yard 1"></div><div class="fld"><label for="fYAddr">Address</label><input id="fYAddr" placeholder="Street, city"></div>' +
      '<div class="actions"><button class="btn primary" data-act="yardadd">Add yard</button></div></div></div>';
    return h;
  }

  /* ---- map icons: yards and drivers get a chosen icon and color ---- */
  var DICON = {};
  var ICOLS = ['#7C3AED', '#0D9488', '#D97706', '#DB2777', '#2563EB', '#16A34A', '#DC2626', '#4B5563'];
  var ICONS = {
    pin: ['Pin', '<path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/>'],
    building: ['Building', '<path d="M4 21V4l9-2v6h7v13H4zm3-14v2h2V7H7zm0 4v2h2v-2H7zm0 4v2h2v-2H7zm6-3v2h2v-2h-2zm0 4v2h2v-2h-2z"/>'],
    dumpster: ['Dumpster', '<path d="M2 7h20l-2.5 12h-15L2 7zm2-3h16v2H4V4z"/>'],
    tractor: ['Tractor', '<path d="M4 6h7l2 4h3V6h2v6h2v5h-2.2a3 3 0 0 0-5.6 0H9.8A3.5 3.5 0 0 0 3 16V8l1-2z"/><circle cx="6.5" cy="17.5" r="3"/><circle cx="16.5" cy="18" r="2"/>'],
    star: ['Star', '<path d="M12 2l3 7 7 .6-5.3 4.6 1.7 7.3L12 17.8 5.6 21.5l1.7-7.3L2 9.6 9 9z"/>']
  };
  var ICKEYS = ['pin', 'building', 'dumpster', 'tractor', 'star'];
  function icSvg(k, sz, col) { return '<svg viewBox="0 0 24 24" width="' + sz + '" height="' + sz + '" fill="' + col + '">' + (ICONS[k] || ICONS.pin)[1] + '</svg>'; }
  function mbIconEl(k, col) {
    var d = document.createElement('div');
    d.style.cssText = 'width:34px;height:34px;border-radius:50%;background:' + col + ';border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;cursor:pointer';
    d.innerHTML = icSvg(k, 20, '#fff'); return d;
  }
  function lvDrawMB() {
    var el = document.getElementById('lvmapL'); if (!el || !window.mapboxgl) return;
    if (MBMAP && MBMAP.getContainer() !== el) { if (el.parentNode) { el.parentNode.replaceChild(MBMAP.getContainer(), el); el = MBMAP.getContainer(); try { MBMAP.resize(); } catch (e) {} } else { try { MBMAP.remove(); } catch (e2) {} MBMAP = null; MBMARK = {}; MBYM = []; } }
    if (!MBMAP) {
      mapboxgl.accessToken = MAPKEY;
      MBMAP = new mapboxgl.Map({ container: el, style: 'mapbox://styles/mapbox/streets-v12', center: [-73.7949, 40.7282], zoom: 12 });
      MBMAP.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
      MBMAP.on('error', function (ev) { var st = ev && ev.error && ev.error.status; if (st === 401 || st === 403) lvFail('Mapbox rejected the token. Check it in Settings.'); });
    }
    var pts = [], k, n, l, i, y, m, mins;
    for (i = 0; i < MBYM.length; i++) { try { MBYM[i].remove(); } catch (e3) {} }
    for (n in MBMARK) { try { MBMARK[n].remove(); } catch (e5) {} }
    MBYM = []; MBMARK = {};
    for (i = 0; i < YARDS.length; i++) {
      y = YARDS[i]; if (typeof y.lat !== 'number') continue;
      m = new mapboxgl.Marker({ element: mbIconEl(y.icon || 'pin', y.col || YCOL[i % YCOL.length]) }).setLngLat([y.lng, y.lat]).setPopup(new mapboxgl.Popup({ offset: 20, closeButton: false }).setText(y.name)).addTo(MBMAP);
      MBYM.push(m); pts.push([y.lng, y.lat]);
    }
    for (k = 0; k < LNAMES.length; k++) {
      n = LNAMES[k]; l = LOCS[n]; if (!l || typeof l.lat !== 'number') continue;
      mins = Math.max(0, Math.round((Date.now() - new Date(l.at).getTime()) / 60000));
      MBMARK[n] = new mapboxgl.Marker({ element: mbIconEl(DICON[n] || 'tractor', DCOL[n]) }).setLngLat([l.lng, l.lat]).setPopup(new mapboxgl.Popup({ offset: 20, closeButton: false }).setText(n + ' - ' + (mins < 1 ? 'just now' : mins + ' min ago'))).addTo(MBMAP);
      pts.push([l.lng, l.lat]);
    }
    if (pts.length) { var b = new mapboxgl.LngLatBounds(pts[0], pts[0]); for (i = 1; i < pts.length; i++) b.extend(pts[i]); try { MBMAP.fitBounds(b, { padding: 60, maxZoom: 14, duration: 0 }); } catch (e4) {} }
  }
  function yardAdd() {
    var nm = ((document.getElementById('fYName') || {}).value || '').trim(), ad = ((document.getElementById('fYAddr') || {}).value || '').trim();
    if (!nm || !ad) { toast('Type the yard name and address'); return; }
    if (!isMB()) { toast('Save a Mapbox token first'); return; }
    toast('Finding the address...');
    fetch('https://api.mapbox.com/geocoding/v5/mapbox.places/' + encodeURIComponent(ad) + '.json?limit=1&country=us&proximity=-73.79,40.73&access_token=' + encodeURIComponent(MAPKEY))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var f = j && j.features && j.features[0]; if (!f) { toast('Could not find that address'); return; }
        YARDS.push({ name: nm, addr: ad, lat: f.center[1], lng: f.center[0], icon: 'pin', col: ICOLS[YARDS.length % ICOLS.length] }); toast('Yard added'); setView('settings'); syncSoon();
      }).catch(function () { toast('Could not look up the address'); });
  }
  function mapOpt(t, i, what, v) {
    if (t === 'y') { if (!YARDS[i]) return; if (what === 'icon') YARDS[i].icon = v; else YARDS[i].col = v; }
    else { var n = LNAMES[i]; if (!n) return; DICON[n] = v; }
    MBMAP = null; MBMARK = {}; MBYM = [];
    setView('settings'); syncSoon();
  }
  function icPicker(t, i, cur, curCol, withCol) {
    var h = '<div style="display:flex;flex-wrap:wrap;gap:6px;padding:4px 14px 8px">', q;
    for (q = 0; q < ICKEYS.length; q++) h += '<button class="btn sm' + (cur === ICKEYS[q] ? ' primary' : '') + '" data-act="mapopt" data-t="' + t + '" data-i="' + i + '" data-w="icon" data-v="' + ICKEYS[q] + '" aria-label="' + ICONS[ICKEYS[q]][0] + '" style="display:inline-flex;align-items:center;gap:4px">' + icSvg(ICKEYS[q], 16, cur === ICKEYS[q] ? '#fff' : '#2563EB') + ICONS[ICKEYS[q]][0] + '</button>';
    h += '</div>';
    if (withCol) {
      h += '<div style="display:flex;flex-wrap:wrap;gap:8px;padding:0 14px 10px">';
      for (q = 0; q < ICOLS.length; q++) h += '<button data-act="mapopt" data-t="' + t + '" data-i="' + i + '" data-w="col" data-v="' + ICOLS[q] + '" aria-label="Color" style="all:unset;cursor:pointer;width:28px;height:28px;border-radius:50%;background:' + ICOLS[q] + ';border:3px solid ' + (curCol === ICOLS[q] ? '#111' : '#fff') + ';box-shadow:0 0 0 1px #bbb"></button>';
      h += '</div>';
    }
    return h;
  }
  function mapKeyCard() {
    var kind = !MAPKEY ? '' : (isMB() ? 'Mapbox' : 'Google');
    var h = '<div class="card"><header><h2>Map</h2></header><div style="padding:0 14px 14px"><p class="note" style="padding:6px 0">' + (MAPKEY ? 'A ' + kind + ' key is saved. The live map uses ' + kind + '.' : 'The live map is using the basic backup map. Paste a Mapbox token (starts with pk.) or a Google map key to switch.') + '</p>' +
      '<div class="fld"><label for="fMapKey">Map token or key</label><input id="fMapKey" type="password" autocomplete="off" autocapitalize="none" placeholder="' + (MAPKEY ? 'Saved. Paste a new one to replace it.' : 'Paste it here') + '"></div>' +
      '<div class="actions"><button class="btn primary" data-act="mapkey">Save</button>' + (MAPKEY ? '<button class="btn" data-act="mapkeyrm">Remove</button>' : '') + '</div></div></div>';
    var rows = '', i, y;
    for (i = 0; i < YARDS.length; i++) {
      y = YARDS[i];
      rows += '<div class="lvrow"><span class="lvdot" style="background:' + (y.col || ICOLS[i % ICOLS.length]) + '"></span><div class="grow"><b>' + invEsc(y.name) + '</b><span class="sub">' + invEsc(y.addr) + '</span></div><button class="btn sm" data-act="yardrm" data-i="' + i + '">Remove</button></div>' + icPicker('y', i, y.icon || 'pin', y.col || ICOLS[i % ICOLS.length], true);
    }
    h += '<div class="card"><header><h2>Yards on the map</h2></header>' + rows + '<div style="padding:0 14px 14px"><p class="note" style="padding:6px 0">' + (YARDS.length ? 'Tap an icon or color to change how a yard looks on the map. ' : 'No yards yet. ') + 'Add each yard with its address. It shows as a pin on the Dispatch map (needs a Mapbox token).</p>' +
      '<div class="fld"><label for="fYName">Yard name</label><input id="fYName" placeholder="Yard 1"></div><div class="fld"><label for="fYAddr">Address</label><input id="fYAddr" placeholder="Street, city"></div>' +
      '<div class="actions"><button class="btn primary" data-act="yardadd">Add yard</button></div></div></div>';
    var dr = '', k;
    for (k = 0; k < LNAMES.length; k++) dr += '<div class="lvrow"><span class="lvdot" style="background:' + DCOL[LNAMES[k]] + '"></span><div class="grow"><b>' + invEsc(LNAMES[k]) + '</b></div></div>' + icPicker('d', k, DICON[LNAMES[k]] || 'tractor', '', false);
    h += '<div class="card"><header><h2>Driver icons on the map</h2></header>' + dr + '</div>';
    return h;
  }
