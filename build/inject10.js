
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
