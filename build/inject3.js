  /* ---- Records saved in app_records ---- */
  var XINVS = [], XCLIS = [], XN = 0, XC = 0, LOCS = {}, SEEDED = false;
  function dmFlat() {
    var o = [], n, k, a;
    for (n in DMSG) { if (DMSG.hasOwnProperty(n)) { a = DMSG[n]; for (k = 0; k < a.length; k++) { a[k].who = n; if (!a[k].ts) a[k].ts = Date.now() - k; o.push(a[k]); } } }
    return o;
  }
  function cfgList() { return [{ id: 'prices', rows: PRICES }, { id: 'rem', on: REM.on, log: REM.log }]; }
  var RECS = [
    { k: 'wait', arr: function () { return WAITS; }, drv: 1 },
    { k: 'rcpt', arr: function () { return RCPTS; }, drv: 1 },
    { k: 'permit', arr: function () { return PERMITS; } },
    { k: 'dlog', arr: function () { return DLOG; } },
    { k: 'calx', arr: function () { return CALX; } },
    { k: 'xinv', arr: function () { return XINVS; } },
    { k: 'xcli', arr: function () { return XCLIS; } },
    { k: 'site', arr: function () { return SITES; }, seed: 1 },
    { k: 'srate', arr: function () { return SRATES; }, seed: 1 },
    { k: 'pay', arr: function () { return PAYLOG; }, ts: 1, drv: 1 },
    { k: 'txt', arr: function () { return TXTLOG; }, ts: 1, drv: 1 },
    { k: 'dmsg', arr: dmFlat, drv: 1, custom: 1 },
    { k: 'cfg', arr: cfgList, custom: 1 }
  ];
  var RSNAP = {};
  function numTail(id) { var m = /(\d+)$/.exec(String(id)); return m ? parseInt(m[1], 10) : 0; }
  function isDrv() { return ME && ME.role === 'driver'; }
  async function loadRecs() {
    var r = await SB.from('app_records').select('kind,id,data');
    if (r.error) { toast('Could not load saved records: ' + r.error.message); return; }
    var by = {}, i, k, a, mx, rk, rows, drv = isDrv();
    for (i = 0; i < r.data.length; i++) { (by[r.data[i].kind] = by[r.data[i].kind] || []).push(r.data[i].data); }
    LOCS = {}; var lr = by.loc || []; for (i = 0; i < lr.length; i++) LOCS[lr[i].who] = lr[i];
    SEEDED = false; var cf = by.cfg || []; for (i = 0; i < cf.length; i++) { if (cf[i].id === 'seeded') SEEDED = true; }
    RSNAP = {};
    for (k = 0; k < RECS.length; k++) {
      rk = RECS[k]; if (drv && !rk.drv) continue;
      rows = by[rk.k] || [];
      if (rk.k === 'cfg') {
        for (i = 0; i < rows.length; i++) {
          if (rows[i].id === 'prices' && rows[i].rows) { PRICES.length = 0; for (mx = 0; mx < rows[i].rows.length; mx++) PRICES.push(rows[i].rows[mx]); }
          if (rows[i].id === 'rem') { REM.on = rows[i].on !== false; REM.log = rows[i].log || {}; }
          RSNAP['cfg|' + rows[i].id] = JSON.stringify(rows[i]);
        }
        continue;
      }
      if (rk.k === 'dmsg') {
        var nm; for (nm in DMSG) { if (DMSG.hasOwnProperty(nm)) DMSG[nm].length = 0; }
        rows.sort(function (x, y) { return (y.ts || 0) - (x.ts || 0); }); mx = 0;
        for (i = 0; i < rows.length; i++) { if (!DMSG[rows[i].who]) DMSG[rows[i].who] = []; DMSG[rows[i].who].push(rows[i]); mx = Math.max(mx, numTail(rows[i].id)); RSNAP['dmsg|' + rows[i].id] = JSON.stringify(rows[i]); }
        DMN = Math.max(DMN, mx); continue;
      }
      a = rk.arr();
      if (rk.seed && !SEEDED && !rows.length) { continue; }
      a.length = 0; mx = 0;
      if (rk.ts) rows.sort(function (x, y) { return (y.ts || 0) - (x.ts || 0); });
      for (i = 0; i < rows.length; i++) { a.push(rows[i]); mx = Math.max(mx, numTail(rows[i].id)); RSNAP[rk.k + '|' + rows[i].id] = JSON.stringify(rows[i]); }
      if (rk.k === 'wait') { a.sort(function (x, y) { return numTail(x.id) - numTail(y.id); }); WN = Math.max(WN, mx); }
      if (rk.k === 'rcpt') { a.sort(function (x, y) { return numTail(y.id) - numTail(x.id); }); RCN = Math.max(RCN, mx); }
      if (rk.k === 'permit') PCNT = Math.max(PCNT, mx);
      if (rk.k === 'dlog') DLN = Math.max(DLN, mx);
      if (rk.k === 'site') SCN = Math.max(SCN, mx);
      if (rk.k === 'xinv') XN = Math.max(XN, mx);
      if (rk.k === 'xcli') XC = Math.max(XC, mx);
      if (rk.k === 'calx') { CXN = Math.max(CXN, mx); for (i = 0; i < a.length; i++) { CAL_EV.push([a[i].iso, (a[i].tm ? t12(a[i].tm) + ' ' : '') + a[i].title, 'cu', a[i].id]); } }
    }
    applyExtras(); buildConfs(); updRBadge();
  }
  async function syncRecs() {
    var k, i, a, key, js, seen = {}, res, err = '', rk, drv = isDrv();
    for (k = 0; k < RECS.length; k++) {
      rk = RECS[k]; if (drv && !rk.drv) continue;
      a = rk.arr();
      for (i = 0; i < a.length; i++) {
        if (a[i].id == null) a[i].id = rk.k + Date.now().toString(36) + i;
        if (rk.ts && !a[i].ts) a[i].ts = Date.now() - i;
        if (rk.k === 'txt' && !a[i].who) a[i].who = a[i].driver;
        if (drv && rk.k === 'dmsg') { /* drivers only change the read flag */ }
        key = rk.k + '|' + a[i].id; seen[key] = 1; js = JSON.stringify(a[i]);
        if (RSNAP[key] !== js) {
          res = await SB.from('app_records').upsert({ kind: rk.k, id: String(a[i].id), data: a[i], updated_at: new Date().toISOString() });
          if (res.error) err = res.error.message; else RSNAP[key] = js;
        }
      }
    }
    for (key in RSNAP) {
      if (RSNAP.hasOwnProperty(key) && !seen[key]) {
        var p = key.split('|'); if (drv && p[0] !== 'wait' && p[0] !== 'rcpt') continue;
        if (p[0] === 'cfg') continue;
        res = await SB.from('app_records').delete().eq('kind', p[0]).eq('id', p[1]);
        if (res.error) err = res.error.message; else delete RSNAP[key];
      }
    }
    if (!drv && !SEEDED) {
      res = await SB.from('app_records').upsert({ kind: 'cfg', id: 'seeded', data: { id: 'seeded', at: new Date().toISOString() } });
      if (!res.error) SEEDED = true;
    }
    return err;
  }
