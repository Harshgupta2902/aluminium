// Extract table/form data from crawled SoftWinQuote pages.
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const read = (f) => fs.readFileSync(path.join(DIR, f), 'utf8');

function decodeEntities(s) {
  return String(s)
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&'); // last, so &amp;quot; etc. aren't double-decoded
}

function stripTags(s) {
  return decodeEntities(s.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

// --- Aluminium Setting: label rows + input name/value ---
function aluminiumSetting() {
  const html = read('aluminium_setting.html');
  const out = [];
  // Each row: <td>N</td><td>Label</td><td><input name=.. value=..></td><td>Unit</td>
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let m;
  while ((m = rowRe.exec(html))) {
    const row = m[1];
    const tds = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((t) => t[1]);
    if (!tds.length) continue;
    const input = row.match(/<input\b[^>]*>/i);
    let name = null, value = null, checkbox = null;
    if (input) {
      const nm = input[0].match(/name="([^"]*)"/i);
      const vl = input[0].match(/value="([^"]*)"/i);
      const type = input[0].match(/type="([^"]*)"/i);
      name = nm ? nm[1] : null;
      value = vl ? vl[1] : null;
      if (type && /checkbox/i.test(type[1])) checkbox = /checked/i.test(input[0]);
    }
    const label = stripTags(tds[1] || tds[0] || '');
    const unit = stripTags(tds[tds.length - 1] || '');
    if (name && !/_token|_method|csrf/.test(name)) {
      out.push({ label, name, value, unit, checkbox });
    }
  }
  return out;
}

// --- Generic data table (Hardware/Coatings/Stock/Glass): read headers + rows ---
function dataTable(file) {
  const html = read(file);
  // find all tables, pick the one with the most <tr>
  const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)].map((t) => t[0]);
  let best = tables.sort((a, b) => (b.match(/<tr/gi) || []).length - (a.match(/<tr/gi) || []).length)[0] || '';
  const headers = [...best.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((h) => stripTags(h[1]));
  const rows = [];
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let m;
  while ((m = trRe.exec(best))) {
    const row = m[1];
    if (/<th/i.test(row)) continue;
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => {
      const input = c[1].match(/<input\b[^>]*value="([^"]*)"[^>]*>/i);
      if (input) return decodeEntities(input[1]).trim();
      const sel = c[1].match(/<option[^>]*selected[^>]*>([\s\S]*?)<\/option>/i);
      if (sel) return stripTags(sel[1]);
      return stripTags(c[1]);
    });
    if (cells.some((x) => x)) rows.push(cells);
  }
  return { headers, rows };
}

const result = {
  aluminium_setting: aluminiumSetting(),
  aluminium_accessories: dataTable('aluminium_accessories.html'),
  coatings: dataTable('coatings.html'),
  aluminium_stock: dataTable('aluminium_stock.html'),
  glass: dataTable('glass.html'),
};

fs.writeFileSync(path.join(DIR, 'extracted.json'), JSON.stringify(result, null, 2));

// Pretty print summary
for (const [k, v] of Object.entries(result)) {
  console.log('\n######## ' + k + ' ########');
  if (Array.isArray(v)) {
    v.forEach((r) => console.log(`  ${r.label} [${r.name}] = ${r.value}${r.checkbox != null ? ' (chk:' + r.checkbox + ')' : ''} ${r.unit ? '(' + r.unit + ')' : ''}`));
  } else {
    console.log('  headers: ' + v.headers.join(' | '));
    console.log('  rows: ' + v.rows.length);
    v.rows.slice(0, 200).forEach((r) => console.log('   - ' + r.join(' | ')));
  }
}
