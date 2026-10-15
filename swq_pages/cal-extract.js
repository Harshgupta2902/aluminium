// Extract every design's costed panel_details from the calibration quotations.
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'cal');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.html'));
// also include the original first sample
const extra = [{ file: path.join(__dirname, 'quotation_detail.html'), q: 'first' }];

const samples = [];

function parseFile(html) {
  // Each design is logged as console.log({...}); capture each balanced-ish object.
  const re = /console\.log\((\{"quotation_id"[\s\S]*?\})\);/g;
  let m;
  while ((m = re.exec(html))) {
    let o;
    try { o = JSON.parse(m[1]); } catch { continue; }
    const pd = Array.isArray(o.panel_details) ? o.panel_details : [];
    samples.push({
      design: o.design_name,
      type: o.windowType || (pd[0] && pd[0].category),
      width: o.width,
      height: o.height,
      area_sqft: o.area_sqft,
      window_price: o.window_price,
      track: o.selectedTrack,
      series: o.series_name,
      glass: o.glass_type,
      panels: pd.length,
      panel_cost_total: pd.reduce((s, p) => s + (Number(p.cost) || 0), 0),
      panel_details: pd.map((p) => ({
        cat: p.category, track: p.track, sash: p.sash, interlock: p.interlock,
        handle: p.handle, roller: p.roller, w: p.width, h: p.height, cost: p.cost,
      })),
    });
  }
}

for (const f of files) parseFile(fs.readFileSync(path.join(dir, f), 'utf8'));
for (const e of extra) parseFile(fs.readFileSync(e.file, 'utf8'));

fs.writeFileSync(path.join(__dirname, 'cal', 'samples.json'), JSON.stringify(samples, null, 2));
console.log('total designs:', samples.length);
for (const s of samples) {
  console.log(
    `${(s.design||'?').padEnd(22)} ${String(s.width)}x${String(s.height)} ` +
    `area=${s.area_sqft} panels=${s.panels} cost=${s.panel_cost_total} ` +
    `track=${s.track||'-'} glass=${(s.glass||'').slice(0,20)}`
  );
}
