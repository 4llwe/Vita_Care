#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:?Set BASE_URL=https://your-domain}"
retry(){ url="$1"; for i in $(seq 1 30);do curl -fsS --max-time 10 "$url"&&return 0;sleep 5;done;return 1;}
retry "$BASE_URL/api/health" >/tmp/vitacare-health.json
retry "$BASE_URL/api/health/ready" >/tmp/vitacare-ready.json
retry "$BASE_URL/api/menus" >/tmp/vitacare-menus.json
node - <<'NODE'
const fs=require('fs');const h=JSON.parse(fs.readFileSync('/tmp/vitacare-ready.json'));const m=JSON.parse(fs.readFileSync('/tmp/vitacare-menus.json'));if(h.status!=='ready')throw Error('readiness failed');if(!Array.isArray(m)||m.length<14)throw Error('menu groups below baseline');const count=m.reduce((n,g)=>n+(g.items?.length||0),0);if(count<117)throw Error(`menu items below baseline: ${count}`);console.log(JSON.stringify({ready:h.status,version:h.version,groups:m.length,items:count}));
NODE
for path in / /login /direktori /informasi/kontak/hubungi-kami;do curl -fsS --max-time 15 "$BASE_URL$path" >/dev/null;done
echo "Production smoke tests passed"
