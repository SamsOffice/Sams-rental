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
      h += '<div class="dadone"><div><b>' + invEsc(d.title) + '</b><small>' + (onlyMine ? '' : invEsc(d.who) + ' &middot; ') + invEsc(d.client) + ' &middot; ' + invEsc(d.time || '') + (d.addr ? ' &middot; ' + invEsc(d.addr) : '') + '</small></div></div>';
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
    if (LMAP && LMAP._container !== el) { try { LMAP.remove(); } catch (e) {} LMAP = null; LMARK = {}; }
    if (!LMAP) {
      LMAP = L.map(el, { zoomControl: true, attributionControl: true }).setView([40.7128, -73.9], 11);
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
      n = LNAMES[k]; l = LOCS[n];
      if (l) { any = true; mins = Math.max(0, Math.round((Date.now() - new Date(l.at).getTime()) / 60000)); }
      rows += '<div class="lvrow"><span class="lvdot" style="background:' + DCOL[n] + '"></span><div class="grow"><b>' + invEsc(n) + '</b><span class="sub">' + (l ? (mins < 1 ? 'Just now' : mins + ' min ago') : 'Not sharing yet') + '</span></div>' + (l ? '<a class="btn sm" target="_blank" rel="noopener" href="https://maps.apple.com/?ll=' + l.lat + ',' + l.lng + '&q=' + encodeURIComponent(n) + '">' + icon('map') + 'Open map</a>' : '') + '</div>';
    }
    setTimeout(function () { lvLoadLib(function () { try { lvDrawMap(); } catch (e) { var m = document.getElementById('lvmapL'); if (m) m.innerHTML = '<p class="note" style="padding:14px">The map could not draw. The list below still shows each driver.</p>'; } }); }, 60);
    return '<header><h2>Where the drivers are</h2>' + pillH(any ? 'From their phones' : 'Waiting', any ? 'good' : 'warn') + '</header>' +
      '<div id="lvmapL" style="height:300px;margin:0 14px 10px;border-radius:12px;overflow:hidden;background:#1b2433"></div>' + rows +
      '<p class="note" style="padding:10px 14px">Each driver shares their place while the driver app is open on their phone. Pins update about every minute.</p>';
  }
  document.getElementById('dClose').addEventListener('click', function () { document.getElementById('detail').hidden = true; });
