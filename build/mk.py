import re
s=open('demo.html').read()
def find_arr(s,name):
    m=re.search(r'(?m)^(\s*)var '+name+r'\s*=\s*\[',s)
    i=m.end()-1; d=0; j=i
    while True:
        c=s[j]
        if c=='[': d+=1
        elif c==']':
            d-=1
            if d==0: break
        elif c in '\'"':
            q=c; j+=1
            while s[j]!=q:
                if s[j]=='\\': j+=1
                j+=1
        j+=1
    return i,j
for n in ['JOBS','RENTALS','DISP','CLIENTS','INBOX','DOCS','INVS','ASSETS','RCPTS','CAL_EV','CONFS','EXTRA','WAITS','PAYLOG','TXTLOG','PERMITS','DLOG','CFLEET']:
    if n=='WAITS':
        s=s.replace("var WAITS = [{ id: 'W1', key: 'd3', jid: 1042, rid: '', who: 'Sams', ri: 0, min: 47, at: '11:20 AM', sent: true }]","var WAITS = []")
        continue
    i,j=find_arr(s,n); s=s[:i]+'[]'+s[j+1:]
open('app.html','w').write(s)
