  /* ---- driver app: show only today (plus anything overdue) by default; button for other days and coworkers ---- */
  function drvTodayKey() { var t = TODAYISO().split('-'); return (parseInt(t[1], 10) - 1) * 100 + parseInt(t[2], 10); }
  function drvDayKey(t) { return Math.floor(dKey(t) / 10000); }
  function drvAllList(me) {
    var all = [], k, j, items, h = '', last = '';
    for (k = 0; k < LNAMES.length; k++) { items = drvItems(LNAMES[k], false); for (j = 0; j < items.length; j++) { items[j].who = LNAMES[k]; all.push(items[j]); } }
    all.sort(function (a, b) { return dKey(a.time) - dKey(b.time); });
    if (!all.length) return '<div class="daempty"><b>No hay trabajos</b>Nadie tiene trabajos activos</div>';
    for (k = 0; k < all.length; k++) {
      var d = all[k], day = String(d.time || 'Sin fecha').split(',')[0], tk = drvDayKey(d.time);
      if (day !== last) { last = day; h += '<div class="dasec">' + invEsc(day) + (tk === drvTodayKey() ? ' (Hoy)' : '') + '</div>'; }
      h += '<div class="dadone"><div><b>' + invEsc(d.title) + '</b><small>' + invEsc(d.client) + ' &middot; ' + invEsc(d.time || '') + ' &middot; ' + (d.who === me ? 'Tuyo' : invEsc(d.who)) + '</small></div></div>';
    }
    return h;
  }
