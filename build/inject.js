  /* ===== REAL DATA LAYER (Supabase) ===== */
  var SB = supabase.createClient('https://ecflvidsdjccfhcbdvvr.supabase.co', 'sb_publishable_IU8KNsEwa7mMbsZzfdXpQQ_szIUAcce', { auth: { persistSession: true, autoRefreshToken: true } });
  var ME = null, DBROWS = { dump: [], rent: [], book: [], ext: [], assets: [], inv: [] };
  var STAFF_SUFFIX = '@staff.sams-office.app';
  function TODAYISO() { var d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function TOMOISO() { return addDays(TODAYISO(), 1); }
  function todayISO() { var d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function fmtPh(p) { var d = String(p || '').replace(/\D/g, ''); if (d.length === 11 && d.charAt(0) === '1') d = d.slice(1); return d.length === 10 ? '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6) : String(p || ''); }
  function digits(p) { return String(p || '').replace(/\D/g, ''); }
  function iso10(x) { return x ? String(x).slice(0, 10) : ''; }
  function t12(t) { var m = /^(\d{1,2}):(\d{2})/.exec(String(t || '')); if (!m) return ''; var h = parseInt(m[1], 10), ap = h >= 12 ? 'PM' : 'AM'; h = h % 12; if (h === 0) h = 12; return h + ':' + m[2] + ' ' + ap; }
  function whenStr(iso, t) { if (!iso) return ''; return shortD(iso) + (t12(t) ? ', ' + t12(t) : ''); }
  function normSize(s) { return String(s || '').replace(/(\d+)\s*yd/i, '$1 yd'); }
  function dumpStat(j) {
    var ds = j.driver_status || 'pending', td = todayISO();
    if (j.payment_status !== 'paid' && j.due_date && iso10(j.due_date) < td && (ds === 'completed' || ds === 'delivered' || ds === 'arrived')) return ['Past due', 'bad'];
    if (ds === 'completed' || ds === 'delivered') return ['Delivered', 'good'];
    if (ds === 'on_the_way') return ['On the way', 'info'];
    if (ds === 'arrived') return ['Arrived', 'info'];
    return ['Scheduled', 'warn'];
  }
  var RST = { assigned: 0, preparing: 1, loading: 2, on_the_way: 3, arrived: 4, delivered: 5 };
  function rentStat(r) {
    var td = todayISO(), due = iso10(r.due_date);
    if (r.rental_status === 'completed') return ['Returned', 'good'];
    if (r.rental_status === 'cancelled') return ['Cancelled', 'bad'];
    if (due && due < td) return ['Overdue', 'bad'];
    if (due && due <= addDays(td, 2)) return ['Due back', 'warn'];
    return ['Active', 'info'];
  }
  function mapAll() {
    var k, j, r, d, st, rows, td = todayISO(), n;
    JOBS.length = 0; RENTALS.length = 0; DISP.length = 0; CLIENTS.length = 0; INBOX.length = 0; INVS.length = 0; CAL_EV.length = 0; ASSETS.length = 0; EXTRA.length = 0; EQUIP.length = 0;
    for (k in ISO) { if (ISO.hasOwnProperty(k)) delete ISO[k]; }
    for (k = 0; k < DBROWS.assets.length; k++) {
      var a = DBROWS.assets[k];
      ASSETS.push({ id: a.id, name: a.name, make: '', model: '', serial: a.serial || '', year: '', acq: '', rep: '', memo: '', maint: [], cat: a.category, st: a.status });
    }
    var seen = {};
    for (k = 0; k < DBROWS.assets.length; k++) { var nm = DBROWS.assets[k].name; if (!seen[nm]) { seen[nm] = 1; EQUIP.push({ n: nm, p: 0, u: '2 weeks' }); } }
    for (k = 0; k < DBROWS.dump.length; k++) {
      j = DBROWS.dump[k]; st = dumpStat(j);
      var tot = parseFloat(j.total_price); if (isNaN(tot)) tot = parseFloat(j.price) || 0;
      var o = { id: j.ticket_no, _id: j.id, client: j.client_name || '', phone: fmtPh(j.client_phone), addr: j.client_address || '', mat: j.material_type || '', size: normSize(j.container_size), status: st[0], tone: st[1], total: tot, pay: j.payment_status === 'paid' ? 'Paid' : 'Unpaid', date: j.date ? longD(iso10(j.date)) : '', driver: j.assigned_driver || 'Unassigned', ow: parseFloat(j.overweight_charge) || 0, pf: parseFloat(j.permit_fee) || 0, jt: j.job_type || '', email: j.client_email || '', notes: j.notes || '', dn: j.driver_notes || '', token: j.portal_token, conf: !!j.portal_confirmed };
      JOBS.push(o);
      var dIso = iso10(j.scheduled_dropoff) || iso10(j.date); ISO[o.id] = dIso; ISO[o.id - 710] = dIso; o.dueIso = iso10(j.scheduled_pickup) || iso10(j.due_date) || ''; o._st0 = o.status; o.method = j.payment_method || '';
      var base = tot - o.ow - o.pf;
      var its = [['Dump - ' + o.mat + (o.size ? ' (' + o.size + ')' : ''), base]]; if (o.ow) its.push(['Overweight Charge', o.ow]); if (o.pf) its.push(['Permit Fee', o.pf]);
      INVS.push({ no: o.id - 710, client: o.client, date: o.date, amt: tot, st: o.pay === 'Paid' ? 'Paid' : (st[0] === 'Past due' ? 'Past due' : 'Unpaid'), tone: o.pay === 'Paid' ? 'good' : (st[0] === 'Past due' ? 'bad' : 'warn'), items: its, addr: o.addr, ph: o.phone });
      var what = function (kind) { return kind + ' - ' + o.mat + (o.size ? ' (' + o.size + ')' : ''); };
      if (j.scheduled_dropoff && st[0] !== 'Delivered' && st[0] !== 'Past due') { DISP.push({ id: DISP.length + 1, jid: o.id, client: o.client, what: what('DROP'), addr: o.addr, ph: digits(j.client_phone), time: whenStr(iso10(j.scheduled_dropoff), j.scheduled_dropoff_time), driver: o.driver === 'Unassigned' ? '' : o.driver, st: st[0] === 'Scheduled' ? 'Scheduled' : st[0] }); CAL_EV.push([iso10(j.scheduled_dropoff), 'Drop: ' + o.client, 'drop']); }
      if (j.scheduled_pickup && (j.driver_status === 'arrived' || j.driver_status === 'delivered' || j.driver_status === 'completed' || true)) { if (j.driver_status !== 'completed') { DISP.push({ id: DISP.length + 1, jid: o.id, client: o.client, what: what('PULL'), addr: o.addr, ph: digits(j.client_phone), time: whenStr(iso10(j.scheduled_pickup), j.scheduled_pickup_time), driver: o.driver === 'Unassigned' ? '' : o.driver, st: 'Scheduled' }); } CAL_EV.push([iso10(j.scheduled_pickup), 'Pickup: ' + o.client, 'cpick']); }
    }
    var order = DBROWS.rent.slice().sort(function (x, y) { return String(x.created_at).localeCompare(String(y.created_at)); });
    var invOf = {}; for (k = 0; k < order.length; k++) invOf[order[k].id] = order[k].invoice_no || (401 + k);
    for (k = 0; k < DBROWS.rent.length; k++) {
      r = DBROWS.rent[k]; st = rentStat(r);
      var mid = ''; for (n = 0; n < ASSETS.length; n++) { if (ASSETS[n].name === r.asset) { mid = ASSETS[n].id; break; } }
      var ro = { id: r.id, mid: mid, asset: r.asset || '', client: r.client_name || '', phone: digits(r.client_phone), email: r.client_email || '', addr: r.client_address || '', tag: r.client_tag || 'New Client', si: iso10(r.start_date), di: iso10(r.due_date), price: parseFloat(r.price) || 0, del: parseFloat(r.delivery_fee) || 0, pick: parseFloat(r.pickup_fee) || 0, trailer: parseFloat(r.trailer_fee) || 0, diesel: parseFloat(r.diesel_fee) || 0, ptype: r.pickup_type || 'delivery', pay: r.payment_status === 'paid' ? 'Paid' : 'Unpaid', method: r.payment_method || '', status: st[0], tone: st[1], driver: r.assigned_driver || 'Unassigned', notes: r.notes || '', sd: iso10(r.delivery_date), sdt: r.delivery_time || r.start_time || '', sp: iso10(r.pickup_date), spt: r.pickup_time || '', step: st[0] === 'Returned' ? 5 : (RST[r.driver_status] || 0), inv: invOf[r.id], dl: iso10(r.due_date) ? shortD(iso10(r.due_date)) : '', dn: r.driver_notes || '', token: r.portal_token, conf: !!r.portal_confirmed };
      RENTALS.push(ro);
      if (ro.sd) { CAL_EV.push([ro.sd, 'Delivery: ' + ro.client, 'rdel']); if (ro.status !== 'Returned') DISP.push({ id: DISP.length + 1, rid: ro.id, client: ro.client, what: 'Deliver ' + ro.asset.toLowerCase(), addr: ro.addr, ph: ro.phone, time: whenStr(ro.sd, ro.sdt), driver: ro.driver === 'Unassigned' ? '' : ro.driver, st: 'Scheduled' }); }
      if (ro.sp) { CAL_EV.push([ro.sp, 'Pickup: ' + ro.client, 'rpick']); if (ro.status !== 'Returned') DISP.push({ id: DISP.length + 1, rid: ro.id, client: ro.client, what: 'Pick up ' + ro.asset.toLowerCase(), addr: ro.addr, ph: ro.phone, time: whenStr(ro.sp, ro.spt), driver: ro.driver === 'Unassigned' ? '' : ro.driver, st: 'Scheduled' }); }
      if (ro.di && ro.status !== 'Returned') CAL_EV.push([ro.di, 'Due: ' + ro.client, 'due']);
    }
    initRentalInvoices();
    var cm = {}, ord = [];
    function addC(nm, ph, amt) { if (!nm) return; if (!cm[nm]) { cm[nm] = { n: nm, ph: ph || '', jobs: 0, bal: 0 }; ord.push(nm); } cm[nm].jobs++; cm[nm].bal += amt; if (!cm[nm].ph && ph) cm[nm].ph = ph; }
    for (k = 0; k < JOBS.length; k++) addC(JOBS[k].client, JOBS[k].phone, JOBS[k].pay === 'Paid' ? 0 : JOBS[k].total);
    for (k = 0; k < RENTALS.length; k++) addC(RENTALS[k].client, fmtPh(RENTALS[k].phone), RENTALS[k].pay === 'Paid' ? 0 : rTotal(RENTALS[k]));
    for (k = 0; k < ord.length; k++) CLIENTS.push(cm[ord[k]]);
    var ib = 0;
    for (k = 0; k < DBROWS.book.length; k++) {
      var b = DBROWS.book[k]; ib++;
      var req = (b.service_type === 'rental' ? 'Rental: ' + (b.equipment || '') : 'Dumpster ' + normSize(b.container_size) + ', ' + (b.material_type || '')) + (b.preferred_date ? ', ' + shortD(iso10(b.preferred_date)) : '');
      INBOX.push({ id: ib, _id: b.id, n: b.client_name || '', req: req, lang: 'EN', t: iso10(b.created_at) ? shortD(iso10(b.created_at)) : '', s: b.status || 'new', ph: fmtPh(b.client_phone), addr: b.client_address || '', notes: b.notes || '' });
    }
    CAL.y = parseInt(td.slice(0, 4), 10); CAL.m = parseInt(td.slice(5, 7), 10) - 1;
    sel = JOBS.length ? dumpSorted(JOBS)[0].id : 0;
    invSel = INVS.length ? INVS[0].no : 0;
  }
  updateStats = function () {
    var ad = 0, ar = 0, un = 0, pd = 0, k, cont = 0, out = 0;
    for (k = 0; k < JOBS.length; k++) { if (JOBS[k].status !== 'Delivered' && JOBS[k].pay !== 'Paid' || JOBS[k].status === 'Scheduled' || JOBS[k].status === 'On the way' || JOBS[k].status === 'Arrived') { } if (JOBS[k].status === 'Scheduled' || JOBS[k].status === 'On the way' || JOBS[k].status === 'Arrived') ad++; if (JOBS[k].pay !== 'Paid') { un += JOBS[k].total; if (JOBS[k].tone === 'bad') pd++; } }
    for (k = 0; k < RENTALS.length; k++) { if (RENTALS[k].status !== 'Returned' && RENTALS[k].status !== 'Cancelled') ar++; if (RENTALS[k].pay !== 'Paid' && RENTALS[k].status !== 'Cancelled') { un += rTotal(RENTALS[k]); if (RENTALS[k].tone === 'bad') pd++; } }
    for (k = 0; k < DBROWS.inv.length; k++) { if (DBROWS.inv[k].kind === 'container') cont += DBROWS.inv[k].total_qty || 0; }
    document.getElementById('sAD').textContent = ad; document.getElementById('sAR').textContent = ar;
    document.getElementById('sCA').textContent = Math.max(0, cont - ad);
    document.getElementById('sUN').textContent = '$' + un.toLocaleString('en-US'); var to = document.getElementById('topOver'); if (to) { to.textContent = pd + ' overdue'; to.hidden = !pd; }
    var sm = document.querySelectorAll('.stats .stat small'); if (sm.length >= 4) { sm[0].textContent = 'dumps on the road or scheduled'; sm[1].textContent = 'out with clients now'; sm[2].textContent = cont ? 'of ' + cont + ' in the yard' : 'set your container count in Settings'; sm[3].textContent = pd + (pd === 1 ? ' invoice' : ' invoices') + ' past due'; }
  };
  async function loadAll() {
    var q = await Promise.all([
      SB.from('dump_jobs').select('*').eq('deleted', false).order('ticket_no', { ascending: false }),
      SB.from('rentals').select('*').eq('deleted', false).order('created_at', { ascending: false }),
      SB.from('booking_requests').select('*').order('created_at', { ascending: false }),
      SB.from('extension_requests').select('*').eq('status', 'pending'),
      SB.from('assets').select('*').order('name'),
      SB.from('inventory').select('*')
    ]);
    for (var i = 0; i < q.length; i++) { if (q[i].error) { toast('Could not load data: ' + q[i].error.message); } }
    DBROWS.dump = q[0].data || []; DBROWS.rent = q[1].data || []; DBROWS.book = q[2].data || []; DBROWS.ext = q[3].data || []; DBROWS.assets = q[4].data || []; DBROWS.inv = q[5].data || [];
    mapAll(); takeSnap();
  }
  function paintAll() { updateStats(); paintIcons(); drawRows(); drawPane(); drawRentals(); paintIcons(document.getElementById('invModal')); updPBadge(); if (curView && curView !== 'dashboard') setView(curView); }
  async function getMe() {
    var g = await SB.auth.getSession(); var ss = g && g.data && g.data.session; if (!ss) return null;
    var p = await SB.from('profiles').select('full_name,role,driver_name,company_id').eq('id', ss.user.id).single();
    return p && p.data ? p.data : null;
  }
  async function enter(me) {
    ME = me; document.getElementById('gate').hidden = true;
    await loadAll(); paintAll();
    if (me.role === 'driver') obInit(me, function (n) { startDriverMode(me); locNotice(); if (n && navigator.onLine !== false) { NET_OFF = true; goOnline(); setTimeout(syncSoon, 2600); } });
  }
  async function gateGo(e) {
    e.preventDefault();
    var u = document.getElementById('gU').value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9._-]/g, ''), p = document.getElementById('gP').value, er = document.getElementById('gE'), bt = document.getElementById('gB');
    er.hidden = true; bt.disabled = true; bt.textContent = 'Checking...';
    var si = await SB.auth.signInWithPassword({ email: u + STAFF_SUFFIX, password: p });
    if (si.error) { si = await SB.auth.signInWithPassword({ email: u + '@drivers.sams-office.app', password: p }); }
    if (si.error) { gMark('gPok', false); document.getElementById('gUok').hidden = true; er.textContent = 'Wrong username or password.'; er.hidden = false; bt.disabled = false; bt.textContent = 'Continue'; return; }
    var me = await getMe();
    if (!me || (me.role !== 'owner' && me.role !== 'secretary' && me.role !== 'driver')) { await SB.auth.signOut(); er.textContent = 'This account is not set up for the office.'; er.hidden = false; bt.disabled = false; bt.textContent = 'Continue'; return; }
    gMark('gUok', true); gMark('gPok', true); bt.disabled = false; bt.textContent = 'Continue'; document.getElementById('gP').value = '';
    enter(me);
  }
  var GCHK = 0;
  function gMark(id, ok) { var e = document.getElementById(id); e.hidden = false; e.textContent = ok ? '\u2713' : '\u2717'; e.style.color = ok ? '#16A34A' : '#DC2626'; }
  function gateCheck() {
    var u = document.getElementById('gU').value.trim(), p = document.getElementById('gP').value, b = document.getElementById('gB'), ue = document.getElementById('gUok');
    b.disabled = !(u && p); document.getElementById('gPok').hidden = true;
    ++GCHK;
    ue.hidden = true;
  }
  document.getElementById('gF').addEventListener('submit', gateGo);
  document.getElementById('gU').addEventListener('input', gateCheck); document.getElementById('gP').addEventListener('input', gateCheck);
  document.getElementById('gEye').addEventListener('click', function () { var i = document.getElementById('gP'); i.type = i.type === 'password' ? 'text' : 'password'; });
  document.getElementById('signOut').addEventListener('click', async function () { await SB.auth.signOut(); location.reload(); });
  (async function () { var me = await getMe(); if (me && (me.role === 'owner' || me.role === 'secretary' || me.role === 'driver')) enter(me); })();
