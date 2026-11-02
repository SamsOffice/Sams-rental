
  /* ---- receipt reader: asks the secure server function to read each receipt photo, shows the result for the office to check ---- */
  var RDBUSY = {};
  function rdStart(r) {
    if (!r || RDBUSY[r.id] || !SB || !SB.functions) return;
    RDBUSY[r.id] = 1; r.ai = '';
    var fin = function (st, msg) {
      delete RDBUSY[r.id]; r.ai = st; r.aimsg = msg || '';
      var put = function (id, v) { var e = document.getElementById(id); if (e && (!e.value || e.value === '0') && v) { e.value = v; if (id.indexOf('rf_lb_') === 0) e.dispatchEvent(new Event('input', { bubbles: true })); } };
      put('rf_site_' + r.id, r.f.site); put('rf_tk_' + r.id, r.f.ticket); put('rf_lb_' + r.id, r.f.lb); put('rf_fee_' + r.id, r.f.fee);
      var nb = document.getElementById('rdn_' + r.id); if (nb) nb.innerHTML = rdNote(r);
      syncSoon();
    };
    SB.functions.invoke('read-receipt', { body: { path: r.photo } }).then(function (res) {
      if (res.error) {
        var c = res.error.context && res.error.context.json ? res.error.context.json() : Promise.resolve({});
        c.then(function (b) { fin('fail', b && b.error === 'not_configured' ? 'The photo reader is not set up yet. Type the numbers.' : 'Could not read this photo. Type the numbers.'); }, function () { fin('fail', 'Could not read this photo. Type the numbers.'); });
        return;
      }
      var d = res.data || {};
      if (r.st !== 'new') { delete RDBUSY[r.id]; return; }
      r.f = { site: d.site || '', ticket: d.ticket || '', lb: d.lb || 0, fee: d.fee || 0 };
      r.ck = d.check || 'ok';
      fin((d.site || d.ticket || d.lb || d.fee) ? 'ok' : 'fail', (d.site || d.ticket || d.lb || d.fee) ? '' : 'Could not read this photo. Type the numbers.');
    }, function () { fin('fail', 'Could not read this photo. Type the numbers.'); });
  }
  function rdNote(r) {
    if (RDBUSY[r.id]) return '<p class="note" style="color:var(--accent,#2563EB)">Reading the photo...</p>';
    if (r.ai === 'ok') return '<p class="note"><b>Read from the photo by the app.</b> Check every number against the photo before you approve.</p>' + (r.ck && r.ck !== 'ok' ? '<p class="note" style="color:var(--bad,#B42318)"><b>Check the weight carefully.</b> The weights on this ticket did not match each other, or the weight could not be read.</p>' : '');
    if (r.ai === 'fail') return '<p class="note">' + invEsc(r.aimsg || 'Could not read this photo. Type the numbers.') + '</p>';
    return '';
  }
  function rcCard(r) {
    var j = dJob(r.jid) || { id: r.jid, client: 'Unknown job' }, ow = owCalc(r.f.lb);
    if (r.st === 'new' && r.photo && r.photo.indexOf('sb:') === 0 && !r.ai && !RDBUSY[r.id] && !(r.f.site || r.f.ticket || r.f.lb || r.f.fee) && ME && ME.role !== 'driver' && navigator.onLine !== false) { setTimeout(function () { rdStart(r); }, 50); }
    var pic = r.photo ? '<img data-ph="' + invEsc(r.photo.slice(3)) + '" src="' + phSrc(r.photo) + '" alt="Receipt photo" style="max-width:100%;max-height:260px;border-radius:10px;border:1px solid var(--line)">' : recPaper(r.f);
    return '<div class="card rcard"><header><h2>#' + j.id + ' ' + invEsc(j.client) + '</h2>' + pillH('New', 'warn') + '</header><div class="pane"><div class="rcg"><div class="rcpic">' + pic + '<p class="note" style="margin-top:8px">From ' + invEsc(r.who) + (r.from === 'office' ? ' (attached by the office)' : '') + ' &middot; ' + r.at + '</p></div>' +
      '<div class="fgrid">' + fld('rf_site_' + r.id, 'Dump site', 'text', r.f.site) + fld('rf_tk_' + r.id, 'Ticket number', 'text', r.f.ticket) + fld('rf_lb_' + r.id, 'Net weight (lb)', 'number', r.f.lb) + fld('rf_fee_' + r.id, 'Dump fee ($)', 'number', r.f.fee) + fld('rf_ow_' + r.id, 'Overweight charge to client ($)', 'number', ow) + '</div></div>' +
      '<div id="rdn_' + r.id + '">' + rdNote(r) + '</div><p class="note" id="rcc_' + r.id + '">' + rcCalcTxt(r.f.lb) + '</p>' +
      '<div class="acts"><button class="btn primary" data-act="rapprove" data-id="' + r.id + '">' + icon('check') + 'Approve and add to invoice</button>' + (r.photo && r.photo.indexOf('sb:') === 0 ? '<button class="btn" data-act="rread" data-id="' + r.id + '">' + icon('camera') + 'Read photo again</button>' : '') + '<button class="btn" data-act="rback" data-id="' + r.id + '">' + icon('refresh') + 'Send back to driver</button></div></div></div>';
  }

  function phSrc(p) {
    if (!p) return '';
    if (p.indexOf('sb:') !== 0) return p;
    var path = p.slice(3);
    if (PHC[path]) return PHC[path];
    if (!PHPEND[path]) {
      PHPEND[path] = 1;
      SB.storage.from('receipts').createSignedUrl(path, 3600).then(function (r) {
        if (r && r.data && r.data.signedUrl) {
          PHC[path] = r.data.signedUrl;
          var ims = document.querySelectorAll('img[data-ph]'), q;
          for (q = 0; q < ims.length; q++) { if (ims[q].getAttribute('data-ph') === path) ims[q].src = PHC[path]; }
          try { refreshAll(); } catch (e) { }
        } else { delete PHPEND[path]; }
      }, function () { delete PHPEND[path]; });
    }
    return PH_BLANK;
  }

  /* receipts follow their job: when a job is deleted, its receipts leave the Receipts list and the badge counts */
  function vReceipts() {
    var pend = '', done = '', k, np = 0;
    for (k = 0; k < RCPTS.length; k++) {
      var r = RCPTS[k], j = dJob(r.jid);
      if (!j) continue;
      if (r.st === 'new') { pend += rcCard(r); np++; }
      else done += '<div class="li"><span class="ic2">' + icon('receipt') + '</span><div class="grow"><b>#' + r.jid + ' ' + invEsc(j.client) + '</b><span class="sub">' + (r.st === 'approved' ? tonsOf(r.f.lb) + ' tons &middot; overweight ' + money(r.ow || 0) + ' &middot; ticket ' + invEsc(r.f.ticket) : 'Waiting for ' + invEsc(r.who) + ' to send a new photo') + '</span></div>' + (r.st === 'approved' ? pillH('Approved', 'good') + '<button class="invbtn" data-inv="d' + r.jid + '" aria-label="Open invoice">' + icon('receipt') + '</button>' : pillH('Sent back', 'warn')) + '</div>';
    }
    return '<div class="vhead"><p>Dump receipts from the drivers show up here already read. Check each one, then approve it.</p><button class="btn primary" data-act="rattach">' + icon('plus') + 'Attach receipt</button></div>' +
      (pend || '<div class="card"><p class="note" style="padding:18px 16px">Nothing to review. New receipts from the drivers show up here.</p></div>') +
      (done ? '<div class="card"><header><h2>Already reviewed</h2></header>' + done + '</div>' : '');
  }

  /* ---- machine nameplate reader (real photo only; no sample button) ---- */
  function fileToB64(blob) {
    return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(String(fr.result).replace(/^data:[^,]*,/, '')); }; fr.onerror = function () { rej(new Error('read')); }; fr.readAsDataURL(blob); });
  }
  function startRead() {
    var inp = document.getElementById('scFile'), file = inp && inp.files && inp.files[0];
    if (!file) return;
    SC.stage = 'scanning'; SC.n++; SC.ai = ''; SC.msg = '';
    SC.f = { name: '', make: '', model: '', serial: '', year: '', memo: '' };
    if (SC.mode !== 'new') { var a0 = assetById(SC.mode); if (a0) SC.f.name = a0.name; }
    drawScan(); var my = SC.n;
    var done = function (ai, msg) { if (SC.n !== my || SC.stage !== 'scanning') return; SC.ai = ai; SC.msg = msg || ''; SC.stage = 'review'; drawScan(); };
    prepPh(file).then(fileToB64).then(function (b64) {
      return SB.functions.invoke('read-receipt', { body: { kind: 'nameplate', image: b64 } });
    }).then(function (res) {
      if (res.error) {
        var c = res.error.context && res.error.context.json ? res.error.context.json() : Promise.resolve({});
        c.then(function (b) { done('fail', b && b.error === 'not_configured' ? 'The photo reader is not set up yet. Type the details.' : 'Could not read this photo. Type the details.'); }, function () { done('fail', 'Could not read this photo. Type the details.'); });
        return;
      }
      var d = res.data || {};
      if (!(d.make || d.model || d.serial)) { done('fail', 'Could not read the plate. Retake the photo closer, or type the details.'); return; }
      SC.f = { name: SC.f.name || d.name || '', make: d.make || '', model: d.model || '', serial: d.serial || '', year: d.year || '', memo: '' };
      done('ok', '');
    }).catch(function () { done('fail', 'Could not read this photo. Type the details.'); });
  }
  function drawScan() {
    var h = '', f = SC.f;
    var pic = function () { return SC.photo ? '<div style="text-align:center"><img src="' + SC.photo + '" alt="Nameplate photo" style="max-width:100%;max-height:220px;border-radius:10px;border:1px solid var(--line)"></div>' : ''; };
    if (SC.stage === 'start') {
      h = '<div style="text-align:center"><span class="ic2" style="margin:0 auto 8px">' + icon('camera') + '</span><b>Take a photo of the machine nameplate</b><p class="note" style="margin-top:6px">Get close to the metal plate so the maker, model and serial number are sharp. Good light helps.</p></div>' +
        '<label class="btn primary" style="justify-content:center;cursor:pointer">' + icon('camera') + 'Take photo<input id="scFile" type="file" accept="image/*" capture="environment" style="display:none"></label>';
    } else if (SC.stage === 'scanning') {
      h = pic() + '<div style="text-align:center"><b>Reading nameplate...</b><p class="note">This takes a few seconds.</p></div>';
    } else {
      h = pic() + '<h3 class="fsec">Select data</h3><div class="fgrid">' + fld('scName', 'Machine name', 'text', f.name, 'Example: Mini excavator', true) + fld('scMake', 'Manufacturer', 'text', f.make) + fld('scModel', 'Model #', 'text', f.model) + fld('scSerial', 'Serial #', 'text', f.serial) + fld('scYear', 'Year', 'number', f.year) +
        '<div class="fld wide"><label for="scMemo">Notes</label><textarea id="scMemo" placeholder="Anything to remember...">' + invEsc(f.memo) + '</textarea></div></div><p class="ferr" id="scErr"></p>' +
        (SC.ai === 'ok' ? '<p class="note"><b>Read from the photo by the app.</b> Check the maker, model and serial number against the plate before saving. One wrong character in a serial number matters.</p>' : '<p class="note">' + invEsc(SC.msg || 'Type the details from the plate.') + '</p>') +
        '<div class="actions"><button type="button" class="btn primary" data-sc="save">' + icon('check') + 'Save machine</button><button type="button" class="btn" data-sc="retake">' + icon('refresh') + 'Retake photo</button><button type="button" class="btn" data-sc="cancel">Cancel</button></div>';
    }
    document.getElementById('scBody').innerHTML = h; paintIcons(document.getElementById('scBody'));
  }

  /* ---- dump job times: drop-off and pickup times in the form ---- */
  function t12(v) {
    var m = /^(\d{1,2}):(\d{2})/.exec(v || ''); if (!m) return '8:00 AM';
    var h = parseInt(m[1], 10), ap = h >= 12 ? 'PM' : 'AM'; h = h % 12; if (h === 0) h = 12; return h + ':' + m[2] + ' ' + ap;
  }
  function dispT(jid, which) {
    var st = jid ? stopsOf(jid) : [], k, pr;
    for (k = 0; k < st.length; k++) {
      var isP = /^PULL/.test(st[k].what);
      if ((which === 'p') === isP) { pr = parseDisp(st[k].time); if (pr && pr.t) return pr.t; }
    }
    return '08:00';
  }

  /* ---- driver location: visible status bar with a button that always works (a tap is needed on iPhones and iPads) ---- */
  var LOCST = { s: 'idle', at: 0, msg: '' };
  function locOff() { try { return localStorage.getItem('sams-loc-off:' + OBX.slug) === '1'; } catch (e) { return false; } }
  function locSetOff(v) {
    try { if (v) localStorage.setItem('sams-loc-off:' + OBX.slug, '1'); else localStorage.removeItem('sams-loc-off:' + OBX.slug); } catch (e) { }
    if (v && ME) { var w = ME.driver_name || ME.full_name; try { Promise.resolve(SB.from('app_records').upsert({ kind: 'loc', id: w, data: { id: w, who: w, off: true, at: new Date().toISOString() } })); } catch (e) { } }
    locPaint(); if (!v) { LOCST = { s: 'idle', at: 0, msg: '' }; sendLoc(true); }
  }
  function sendLoc(force) {
    if (locOff()) return;
    if (!navigator.geolocation || !ME || document.body.className.indexOf('drvmode') < 0) return;
    if (force === true) { LOCOK = true; try { localStorage.setItem('sams-loc-ok:' + OBX.slug, '1'); } catch (e) { } }
    else if (LOCOK === false || NET_OFF) return;
    navigator.geolocation.getCurrentPosition(function (p) {
      var w = ME.driver_name || ME.full_name;
      var pr = SB.from('app_records').upsert({ kind: 'loc', id: w, data: { id: w, who: w, lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy, at: new Date().toISOString() } });
      Promise.resolve(pr).then(function (r) {
        if (r && r.error) { LOCST = { s: 'saveerr', at: 0, msg: r.error.message || '' }; } else { LOCST = { s: 'ok', at: Date.now(), msg: '' }; }
        locPaint();
      }, function () { LOCST = { s: 'saveerr', at: 0, msg: 'red' }; locPaint(); });
    }, function (er) {
      LOCST = { s: er && er.code === 1 ? 'denied' : 'error', at: 0, msg: er && er.message || '' }; locPaint();
    }, { enableHighAccuracy: true, maximumAge: 30000, timeout: 20000 });
  }
  function locPaint() {
    var inDrv = document.body.className.indexOf('drvmode') >= 0, el = document.getElementById('locBar');
    if (!inDrv) { if (el) el.style.display = 'none'; return; }
    if (!el) {
      el = document.createElement('div'); el.id = 'locBar';
      el.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:9000;padding:10px 14px calc(10px + env(safe-area-inset-bottom,0px));display:flex;gap:10px;align-items:center;justify-content:space-between;font:15px/1.35 system-ui,-apple-system,sans-serif;border-top:1px solid rgba(0,0,0,.15)';
      el.innerHTML = '<span id="locTxt" style="flex:1"></span><button id="locGo" type="button" style="border:0;border-radius:10px;padding:10px 14px;font:600 15px system-ui;background:#1D6FEF;color:#fff">Compartir ubicación</button>';
      document.body.appendChild(el);
      document.getElementById('locGo').addEventListener('click', function () { LOCST = { s: 'idle', at: 0, msg: '' }; sendLoc(true); locPaint(); });
    }
    el.style.display = 'flex'; var db0 = document.getElementById('drvBody'); if (db0) db0.style.paddingBottom = LOCST.s === 'ok' ? '70px' : '120px';
    if (locOff()) {
      el.style.cssText = 'position:fixed;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));left:auto;z-index:9000;padding:6px 12px;display:flex;gap:8px;align-items:center;font:600 13px system-ui,-apple-system,sans-serif;border-radius:99px;border:1px solid #D1D5DB;background:#F3F4F6;color:#374151;box-shadow:0 1px 4px rgba(0,0,0,.2)';
      document.getElementById('locTxt').style.flex = '0 0 auto'; document.getElementById('locGo').style.display = 'none';
      document.getElementById('locTxt').textContent = '\u25CB Ubicaci\u00f3n apagada. Toca para encender'; el.onclick = function () { locSetOff(false); };
      if (db0) db0.style.paddingBottom = '70px'; return;
    }
    if (LOCST.s === 'ok') {
      el.style.cssText = 'position:fixed;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));left:auto;z-index:9000;padding:6px 12px;display:flex;gap:8px;align-items:center;font:600 13px system-ui,-apple-system,sans-serif;border-radius:99px;border:1px solid #86EFAC;background:#DCFCE7;color:#166534;box-shadow:0 1px 4px rgba(0,0,0,.2)';
      document.getElementById('locTxt').style.flex = '0 0 auto'; document.getElementById('locGo').style.display = 'none';
      document.getElementById('locTxt').textContent = '\u25CF Ubicaci\u00f3n activa. Toca para apagar'; el.onclick = function () { locSetOff(true); };
      return;
    }
    el.onclick = null; document.getElementById('locGo').style.display = '';
    el.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:9000;padding:10px 14px calc(10px + env(safe-area-inset-bottom,0px));display:flex;gap:10px;align-items:center;justify-content:space-between;font:15px/1.35 system-ui,-apple-system,sans-serif;border-top:1px solid rgba(0,0,0,.15)';
    document.getElementById('locTxt').style.flex = '1';
    var t = document.getElementById('locTxt'), bg = '#FEF3C7', fg = '#92400E', tx, btn = document.getElementById('locGo');
    if (LOCST.s === 'ok') { var mn = Math.max(0, Math.round((Date.now() - LOCST.at) / 60000)); tx = 'Ubicación compartida con la oficina (' + (mn < 1 ? 'ahora' : 'hace ' + mn + ' min') + ')'; bg = '#DCFCE7'; fg = '#166534'; btn.textContent = 'Actualizar'; }
    else if (LOCST.s === 'denied') { tx = 'Ubicación bloqueada. En Ajustes del teléfono, activa Ubicación para este navegador y para este sitio. Luego toca el botón.'; bg = '#FEE2E2'; fg = '#991B1B'; btn.textContent = 'Intentar de nuevo'; }
    else if (LOCST.s === 'error') { tx = 'No se pudo obtener tu ubicación. Sal al aire libre o activa el GPS y toca el botón.'; bg = '#FEE2E2'; fg = '#991B1B'; btn.textContent = 'Intentar de nuevo'; }
    else if (LOCST.s === 'saveerr') { tx = 'Se obtuvo tu ubicación pero no se pudo enviar a la oficina.'; bg = '#FEE2E2'; fg = '#991B1B'; btn.textContent = 'Intentar de nuevo'; }
    else { tx = 'Toca el botón para compartir tu ubicación con la oficina.'; btn.textContent = 'Compartir ubicación'; }
    t.textContent = tx; el.style.background = bg; el.style.color = fg;
  }
  setInterval(function () { sendLoc(); }, 45000);
  setInterval(locPaint, 15000);
  var LOCBOOT = setInterval(function () { if (document.body.className.indexOf('drvmode') >= 0 && ME) { clearInterval(LOCBOOT); locPaint(); setTimeout(function () { sendLoc(); }, 2500); } }, 800);
