  /* ---- Stage 3: driver mode ---- */
  function startDriverMode(me) {
    document.body.className += ' drvmode';
    var nm = me.driver_name || me.full_name || '';
    openDrv(nm);
    var bar = document.querySelector('#drvApp .dabar span'); if (bar) bar.textContent = 'Sams Office';
    var nb = document.getElementById('drvNet'); if (nb) nb.hidden = true;
    sendLoc(); if (navigator.onLine === false) goOffline();
    var cb = document.getElementById('drvClose'); if (cb) cb.textContent = 'Salir';
  }
  document.getElementById('drvClose').addEventListener('click', async function (e) {
    if (document.body.className.indexOf('drvmode') < 0) return;
    e.stopImmediatePropagation(); await SB.auth.signOut(); location.reload();
  }, true);
  setInterval(function () {
    if (document.body.className.indexOf('drvmode') < 0 || !ME) return;
    if (WACT || DAPP.scan || document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if (SYNC_FAIL || NQ.length) { if (!NET_OFF) syncSoon(); return; }
    loadAll().then(function () { paintAll(); drawDrv(); });
  }, 60000);

  function sendLoc() {
    if (LOCOK === false || !navigator.geolocation || !ME || NET_OFF || document.body.className.indexOf('drvmode') < 0) return;
    navigator.geolocation.getCurrentPosition(function (p) {
      var w = ME.driver_name || ME.full_name;
      SB.from('app_records').upsert({ kind: 'loc', id: w, data: { id: w, who: w, lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy, at: new Date().toISOString() } });
    }, function () {}, { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 });
  }
  setInterval(sendLoc, 45000);
  window.addEventListener('offline', function () { if (document.body.className.indexOf('drvmode') >= 0) goOffline(); });
  window.addEventListener('online', function () { if (document.body.className.indexOf('drvmode') >= 0) { goOnline(); setTimeout(syncSoon, 2200); } });
