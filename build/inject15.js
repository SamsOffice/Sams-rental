  /* ---- End of day card at the top of Overview (office only). Real data, names under every number, fold-away lower part. ---- */
  (function () {
    var WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var WDES = { Sunday: 'del domingo', Monday: 'del lunes', Tuesday: 'del martes', Wednesday: 'del miércoles', Thursday: 'del jueves', Friday: 'del viernes', Saturday: 'del sábado' };
    var X = {
      'Great day, team!': '¡Buen día, equipo!', 'Here is your day': 'Así va tu día', 'Dumps today': 'Viajes hoy', 'None today': 'Ninguno hoy',
      'Billed today': 'Facturado hoy', 'Containers out': 'Contenedores afuera', 'Out over 7 days': 'Afuera más de 7 días', 'Still owed': 'Aún se debe',
      'Show more': 'Ver más', 'Show less': 'Ver menos', 'Driver note:': 'Nota del chofer:',
      'Nothing billed yet': 'Nada facturado aún', 'No containers out': 'Ningún contenedor afuera', 'None over 7 days': 'Ninguno pasa de 7 días',
      'Nobody owes you': 'Nadie te debe', 'No deliveries yet': 'Aún no hay entregas', 'Nothing scheduled': 'Nada programado'
    }, k;
    for (k in X) { if (X.hasOwnProperty(k) && !ES_X[k]) ES_X[k] = X[k]; }
    if (!ES_X['Drivers']) ES_X['Drivers'] = 'Choferes';
    if (!ES_X['Tomorrow']) ES_X['Tomorrow'] = 'Mañana';
    ES_P.push([/^Here is how (Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday) went$/, function (a, d) { return 'Así fue el día ' + WDES[d]; }]);
    ES_P.push([/^(\d+) of (\d+)$/, function (a, x, y) { return x + ' de ' + y; }]);
    ES_P.push([/^\+ (\d+) more$/, function (a, n) { return '+ ' + n + ' más'; }]);
    ES_P.push([/^(\d+) dumps? not done$/, function (a, n) { return n + (n === '1' ? ' viaje sin terminar' : ' viajes sin terminar'); }]);
    ES_P.push([/^(\d+) stops?$/, function (a, n) { return n + (n === '1' ? ' parada' : ' paradas'); }]);
    ES_P.push([/^(.+), out (\d+) days?$/, function (a, p, n) { return p + ', afuera ' + n + (n === '1' ? ' día' : ' días'); }]);
    ES_P.push([/^(.+): not done yet$/, function (a, p) { return p + ': aún sin hacer'; }]);
    ES_P.push([/^(.+): on the way$/, function (a, p) { return p + ': en camino'; }]);
    ES_P.push([/^(.+): arrived$/, function (a, p) { return p + ': llegó'; }]);

    function fm(n) { n = Math.round(n * 100) / 100; return '$' + n.toLocaleString('en-US', { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }); }
    function short(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '...' : s; }
    function line(t, bold) { return '<div class="el">' + (bold ? '<b>' + t + '</b>' : t) + '</div>'; }
    function tile(ic, num, lab, tone, body) {
      return '<div class="etile ' + tone + '"><div class="etop"><span class="eic">' + icon(ic) + '</span><div><div class="enum">' + num + '</div><div class="elab">' + lab + '</div></div></div><div class="ebody">' + body + '</div></div>';
    }
    function group(map, ord, fmt, max) {
      var h = '', k, extra = ord.length - max;
      for (k = 0; k < ord.length && k < max; k++) h += line(invEsc(ord[k]) + ' ' + fmt(map[ord[k]]));
      if (extra > 0) h += line('+ ' + extra + ' more');
      return h;
    }
    function eodData() {
      var t = TODAYISO(), tm = TOMOISO(), k, d, stops = [], done = 0, notDone = [], drv = {}, drvOrd = [], tom = 0, note = '';
      for (k = 0; k < DISP.length; k++) {
        d = DISP[k]; var iso = dispISO(d);
        if (iso === t) {
          stops.push(d);
          if (d.st === 'Delivered') { done++; if (d.driver) { if (!drv[d.driver]) { drv[d.driver] = 0; drvOrd.push(d.driver); } drv[d.driver]++; } }
          else notDone.push(d);
          if (d.dn) note = (d.driver ? d.driver + ': ' : '') + d.dn;
        } else if (iso === tm && d.st !== 'Delivered') tom++;
      }
      var bill = {}, billOrd = [], billTot = 0, lj = liveJobs(), lr = liveRentals(), amt;
      function addb(n, v) { if (!n || !(v > 0)) return; if (bill[n] == null) { bill[n] = 0; billOrd.push(n); } bill[n] += v; billTot += v; }
      for (k = 0; k < lj.length; k++) { if (ISO[lj[k].id] === t) addb(lj[k].client, lj[k].total); }
      for (k = 0; k < lr.length; k++) { if (lr[k].si === t) addb(lr[k].client, rTotal(lr[k])); }
      for (k = 0; k < XINVS.length; k++) { if (XINVS[k].date === t) addb(XINVS[k].client, XINVS[k].amt); }
      billOrd.sort(function (a, b) { return bill[b] - bill[a]; });
      var con = {}, conOrd = [], conN = 0;
      for (k = 0; k < JOBS.length; k++) {
        if (JOBS[k].status !== 'Delivered' && JOBS[k].status !== 'Out for pickup') continue;
        if (con[JOBS[k].client] == null) { con[JOBS[k].client] = 0; conOrd.push(JOBS[k].client); }
        con[JOBS[k].client]++; conN++;
      }
      conOrd.sort(function (a, b) { return con[b] - con[a]; });
      var over = overstay(), L = acctList(), owe = 0, rem = [];
      L.sort(function (a, b) { return b.amt - a.amt; });
      for (k = 0; k < L.length; k++) owe += L[k].amt;
      for (k = 0; k < NOTES.length; k++) { if (NOTES[k].rm && !NOTES[k].done && NOTES[k].iso <= tm) rem.push(NOTES[k]); }
      return { stops: stops, done: done, notDone: notDone, drv: drv, drvOrd: drvOrd, tom: tom, note: note, bill: bill, billOrd: billOrd, billTot: billTot, con: con, conOrd: conOrd, conN: conN, over: over, L: L, owe: owe, rem: rem };
    }
    function eodCard() {
      if (!ME || isDrv()) return '';
      var D = eodData(), Y = D.stops.length, X2 = D.done, pct = Y ? Math.round(X2 * 100 / Y) : 0, k, h, open = false;
      try { open = localStorage.getItem('so-eod') === '1'; } catch (e) { open = false; }
      var title = (Y && pct >= 80) ? 'Great day, team!' : 'Here is your day';
      var day = WD[new Date().getDay()];
      /* tiles */
      var t1 = D.billOrd.length ? group(D.bill, D.billOrd, fm, 3) : line('Nothing billed yet');
      var t2 = D.conOrd.length ? group(D.con, D.conOrd, function (n) { return n; }, 3) : line('No containers out');
      var t3 = ''; for (k = 0; k < D.over.length && k < 2; k++) { var oj = D.over[k].j; t3 += line(invEsc(oj.client) + (oj.size ? ', ' + invEsc(oj.size) : ''), true) + line(invEsc(short(oj.addr, 28)) + ', out ' + D.over[k].days + (D.over[k].days === 1 ? ' day' : ' days')); }
      if (D.over.length > 2) t3 += line('+ ' + (D.over.length - 2) + ' more');
      if (!t3) t3 = line('None over 7 days');
      var t4 = ''; for (k = 0; k < D.L.length && k < 3; k++) t4 += line(invEsc(D.L[k].n) + ' ' + fm(D.L[k].amt), k === 0);
      if (D.L.length > 3) t4 += line('+ ' + (D.L.length - 3) + ' more');
      if (!t4) t4 = line('Nobody owes you');
      /* lower part */
      var more = '';
      if (D.notDone.length) {
        h = ''; for (k = 0; k < D.notDone.length && k < 6; k++) {
          var nd = D.notDone[k], why = nd.dn ? short(nd.dn, 70) : (nd.st === 'Scheduled' ? 'not done yet' : (nd.st === 'Arrived' ? 'arrived' : 'on the way'));
          h += line(invEsc(nd.client) + (nd.addr ? ', ' + invEsc(short(nd.addr, 30)) : '') + ': ' + invEsc(why));
        }
        more += '<div class="enot"><b class="ehd bad"><span class="eic2">' + icon('alert') + '</span>' + D.notDone.length + (D.notDone.length === 1 ? ' dump not done' : ' dumps not done') + '</b>' + h + '</div>';
      }
      var dh = ''; for (k = 0; k < D.drvOrd.length; k++) dh += (k ? ' &nbsp;&middot;&nbsp; ' : '') + invEsc(D.drvOrd[k]) + ' ' + D.drv[D.drvOrd[k]];
      if (!dh) dh = 'No deliveries yet';
      var th = D.tom + (D.tom === 1 ? ' stop' : ' stops'); for (k = 0; k < D.rem.length && k < 2; k++) th += '<div class="el">' + invEsc(short(D.rem[k].text, 60)) + '</div>';
      if (!D.tom && !D.rem.length) th = 'Nothing scheduled';
      more += '<div class="e2"><div class="ebox blue"><b class="ehd"><span class="eic2">' + icon('users') + '</span>Drivers</b><div class="el">' + dh + '</div></div>' +
        '<div class="ebox red"><b class="ehd bad"><span class="eic2">' + icon('calendar') + '</span>Tomorrow</b><div class="el">' + th + '</div></div></div>';
      if (D.note) more += '<div class="enote"><span class="eic2">' + icon('note') + '</span><span><b>Driver note:</b> ' + invEsc(short(D.note, 140)) + '</span></div>';
      return '<div class="eod' + (open ? ' open' : '') + '" id="eod"><div class="ebanner"><div><div class="et">' + title + '</div><div class="es">Here is how ' + day + ' went</div></div>' +
        '<div class="er"><div class="es">Dumps today</div><div class="ebig">' + (Y ? X2 + ' of ' + Y : 'None today') + '</div></div></div>' +
        '<div class="ebar"><i style="width:' + pct + '%"></i></div><div class="epad"><div class="etiles">' +
        tile('dollar', fm(D.billTot), 'Billed today', 'blue', t1) + tile('box', D.conN, 'Containers out', 'blue', t2) +
        tile('clock', D.over.length, 'Out over 7 days', 'red', t3) + tile('wallet', fm(D.owe), 'Still owed', 'red', t4) + '</div>' +
        '<div class="emore">' + more + '</div><button type="button" class="ebtn" id="eodBtn"><span class="elbl">' + (open ? 'Show less' : 'Show more') + '</span><span class="etg">&#9662;</span></button></div></div>';
    }
    var css = '.eod{margin-bottom:18px;border-radius:22px;overflow:hidden;border:1px solid var(--line);background:var(--surface)}' +
      '.eod .ebanner{background:linear-gradient(120deg,#1D6FEF,#1553b8);color:#fff;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}' +
      '.eod .et{font-size:21px;font-weight:700}.eod .es{font-size:13px;opacity:.85;margin-top:2px}.eod .er{text-align:right}.eod .ebig{font-size:28px;font-weight:700;line-height:1.1}' +
      '.eod .ebar{height:10px;background:var(--tint)}.eod .ebar i{display:block;height:100%;background:linear-gradient(90deg,#e03a3a,#1D6FEF)}' +
      '.eod .epad{padding:14px 16px}.eod .etiles{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;align-items:stretch}' +
      '.eod .etile{background:var(--surface);border:2px solid var(--blue);border-radius:18px;padding:14px;min-width:0}.eod .etile.red{border-color:var(--bad)}' +
      '.eod .etop{display:flex;align-items:center;gap:12px}.eod .eic{width:46px;height:46px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;flex:none}' +
      '.eod .etile.red .eic{background:var(--bad)}.eod .eic svg{width:22px;height:22px}.eod .enum{font-size:26px;font-weight:700;line-height:1}.eod .elab{font-size:13px;color:var(--muted);margin-top:3px}' +
      '.eod .ebody{font-size:13px;margin-top:10px;line-height:1.5;border-top:1px solid var(--line);padding-top:8px}.eod .el{overflow-wrap:anywhere}' +
      '.eod .emore{display:none;margin-top:14px}.eod.open .emore{display:block}' +
      '.eod .enot{background:var(--bad-bg);border:1px solid var(--bad);border-radius:14px;padding:12px 14px;font-size:14px;margin-bottom:12px}' +
      '.eod .ehd{display:flex;align-items:center;gap:8px;color:var(--blue);font-weight:700;margin-bottom:2px}.eod .ehd.bad{color:var(--bad)}' +
      '.eod .eic2 svg{width:20px;height:20px;display:block}.eod .e2{display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px}' +
      '.eod .ebox{border-radius:14px;padding:12px 14px}.eod .ebox.blue{background:var(--tint)}.eod .ebox.red{background:var(--bad-bg)}' +
      '.eod .enote{margin-top:12px;background:var(--tint);border-radius:14px;padding:10px 14px;font-size:14px;display:flex;align-items:center;gap:8px}.eod .enote .eic2{color:var(--blue)}' +
      '.eod .ebtn{margin-top:12px;width:100%;border:1.5px solid var(--blue);color:var(--blue);background:var(--surface);border-radius:14px;padding:11px;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;font-family:inherit}' +
      '.eod .etg{display:inline-block;transition:transform .2s}.eod.open .etg{transform:rotate(180deg)}' +
      '@media (max-width:900px){.eod .etiles{grid-template-columns:1fr 1fr}.eod .e2{grid-template-columns:1fr}}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    document.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('#eodBtn') : null; if (!b) return;
      var box = document.getElementById('eod'); if (!box) return;
      var o = box.classList.toggle('open');
      var l = b.querySelector('.elbl'); if (l) l.textContent = o ? 'Show less' : 'Show more';
      try { localStorage.setItem('so-eod', o ? '1' : '0'); } catch (x) { }
    });
    var eod0 = vOverview;
    vOverview = function () { return eodCard() + eod0(); };
  })();
