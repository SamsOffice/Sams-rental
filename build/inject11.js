  /* ---- invoice: copy and paste into Excel / Sheets / Numbers keeping the invoice look ---- */
  function invCopyHtml(d) {
    var items = d.items || [], sub = 0, i, B = 'border:1px solid #111;', rows = '';
    for (i = 0; i < items.length; i++) sub += parseFloat(items[i].amount) || 0;
    for (i = 0; i < Math.max(8, items.length + 1); i++) {
      var it = items[i];
      rows += '<tr><td style="' + B + 'padding:6px 8px;height:26px">' + (it ? invEsc(it.desc) : '&nbsp;') + '</td><td style="' + B + 'padding:6px 8px;text-align:center">' + (it && it.date ? invEsc(invShort(it.date)) : '&nbsp;') + '</td><td style="' + B + 'padding:6px 8px;text-align:right">' + (it ? '$' + invMoney(it.amount) : '&nbsp;') + '</td></tr>';
    }
    var F = 'font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111;';
    return '<table style="' + F + 'border-collapse:collapse;width:640px"><colgroup><col style="width:360px"><col style="width:150px"><col style="width:130px"></colgroup>' +
      '<tr><td colspan="3" style="font-size:22px;font-weight:bold;padding:8px 0;text-align:center">' + invEsc(INV_CO.name) + '</td></tr>' +
      '<tr><td colspan="2" style="padding:2px 0">' + invEsc(INV_CO.addr1) + '</td><td style="text-align:right"><b>Invoice No.</b> ' + invEsc(d.invNo) + '</td></tr>' +
      '<tr><td colspan="2" style="padding:2px 0">' + invEsc(INV_CO.addr2) + '</td><td style="text-align:right"><b>Date:</b> ' + invEsc(invLong(d.invDate)) + '</td></tr>' +
      '<tr><td colspan="3" style="padding:2px 0">' + invEsc(INV_CO.phone) + '</td></tr>' +
      '<tr><td colspan="3" style="padding:2px 0 12px">' + invEsc(INV_CO.bic) + '</td></tr>' +
      '<tr><td colspan="3" style="padding:2px 0"><b>Bill to:</b> ' + invEsc(d.billTo) + '</td></tr>' +
      '<tr><td colspan="3" style="padding:2px 0"><b>Address:</b> ' + invEsc(d.addr1) + (d.addr2 ? ', ' + invEsc(d.addr2) : '') + '</td></tr>' +
      '<tr><td colspan="3" style="padding:2px 0 12px"><b>Phone:</b> ' + invEsc(d.phone) + '</td></tr>' +
      '<tr><td style="' + B + 'padding:6px 8px;font-weight:bold;background:#E5E7EB">Description</td><td style="' + B + 'padding:6px 8px;font-weight:bold;text-align:center;background:#E5E7EB">Date</td><td style="' + B + 'padding:6px 8px;font-weight:bold;text-align:right;background:#E5E7EB">Amount</td></tr>' +
      rows +
      '<tr><td colspan="2" style="padding:6px 8px;text-align:right">Sales Tax</td><td style="' + B + 'padding:6px 8px;text-align:right">&nbsp;</td></tr>' +
      '<tr><td colspan="2" style="padding:6px 8px;text-align:right">Other</td><td style="' + B + 'padding:6px 8px;text-align:right">&nbsp;</td></tr>' +
      '<tr><td colspan="2" style="padding:8px;text-align:right;font-weight:bold;font-size:16px">TOTAL</td><td style="' + B + 'padding:8px;text-align:right;font-weight:bold;font-size:16px;background:#E5E7EB">$' + invMoney(sub) + '</td></tr>' +
      (d.paid ? '<tr><td colspan="3" style="padding:8px;text-align:center;font-weight:bold;font-size:20px;color:#15803D">PAID</td></tr>' : '') + '</table>';
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
