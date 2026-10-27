  /* ---- receipt photos in Supabase Storage (private bucket 'receipts') ---- */
  var PHC = {}, PHPEND = {}, PH_BLANK = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120"><rect width="240" height="120" fill="#F3F4F6"/><text x="120" y="64" font-size="14" text-anchor="middle" fill="#6B7280" font-family="sans-serif">Loading photo...</text></svg>');
  function phSlug(s) { return String(s || 'office').toLowerCase().replace(/[^a-z0-9]+/g, '-'); }
  function prepPh(file) {
    return new Promise(function (resolve) {
      if (!file || !file.type || file.type.indexOf('image/') !== 0 || typeof file.size !== 'number') { resolve(file); return; }
      var url = ''; try { url = URL.createObjectURL(file); } catch (e) { resolve(file); return; }
      var im = new Image();
      im.onload = function () {
        try {
          var w = im.naturalWidth, h = im.naturalHeight, sc = Math.min(1, 1600 / Math.max(w, h)), c = document.createElement('canvas');
          c.width = Math.round(w * sc); c.height = Math.round(h * sc); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url);
          c.toBlob(function (b) { resolve(b || file); }, 'image/jpeg', 0.8);
        } catch (e) { resolve(file); }
      };
      im.onerror = function () { try { URL.revokeObjectURL(url); } catch (e) { } resolve(file); };
      im.src = url;
    });
  }
  function upPh(fileOrBlob, who) {
    var cid = ME && ME.company_id;
    if (!cid) return Promise.reject(new Error('No company'));
    return prepPh(fileOrBlob).then(function (b) {
      var path = cid + '/' + phSlug(who) + '/' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7) + '.jpg';
      return SB.storage.from('receipts').upload(path, b, { contentType: 'image/jpeg', upsert: false }).then(function (r) {
        if (r.error) throw new Error(r.error.message);
        return 'sb:' + path;
      });
    });
  }
  function phSrc(p) {
    if (!p) return '';
    if (p.indexOf('sb:') !== 0) return p;
    var path = p.slice(3);
    if (PHC[path]) return PHC[path];
    if (!PHPEND[path]) {
      PHPEND[path] = 1;
      SB.storage.from('receipts').createSignedUrl(path, 3600).then(function (r) {
        if (r && r.data && r.data.signedUrl) { PHC[path] = r.data.signedUrl; try { refreshAll(); } catch (e) { } }
        else { PHC[path] = PH_BLANK; }
      });
    }
    return PH_BLANK;
  }
  function sendDrvReceipt(key, file) {
    var o = drvFind(key); if (!o || !o.d || !o.d.jid) return;
    if (NET_OFF) {
      if (!file) { NQ.push({ kind: 'rcpt', key: key, blob: null, who: DAPP.name }); drawDrv(); toast('Recibo guardado en el teléfono. Se envía con señal.'); return; }
      prepPh(file).then(function (b) { NQ.push({ kind: 'rcpt', key: key, blob: b, who: DAPP.name }); drawDrv(); toast('Foto guardada en el teléfono. Se envía con señal. No cierres la app.'); });
      return;
    }
    DAPP.scan = { key: key, stage: 'scanning' }; drawDrv();
    var done = function (path) {
      addReceipt({ jid: o.d.jid, from: 'driver', who: DAPP.name, photo: path || '' });
      DAPP.scan = null; if (!document.getElementById('drvApp').hidden) drawDrv(); toast('Recibo enviado a la oficina.'); refreshAll(); syncSoon();
    };
    if (!file) { setTimeout(function () { done(''); }, 600); return; }
    upPh(file, DAPP.name).then(done).catch(function (er) { DAPP.scan = null; if (!document.getElementById('drvApp').hidden) drawDrv(); toast('No se pudo enviar la foto: ' + er.message + '. Intenta de nuevo.'); });
  }
  function flushNQ() {
    var q = NQ.slice(), k, m, e, o; NQ = [];
    for (k = 0; k < q.length; k++) {
      e = q[k];
      if (e.kind === 'move') drvMove(e.key, e.dir);
      else if (e.kind === 'note') drvSaveNote(e.key, e.text);
      else if (e.kind === 'rcpt') {
        o = drvFind(e.key);
        if (o && o.d && o.d.jid) {
          (function (jid, ee) {
            if (!ee.blob) { addReceipt({ jid: jid, from: 'driver', who: ee.who, photo: '' }); return; }
            upPh(ee.blob, ee.who).then(function (p) { addReceipt({ jid: jid, from: 'driver', who: ee.who, photo: p }); refreshAll(); syncSoon(); toast('Foto enviada a la oficina.'); })
              .catch(function (er) { NQ.push(ee); toast('La foto no se pudo enviar todavia: ' + er.message); });
          })(o.d.jid, e);
        }
      }
      else if (e.kind === 'wait') { for (m = 0; m < WAITS.length; m++) { if (WAITS[m].id === e.wid) WAITS[m].sent = true; } }
    }
    return q.length;
  }
