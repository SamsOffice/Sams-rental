  /* ---- small motion details: press scale, ease-out entrances, short row stagger, success pulse. Off for reduced motion and while offline. ---- */
  var AUTOV = false, ROWT = 0;
  (function () {
    var css = '@media (prefers-reduced-motion: no-preference) {' +
      'html:not(.offl) button:active:not(:disabled), html:not(.offl) .btn:active { transform: scale(.97); transition: transform 90ms ease-out; }' +
      'html:not(.offl) .modal:not([hidden]) > :not(.mbar) { animation: nbUp 200ms cubic-bezier(.2,.7,.2,1) both; }' +
      'html:not(.offl) body.rows-in .card { animation: nbFade 200ms ease-out both; }' +
      'html:not(.offl) body.rows-in tbody tr { animation: nbRow 220ms cubic-bezier(.2,.7,.2,1) both; }';
    for (var i = 1; i <= 8; i++) css += 'html:not(.offl) body.rows-in tbody tr:nth-child(' + i + ') { animation-delay: ' + ((i - 1) * 30) + 'ms; }';
    css += 'html:not(.offl) .toast.pulse { animation: nbPulse 520ms ease-out; }' +
      '@keyframes nbUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }' +
      '@keyframes nbFade { from { opacity: 0; } to { opacity: 1; } }' +
      '@keyframes nbRow { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }' +
      '@keyframes nbPulse { 0% { box-shadow: 0 0 0 0 rgba(34,197,94,.65); } 100% { box-shadow: 0 0 0 14px rgba(34,197,94,0); } }' +
      '}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    function net() { document.documentElement.classList.toggle('offl', navigator.onLine === false); }
    window.addEventListener('online', net); window.addEventListener('offline', net); net();
  })();
  var setView0 = setView;
  setView = function () {
    var r = setView0.apply(this, arguments);
    if (!AUTOV) {
      var b = document.body; b.classList.remove('rows-in'); void b.offsetWidth; b.classList.add('rows-in');
      clearTimeout(ROWT); ROWT = setTimeout(function () { b.classList.remove('rows-in'); }, 600);
    }
    return r;
  };
  var toast0 = toast;
  toast = function (t) {
    toast0(t);
    if (/guardad|saved|approv|aprobad|copied|copiad|sent|enviad|delet|elimin|created|creada|confirm|added|agregad|moved|movid/i.test(String(t))) {
      var el = document.getElementById('toast'); if (el) { el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); }
    }
  };
