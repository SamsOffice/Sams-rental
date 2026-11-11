# --- equipment with day / week / 2-week prices ---
rep("  var PRESET_M = [];\n", """  function eqRates(e) {
    var r = { d: Number(e.d) || 0, w: Number(e.w) || 0, w2: Number(e.w2) || 0 };
    if (!r.d && !r.w && !r.w2 && e.p) { if (e.u === 'day') r.d = Number(e.p); else if (e.u === 'week') r.w = Number(e.p); else if (e.u === '2 weeks') r.w2 = Number(e.p); else r.flat = Number(e.p); }
    return r;
  }
  function eqTxt(e) {
    var r = eqRates(e), a = [];
    if (r.flat) return '$' + invMoney(r.flat).replace('.00', '') + ' usual price';
    if (r.d) a.push('$' + invMoney(r.d).replace('.00', '') + ' per day');
    if (r.w) a.push('$' + invMoney(r.w).replace('.00', '') + ' per week');
    if (r.w2) a.push('$' + invMoney(r.w2).replace('.00', '') + ' per 2 weeks');
    return a.length ? a.join('  \\u00b7  ') : 'No price yet';
  }
  function eqCalc(e, days) {
    var r = eqRates(e); days = Math.max(1, days || 1);
    if (r.flat) return r.flat;
    var tiers = [[r.d, 1], [r.w, 7], [r.w2, 14]], want = days < 7 ? 0 : (days < 14 ? 1 : 2), i, t = null;
    if (tiers[want][0]) t = tiers[want];
    else { for (i = 0; i < 3; i++) { if (tiers[i][0]) { t = tiers[i]; break; } } }
    if (!t) return '';
    return Math.round(t[0] * days / t[1]);
  }
  var PRESET_M = [];
""")
rep("<div class=\"sub\">$' + invMoney(EQUIP[q].p) + (EQUIP[q].u ? ' per ' + invEsc(EQUIP[q].u) : ' usual price') + '</div></div><button type=\"button\" class=\"btn sm\" data-fa=\"eqed\" data-ix=\"' + q + '\">Change price</button>",
    "<div class=\"sub\">' + eqTxt(EQUIP[q]) + '</div></div><button type=\"button\" class=\"btn sm\" data-fa=\"eqed\" data-ix=\"' + q + '\">Change prices</button>")
rep("fld('fEqP', 'Usual price ($)', 'number', '') + '<input type=\"hidden\" id=\"fEqU\" value=\"\">' + '</div>",
    "fld('fEqD', 'Price per day ($)', 'number', '') + fld('fEqW', 'Price per week ($)', 'number', '') + fld('fEqW2', 'Price per 2 weeks ($)', 'number', '') + '</div><p class=\"sub\">Fill in only the prices you charge. Leave the others empty.</p>")
rep("fe2.value = EQUIP[ei].n; document.getElementById('fEqP').value = EQUIP[ei].p; document.getElementById('fEqU').value = EQUIP[ei].u; document.getElementById('fEqP').focus(); }",
    "var er = eqRates(EQUIP[ei]); fe2.value = EQUIP[ei].n; document.getElementById('fEqD').value = er.d || ''; document.getElementById('fEqW').value = er.w || ''; document.getElementById('fEqW2').value = er.w2 || ''; document.getElementById('fEqD').focus(); }")
rep("if (ex0 >= 0) { EQUIP[ex0].p = fn('fEqP'); EQUIP[ex0].u = fv('fEqU'); openForm('equip'); toast(nm + ' updated'); return; }\n      EQUIP.push({ n: nm, p: fn('fEqP'), u: fv('fEqU') }); openForm('equip'); toast(nm + ' added to your equipment'); return;",
    "var qd = fn('fEqD'), qw = fn('fEqW'), qw2 = fn('fEqW2');\n      if (!qd && !qw && !qw2) { err.textContent = 'Type at least one price: day, week or 2 weeks.'; return; }\n      var qp = qw2 || qw || qd, qu = qw2 ? '2 weeks' : (qw ? 'week' : 'day');\n      if (ex0 >= 0) { EQUIP[ex0].d = qd; EQUIP[ex0].w = qw; EQUIP[ex0].w2 = qw2; EQUIP[ex0].p = qp; EQUIP[ex0].u = qu; openForm('equip'); toast(nm + ' updated'); return; }\n      EQUIP.push({ n: nm, d: qd, w: qw, w2: qw2, p: qp, u: qu }); openForm('equip'); toast(nm + ' added to your equipment'); return;")
rep("var R0 = id ? rentalById(id) : null; ERID = R0 ? R0.id : '';", "var R0 = id ? rentalById(id) : null; ERID = R0 ? R0.id : ''; window.__eqpick = 0; window.__pe = 0;")
rep("document.getElementById('theForm').addEventListener('input', function () {\n    if (FKIND === 'mailfb')",
    "document.getElementById('theForm').addEventListener('input', function (ev) {\n    if (ev && ev.target && ev.target.id === 'fPrice') window.__pe = 1;\n    if (FKIND === 'rental' && ev && ev.target && ev.target.id === 'fDays' && window.__eqpick && !window.__pe) { var ae = document.getElementById('fAsset'), pz = document.getElementById('fPrice'); if (ae && pz) { for (var kz = 0; kz < EQUIP.length; kz++) { if (EQUIP[kz].n === ae.value) pz.value = eqCalc(EQUIP[kz], parseInt(fv('fDays'), 10) || 1); } } }\n    if (FKIND === 'mailfb')")
rep("if (e.target.id === 'fAsset') { var pr = ''; for (var k = 0; k < EQUIP.length; k++) { if (EQUIP[k].n === e.target.value) pr = EQUIP[k].p; }",
    "if (e.target.id === 'fAsset') { var pr = ''; window.__eqpick = 1; window.__pe = 0; for (var k = 0; k < EQUIP.length; k++) { if (EQUIP[k].n === e.target.value) pr = eqCalc(EQUIP[k], parseInt(fv('fDays'), 10) || 1); }")
# --- Equipment box in New Rental: type any name, or pick a saved one ---
rep("<select id=\"fAsset\">' + opts + '</select></div>",
    "<input id=\"fAsset\" type=\"text\" list=\"fAssetL\" autocomplete=\"off\" placeholder=\"Type the machine name\" value=\"' + invEsc(d0.asset) + '\"><datalist id=\"fAssetL\">' + eqDl + '</datalist></div>")
rep("      var dl = '<datalist id=\"fClients\">';",
    "      var eqDl = ''; for (kq = 0; kq < EQUIP.length; kq++) eqDl += '<option value=\"' + invEsc(EQUIP[kq].n) + '\"></option>';\n      var dl = '<datalist id=\"fClients\">';")
rep("(EQUIP.length || R0 ? '' : '<p class=\"note\" style=\"grid-column:1/-1\">You have not added any equipment yet. Close this, tap Equipment, add your machines, then come back.</p>') + ", "")
rep("if (!fv('fAsset')) { err.textContent = 'Choose the equipment.'; return; }", "if (!fv('fAsset').trim()) { err.textContent = 'Type the equipment name.'; return; }")
rep("var pr = ''; window.__eqpick = 1; window.__pe = 0;", "var pr = null; window.__eqpick = 1; window.__pe = 0;")
rep("var pr = null; window.__eqpick = 1; window.__pe = 0; for (var k = 0; k < EQUIP.length; k++) { if (EQUIP[k].n === e.target.value) pr = eqCalc(EQUIP[k], parseInt(fv('fDays'), 10) || 1); } document.getElementById('fPrice').value = pr;",
    "var pr = null; window.__eqpick = 1; window.__pe = 0; for (var k = 0; k < EQUIP.length; k++) { if (EQUIP[k].n === e.target.value.trim()) pr = eqCalc(EQUIP[k], parseInt(fv('fDays'), 10) || 1); } if (pr !== null) document.getElementById('fPrice').value = pr;")
# --- New invoice: up to 6 lines, each with its own date (for several days on one invoice) ---
rep("""'<div class="fgrid">' + fld('fXD1', 'What is it for (line 1)', 'text', '', 'Example: Dump fee', true) + fld('fXA1', 'Amount ($)', 'number', '') + fld('fXD2', 'Line 2 (optional)', 'text', '', '', false) + fld('fXA2', 'Amount ($)', 'number', '') + fld('fXD3', 'Line 3 (optional)', 'text', '', '', false) + fld('fXA3', 'Amount ($)', 'number', '') + '</div>' +""",
    """(function () { var o = '', n; for (n = 1; n <= 6; n++) o += '<div class="fgrid" id="fXL' + n + '"' + (n > 1 ? ' style="display:none"' : '') + '>' + fld('fXD' + n, n === 1 ? 'What is it for' : 'Line ' + n + ': what is it for', 'text', '', n === 1 ? 'Example: Dump - Dirt (20 yd)' : '', n === 1) + fld('fXT' + n, 'Day', 'date', '') + fld('fXA' + n, 'Amount ($)', 'number', '') + (n > 1 ? '<div style="grid-column:1/-1"><button type="button" class="btn sm" data-fa="xlrm" data-n="' + n + '">Remove this line</button></div>' : '') + '</div>'; return o + '<div style="margin:2px 0 10px"><button type="button" class="btn" id="fXAdd" data-fa="xladd">+ Add another day</button></div>'; })() +""")
rep("else if (a === 'sugg') {", """else if (a === 'xladd') { var xn2, xl2, xs2 = 0; for (xn2 = 2; xn2 <= 6; xn2++) { xl2 = document.getElementById('fXL' + xn2); if (xl2 && xl2.style.display === 'none') { xl2.style.display = ''; var xf2 = document.getElementById('fXD' + xn2); if (xf2) xf2.focus(); break; } } for (xn2 = 2; xn2 <= 6; xn2++) { xl2 = document.getElementById('fXL' + xn2); if (xl2 && xl2.style.display === 'none') xs2 = 1; } if (!xs2) b.style.display = 'none'; }
    else if (a === 'xlrm') { var xr = b.getAttribute('data-n'), xe, xm; for (xe = 0; xe < 3; xe++) { xm = document.getElementById(['fXD', 'fXT', 'fXA'][xe] + xr); if (xm) xm.value = ''; } xm = document.getElementById('fXL' + xr); if (xm) xm.style.display = 'none'; xm = document.getElementById('fXAdd'); if (xm) xm.style.display = ''; }
    else if (a === 'sugg') {""")
rep("for (xi = 1; xi <= 3; xi++) { xd = fv('fXD' + xi).trim(); xa = fn('fXA' + xi); if (xd || xa) { xit.push([xd || 'Service', xa]); xs += xa; } }",
    "for (xi = 1; xi <= 6; xi++) { xd = fv('fXD' + xi).trim(); xa = fn('fXA' + xi); if (xd || xa) { xit.push([xd || 'Service', xa, fv('fXT' + xi) || '']); xs += xa; } }")
rep("amount: v.items[k][1] });", "amount: v.items[k][1] });\n    for (var k2 = 0; k2 < items.length; k2++) { if (v.items[k2][2]) items[k2].date = v.items[k2][2]; }")
# --- hand-made invoices: count in the Dashboard Unpaid box and in each client's balance; plain send message ---
rep("    for (k = 0; k < DBROWS.inv.length; k++) { if (DBROWS.inv[k].kind === 'container') cont += DBROWS.inv[k].total_qty || 0; }\n    document.getElementById('sAD')",
    "    for (k = 0; k < XINVS.length; k++) { if (!XINVS[k].paid) un += parseFloat(XINVS[k].amt) || 0; }\n    for (k = 0; k < DBROWS.inv.length; k++) { if (DBROWS.inv[k].kind === 'container') cont += DBROWS.inv[k].total_qty || 0; }\n    document.getElementById('sAD')")
rep("  function makeXInv(o) {", """  function xBal() {
    var i, k, c;
    for (i = 0; i < CLIENTS.length; i++) { c = CLIENTS[i]; c.bal = (c.bal || 0) - (c.xb || 0); c.xb = 0; }
    for (k = 0; k < XINVS.length; k++) {
      if (XINVS[k].paid) continue;
      for (i = 0; i < CLIENTS.length; i++) { if (CLIENTS[i].n === XINVS[k].client) { CLIENTS[i].bal = (CLIENTS[i].bal || 0) + (parseFloat(XINVS[k].amt) || 0); CLIENTS[i].xb = (CLIENTS[i].xb || 0) + (parseFloat(XINVS[k].amt) || 0); } }
    }
    try { updateStats(); } catch (e) { }
  }
  function makeXInv(o) {""")
rep("    if (!invSel || !INVS.length) invSel = INVS.length ? INVS[0].no : 0;\n  }\n  function xBal()", "    if (!invSel || !INVS.length) invSel = INVS.length ? INVS[0].no : 0;\n    xBal();\n  }\n  function xBal()")
rep("    invSel = rec.no;\n  }", "    invSel = rec.no; xBal();\n  }")
rep("x.paid = !x.paid;", "x.paid = !x.paid; xBal();")
rep("openForm('send', null, { name: d.billTo, ph: ph, email: email, what: 'invoice #' + d.invNo, es: 'factura #' + d.invNo, link: link });",
    "var xin = false, xt = 0; for (k = 0; k < XINVS.length; k++) { if (XINVS[k].no === no) xin = true; } for (k = 0; k < (d.items || []).length; k++) xt += parseFloat(d.items[k].amount) || 0;\n    openForm('send', null, { name: d.billTo, ph: ph, email: email, what: 'invoice #' + d.invNo, es: 'factura #' + d.invNo, link: link, noLink: xin, tot: xt });")
rep("    if (rebuild) ta.value = es ? ('Hola '", """    if (rebuild && SEND.noLink) ta.value = es ? ('Hola ' + SEND.name + ', le enviamos su ' + SEND.es + ' de Sams Construction Services LTD por ' + money(SEND.tot) + '. Preguntas? Llame al +1 (917) 663-6369.') : ('Hi ' + SEND.name + ', here is your ' + SEND.what + ' from Sams Construction Services LTD for ' + money(SEND.tot) + '. Questions? Call +1 (917) 663-6369.');
    else if (rebuild) ta.value = es ? ('Hola '""")
