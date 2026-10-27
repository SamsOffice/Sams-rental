  /* ===== SAVING: detect changes on screen and write them to the database ===== */
  var DRV_KEY = { 'Scheduled': 'pending', 'On the way': 'on_the_way', 'Arrived': 'arrived', 'Delivered': 'completed', 'Past due': 'completed' };
  var RSTEP_KEY = ['assigned', 'preparing', 'loading', 'on_the_way', 'arrived', 'delivered'];
  function parseDisp(str) {
    var m = /^([A-Za-z]{3})\s+(\d{1,2})(?:,?\s*(\d{1,2}):(\d{2})\s*([AaPp][Mm]))?/.exec(String(str || '')), mi = m ? MAB.indexOf(m[1]) : -1;
    if (mi < 0) return null;
    var y = TODAY.getFullYear(); if (mi < TODAY.getMonth() - 6) y++; else if (mi > TODAY.getMonth() + 6) y--;
    var t = null; if (m[3]) { var h = parseInt(m[3], 10) % 12 + (/p/i.test(m[5]) ? 12 : 0); t = pad2(h) + ':' + m[4]; }
    return { iso: y + '-' + pad2(mi + 1) + '-' + pad2(parseInt(m[2], 10)), t: t };
  }
  function stopsOf(jid) { var out = [], k; for (k = 0; k < DISP.length; k++) { if (DISP[k].jid === jid) out.push(DISP[k]); } return out; }
  function outJob(j) {
    var drop = ISO[j.id] || null, st = stopsOf(j.id), drv = j.driver, k, pk = null, dr = null, dt = null, pt = null;
    for (k = 0; k < st.length; k++) { if (/^PULL/.test(st[k].what)) pk = pk || st[k]; else dr = dr || st[k]; }
    var first = dr || pk; if (first && first.driver !== undefined) drv = first.driver || 'Unassigned';
    var pd = pk ? parseDisp(pk.time) : null, dd = dr ? parseDisp(dr.time) : null;
    var o = {
      client_name: j.client, client_phone: digits(j.phone) || null, client_address: j.addr, material_type: j.mat, container_size: j.size, job_type: j.jt || null,
      total_price: j.total, price: j.total - (j.ow || 0) - (j.pf || 0), overweight_charge: j.ow || 0, permit_fee: j.pf || 0,
      assigned_driver: drv && drv !== 'Unassigned' ? drv : null, payment_status: j.pay === 'Paid' ? 'paid' : 'unpaid', payment_method: j.method || null,
      client_email: j.email || null, notes: j.notes || null, driver_status: DRV_KEY[j.status] || 'pending', date: drop, scheduled_dropoff: dd ? dd.iso : drop, scheduled_dropoff_time: dd ? dd.t : null,
      scheduled_pickup: pd ? pd.iso : (j.dueIso || null), scheduled_pickup_time: pd ? pd.t : null, due_date: pd ? pd.iso : (j.dueIso || null)
    };
    return o;
  }
  function outRental(r) {
    var rs = [], k, dv = null, pu = null, drv0 = r.driver;
    for (k = 0; k < DISP.length; k++) { if (DISP[k].rid === r.id) rs.push(DISP[k]); }
    for (k = 0; k < rs.length; k++) { if (/^Pick up/.test(rs[k].what)) pu = pu || rs[k]; else dv = dv || rs[k]; }
    var fs = dv || pu; if (fs && fs.driver !== undefined) drv0 = fs.driver || 'Unassigned';
    var pdv = dv ? parseDisp(dv.time) : null, ppu = pu ? parseDisp(pu.time) : null;
    var key = r.step >= 5 || r.status === 'Returned' ? 'delivered' : (RSTEP_KEY[r.step] || 'assigned');
    return {
      client_name: r.client, client_phone: digits(r.phone) || null, client_email: r.email || null, client_address: r.addr, asset: r.asset, assigned_driver: drv0 && drv0 !== 'Unassigned' ? drv0 : null,
      start_date: r.si || null, due_date: r.di || null, price: parseFloat(r.price) || 0, delivery_fee: parseFloat(r.del) || 0, pickup_fee: parseFloat(r.pick) || 0, trailer_fee: parseFloat(r.trailer) || 0, diesel_fee: parseFloat(r.diesel) || 0,
      pickup_type: r.ptype || 'delivery', payment_status: r.pay === 'Paid' ? 'paid' : 'unpaid', payment_method: r.method || null,
      rental_status: r.status === 'Returned' ? 'completed' : (r.status === 'Cancelled' ? 'cancelled' : 'active'), driver_status: key,
      notes: r.notes || null, delivery_date: (pdv ? pdv.iso : r.sd) || null, delivery_time: (pdv ? pdv.t : r.sdt) || null, pickup_date: (ppu ? ppu.iso : r.sp) || null, pickup_time: (ppu ? ppu.t : r.spt) || null, client_tag: r.tag || null
    };
  }
  function changed(now, snap) { var d = {}, any = false, k; for (k in now) { if (now.hasOwnProperty(k) && JSON.stringify(now[k]) !== JSON.stringify(snap ? snap[k] : undefined)) { d[k] = now[k]; any = true; } } return any ? d : null; }
  var SYNCING = false, SYNC_AGAIN = false, SNAP = { dump: {}, rent: {}, book: {} }, SYNC_TIMER = 0;
  function takeSnap() {
    var k; SNAP.dump = {}; SNAP.rent = {}; SNAP.book = {};
    for (k = 0; k < JOBS.length; k++) { if (JOBS[k]._id) SNAP.dump[JOBS[k]._id] = outJob(JOBS[k]); }
    for (k = 0; k < RENTALS.length; k++) { RENTALS[k]._snapOk = 1; SNAP.rent[RENTALS[k].id] = outRental(RENTALS[k]); }
    for (k = 0; k < INBOX.length; k++) { if (INBOX[k]._id) SNAP.book[INBOX[k]._id] = INBOX[k].s; }
  }
  async function syncNow() {
    if (!ME || SYNCING) { SYNC_AGAIN = true; return; }
    SYNCING = true; var k, reload = false, err = '', res, d;
    try {
      var seenD = {}, seenR = {};
      for (k = 0; k < JOBS.length; k++) {
        var j = JOBS[k];
        if (!j._id) { res = await SB.from('dump_jobs').insert([outJob(j)]).select('id'); if (res.error) { err = res.error.message; } else { reload = true; } continue; }
        seenD[j._id] = 1; var nowD = outJob(j); d = changed(nowD, SNAP.dump[j._id]);
        if (!d) { continue; }
        d.updated_at = new Date().toISOString();
        res = await SB.from('dump_jobs').update(d).eq('id', j._id);
        if (res.error) { err = res.error.message; } else { SNAP.dump[j._id] = nowD; j._st0 = j.status; }
      }
      for (var id in SNAP.dump) { if (SNAP.dump.hasOwnProperty(id) && !seenD[id]) { res = await SB.from('dump_jobs').update({ deleted: true }).eq('id', id); if (res.error) err = res.error.message; else delete SNAP.dump[id]; } }
      for (k = 0; k < RENTALS.length; k++) {
        var r = RENTALS[k];
        if (!r._snapOk) { var row = outRental(r); row.id = r.id; if (String(r.id).indexOf('RN') === 0) row.id = 'RN' + Date.now().toString(36).toUpperCase() + k; res = await SB.from('rentals').insert([row]); if (res.error) err = res.error.message; else reload = true; continue; }
        seenR[r.id] = 1; var nowR = outRental(r); d = changed(nowR, SNAP.rent[r.id]);
        if (!d) continue; d.updated_at = new Date().toISOString();
        res = await SB.from('rentals').update(d).eq('id', r.id);
        if (res.error) err = res.error.message; else SNAP.rent[r.id] = nowR;
      }
      for (var rid in SNAP.rent) { if (SNAP.rent.hasOwnProperty(rid) && !seenR[rid]) { res = await SB.from('rentals').update({ deleted: true }).eq('id', rid); if (res.error) err = res.error.message; else delete SNAP.rent[rid]; } }
      for (k = 0; k < INBOX.length; k++) { var b = INBOX[k]; if (b._id && SNAP.book[b._id] !== b.s) { res = await SB.from('booking_requests').update({ status: b.s }).eq('id', b._id); if (res.error) err = res.error.message; else SNAP.book[b._id] = b.s; } }
    } catch (e) { err = String(e && e.message || e); }
    SYNCING = false;
    if (err) { toast('Could not save: ' + err); }
    if (reload) { await loadAll(); paintAll(); toast('Saved'); }
    if (SYNC_AGAIN) { SYNC_AGAIN = false; syncSoon(); }
  }
  function syncSoon() { if (!ME) return; clearTimeout(SYNC_TIMER); SYNC_TIMER = setTimeout(syncNow, 600); }
  ['click', 'change', 'submit'].forEach(function (ev) { document.addEventListener(ev, function () { if (document.getElementById('gate').hidden) syncSoon(); }, false); });
