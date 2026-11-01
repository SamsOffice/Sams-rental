import re
exec(open('mk.py').read().split("open('app.html'")[0])
def rep(a,b,cnt=1):
    global s
    assert s.count(a)==cnt,(s.count(a),a[:70]); s=s.replace(a,b)
# supabase lib
s='<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>\n'+s+'\n</body></html>'
# guard
rep("function invPaper(v) {","function invPaper(v) {\n    if (!v) return '<div class=\"sub\" style=\"padding:20px\">No invoices yet.</div>';",1) if "function invPaper(v) {" in s else None
# gate
gate = '''<div id="gate" style="position:fixed;inset:0;z-index:9999;background:#fff;overflow:auto;font-family:inherit;color:#111827">
  <div style="display:flex;align-items:center;justify-content:center;gap:12px;padding:14px 18px;border-bottom:1px solid #E5E7EB;min-height:60px"><img src="logo.png" alt="" style="width:36px;height:36px;border-radius:50%"><span style="font-size:20px;font-weight:700">Sams Office</span></div>
  <form id="gF" style="max-width:520px;margin:0 auto;padding:clamp(28px,5vw,44px) 22px 40px">
    <div style="font-size:clamp(24px,3vw,30px);font-weight:700;line-height:1.15;margin-bottom:10px">Welcome to Sams Office</div>
    <div style="font-size:16px;color:#4B5563;margin-bottom:26px">Enter your username and password to log in.</div>
    <label for="gU" style="display:block;font-size:15px;font-weight:600;margin-bottom:8px">Username</label>
    <div style="display:flex;align-items:center;height:56px;border:1.5px solid #9CA3AF;border-radius:8px;padding:0 16px"><input id="gU" type="text" autocapitalize="none" autocorrect="off" spellcheck="false" autocomplete="username" style="flex:1;min-width:0;border:none;outline:none;font-size:17px;background:transparent;height:100%;color:#111827"><span id="gUok" hidden style="color:#16A34A;font-size:22px;font-weight:700">&#10003;</span></div>
    <label for="gP" style="display:block;font-size:15px;font-weight:600;margin:20px 0 8px">Password</label>
    <div style="display:flex;align-items:center;height:56px;border:1.5px solid #9CA3AF;border-radius:8px;padding:0 16px"><input id="gP" type="password" autocomplete="current-password" style="flex:1;min-width:0;border:none;outline:none;font-size:17px;background:transparent;height:100%;color:#111827"><span id="gPok" hidden style="color:#16A34A;font-size:22px;font-weight:700;margin-right:8px">&#10003;</span><button type="button" id="gEye" aria-label="Show or hide password" style="background:none;border:none;cursor:pointer;font-size:14px;font-weight:600;color:#374151;padding:8px">Show</button></div>
    <div id="gE" hidden style="margin-top:16px;background:#FEF2F2;border:1px solid #FCA5A5;border-radius:8px;padding:12px 14px;font-size:14px;color:#B91C1C"></div>
    <button id="gB" type="submit" disabled style="width:100%;height:56px;margin-top:26px;border:none;border-radius:8px;font-size:17px;font-weight:700;cursor:pointer;background:#2563EB;color:#fff">Continue</button>
    <div style="margin-top:26px;font-size:14px;color:#4B5563;line-height:1.55">This system is for Sams Construction Services LTD staff only. Your account stays signed in on this device until you tap Sign out. Forgot your password? Ask the owner to reset it.</div>
  </form>
</div>
'''
rep('<div class="app">','</head><body>\n'+gate+'<div class="app">')
rep('''<button class="nav" data-v="settings"><span data-i="gear"></span>Settings</button>''','''<button class="nav" data-v="settings"><span data-i="gear"></span>Settings</button>
      <button class="nav" id="signOut"><span data-i="gear"></span>Sign out</button>''')
# gate button style when disabled
rep('</style>','#gB:disabled{background:#F3F4F6!important;color:#B6BCC4!important;cursor:default!important}\n</style>',1) if s.count('</style>')==1 else None
rep("var TODAY = new Date(2026, 9, 11)","var TODAY = (function () { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); })()")
s=s.replace("'2026-10-11'","TODAYISO()").replace("'2026-10-12'","TOMOISO()")
s=s.replace("var DDAY = TOMOISO()","var DDAY = TODAYISO()")
s=s.replace('src="logo.png"','src="/Sams-rental/logo.png"')
# kill simulated trucks
rep('function liveInner() {','function liveInner() {\n    return \'<div class="card"><div class="sub" style="padding:20px">Live truck tracking is not connected yet. Dispatch shows the real stops below.</div></div>\';\n  }\n  function liveInnerDemo() {')
s=s.replace("f: { site: smp.site, ticket: smp.ticket, lb: smp.lb, fee: smp.fee }","f: { site: '', ticket: '', lb: 0, fee: 0 }")
inj=open('inject.js').read()+open('inject2.js').read()+open('inject3.js').read()+open('inject4.js').read()+open('inject5.js').read()+open('inject6.js').read()+open('inject7.js').read()+open('inject8.js').read()+open('inject9.js').read()
inj=inj.replace('    mapAll(); takeSnap();\n  }','    mapAll(); takeSnap(); await loadRecs();\n  }',1)
assert 'await loadRecs' in inj
inj=inj.replace('    SYNCING = false; SYNC_FAIL = !!err;\n    if (err) {','    try { var e2 = await syncRecs(); if (e2) err = e2; } catch (e) { err = String(e && e.message || e); }\n    SYNCING = false; SYNC_FAIL = !!err;\n    if (err) {',1)
assert 'await syncRecs()' in inj
rep("  initRentalInvoices(); paintIcons(); drawRows(); drawPane(); drawRentals(); paintIcons(document.getElementById('invModal'));\n</script>","  initRentalInvoices(); paintIcons(); drawRows(); drawPane(); drawRentals(); paintIcons(document.getElementById('invModal'));\n"+inj+"</script>")

s=s.replace("ES_MON = ['enero'","ES_MONA = ['enero'").replace('ES_MON[mi]','ES_MONA[mi]')
s=s.replace("</style>","body.drvmode .app{display:none!important}\n</style>",1)
s=s.replace("Driver app preview","Sams Office")
import re as _re
s=_re.sub(r"<button class=\"daundo\" data-d=\"wskip\" data-k=\"' \+ d.key \+ '\">Demo: sumar 15 min</button>","",s)
s=_re.sub(r"<button class=\"daundo\" data-d=\"rcsample\" data-k=\"' \+ d.key \+ '\">[^<]*</button>","",s)
s=s.replace("link: BASEURL + '#/dump/demo-' + sj.id","link: BASEURL + '#/dump/' + (sj.token || '')").replace("link: BASEURL + '#/portal/demo-' + r.id","link: BASEURL + '#/portal/' + (r.token || '')")
route="<script>(function(){var h=location.hash;if(/^#\\/(book|portal|dump|combined|driver)(\\/|$)/.test(h)){location.replace('/Sams-rental/legacy.html'+h);}})();</script>"
s=s.replace('<script src="https://cdn.jsdelivr',route+'\n<script src="https://cdn.jsdelivr',1)

def R(a,b,cnt=1):
    global s
    assert s.count(a)>=1 and (cnt is None or s.count(a)==cnt),(s.count(a),a[:80]); s=s.replace(a,b,1) if cnt is None else s.replace(a,b)
# Excel library
R('<script src="https://cdn.jsdelivr.net/npm/@supabase','<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>\n<script src="https://cdn.jsdelivr.net/npm/@supabase',1)
# buttons that did nothing
R('<button class="btn" data-act="toast" data-msg="Example only. Downloads the Excel invoice.">\' + icon(\'download\') + \'Download Excel</button><button class="btn" data-act="toast" data-msg="Example only. Nothing was sent.">\' + icon(\'mail\') + \'Send to client</button></div>\'','<button class="btn" data-act="xlsinv">\' + icon(\'download\') + \'Download Excel</button><button class="btn" data-act="sendinv">\' + icon(\'mail\') + \'Send to client</button>\' + (cur && cur.no >= 900 ? \'<button class="btn" data-act="xinvpaid">\' + icon(\'check\') + \'Mark paid or unpaid</button>\' : \'\') + \'</div>\'')
R("head('Tap an invoice to preview it, then open it full size.', 'New invoice', 'plus', 'Example only. This opens the invoice builder.')","head('Tap an invoice to preview it, then open it full size.', 'New invoice', 'plus', '').replace('data-act=\"toast\"', 'data-act=\"form\" data-f=\"newinv\"')")
R("document.getElementById('invXls').addEventListener('click', function () { toast('Example only. Downloads the Excel invoice.'); });\n","")
R("ACH: 'Le mandamos un enlace de pago al telefono del cliente. Se marca pagado cuando el banco lo confirme.'","ACH: 'Pide al cliente que haga una transferencia bancaria (ACH) a la oficina. Aqui solo se anota. Se marca pagado cuando la oficina confirme que el banco lo recibio.'")
R("'Enviar enlace de pago'","'Anotar pago por banco'")
R("Drivers can take cash, check, Zelle or a bank transfer link.","Drivers can take cash, check or Zelle, and note a bank transfer (ACH) that the office confirms.",None)
R("document.getElementById('invSend').addEventListener('click', function () { toast('Example only. Nothing was sent.'); });\n","")
R("data-act=\"toast\" data-msg=\"Example only. This opens the file.\"","data-act=\"toast\" data-msg=\"This receipt photo is saved on the Receipts screen.\"")
R('data-msg="Example only. You would be signed out."','data-msg=""')
# forms
newforms=r"""    } else if (kind === 'newinv') {
      t = 'New invoice';
      var ncl = ['Type a new client below'], nq; for (nq = 0; nq < CLIENTS.length; nq++) ncl.push(CLIENTS[nq].n);
      h = '<div class="fgrid">' + selF('fXCl', 'Existing client', ncl, ncl.length > 1 ? ncl[1] : ncl[0]) + fld('fXNew', 'Or type a new client name', 'text', '', '', false) + fld('fXPh', 'Phone', 'tel', '', '', false) + fld('fXEm', 'Email', 'email', '', '', false) + fld('fXAd', 'Address (street, city state zip)', 'text', '', '', false) + fld('fXDate', 'Invoice date', 'date', TODAYISO()) + '</div>' +
        '<div class="fgrid">' + fld('fXD1', 'What is it for (line 1)', 'text', '', 'Example: Dump fee', true) + fld('fXA1', 'Amount ($)', 'number', '') + fld('fXD2', 'Line 2 (optional)', 'text', '', '', false) + fld('fXA2', 'Amount ($)', 'number', '') + fld('fXD3', 'Line 3 (optional)', 'text', '', '', false) + fld('fXA3', 'Amount ($)', 'number', '') + '</div>' +
        selF('fXPaid', 'Payment', ['Unpaid', 'Paid'], 'Unpaid') + '<p class="ferr" id="fErr"></p><div class="actions"><button type="submit" class="btn primary">' + icon('check') + 'Create invoice</button><button type="button" class="btn" data-fa="close">Cancel</button></div>';
    } else if (kind === 'newclient') {
      t = 'Add client';
      h = '<div class="fgrid">' + fld('fCName', 'Client name', 'text', '', '', true) + fld('fCPh', 'Phone', 'tel', '', '', false) + fld('fCEm', 'Email', 'email', '', '', false) + fld('fCAd', 'Address', 'text', '', '', false) + '</div><p class="ferr" id="fErr"></p>' +
        '<div class="actions"><button type="submit" class="btn primary">' + icon('check') + 'Save client</button><button type="button" class="btn" data-fa="close">Cancel</button></div>';
    } else if (kind === 'send') {"""
R("    } else if (kind === 'send') {",newforms)
subs=r"""    if (FKIND === 'newinv') {
      var xcl = fv('fXCl'), xn = fv('fXNew').trim() || (xcl === 'Type a new client below' ? '' : xcl); if (!xn) { err.textContent = 'Pick the client or type a new name.'; return; }
      var xit = [], xi, xs = 0, xd, xa, xph = fv('fXPh').trim(), xq;
      for (xi = 1; xi <= 3; xi++) { xd = fv('fXD' + xi).trim(); xa = fn('fXA' + xi); if (xd || xa) { xit.push([xd || 'Service', xa]); xs += xa; } }
      if (!xit.length || !xs) { err.textContent = 'Type what it is for and the amount.'; return; }
      if (!xph) { for (xq = 0; xq < CLIENTS.length; xq++) { if (CLIENTS[xq].n === xn) xph = CLIENTS[xq].ph; } }
      makeXInv({ client: xn, ph: xph, em: fv('fXEm').trim(), addr: fv('fXAd').trim(), date: fv('fXDate') || TODAYISO(), items: xit, amt: xs, paid: fv('fXPaid') === 'Paid' });
      closeForm(); setView('invoice'); toast('Invoice created'); return;
    }
    if (FKIND === 'newclient') {
      var cn = fv('fCName').trim(); if (!cn) { err.textContent = 'Type the client name.'; return; }
      for (var cq = 0; cq < CLIENTS.length; cq++) { if (CLIENTS[cq].n === cn) { err.textContent = 'That client is already in the list.'; return; } }
      makeXCli({ name: cn, ph: fv('fCPh').trim(), em: fv('fCEm').trim(), addr: fv('fCAd').trim() }); closeForm(); setView('clients'); toast('Client added'); return;
    }
    if (FKIND === 'chgpw') {
      var p1 = fv('fPw1'), p2 = fv('fPw2'); if (p1.length < 8) { err.textContent = 'Use at least 8 characters.'; return; } if (p1 !== p2) { err.textContent = 'The two passwords do not match.'; return; }
      SB.auth.updateUser({ password: p1 }).then(function (r) { if (r.error) { err.textContent = r.error.message; } else { closeForm(); toast('Password changed'); } }); return;
    }
    if (FKIND === 'permit') {"""
R("    if (FKIND === 'permit') {",subs)
# dates not locked to Oct 2026
R("var CAL = { y: 2026, m: 9 };","var CAL = { y: new Date().getFullYear(), m: new Date().getMonth() };")
R("CAL.y = 2026; CAL.m = 9;","CAL.y = TODAY.getFullYear(); CAL.m = TODAY.getMonth();")
R("new Date(2026, mi, parseInt(m[2], 10))","new Date(TODAY.getFullYear(), mi, parseInt(m[2], 10))")
R("di: '2026-10-25',","di: addDays(TODAYISO(), 1),")
R("'2026-10-16', base0 = ","addDays(TODAYISO(), 3), base0 = ")
R("parseInt(dm[3], 10) : 2026,","parseInt(dm[3], 10) : TODAY.getFullYear(),")
R("x.d.indexOf('2026-10') === 0","x.d.indexOf(TODAYISO().slice(0, 7)) === 0")
R("'2026-' + pad2(mi + 1)","TODAY.getFullYear() + '-' + pad2(mi + 1)")
# honest wording
R("<p class=\"note\">No photo handy? Leave it empty and the demo reads a sample receipt. The receipt then shows up in Receipts, already read.","<p class=\"note\">Attach the photo. The receipt then shows up in Receipts and you type in the numbers from the ticket.")
R("Demo only: Mark as sent just logs it, nothing is really sent.","Tap Text or open your message app to send it, then tap Mark as sent to log it.",None)
R("Example only. This demo does not send anything. In the live app the link goes to the client portal.","Tap Text or Email to send it from your own phone. The link opens the client portal.",None)
R("toast('Logged as sent. Demo only, nothing was really sent.')","toast('Logged as sent.')",None)
R("Demo only: nothing is really charged.","The driver marks the money collected and the invoice shows paid.",None)
R("Demo only: nothing is sent yet. Real automatic sending needs Supabase Pro. You can still tap Remind on any client below.","Automatic sending is not turned on yet. Tap Remind on any client below and send it from your own phone.",None)
R("'Demo: online' : 'Demo: offline'","'Test: signal back' : 'Test: no signal'")
R("<button class=\"btn sm\" id=\"drvNet\">Demo: offline</button>","<button class=\"btn sm\" id=\"drvNet\">Test: no signal</button>")
# scans: type what the nameplate says
R("var SAMPLES = [{ make: 'Caterpillar', model: '305.5E2', serial: 'CAT3055E2-K6B08842', year: 2021 }, { make: 'John Deere', model: '35G', serial: '1FF035GXKJK277431', year: 2019 }, { make: 'JLG', model: '1930ES', serial: '0200231845', year: 2022 }];","var SAMPLES = [{ make: '', model: '', serial: '', year: '' }];")

R("Profit in October","Profit in ' + INV_MONTHS[TODAY.getMonth()] + '")
R("Dump costs in October","Dump costs in ' + INV_MONTHS[TODAY.getMonth()] + '")
R("'Drivers can take cash, check, Zelle or a bank transfer link. Card is left out for now because of the fee. Demo only: nothing is really charged.': 'Los choferes pueden recibir efectivo, cheque, Zelle o un enlace de transferencia bancaria. La tarjeta se deja fuera por ahora por la comisión. Solo demo: no se cobra nada de verdad.'","'Drivers can take cash, check or Zelle, and note a bank transfer (ACH) that the office confirms. Card is left out for now because of the fee. The driver marks the money collected and the invoice shows paid.': 'Los choferes pueden recibir efectivo, cheque o Zelle, y anotar una transferencia bancaria (ACH) que la oficina confirma. La tarjeta se deja fuera por ahora por la comisión. El chofer marca el dinero cobrado y la factura queda pagada.'")
R("var url = ''; try { url = URL.createObjectURL(e.target.files[0]); } catch (er) { url = ''; } sendDrvReceipt(m[1], url);","var f0 = e.target.files[0], k0 = m[1]; try { e.target.value = ''; } catch (er) { } sendDrvReceipt(k0, f0);")
R("RFILE = ''; if (e.target.files && e.target.files[0]) { try { RFILE = URL.createObjectURL(e.target.files[0]); } catch (er) { RFILE = ''; } }","RFILE = ''; if (e.target.files && e.target.files[0]) { RFILE = e.target.files[0]; }")
R("addReceipt({ jid: jj, from: 'office', who: 'Office', photo: RFILE }); RFILE = ''; closeForm(); setView('receipts'); toast('Receipt attached and read. Check it below.'); return;","var rf = RFILE; RFILE = ''; if (rf) { toast('Uploading photo...'); upPh(rf, 'office').then(function (pp) { addReceipt({ jid: jj, from: 'office', who: 'Office', photo: pp }); closeForm(); setView('receipts'); toast('Receipt attached. Check it below.'); syncSoon(); }).catch(function (er) { toast('Photo not saved: ' + er.message); }); return; } addReceipt({ jid: jj, from: 'office', who: 'Office', photo: '' }); closeForm(); setView('receipts'); toast('Receipt attached. Check it below.'); return;")
R("var pic = r.photo ? '<img src=\"' + r.photo + '\" alt=\"Receipt photo\"","var pic = r.photo ? '<img src=\"' + phSrc(r.photo) + '\" alt=\"Receipt photo\"")
R('<b id="sAD">14</b><small>5 out for pickup today</small>','<b id="sAD">-</b><small>&nbsp;</small>')
R('<b id="sAR">9</b><small>2 due back this week</small>','<b id="sAR">-</b><small>&nbsp;</small>')
R('<b id="sCA">11</b><small>of 25 in the yard</small>','<b id="sCA">-</b><small>&nbsp;</small>')
R('<b id="sUN">$6,840</b><small>4 invoices past due</small>','<b id="sUN">-</b><small>&nbsp;</small>')
R('<span class="pill bad">3 overdue</span>','<span class="pill bad" id="topOver" hidden>0 overdue</span>')
R("<b>$6,840</b><small>4 invoices past due</small>","<b>-</b><small>&nbsp;</small>")
R("[['Hollis Demo Corp', 1980, 13], ['Delgado Roofing', 2724, 9], ['Stallion Construction', 1496, 2], ['Parkview Builders', 640, 0]]","[]")
R("[['Hollis Demo Corp', 3810], ['Stallion Construction', 3296], ['Rivera Masonry', 2270], ['Delgado Roofing', 2724]]","[]")
R("[['Parkview Builders', 640, 'Due Oct 15']]","[]")
R("[['Stallion Construction', 1496, '2 days']]","[]")
R("['Final notice', 'bad', [['Delgado Roofing', 2724, '9 days']]], ['Lien stage', 'bad', [['Hollis Demo Corp', 1980, '16 days']]]","['Final notice', 'bad', []], ['Lien stage', 'bad', []]")
R("<b>$18,260</b><small>22 invoices paid</small>","<b>-</b><small>&nbsp;</small>")
R("<b>$18,260</b><small>All rentals and dumping</small>","<b>-</b><small>&nbsp;</small>")
R("<b>$7,410</b><small>9 active rentals</small>","<b>-</b><small>&nbsp;</small>")
R("<b>$10,850</b><small>31 jobs</small>","<b>-</b><small>&nbsp;</small>")
R('data-c="Stallion Construction"','data-c=""')
R("'<button class=\"btn\" data-a=\"scan\">' + icon('scan') + 'Scan receipt</button>' +","'<button class=\"btn\" data-a=\"scan\">' + icon('receipt') + 'Receipts and documents</button>' +")
R("if (a === 'scan') { tab = 'docs'; scanState = 'scanning'; drawPane(); setTimeout(function () { scanState = 'done'; if (tab === 'docs') drawPane(); }, 1800); }","if (a === 'scan') { tab = 'docs'; scanState = 'idle'; drawPane(); }")
R("setView('dashboard'); tab = 'docs'; scanState = 'scanning'; drawPane();\n      setTimeout(function () { scanState = 'done'; if (tab === 'docs' && curView === 'dashboard') drawPane(); }, 1800);","setView('dashboard'); tab = 'docs'; scanState = 'idle'; drawPane();")
R("var d0 = R0 || { asset: EQUIP[0].n,","var E0 = EQUIP[0] || { n: (typeof PRESET_M !== 'undefined' && PRESET_M[0]) || '', p: '' };\n      var d0 = R0 || { asset: E0.n,")
R("price: EQUIP[0].p, del: ''","price: E0.p, del: ''")
R("var E0 = EQUIP[0] || { n: (typeof PRESET_M !== 'undefined' && PRESET_M[0]) || '', p: '' };\n      var d0 = R0 || { asset: E0.n,","var E0 = { n: '', p: '' };\n      var d0 = R0 || { asset: E0.n,")
R("var opts = '<optgroup label=\"Your equipment\">', seen = {}, kq;","var opts = (R0 ? '' : '<option value=\"\" selected>Choose equipment</option>') + '<optgroup label=\"Your equipment\">', seen = {}, kq;")
R("if (!st) { err.textContent = 'Pick the start date.'; return; }","if (!st) { err.textContent = 'Pick the start date.'; return; }\n      if (!fv('fAsset')) { err.textContent = 'Choose the equipment.'; return; }")
R("  .dabar .btn { border-radius: 99px; padding: 8px 16px; font-weight: 600; }","  .dabar .btn { border-radius: 99px; padding: 8px 16px; font-weight: 600; background: #fff; color: #1F2937; border: 1px solid #94A3B8; }")
R("var n = DAPP.name, act = drvItems(n, false), dn = drvItems(n, true), h = '', k;\n    act.sort(function (a, b) { return dKey(a.time) - dKey(b.time); });","var n = DAPP.name, act = drvItems(n, false), dn = drvItems(n, true), h = '', k, hid = 0, mine;\n    act.sort(function (a, b) { return dKey(a.time) - dKey(b.time); });\n    mine = act.slice(); var dtab = DAPP.tab || 'hoy';\n    if (dtab === 'hoy') { var tdk = drvTodayKey(), keep = [], q; for (q = 0; q < act.length; q++) { if (drvDayKey(act[q].time) <= tdk || dKey(act[q].time) >= 1e9) keep.push(act[q]); } hid = act.length - keep.length; act = keep; } else { act = []; }")
R("if (!act.length) h += '<div class=\"daempty\"><b>Sin trabajos activos</b>Todos los trabajos completados</div>';","h += drvTabs(dtab, hid);\n    if (!act.length && dtab === 'hoy') h += '<div class=\"daempty\"><b>' + (hid ? 'No tienes trabajos para hoy' : 'Sin trabajos activos') + '</b>' + (hid ? 'Mira la pesta\\u00f1a Pr\\u00f3ximos d\\u00edas' : 'Todos los trabajos completados') + '</div>';\n    if (dtab === 'prox') h += drvList(n, mine, true); else if (dtab === 'comp') h += drvList(n, null, false);")
R("if (a === 'msgread') { msgRead(DAPP.name, key); drawDrv(); return; }","if (a === 'msgread') { msgRead(DAPP.name, key); drawDrv(); return; }\n    if (a === 'dtab') { DAPP.tab = key; drawDrv(); return; }")
R("sel = parseInt(tr.getAttribute('data-id'), 10); scanState = 'idle'; DS.del = false; drawRows(); drawPane();\n  });","var nsel = parseInt(tr.getAttribute('data-id'), 10), dt0 = document.getElementById('detail');\n    if (nsel === sel && dt0 && !dt0.hidden) { dt0.hidden = true; return; }\n    sel = nsel; scanState = 'idle'; DS.del = false; if (dt0) dt0.hidden = false; drawRows(); drawPane();\n  });")
R("    var j = find(sel), el = document.getElementById('pane');\n","    var j = find(sel), el = document.getElementById('pane'), dt1 = document.getElementById('detail'); if (dt1) dt1.hidden = false;\n")
R("<button class=\"tab\" role=\"tab\" data-t=\"history\" aria-selected=\"false\">History</button>\n","<button class=\"tab\" role=\"tab\" data-t=\"history\" aria-selected=\"false\">History</button>\n          <button class=\"btn sm\" id=\"dClose\" style=\"margin-left:auto\">Close</button>\n")
R("var tr = e.target.closest('tr[data-r]'); if (tr) { openRental(tr.getAttribute('data-r')); return; }","var tr = e.target.closest('tr[data-r]'); if (tr) { var rd0 = document.getElementById('rentalDetail'); if (RS && RS.id === tr.getAttribute('data-r') && rd0 && !rd0.hidden) { closeRental(); return; } openRental(tr.getAttribute('data-r')); return; }")
R("    if (a === 'dtab') { DAPP.tab = key; drawDrv(); return; }","    if (a === 'dtab') { DAPP.tab = key; DAPP.open = ''; drawDrv(); return; }\n    if (a === 'dopen') { DAPP.open = DAPP.open === key ? '' : key; drawDrv(); return; }")
R("      h = '<div><b>Your equipment</b>' + list + '</div><div class=\"fgrid\">'","      if (!list) list = '<p class=\"note\">No equipment added yet. Add what you rent out below, or tap a suggestion.</p>';\n      var sg = '', sq, have = {}; for (sq = 0; sq < EQUIP.length; sq++) have[EQUIP[sq].n] = 1;\n      for (sq = 0; sq < PRESET_M.length; sq++) { if (!have[PRESET_M[sq]]) sg += '<button type=\"button\" class=\"btn sm\" style=\"margin:3px\" data-fa=\"sugg\" data-n=\"' + invEsc(PRESET_M[sq]) + '\">' + invEsc(PRESET_M[sq]) + '</button>'; }\n      for (sq = 0; sq < PRESET_T.length; sq++) { if (!have[PRESET_T[sq]]) sg += '<button type=\"button\" class=\"btn sm\" style=\"margin:3px\" data-fa=\"sugg\" data-n=\"' + invEsc(PRESET_T[sq]) + '\">' + invEsc(PRESET_T[sq]) + '</button>'; }\n      h = '<div><b>Your equipment (' + EQUIP.length + ')</b>' + list + '</div>' + (sg ? '<div style=\"margin-top:14px\"><b>Tap one to add it</b><div class=\"sub\">Then type the price and tap Add equipment.</div><div style=\"margin-top:6px\">' + sg + '</div></div>' : '') + '<div class=\"fgrid\">'")
R("    else if (a === 'rm') { EQUIP.splice(","    else if (a === 'sugg') { var fe = document.getElementById('fEq'); if (fe) { fe.value = b.getAttribute('data-n'); var fp = document.getElementById('fEqP'); if (fp) fp.focus(); } }\n    else if (a === 'rm') { EQUIP.splice(")
R("var PRIV = { 1036: true }, PCNT = 6,","var PRIV = {}, PCNT = 6,")
R("    } else if (kind === 'send') {\n      SEND = ctx; t = 'Send to client';","    } else if (kind === 'prices') {\n      t = 'Dump container prices';\n      var pl = '', pq;\n      for (pq = 0; pq < PRICES.length; pq++) pl += '<div class=\"eqrow\" style=\"display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:8px 0\"><div class=\"grow\" style=\"min-width:140px\"><b>' + invEsc(PRICES[pq][0]) + ' ' + invEsc(PRICES[pq][1]) + '</b></div><label style=\"font-size:12px\">Price $<input type=\"number\" min=\"0\" step=\"1\" id=\"fPr' + pq + '\" value=\"' + PRICES[pq][2] + '\" style=\"width:90px\"></label><label style=\"font-size:12px\">Tons included <input type=\"number\" min=\"0\" step=\"1\" id=\"fTn' + pq + '\" value=\"' + (PRICES[pq][3] || 0) + '\" style=\"width:70px\"></label><button type=\"button\" class=\"btn sm\" data-fa=\"prrm\" data-ix=\"' + pq + '\">Remove</button></div>';\n      if (!pl) pl = '<p class=\"note\">No prices yet. Add one below.</p>';\n      h = '<div><b>Your container prices</b><div class=\"sub\">Change any price, then tap Save prices.</div>' + pl + '</div><div style=\"margin-top:14px\"><b>Add a price</b></div><div class=\"fgrid\">' + fld('fNM', 'Material', 'text', '', 'Example: Dirt / mix', false) + fld('fNS', 'Container size', 'text', '', 'Example: 20 yd', false) + fld('fNP', 'Price ($)', 'number', '') + fld('fNT', 'Tons included', 'number', '0') + '</div><p class=\"ferr\" id=\"fErr\"></p>' +\n        '<div class=\"actions\"><button type=\"submit\" class=\"btn primary\">' + icon('check') + 'Save prices</button><button type=\"button\" class=\"btn\" data-fa=\"close\">Cancel</button></div>';\n    } else if (kind === 'send') {\n      SEND = ctx; t = 'Send to client';")
R("    else if (a === 'rm') { EQUIP.splice(","    else if (a === 'prrm') { var pi0 = parseInt(b.getAttribute('data-ix'), 10); var kp; for (kp = 0; kp < PRICES.length; kp++) { var e1 = document.getElementById('fPr' + kp), e2 = document.getElementById('fTn' + kp); if (e1) PRICES[kp][2] = parseFloat(e1.value) || 0; if (e2) PRICES[kp][3] = parseFloat(e2.value) || 0; } PRICES.splice(pi0, 1); openForm('prices'); toast('Price removed'); }\n    else if (a === 'eqed') { var ei = parseInt(b.getAttribute('data-ix'), 10), fe2 = document.getElementById('fEq'); if (fe2 && EQUIP[ei]) { fe2.value = EQUIP[ei].n; document.getElementById('fEqP').value = EQUIP[ei].p; document.getElementById('fEqU').value = EQUIP[ei].u; document.getElementById('fEqP').focus(); } }\n    else if (a === 'rm') { EQUIP.splice(")
R("    if (FKIND === 'equip') {\n      var nm = fv('fEq').trim(); if (!nm) { err.textContent = 'Type the equipment name.'; return; }\n      EQUIP.push({ n: nm, p: fn('fEqP'), u: fv('fEqU') });","    if (FKIND === 'prices') {\n      var kq2; for (kq2 = 0; kq2 < PRICES.length; kq2++) { var g1 = document.getElementById('fPr' + kq2), g2 = document.getElementById('fTn' + kq2); if (g1) PRICES[kq2][2] = parseFloat(g1.value) || 0; if (g2) PRICES[kq2][3] = parseFloat(g2.value) || 0; }\n      var nm1 = fv('fNM').trim(), ns1 = fv('fNS').trim();\n      if (nm1 || ns1 || fv('fNP')) { if (!nm1 || !ns1) { err.textContent = 'To add a price, type the material and the container size.'; return; } PRICES.push([nm1, ns1, fn('fNP'), fn('fNT')]); }\n      openForm('prices'); toast('Prices saved'); return;\n    }\n    if (FKIND === 'equip') {\n      var nm = fv('fEq').trim(); if (!nm) { err.textContent = 'Type the equipment name.'; return; }\n      var ex0 = -1, xq; for (xq = 0; xq < EQUIP.length; xq++) { if (EQUIP[xq].n === nm) ex0 = xq; }\n      if (ex0 >= 0) { EQUIP[ex0].p = fn('fEqP'); EQUIP[ex0].u = fv('fEqU'); openForm('equip'); toast(nm + ' updated'); return; }\n      EQUIP.push({ n: nm, p: fn('fEqP'), u: fv('fEqU') });")
R("<button type=\"button\" class=\"btn sm\" data-fa=\"rm\" data-i=\"' + q + '\">Remove</button>","<button type=\"button\" class=\"btn sm\" data-fa=\"eqed\" data-ix=\"' + q + '\">Change price</button> <button type=\"button\" class=\"btn sm\" data-fa=\"rm\" data-ix=\"' + q + '\">Remove</button>")
R("else if (a === 'rm') { EQUIP.splice(parseInt(b.getAttribute('data-i'), 10), 1);","else if (a === 'rm') { EQUIP.splice(parseInt(b.getAttribute('data-ix'), 10), 1);")
import re as _re
s=_re.sub(r"var PRESET_M = \[[^\]]*\];","var PRESET_M = [];",s,count=1)
s=_re.sub(r"var PRESET_T = \[[^\]]*\];","var PRESET_T = [];",s,count=1)
assert "var PRESET_M = [];" in s and "var PRESET_T = [];" in s
R("No equipment added yet. Add what you rent out below, or tap a suggestion.","No equipment added yet. Type the name and price of a machine below and tap Add equipment.")
R("      opts += '</optgroup><optgroup label=\"Tools\">';","      if (R0 && R0.asset && !seen[R0.asset]) opts += '<option selected>' + invEsc(R0.asset) + '</option>';\n      opts += '</optgroup><optgroup label=\"Tools\">';")
R("<h3 class=\"fsec\">Equipment and driver</h3>","<h3 class=\"fsec\">Equipment and driver</h3>' + (EQUIP.length || R0 ? '' : '<p class=\"note\" style=\"grid-column:1/-1\">You have not added any equipment yet. Close this, tap Equipment, add your machines, then come back.</p>') + '")
R("bar + ban + '<div class=\"card livecard\" id=\"live\">'","bar + ban + driverLinkCard() + '<div class=\"card livecard\" id=\"live\">'")
R("    if (a === 'toast') toast(b.getAttribute('data-msg'));\n    else if (a === 'assign')","    if (a === 'dlcopy') { copyText(DRV_LINK); toast('Driver link copied'); }\n    else if (a === 'dlmsg') { copyText(drvMsgText(b.getAttribute('data-l'), b.getAttribute('data-w'))); toast('Message copied. Paste it into a text.'); }\n    else if (a === 'toast') toast(b.getAttribute('data-msg'));\n    else if (a === 'assign')")
open('app.html','w').write(s)
print(len(s))
