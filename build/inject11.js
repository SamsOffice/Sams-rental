  /* ---- invoice: copy and paste into Excel / Sheets / Numbers keeping the invoice look ---- */
  function invCopyHtml(d) {
    var items = d.items || [], sub = 0, i, G = 'border:1px solid #808080;', BL = '#CCECF8', rows = '';
    for (i = 0; i < items.length; i++) sub += parseFloat(items[i].amount) || 0;
    for (i = 0; i < Math.max(8, items.length + 1); i++) {
      var it = items[i];
      rows += '<tr bgcolor="#F0F0F0" style="background:#F0F0F0;font-style:italic"><td style="' + G + 'padding:6px 8px;height:26px">' + (it ? invEsc(it.desc) : '&nbsp;') + '</td><td style="' + G + 'padding:6px 8px;text-align:center">' + (it && it.date ? invEsc(invShort(it.date)) : '&nbsp;') + '</td><td style="' + G + 'padding:6px 8px;text-align:right">' + (it ? '$' + invMoney(it.amount) : '&nbsp;') + '</td></tr>';
    }
    var F = 'font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111;';
    var rule = 'border-bottom:3px solid #489CD4;';
    return '<table style="' + F + 'border-collapse:collapse;width:640px"><colgroup><col style="width:360px"><col style="width:150px"><col style="width:130px"></colgroup>' +
      '<tr><td colspan="3" style="font-size:26px;font-weight:bold;color:#6A9AD0;padding:8px 0 4px;border-bottom:3px solid #808080">' + invEsc(INV_CO.name) + '</td></tr>' +
      '<tr><td style="padding:3px">' + invEsc(INV_CO.addr1) + '</td><td bgcolor="' + BL + '" style="background:' + BL + '">&nbsp;</td><td style="text-align:right;padding:3px"><b>Invoice No.</b> ' + invEsc(d.invNo) + '</td></tr>' +
      '<tr><td style="padding:3px">' + invEsc(INV_CO.addr2) + '</td><td bgcolor="' + BL + '" style="background:' + BL + '">&nbsp;</td><td style="text-align:right;padding:3px"><b>Invoice Date:</b> ' + invEsc(invLong(d.invDate)) + '</td></tr>' +
      '<tr><td style="padding:3px">&nbsp;</td><td bgcolor="' + BL + '" style="background:' + BL + '">&nbsp;</td><td></td></tr>' +
      '<tr><td style="padding:3px">' + invEsc(INV_CO.phone) + '</td><td bgcolor="' + BL + '" style="background:' + BL + ';padding:3px"><b>Bill to :</b></td><td style="text-align:right;padding:3px">' + invEsc(d.billTo) + '</td></tr>' +
      '<tr><td style="padding:3px">' + invEsc(INV_CO.bic) + '</td><td bgcolor="' + BL + '" style="background:' + BL + ';padding:3px"><b>Address:</b></td><td style="text-align:right;padding:3px">' + invEsc(d.addr1) + (d.addr2 ? ', ' + invEsc(d.addr2) : '') + '</td></tr>' +
      '<tr><td style="padding:3px;' + rule + '">&nbsp;</td><td bgcolor="' + BL + '" style="background:' + BL + ';padding:3px;' + rule + '"><b>Phone</b></td><td style="text-align:right;padding:3px;' + rule + '">' + invEsc(d.phone) + '</td></tr>' +
      '<tr><td colspan="3" style="height:14px">&nbsp;</td></tr>' +
      '<tr bgcolor="' + BL + '" style="background:' + BL + ';font-weight:bold"><td style="' + G + 'padding:10px 8px">Description</td><td style="' + G + 'padding:10px 8px;text-align:center">Date</td><td style="' + G + 'padding:10px 8px;text-align:right">Amount</td></tr>' +
      rows +
      '<tr><td colspan="2" style="padding:8px;text-align:right">Sales Tax</td><td style="padding:8px;text-align:right;border-left:3px solid #489CD4">&nbsp;</td></tr>' +
      '<tr><td colspan="2" style="padding:8px;text-align:right">Other</td><td style="padding:8px;text-align:right;border-left:3px solid #489CD4">&nbsp;</td></tr>' +
      '<tr bgcolor="' + BL + '" style="background:' + BL + ';font-weight:bold"><td colspan="2" style="padding:8px;text-align:right;border-top:1px solid #808080;border-bottom:3px double #808080">TOTAL</td><td style="padding:8px;text-align:right;font-size:18px;border-top:1px solid #808080;border-bottom:3px double #808080">$' + invMoney(sub) + '</td></tr>' +
      (d.paid ? '<tr><td colspan="3" style="padding:8px;text-align:right;font-weight:bold;font-size:18px;color:#065F46">PAID</td></tr>' : '') + '</table>';
  }
  function invCopyText(d) {
    var items = d.items || [], sub = 0, i, t = INV_CO.name + '\n' + INV_CO.addr1 + '\n' + INV_CO.addr2 + '\n' + INV_CO.phone + '\n' + INV_CO.bic + '\n\nInvoice No.\t' + d.invNo + '\nInvoice Date\t' + invLong(d.invDate) + '\n\nBill to\t' + d.billTo + '\nAddress\t' + d.addr1 + (d.addr2 ? ', ' + d.addr2 : '') + '\nPhone\t' + d.phone + '\n\nDescription\tDate\tAmount\n';
    for (i = 0; i < items.length; i++) { sub += parseFloat(items[i].amount) || 0; t += items[i].desc + '\t' + (items[i].date ? invShort(items[i].date) : '') + '\t$' + invMoney(items[i].amount) + '\n'; }
    return t + '\nTOTAL\t\t$' + invMoney(sub) + (d.paid ? '\nPAID' : '');
  }
  function downloadXls(d) {
    if (!d) return;
    var html = invCopyHtml(d), text = invCopyText(d);
    function fallback() {
      var el = document.createElement('div'); el.contentEditable = 'true'; el.style.cssText = 'position:fixed;left:0;top:0;opacity:0;background:#fff'; el.innerHTML = html; document.body.appendChild(el);
      var rg = document.createRange(); rg.selectNodeContents(el); var sl = window.getSelection(); sl.removeAllRanges(); sl.addRange(rg);
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      sl.removeAllRanges(); document.body.removeChild(el);
      toast(ok ? 'Invoice copied. Open Excel and paste.' : 'Could not copy. Try again.');
    }
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([text], { type: 'text/plain' }) })]).then(function () { toast('Invoice copied. Open Excel and paste.'); }, fallback);
      } else fallback();
    } catch (e) { fallback(); }
  }
  /* ---- office: refresh driver pins every 15 seconds on Dispatch and Drivers ---- */
  setInterval(function () {
    if (!ME || isDrv() || (curView !== 'dispatch' && curView !== 'drivers')) return;
    var ae = document.activeElement; if (ae && /INPUT|TEXTAREA|SELECT/.test(ae.tagName)) return;
    var before = JSON.stringify(LOCS), cv = curView;
    loadRecs().then(function () { if (curView === cv && JSON.stringify(LOCS) !== before) setView(cv); });
  }, 15000);
  /* ---- driver notes: flag on job rows + count on the menu until the office opens the job ---- */
  function dnSeen() { try { return JSON.parse(localStorage.getItem('sams-dn-seen:' + OBX.slug) || '{}'); } catch (e) { return {}; } }
  function dnMark(key, text) { var s = dnSeen(); s[key] = text; try { localStorage.setItem('sams-dn-seen:' + OBX.slug, JSON.stringify(s)); } catch (e) { } }
  function dnUnread(kind) {
    var s = dnSeen(), n = 0, k, list = kind === 'd' ? JOBS : RENTALS;
    for (k = 0; k < list.length; k++) { if (list[k].dn && s[kind + list[k].id] !== list[k].dn) n++; }
    return n;
  }
  var badgeCount0 = badgeCount;
  badgeCount = function (v) { var n = badgeCount0(v); if (!ME || isDrv()) return n; if (v === 'dumping') n += dnUnread('d'); else if (v === 'rentals') n += dnUnread('r'); return n; };
  function dnDecorate() {
    if (!ME || isDrv()) return;
    var s = dnSeen(), rows = document.querySelectorAll('tr[data-id],tr[data-r]'), k, tr, kind, id, list, j, q, has;
    for (k = 0; k < rows.length; k++) {
      tr = rows[k]; kind = tr.hasAttribute('data-r') ? 'r' : 'd'; id = tr.getAttribute(kind === 'r' ? 'data-r' : 'data-id'); list = kind === 'r' ? RENTALS : JOBS; j = null;
      for (q = 0; q < list.length; q++) { if (String(list[q].id) === String(id)) { j = list[q]; break; } }
      has = j && j.dn && s[kind + j.id] !== j.dn; var old = tr.querySelector('.dnflag');
      if (has && !old) { var td = tr.querySelector('td'); if (td) { var sp = document.createElement('span'); sp.className = 'dnflag'; sp.style.cssText = 'display:inline-block;margin-left:6px;padding:1px 7px;border-radius:99px;background:#FEF3C7;color:#92400E;font:700 11px system-ui'; sp.textContent = 'Driver note'; td.appendChild(sp); } }
      else if (!has && old) old.parentNode.removeChild(old);
    }
  }
  document.addEventListener('click', function (e) {
    if (!ME || isDrv()) return;
    var tr = e.target.closest && e.target.closest('tr[data-id],tr[data-r]'); if (!tr) return;
    var kind = tr.hasAttribute('data-r') ? 'r' : 'd', id = tr.getAttribute(kind === 'r' ? 'data-r' : 'data-id'), list = kind === 'r' ? RENTALS : JOBS, q;
    for (q = 0; q < list.length; q++) { if (String(list[q].id) === String(id) && list[q].dn) { dnMark(kind + list[q].id, list[q].dn); break; } }
    setTimeout(function () { updPBadge(); dnDecorate(); }, 50);
  }, true);
  setInterval(function () { try { dnDecorate(); updPBadge(); } catch (e) { } }, 1500);
