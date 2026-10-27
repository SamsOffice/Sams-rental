# How index.html is built

index.html is generated. Do not edit it by hand.

1. demo.html is the design demo (copy of the "Sams Office Dashboard" artifact).
2. mk.py empties the demo sample data.
3. asm.py applies patches and appends inject.js to inject7.js (sign-in, loading and saving real data, drivers, Excel, photo storage).
4. Run: python3 asm.py (from this folder). It writes app.html. Copy it to ../index.html.
5. Before every push: extract the largest inline script, run node --check, confirm zero backticks.

Supabase: project ecflvidsdjccfhcbdvvr. Every table has company_id, with tenant isolation policies.
Receipt photos live in the private storage bucket "receipts" at <company_id>/<driver>/<file>.jpg.
Driver outbox: queued changes and photos are saved on the phone (IndexedDB 'sams-outbox') and sent when signal returns, even after the app is closed.
