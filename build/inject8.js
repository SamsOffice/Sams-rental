  /* ---- job Documents and History tabs: real data only (the demo's sample receipt and sample timeline are gone) ---- */
  function docs(j) {
    var rs = [], k, r, h = '';
    for (k = 0; k < RCPTS.length; k++) { if (RCPTS[k].jid === j.id) rs.push(RCPTS[k]); }
    if (!rs.length) {
      return '<div class="drop"><span class="ic">' + icon('camera') + '</span><b>No receipt or ticket photos yet</b>' +
        '<p>Drivers take the dump receipt photo in the driver app. You can also attach one yourself.</p>' +
        '<button class="btn primary" data-act="rattach">' + icon('camera') + 'Attach receipt</button></div>';
    }
    for (k = 0; k < rs.length; k++) {
      r = rs[k]; var f = r.f || {}, hasF = f.site || f.ticket || f.lb || f.fee;
      h += '<div class="field" style="grid-template-columns:1fr"><div><b>Receipt from ' + invEsc(r.who || r.from || '') + ' &middot; ' + invEsc(r.at || '') + '</b><span class="v">' +
        (hasF ? invEsc(f.site || '-') + ' &middot; ticket ' + invEsc(f.ticket || '-') + ' &middot; ' + Number(f.lb || 0).toLocaleString('en-US') + ' lb &middot; fee ' + money(Number(f.fee) || 0) : 'Numbers not entered yet. Open Receipts to read the photo and type them.') +
        ' &middot; ' + invEsc(r.st === 'approved' ? 'approved' : (r.st === 'back' ? 'sent back to driver' : 'waiting for review')) + '</span></div></div>';
    }
    return h + '<div class="actions"><button class="btn" data-act="rattach">' + icon('camera') + 'Attach another receipt</button></div>';
  }
  function history(j) {
    var E = [], pay = j.pay === 'Paid';
    E.push(['dollar', 'Invoice #' + (j.id - 710), money(j.total) + (j.date ? ' &middot; ' + invEsc(j.date) : '')]);
    if (j.driver && j.driver !== 'Unassigned') E.push(['pin', 'Assigned to driver', invEsc(j.driver)]);
    if (j.conf) E.push(['mail', 'Confirmed by client', 'From the client portal link']);
    E.push(['truck', 'Status: ' + invEsc(j.status), j.dn ? 'Driver note: ' + invEsc(j.dn) : 'No driver note']);
    if (pay) E.push(['check', 'Paid', invEsc(j.method || '')]);
    var h = '<ol class="tl">';
    for (var k = 0; k < E.length; k++) { h += '<li><span class="dot">' + icon(E[k][0]) + '</span><div><b>' + E[k][1] + '</b><span>' + E[k][2] + '</span></div></li>'; }
    return h + '</ol><p class="note">A full minute-by-minute activity log is planned for after the pilot.</p>';
  }
  document.getElementById('pane').addEventListener('click', function (e) {
    var b = e.target.closest('[data-act="rattach"]'); if (b) openForm('rattach');
  });
