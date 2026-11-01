  /* ---- driver app tabs: Hoy (today + overdue) | Proximos dias (my later jobs) | Companeros (everyone else's jobs) ---- */
  function drvTodayKey() { var t = TODAYISO().split('-'); return (parseInt(t[1], 10) - 1) * 100 + parseInt(t[2], 10); }
  function drvDayKey(t) { return Math.floor(dKey(t) / 10000); }
  function drvTabs(cur, hid) {
    var T = [['hoy', 'Hoy'], ['prox', 'Próximos días'], ['comp', 'Compañeros']], h = '<div class="databs" role="tablist" style="display:flex;gap:6px;margin:10px 0">', k;
    for (k = 0; k < T.length; k++) {
      var on = cur === T[k][0];
      h += '<button role="tab" aria-selected="' + on + '" data-d="dtab" data-k="' + T[k][0] + '" style="flex:1;padding:12px 6px;border-radius:12px;font:600 15px inherit;font-family:inherit;cursor:pointer;border:2px solid #1D6FEF;' + (on ? 'background:#1D6FEF;color:#fff' : 'background:#fff;color:#1D6FEF') + '">' + T[k][1] + '</button>';
    }
    return h + '</div>';
  }
  function drvList(me, mine, onlyMine) {
    var all = [], k, j, items, h = '', last = '', tk0 = drvTodayKey();
    if (onlyMine) { for (k = 0; k < mine.length; k++) { if (drvDayKey(mine[k].time) > tk0 && dKey(mine[k].time) < 1e9) { mine[k].who = me; all.push(mine[k]); } } }
    else { for (k = 0; k < LNAMES.length; k++) { if (LNAMES[k] === me) continue; items = drvItems(LNAMES[k], false); for (j = 0; j < items.length; j++) { items[j].who = LNAMES[k]; all.push(items[j]); } } }
    all.sort(function (a, b) { return dKey(a.time) - dKey(b.time); });
    if (!all.length) return '<div class="daempty"><b>' + (onlyMine ? 'No tienes más trabajos' : 'Tus compañeros no tienen trabajos') + '</b>' + (onlyMine ? 'Aquí verás tus trabajos de los próximos días' : 'Aquí verás los trabajos de los demás') + '</div>';
    for (k = 0; k < all.length; k++) {
      var d = all[k], day = String(d.time || 'Sin fecha').split(',')[0], tk = drvDayKey(d.time);
      if (day !== last) { last = day; h += '<div class="dasec">' + invEsc(day) + (tk === tk0 ? ' (Hoy)' : '') + '</div>'; }
      h += '<div class="dadone"><div><b>' + invEsc(d.title) + '</b><small>' + (onlyMine ? '' : invEsc(d.who) + ' &middot; ') + invEsc(d.client) + ' &middot; ' + invEsc(d.time || '') + (d.addr ? ' &middot; ' + invEsc(d.addr) : '') + '</small></div></div>';
    }
    return h;
  }
