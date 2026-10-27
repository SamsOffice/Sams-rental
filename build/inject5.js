  /* ---- Real numbers, invoices, clients, settings, sending ---- */
  function monthOf(iso) { return iso && String(iso).slice(0, 7) === TODAYISO().slice(0, 7); }
  function liveJobs() { var o = [], k; for (k = 0; k < JOBS.length; k++) { if (JOBS[k].status !== 'Cancelled') o.push(JOBS[k]); } return o; }
  function liveRentals() { var o = [], k; for (k = 0; k < RENTALS.length; k++) { if (RENTALS[k].status !== 'Cancelled') o.push(RENTALS[k]); } return o; }
  function acctList() {
    var m = {}, ord = [], out = [], k, e;
    function add(nm, amt, due) {
      if (!nm || !(amt > 0)) return;
      var d = invParse(due), days = d ? Math.round((TODAY - d) / 86400000) : 0;
      e = m[nm]; if (!e) { e = m[nm] = { n: nm, amt: 0, days: -9999, due: due }; ord.push(nm); }
      e.amt += amt; if (days > e.days) { e.days = days; e.due = due; }
    }
    var lj = liveJobs(), lr = liveRentals();
    for (k = 0; k < lj.length; k++) { if (lj[k].pay !== 'Paid') add(lj[k].client, lj[k].total, lj[k].dueIso || ISO[lj[k].id]); }
    for (k = 0; k < lr.length; k++) { if (lr[k].pay !== 'Paid') add(lr[k].client, rTotal(lr[k]), lr[k].di); }
    for (k = 0; k < XINVS.length; k++) { if (!XINVS[k].paid) add(XINVS[k].client, XINVS[k].amt, XINVS[k].date); }
    for (k = 0; k < ord.length; k++) out.push(m[ord[k]]);
    out.sort(function (a, b) { return b.days - a.days; });
    return out;
  }
  function acctTxt(e) { return e.days > 0 ? e.days + ' days past due' : 'Due ' + (e.due ? longD(e.due) : 'soon'); }
  function paidMonthTotal() {
    var t = 0, n = 0, k, lj = liveJobs(), lr = liveRentals();
    for (k = 0; k < lj.length; k++) { if (lj[k].pay === 'Paid' && monthOf(ISO[lj[k].id])) { t += lj[k].total; n++; } }
    for (k = 0; k < lr.length; k++) { if (lr[k].pay === 'Paid' && monthOf(lr[k].si)) { t += rTotal(lr[k]); n++; } }
    for (k = 0; k < XINVS.length; k++) { if (XINVS[k].paid && monthOf(XINVS[k].date)) { t += XINVS[k].amt; n++; } }
    return [t, n];
  }
  function vCenter() {
    var L = acctList(), h = '', tot = 0, k, e, pm = paidMonthTotal();
    for (k = 0; k < L.length; k++) {
      e = L[k]; tot += e.amt;
      h += '<div class="li"><span class="ic2">' + icon('wallet') + '</span><div class="grow"><b>' + invEsc(e.n) + '</b><span class="sub">' + acctTxt(e) + '</span></div>' + pillH(e.days > 7 ? 'Past due' : 'Unpaid', e.days > 7 ? 'bad' : 'warn') + '<b class="num">' + money(e.amt) + '</b><button class="btn sm" data-act="remind" data-n="' + invEsc(e.n) + '" data-amt="' + e.amt + '" data-days="' + Math.max(e.days, 0) + '">' + icon('mail') + 'Remind</button></div>';
    }
    if (!h) h = '<p class="note" style="padding:14px">Nobody owes you anything right now.</p>';
    return '<section class="stats"><div class="stat alert"><div class="row">Total unpaid<span class="ic">' + icon('alert') + '</span></div><b>' + money(tot) + '</b><small>' + L.length + (L.length === 1 ? ' client' : ' clients') + '</small></div>' +
      '<div class="stat"><div class="row">Collected this month<span class="ic">' + icon('check') + '</span></div><b>' + money(pm[0]) + '</b><small>' + pm[1] + (pm[1] === 1 ? ' invoice paid' : ' invoices paid') + '</small></div></section>' +
      '<div class="card"><header><h2>Who owes you</h2></header>' + h + '</div>';
  }
  function vOverview() {
    var lj = liveJobs(), lr = liveRentals(), k, dumpRev = 0, dumpN = 0, rentRev = 0, actR = 0, xr = 0, byc = {}, ord = [], L = acctList(), out = 0, late = 0, h = '', top = [];
    function addc(n, v) { if (!byc[n]) { byc[n] = 0; ord.push(n); } byc[n] += v; }
    for (k = 0; k < lj.length; k++) { if (monthOf(ISO[lj[k].id])) { dumpRev += lj[k].total; dumpN++; addc(lj[k].client, lj[k].total); } }
    for (k = 0; k < lr.length; k++) { if (monthOf(lr[k].si)) { rentRev += rTotal(lr[k]); addc(lr[k].client, rTotal(lr[k])); } if (lr[k].status !== 'Returned') actR++; }
    for (k = 0; k < XINVS.length; k++) { if (monthOf(XINVS[k].date)) { xr += XINVS[k].amt; addc(XINVS[k].client, XINVS[k].amt); } }
    for (k = 0; k < L.length; k++) { out += L[k].amt; if (L[k].days > 0) late++; }
    for (k = 0; k < ord.length; k++) top.push([ord[k], byc[ord[k]]]);
    top.sort(function (a, b) { return b[1] - a[1]; }); top = top.slice(0, 5);
    for (k = 0; k < top.length; k++) h += '<div class="li"><span class="avatar">' + initials(top[k][0]) + '</span><div class="grow"><b>' + invEsc(top[k][0]) + '</b></div><b class="num">' + money(top[k][1]) + '</b></div>';
    if (!h) h = '<p class="note" style="padding:14px">No jobs this month yet.</p>';
    return '<section class="stats"><div class="stat"><div class="row">Revenue this month<span class="ic">' + icon('dollar') + '</span></div><b>' + money(dumpRev + rentRev + xr) + '</b><small>All rentals and dumping</small></div>' +
      '<div class="stat"><div class="row">Rental revenue<span class="ic">' + icon('box') + '</span></div><b>' + money(rentRev) + '</b><small>' + actR + ' active rentals</small></div>' +
      '<div class="stat"><div class="row">Dumping revenue<span class="ic">' + icon('truck') + '</span></div><b>' + money(dumpRev) + '</b><small>' + dumpN + (dumpN === 1 ? ' job' : ' jobs') + '</small></div>' +
      '<div class="stat alert"><div class="row">Outstanding<span class="ic">' + icon('alert') + '</span></div><b>' + money(out) + '</b><small>' + late + (late === 1 ? ' client' : ' clients') + ' past due</small></div></section>' +
      '<div class="card"><header><h2>Top clients this month</h2></header>' + h + '</div>';
  }
  function vCollections() {
    var L = acctList(), B = [['Not due', 'info', []], ['Overdue', 'warn', []], ['Final notice', 'bad', []], ['Lien stage', 'bad', []]], k, h = '', rows, m;
    for (k = 0; k < L.length; k++) { B[remStage(L[k].days)][2].push([L[k].n, L[k].amt, L[k].days > 0 ? L[k].days + ' days' : 'Due ' + (L[k].due ? longD(L[k].due) : 'soon')]); }
    for (k = 0; k < B.length; k++) {
      rows = ''; for (m = 0; m < B[k][2].length; m++) rows += colRow(B[k][2][m]);
      if (!rows) rows = '<p class="note" style="padding:14px">Nobody here.</p>';
      h += '<div class="card"><header><h2>' + B[k][0] + '</h2>' + pillH(B[k][2].length + (B[k][2].length === 1 ? ' client' : ' clients'), B[k][1]) + '</header>' + rows + '</div>';
    }
    return '<div class="vhead"><p>Unpaid accounts sorted by how late they are.</p></div>' + payCard() + remCard() + h;
  }
  function buildConfs() {
    CONFS.length = 0; var k, j, r, row, at, mk = function (c, ph, eq, rid, amt, due, ok, at2) {
      return { c: c, ph: String(ph || '').replace(/[^0-9]/g, ''), eq: eq, rid: rid, amt: amt, due: due ? longD(due) : '', ok: ok, d: at2 ? at2.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '', t: at2 ? at2.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '' };
    }, w = [], c2 = [], i;
    function dbRow(list, id) { for (var q = 0; q < list.length; q++) { if (list[q].id === id) return list[q]; } return null; }
    for (k = 0; k < JOBS.length; k++) {
      j = JOBS[k]; if (j.status === 'Cancelled' || (!j.conf && j.pay === 'Paid')) continue;
      row = dbRow(DBROWS.dump, j._id); at = row && row.portal_confirmed_at ? new Date(row.portal_confirmed_at) : null;
      (j.conf ? c2 : w).push(mk(j.client, j.phone, (j.jt || 'DROP') + ' - ' + j.mat + (j.size ? ' (' + j.size + ')' : ''), '', j.total, j.dueIso || ISO[j.id], !!j.conf, at));
    }
    for (k = 0; k < RENTALS.length; k++) {
      r = RENTALS[k]; if (r.status === 'Cancelled' || r.status === 'Returned' || (!r.conf && r.pay === 'Paid')) continue;
      row = dbRow(DBROWS.rent, r.id); at = row && row.portal_confirmed_at ? new Date(row.portal_confirmed_at) : null;
      (r.conf ? c2 : w).push(mk(r.client, r.phone, r.asset, r.id, rTotal(r), r.di, !!r.conf, at));
    }
    for (i = 0; i < w.length; i++) CONFS.push(w[i]);
    for (i = 0; i < c2.length; i++) CONFS.push(c2[i]);
  }
  function vConfirms() {
    var r = '', k, c;
    for (k = 0; k < CONFS.length; k++) {
      c = CONFS[k];
      r += '<tr data-act="portal" data-c="' + invEsc(c.c) + '"' + (c.rid ? ' data-r="' + c.rid + '"' : '') + '><td><b>' + invEsc(c.c) + '</b><span class="sub">' + c.ph + '</span></td><td style="white-space:normal;min-width:140px">' + invEsc(c.eq) + '</td><td class="mono">' + money(c.amt) + '</td><td style="white-space:normal">' + c.due + '</td>' +
        '<td>' + (c.ok ? '<span class="pill good ic">' + icon('check') + 'Confirmed</span>' : '<span class="pill warn ic">' + icon('clock') + 'Waiting</span>') + '</td>' +
        '<td>' + (c.ok ? '<span class="okat">' + c.d + '</span><span class="sub">' + c.t + '</span>' : '<span class="sub">-</span>') + '</td></tr>';
    }
    if (!r) r = '<tr><td colspan="6" class="sub" style="padding:18px">Nothing waiting. When a client confirms from their link, it shows here.</td></tr>';
    return '<div class="vhead"><p>Only the client can confirm, from their own link. Tap a row to see that client portal.</p></div>' +
      '<div class="card dkt"><div class="tablewrap"><table style="min-width:640px"><thead><tr><th>CLIENT</th><th>EQUIPMENT</th><th>AMOUNT</th><th>DUE DATE</th><th>STATUS</th><th>CONFIRMED AT</th></tr></thead><tbody>' + r + '</tbody></table></div></div>';
  }
  /* custom invoices and clients */
  function applyExtras() {
    var k, x, i, have;
    for (k = 0; k < XINVS.length; k++) {
      x = XINVS[k]; ISO[x.no] = x.date;
      INVS.push({ no: x.no, client: x.client, date: longD(x.date), amt: x.amt, st: x.paid ? 'Paid' : 'Unpaid', tone: x.paid ? 'good' : 'warn', items: x.items, addr: x.addr, ph: x.ph });
    }
    for (k = 0; k < XCLIS.length; k++) {
      x = XCLIS[k]; have = false;
      for (i = 0; i < CLIENTS.length; i++) { if (CLIENTS[i].n === x.name) { have = true; if (!CLIENTS[i].ph) CLIENTS[i].ph = x.ph; } }
      if (!have) CLIENTS.push({ n: x.name, ph: x.ph, jobs: 0, bal: 0 });
    }
    if (!invSel || !INVS.length) invSel = INVS.length ? INVS[0].no : 0;
  }
  function makeXInv(o) {
    XN++; var rec = { id: 'X' + XN, no: 900 + XN, client: o.client, ph: o.ph, em: o.em, addr: o.addr, date: o.date, items: o.items, amt: o.amt, paid: o.paid };
    XINVS.push(rec);
    ISO[rec.no] = rec.date;
    INVS.push({ no: rec.no, client: rec.client, date: longD(rec.date), amt: rec.amt, st: rec.paid ? 'Paid' : 'Unpaid', tone: rec.paid ? 'good' : 'warn', items: rec.items, addr: rec.addr, ph: rec.ph });
    var have = false, i; for (i = 0; i < CLIENTS.length; i++) { if (CLIENTS[i].n === rec.client) have = true; }
    if (!have) { XC++; XCLIS.push({ id: 'C' + XC, name: rec.client, ph: rec.ph, em: rec.em, addr: rec.addr }); CLIENTS.push({ n: rec.client, ph: rec.ph, jobs: 0, bal: 0 }); }
    invSel = rec.no;
  }
  function makeXCli(o) { XC++; XCLIS.push({ id: 'C' + XC, name: o.name, ph: o.ph, em: o.em, addr: o.addr }); CLIENTS.push({ n: o.name, ph: o.ph, jobs: 0, bal: 0 }); }
  function vClients() {
    var h = '', k, c;
    for (k = 0; k < CLIENTS.length; k++) {
      c = CLIENTS[k];
      h += '<div class="person" data-act="client" data-n="' + invEsc(c.n) + '" tabindex="0" style="cursor:pointer"><div class="top2"><span class="avatar">' + initials(c.n) + '</span><div><b>' + invEsc(c.n) + ' ' + (c.jobs ? gradePill(c.n) : '') + '</b><span class="sub">' + invEsc(c.ph) + '</span></div></div>' +
        '<div class="vhead"><span class="sub">' + c.jobs + ' jobs</span>' + (c.bal > 0 ? pillH(money(c.bal) + ' due', 'warn') : pillH('Paid up', 'good')) + '</div>' +
        (c.jobs ? '<div class="actions"><button class="btn sm" data-act="portal" data-c="' + invEsc(c.n) + '">' + icon('link') + 'Open portal</button></div>' : '') + '</div>';
    }
    if (!h) h = '<p class="note">No clients yet. They appear when you add a job, or tap Add client.</p>';
    return '<div class="vhead"><p>Everyone you rent to or dump for.</p><button class="btn primary" data-act="form" data-f="newclient">' + icon('plus') + 'Add client</button></div><div class="cards">' + h + '</div>';
  }
  function vSettings() {
    function row(a, b) { return '<div class="formrow"><span>' + a + '</span><b>' + b + '</b></div>'; }
    var pr = '', k, seen = {};
    for (k = 0; k < PRICES.length; k++) { var key = PRICES[k][1]; if (!seen[key] || PRICES[k][2] < seen[key]) seen[key] = PRICES[k][2]; }
    for (k in seen) { if (seen.hasOwnProperty(k)) pr += row('Dump container ' + k, money(seen[k]) + ' and up'); }
    return '<div class="card"><header><h2>Company</h2></header>' + row('Name', 'Sams Construction Services LTD') + row('Address', '188-16 Woodhull Ave, Hollis NY 11423') + row('Phone', '+1 (917) 663-6369') + row('BIC', 'BIC#4376') + '</div>' +
      '<div class="card"><header><h2>Equipment and prices</h2><button class="btn sm" data-act="form" data-f="equip">' + icon('gear') + 'Edit</button></header>' + eqRows() + pr + '</div>' +
      '<div class="card"><header><h2>People</h2></header>' + row('Keilah', 'Owner') + row('Office', 'Secretary') + row('Sams, Gustavo, Jose Luis', 'Drivers') + '</div>' +
      '<div class="card"><header><h2>Your account</h2></header><div style="padding:14px"><button class="btn" id="chgPw">' + icon('gear') + 'Change my password</button></div></div>';
  }
  /* Excel, send invoice */
  var CURINV = null;
  function openInv(d) {
    CURINV = d;
    document.getElementById('invTitle').textContent = 'Invoice #' + d.invNo + ' - ' + d.billTo;
    document.getElementById('invWrap').innerHTML = invSheet(d);
    document.getElementById('invModal').hidden = false;
    fitInv();
    document.getElementById('invClose').focus();
  }
  function downloadXls(d) {
    if (!d) return;
    var rows = [[INV_CO.name], [INV_CO.addr1], [INV_CO.addr2], [INV_CO.phone], [INV_CO.bic], [], ['Invoice No.', d.invNo], ['Invoice Date', invLong(d.invDate)], [], ['Bill to', d.billTo], ['Address', d.addr1], ['', d.addr2], ['Phone', d.phone], [], ['Description', 'Date', 'Amount']], k, sub = 0;
    for (k = 0; k < (d.items || []).length; k++) { var it = d.items[k]; rows.push([it.desc, it.date ? invLong(it.date) : '', parseFloat(it.amount) || 0]); sub += parseFloat(it.amount) || 0; }
    rows.push([]); rows.push(['TOTAL', '', sub]); if (d.paid) rows.push(['PAID', '', '']);
    if (!window.XLSX) { var csv = '', q2, c2; for (q2 = 0; q2 < rows.length; q2++) { var line = []; for (c2 = 0; c2 < rows[q2].length; c2++) line.push('"' + String(rows[q2][c2]).replace(/"/g, '""') + '"'); csv += line.join(',') + '\r\n'; } var bl = new Blob([csv], { type: 'text/csv' }), an = document.createElement('a'); an.href = URL.createObjectURL(bl); an.download = 'Invoice-' + d.invNo + '.csv'; document.body.appendChild(an); an.click(); setTimeout(function () { document.body.removeChild(an); }, 500); toast('Downloaded (opens in Excel)'); return; }
    var ws = XLSX.utils.aoa_to_sheet(rows); ws['!cols'] = [{ wch: 44 }, { wch: 20 }, { wch: 14 }];
    var wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Invoice');
    XLSX.writeFile(wb, 'Invoice-' + d.invNo + '.xlsx'); toast('Excel invoice downloaded');
  }
  function curInvData() { var k; for (k = 0; k < INVS.length; k++) { if (INVS[k].no === invSel) return dataFromInv(INVS[k]); } return null; }
  function sendInvoice(d) {
    if (!d) return; closeInv();
    var no = parseInt(d.invNo, 10), link = BASEURL, email = '', ph = d.phone, k, j, r;
    for (k = 0; k < JOBS.length; k++) { if (JOBS[k].id - 710 === no) { j = JOBS[k]; link = BASEURL + '#/dump/' + (j.token || ''); email = j.email; } }
    for (k = 0; k < RENTALS.length; k++) { if (RENTALS[k].inv === no) { r = RENTALS[k]; link = BASEURL + '#/portal/' + (r.token || ''); email = r.email; } }
    for (k = 0; k < XINVS.length; k++) { if (XINVS[k].no === no) email = XINVS[k].em; }
    openForm('send', null, { name: d.billTo, ph: ph, email: email, what: 'invoice #' + d.invNo, es: 'factura #' + d.invNo, link: link });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act="xlsinv"],[data-act="sendinv"],[data-act="xinvpaid"],#invXls,#invSend,#chgPw,#signBtn');
    if (!b) return;
    var a = b.getAttribute('data-act') || b.id;
    if (a === 'xlsinv') downloadXls(curInvData());
    else if (a === 'invXls') downloadXls(CURINV);
    else if (a === 'sendinv') sendInvoice(curInvData());
    else if (a === 'invSend') sendInvoice(CURINV);
    else if (a === 'xinvpaid') {
      var k, x; for (k = 0; k < XINVS.length; k++) { if (XINVS[k].no === invSel) x = XINVS[k]; }
      if (x) { x.paid = !x.paid; for (k = 0; k < INVS.length; k++) { if (INVS[k].no === x.no) { INVS[k].st = x.paid ? 'Paid' : 'Unpaid'; INVS[k].tone = x.paid ? 'good' : 'warn'; } } setView('invoice'); toast(x.paid ? 'Marked paid' : 'Marked unpaid'); }
    } else if (a === 'signBtn') { SB.auth.signOut().then(function () { location.reload(); }); }
    else if (a === 'chgPw') { changePw(); }
  }, false);
  function changePw() {
    var f = document.getElementById('theForm'); FKIND = 'chgpw';
    f.innerHTML = '<div><b>Change my password</b></div><div class="fgrid">' + fld('fPw1', 'New password (at least 8 characters)', 'password', '', '', true) + fld('fPw2', 'Type it again', 'password', '', '', true) + '</div><p class="ferr" id="fErr"></p><div class="actions"><button type="submit" class="btn primary">' + icon('check') + 'Save password</button><button type="button" class="btn" data-fa="close">Cancel</button></div>';
    document.getElementById('formModal').hidden = false;
  }
  /* driver collects money for real */
  function payNow(key, m) {
    var its = drvItems(DAPP.name, false), d = null, k; for (k = 0; k < its.length; k++) { if (its[k].key === key) d = its[k]; }
    if (!d || !m) return;
    var pend = m === 'ACH', tbl2 = d.jid ? 'dump_jobs' : 'rentals', pid = '', mm = { Efectivo: 'cash', Cheque: 'check', Zelle: 'zelle', ACH: 'ach' };
    if (d.jid) { for (k = 0; k < JOBS.length; k++) { if (JOBS[k].id === d.jid) pid = JOBS[k]._id; } } else { pid = String(key).slice(1); }
    PAYLOG.unshift({ tk: key, ref: d.jid ? '#' + d.jid : 'Rental', client: d.client, amt: d.amt, method: m, driver: DAPP.name, who: DAPP.name, t: 'Today, ' + nowT(), turned: m !== 'Efectivo', pend: pend });
    if (!pend) {
      markPaidByKey(key);
      if (ME && ME.role === 'driver' && pid) { SB.rpc('driver_collect', { p_table: tbl2, p_id: String(pid), p_method: mm[m] || String(m).toLowerCase() }).then(function (r) { if (r.error) toast('No se pudo guardar el pago: ' + r.error.message); }); }
    }
    DAPP.pay = null; drawDrv(); refreshAll();
    toast(pend ? 'Anotado. La oficina marca pagado cuando el banco lo reciba.' : 'Pago guardado. La oficina lo ve ahora.');
  }
  function dmSend(name, text) { DMN++; if (!DMSG[name]) DMSG[name] = []; DMSG[name].unshift({ id: 'M' + Date.now().toString(36) + DMN, text: text, t: 'Ahora', read: false, who: name, ts: Date.now() }); }
  /* on-the-way texts: the office taps Text to send */
  function otwMsg(x, es) {
    var eta = 10 + (hashS(x.addr) % 18);
    return es ? 'Hola ' + x.name + ', le habla Sams Construction. ' + x.driver + ' va en camino a ' + x.addr + '. Llega en aprox. ' + eta + ' minutos.'
      : 'Hi ' + x.name + ', this is Sams Construction. ' + x.driver + ' is on the way to ' + x.addr + '. Arriving in about ' + eta + ' minutes.';
  }
  function otwCard() {
    var rows = '', k, x;
    for (k = 0; k < TXTLOG.length; k++) { x = TXTLOG[k]; rows += '<div class="li"><span class="ic2">' + icon('phone') + '</span><div class="grow"><b>' + invEsc(x.name) + '</b><span class="sub">' + x.t + ' &middot; from ' + invEsc(x.driver) + '</span><span class="sub" style="white-space:normal">' + invEsc(otwMsg(x, true)) + '</span></div><a class="btn sm" href="sms:' + String(x.ph || '').replace(/[^0-9]/g, '') + '&body=' + encodeURIComponent(otwMsg(x, true)) + '">' + icon('phone') + 'Text client</a></div>'; }
    if (!rows) rows = '<p class="note" style="padding:14px">Nothing yet. A line shows here when a driver taps On the way.</p>';
    return '<div class="card"><header><h2>On-the-way texts</h2>' + pillH(TXTLOG.length + (TXTLOG.length === 1 ? ' driver' : ' drivers') + ' on the way', 'info') + '</header>' + rows + '<p class="note" style="padding:0 14px 14px">When a driver taps On the way, it shows here. Tap Text client to send the message from your phone. Automatic texting is not turned on.</p></div>';
  }
  /* where the drivers are (from their phones) */
  function liveInner() {
    var rows = '', k, n, l, mins, any = false;
    for (k = 0; k < LNAMES.length; k++) {
      n = LNAMES[k]; l = LOCS[n];
      if (l) { any = true; mins = Math.max(0, Math.round((Date.now() - new Date(l.at).getTime()) / 60000)); }
      rows += '<div class="lvrow"><span class="lvdot" style="background:' + DCOL[n] + '"></span><div class="grow"><b>' + invEsc(n) + '</b><span class="sub">' + (l ? (mins < 1 ? 'Just now' : mins + ' min ago') : 'Not sharing yet') + '</span></div>' + (l ? '<a class="btn sm" target="_blank" rel="noopener" href="https://maps.apple.com/?ll=' + l.lat + ',' + l.lng + '&q=' + encodeURIComponent(n) + '">' + icon('map') + 'Open map</a>' : '') + '</div>';
    }
    return '<header><h2>Where the drivers are</h2>' + pillH(any ? 'From their phones' : 'Waiting', any ? 'good' : 'warn') + '</header>' + rows + '<p class="note" style="padding:10px 14px">Each driver shares their place while the driver app is open on their phone.</p>';
  }
  setInterval(function () {
    if (!ME || isDrv() || curView !== 'dispatch') return;
    var ae = document.activeElement; if (ae && /INPUT|TEXTAREA|SELECT/.test(ae.tagName)) return;
    loadRecs().then(function () { setView('dispatch'); });
  }, 60000);
