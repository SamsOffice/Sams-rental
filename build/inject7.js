  /* ---- driver outbox saved on the phone (IndexedDB) so queued changes and photos survive closing the app ---- */
  var SYNC_FAIL = false, OBX = { db: null, sig: '', slug: '' };
  function obOpen(cb) {
    var done = false, fin = function () { if (!done) { done = true; cb(); } };
    try {
      var r = indexedDB.open('sams-outbox', 1);
      r.onupgradeneeded = function () { try { r.result.createObjectStore('kv'); } catch (e) { } };
      r.onsuccess = function () { OBX.db = r.result; fin(); };
      r.onerror = function () { fin(); }; r.onblocked = function () { fin(); };
      setTimeout(fin, 2500);
    } catch (e) { fin(); }
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { }
  }
  function obGet(k, cb) {
    if (!OBX.db) { cb(null); return; }
    try { var q = OBX.db.transaction('kv', 'readonly').objectStore('kv').get(k); q.onsuccess = function () { cb(q.result || null); }; q.onerror = function () { cb(null); }; } catch (e) { cb(null); }
  }
  function obPut(k, v) { if (!OBX.db) return; try { OBX.db.transaction('kv', 'readwrite').objectStore('kv').put(v, k); } catch (e) { } }
  function obSig() {
    var s = '', k, e;
    for (k = 0; k < NQ.length; k++) { e = NQ[k]; s += e.kind + '|' + (e.key || '') + '|' + (e.dir || '') + '|' + (e.text || '') + '|' + (e.wid || '') + '|' + (e.blob ? e.blob.size : 0) + ';'; }
    return s;
  }
  function obSave() {
    if (!OBX.db || !OBX.slug) return;
    var sig = obSig(); if (sig === OBX.sig) return; OBX.sig = sig;
    var out = [], k, e, m, c;
    for (k = 0; k < NQ.length; k++) {
      e = NQ[k]; c = {}; for (m in e) { if (e.hasOwnProperty(m)) c[m] = e[m]; }
      if (e.kind === 'wait') { for (m = 0; m < WAITS.length; m++) { if (WAITS[m].id === e.wid) c.wrec = JSON.parse(JSON.stringify(WAITS[m])); } }
      out.push(c);
    }
    obPut('nq:' + OBX.slug, out);
  }
  function obInit(me, cb) {
    OBX.slug = String(me.driver_name || me.full_name || 'x').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    obOpen(function () {
      obGet('nq:' + OBX.slug, function (v) {
        var n = 0, k, m, e, has;
        if (v && v.length) {
          for (k = 0; k < v.length; k++) {
            e = v[k];
            if (e.kind === 'wait' && e.wrec) { has = false; for (m = 0; m < WAITS.length; m++) { if (WAITS[m].id === e.wrec.id) has = true; } if (!has) WAITS.push(e.wrec); }
            delete e.wrec; NQ.push(e); n++;
          }
        }
        OBX.sig = obSig(); cb(n);
      });
    });
  }
  setInterval(obSave, 700);
  window.addEventListener('pagehide', obSave);
  document.addEventListener('visibilitychange', function () { if (document.hidden) obSave(); });
