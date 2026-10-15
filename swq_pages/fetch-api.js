// Fetch the full catalog from the SoftWinQuote designer API using the
// bundle's hardcoded bearer token. Walks all aluminium series -> profiles.
const fs = require('fs');
const path = require('path');

const TOKEN = 'Bearer base64:SsD5Hv4W4ZHnasGRikYR/w/Be0s56D6DAgaNe0wtvRI=';
const BASE = 'https://www.softwinquote.com';
const OUT = path.join(__dirname, 'api');
fs.mkdirSync(OUT, { recursive: true });

async function api(ep, params = {}) {
  const url = new URL(BASE + ep);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: { Authorization: TOKEN, Accept: 'application/json' },
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* non-json */ }
  return { status: res.status, json, text };
}

(async () => {
  const result = { company: 'Vitco', glasses: null, colors: null, series: [] };

  // Glasses (name -> id map)
  const g = await api('/api/getAllGlasses');
  result.glasses = g.json?.data ?? null;
  console.log('glasses:', g.status, result.glasses ? Object.keys(result.glasses).length + ' entries' : 'none');

  // Colors (endpoint has a server bug; try anyway)
  const c = await api('/api/getColors', { company_name: 'Vitco' });
  result.colors = c.json?.data ?? null;
  console.log('colors:', c.status, result.colors ? 'ok' : '(server error — skipping)');

  // Series for aluminium
  const s = await api('/api/aluminium/getSeries', { company_name: 'Vitco' });
  const seriesList = s.json?.data ?? [];
  console.log('series:', s.status, seriesList.length);

  // Window types to probe for profiles (profiles differ by window_type/type).
  const types = ['window', 'door'];
  for (const ser of seriesList) {
    const entry = { id: ser.id, name: ser.name, profiles: {} };
    for (const ty of types) {
      const p = await api('/api/aluminium/getProfiles', {
        company_name: 'Vitco',
        series_name: ser.name,
        type: ty,
        window_type: ty,
      });
      if (p.json?.data) {
        // merge non-empty profile groups
        for (const [grp, arr] of Object.entries(p.json.data)) {
          if (Array.isArray(arr) && arr.length) {
            entry.profiles[grp] = entry.profiles[grp] || [];
            // de-dupe by profile_code
            const seen = new Set(entry.profiles[grp].map((x) => x.profile_code || x.name));
            for (const item of arr) {
              const key = item.profile_code || item.name;
              if (!seen.has(key)) { entry.profiles[grp].push(item); seen.add(key); }
            }
          }
        }
      }
    }
    const counts = Object.entries(entry.profiles).map(([k, v]) => `${k}:${v.length}`).join(' ');
    console.log(`  ${ser.name} -> ${counts || '(none)'}`);
    result.series.push(entry);
  }

  fs.writeFileSync(path.join(OUT, 'catalog.json'), JSON.stringify(result, null, 2));
  console.log('\nWrote api/catalog.json');
})();
