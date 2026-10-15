// Generate seed.sql from extracted.json (settings-page data) +
// api/catalog.json (designer API: series-scoped profiles, colors).
const fs = require('fs');
const path = require('path');
const d = require('./extracted.json');
const catalog = require('./api/catalog.json');

const q = (s) => "'" + String(s ?? '').replace(/'/g, "''").trim() + "'";
const num = (v) => {
  const n = Number(String(v ?? '').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const L = [];
L.push('-- =============================================================================');
L.push('-- seed.sql — SoftWinQuote catalog seed data (scraped from the live original)');
L.push('-- =============================================================================');
L.push('-- HOW TO USE:');
L.push('--   1. Set :owner below to YOUR Supabase auth user id (from auth.users).');
L.push("--      Find it: SELECT id, email FROM auth.users;");
L.push('--   2. Run this whole file in the Supabase SQL Editor.');
L.push('-- All catalog rows are owned by that user (created_by) so RLS lets you see them.');
L.push('-- Re-running is safe-ish: it DELETEs this owner\'s existing catalog rows first.');
L.push('-- =============================================================================');
L.push('');
L.push('DO $$');
L.push('DECLARE');
L.push('  owner UUID;');
L.push('BEGIN');
L.push('  -- >>> EDIT THIS: pick your user. Defaults to the first profile. <<<');
L.push('  SELECT id INTO owner FROM public.profiles ORDER BY created_at LIMIT 1;');
L.push('  IF owner IS NULL THEN');
L.push("    RAISE EXCEPTION 'No profile found. Create a user first, then re-run.';");
L.push('  END IF;');
L.push('');
L.push('  -- Clean this owner\'s existing catalog rows so the seed is idempotent.');
L.push('  DELETE FROM public.series_profiles    WHERE created_by = owner;');
L.push('  DELETE FROM public.design_accessories WHERE created_by = owner;');
L.push('  DELETE FROM public.design_glasses     WHERE created_by = owner;');
L.push('  DELETE FROM public.design_colors      WHERE created_by = owner;');
L.push('  DELETE FROM public.aluminium_series   WHERE created_by = owner;');
L.push('');

/* ---------- 1. design_glasses (Name | Price) — incl. mesh rows ---------- */
L.push('  -- ---- Glass + mesh options (design_glasses) ----');
d.glass.rows.forEach((r, i) => {
  const [name, price] = r;
  if (!name) return;
  L.push(`  INSERT INTO public.design_glasses (name, rate_per_sqft, sort_order, created_by) VALUES (${q(name)}, ${num(price)}, ${i + 1}, owner);`);
});
L.push('');

/* ---------- 2. design_accessories (Type | Name | Code | Price) ---------- */
// Map original types -> our CHECK-constrained kinds.
const KIND_MAP = {
  lock: 'lock',
  aluminium_handle: 'handle',
  aluminium_hinges: 'hinge',
  aluminium_roller: 'roller',
  aluminium_friction: 'friction_stay',
  aluminium_mesh_component: 'mesh',
  common: 'common', // dedicated 'common' kind (added via updates.sql)
};
L.push('  -- ---- Hardware / accessories (design_accessories) ----');
L.push('  -- original type -> our kind: handle->handle, hinges->hinge, roller->roller,');
L.push("  --   friction->friction_stay, mesh_component->mesh, lock->lock, common->common");
d.aluminium_accessories.rows.forEach((r, i) => {
  const [type, name, code, price] = r;
  if (!name) return;
  const kind = KIND_MAP[type] || 'handle';
  const codeVal = code && code.trim() ? q(code) : 'NULL';
  L.push(`  INSERT INTO public.design_accessories (kind, name, code, price, sort_order, created_by) VALUES (${q(kind)}, ${q(name)}, ${codeVal}, ${num(price)}, ${i + 1}, owner);`);
});
L.push('');

/* ---------- 3. aluminium_series (Company | Series | Available Length + external_id) ---------- */
// Merge coatings (company+series) with stock (adds available length) and the
// API catalog (adds the stable external_id used to attach profiles).
const stockByKey = new Map();
d.aluminium_stock.rows.forEach((r) => {
  const [company, series, len] = r;
  if (company && series) stockByKey.set(company + '|' + series, len || '');
});
const company = catalog.company || 'Vitco';
// name -> external id (from the designer API)
const seriesIdByName = new Map(catalog.series.map((s) => [s.name, s.id]));
// Use the API series list as the source of truth (it has ids + matches profiles).
L.push('  -- ---- Profile Company + Series registry (aluminium_series) ----');
L.push('  -- company + series + available_length + external_id (API series id).');
L.push("  -- Insert each series and capture its new UUID into a temp map via a CTE-less");
L.push('  -- approach: we insert then look up by (created_by, external_id) when seeding profiles.');
catalog.series.forEach((s, i) => {
  const len = stockByKey.get(company + '|' + s.name) || '';
  const lenVal = len ? q(len) : 'NULL';
  L.push(`  INSERT INTO public.aluminium_series (company, series_name, available_length, external_id, material, sort_order, created_by) VALUES (${q(company)}, ${q(s.name)}, ${lenVal}, ${q(s.id)}, 'aluminium', ${i + 1}, owner);`);
});
L.push('');

/* ---------- 3b. series_profiles (series-scoped tracks/sashes/etc.) ---------- */
// Only real profile groups (skip meshes/slider_type — those are pick-lists
// already covered by glass/accessories).
const PROFILE_GROUPS = ['track', 'sash', 'mesh_sash', 'interlock', 'clip', 'mesh_clip', 'mullion', 'slim_interlock', 'slim_huricane', 'outer_top', 'outer_left'];
L.push('  -- ---- Series-scoped profiles (series_profiles) ----');
L.push('  -- Each row attaches to its series by looking up external_id for this owner.');
let profCount = 0;
catalog.series.forEach((s) => {
  let order = 0;
  for (const grp of PROFILE_GROUPS) {
    const arr = s.profiles[grp];
    if (!Array.isArray(arr)) continue;
    for (const p of arr) {
      order += 1;
      profCount += 1;
      const code = p.profile_code ? q(p.profile_code) : 'NULL';
      const name = p.name || p.profile_code || grp;
      const thickness = Number(p.thickness);
      const thVal = Number.isFinite(thickness) && thickness > 0 ? thickness : 'NULL';
      L.push(
        `  INSERT INTO public.series_profiles (series_id, profile_group, profile_code, name, thickness, sort_order, created_by) ` +
        `SELECT id, ${q(grp)}, ${code}, ${q(name)}, ${thVal}, ${order}, owner FROM public.aluminium_series WHERE external_id = ${q(s.id)} AND created_by = owner;`
      );
    }
  }
});
L.push('');

/* ---------- 3c. design_colors (from API) ---------- */
if (Array.isArray(catalog.colors) && catalog.colors.length) {
  L.push('  -- ---- Colours (design_colors) ----');
  catalog.colors.forEach((c, i) => {
    const name = c.color_name || c.name;
    if (!name) return;
    const hex = c.system_color || c.hex || '';
    const hexVal = hex ? q(hex) : 'NULL';
    L.push(`  INSERT INTO public.design_colors (name, hex, sort_order, created_by) VALUES (${q(name)}, ${hexVal}, ${i + 1}, owner);`);
  });
  L.push('');
}

/* ---------- 4. aluminium_cost_settings (upsert the mapped cost heads) ---------- */
const setting = {};
d.aluminium_setting.forEach((row) => { setting[row.name] = row.value; });
const sv = (k) => num(setting[k]);
L.push('  -- ---- Aluminium cost settings (per-user, single row) ----');
L.push('  INSERT INTO public.aluminium_cost_settings (');
L.push('    user_id, aluminium_rate, profit_percentage, labour_charge, coating,');
L.push('    corner_cleat, weather_strip, ss_corner_con, screw, rail, fastner,');
L.push('    dustpad, outer_clit, sash_clit, l_pati, lockguide_cap, interlock_cap,');
L.push('    bubstopper, ugid, lockguid, water_drainage, brassrubber, suitbelt,');
L.push('    slider_width_overlap, slider_height_overlap, slider_glass_overlap, slim_width_overlap,');
L.push('    casement_width_overlap, casement_height_overlap, casement_glass_overlap');
L.push('  ) VALUES (');
L.push(`    owner, ${sv('aluminium')}, ${sv('profit_percentage')}, ${sv('labour_charge')}, ${sv('coating')},`);
L.push(`    ${sv('clit')}, ${sv('wheater_strip')}, ${sv('ss_corner_con')}, ${sv('screw')}, ${sv('rail')}, ${sv('fastner')},`);
L.push(`    ${sv('dustpad')}, ${sv('outer_clit')}, ${sv('sash_clit')}, ${sv('l_pati')}, ${sv('lockguide_cap')}, ${sv('interlock_cap')},`);
L.push(`    ${sv('bubstopper')}, ${sv('ugid')}, ${sv('lockguid')}, ${sv('water_drainage')}, ${sv('brassrubber')}, ${sv('suitbelt')},`);
L.push(`    ${sv('slidr_width_overlap') || 25}, ${sv('slider_height_overlap') || 18}, ${sv('slider_glass_overlap') || 16}, ${sv('slim_width_overlap') || 25},`);
L.push(`    ${sv('casement_width_overlap') || 12}, ${sv('casement_height_overlap') || 12}, ${sv('casement_glass_overlap') || 20}`);
L.push('  )');
L.push('  ON CONFLICT (user_id) DO UPDATE SET');
L.push('    aluminium_rate = EXCLUDED.aluminium_rate,');
L.push('    profit_percentage = EXCLUDED.profit_percentage,');
L.push('    labour_charge = EXCLUDED.labour_charge,');
L.push('    coating = EXCLUDED.coating,');
L.push('    corner_cleat = EXCLUDED.corner_cleat,');
L.push('    weather_strip = EXCLUDED.weather_strip,');
L.push('    ss_corner_con = EXCLUDED.ss_corner_con,');
L.push('    screw = EXCLUDED.screw,');
L.push('    rail = EXCLUDED.rail,');
L.push('    fastner = EXCLUDED.fastner,');
L.push('    dustpad = EXCLUDED.dustpad,');
L.push('    outer_clit = EXCLUDED.outer_clit,');
L.push('    sash_clit = EXCLUDED.sash_clit,');
L.push('    l_pati = EXCLUDED.l_pati,');
L.push('    lockguide_cap = EXCLUDED.lockguide_cap,');
L.push('    interlock_cap = EXCLUDED.interlock_cap,');
L.push('    bubstopper = EXCLUDED.bubstopper,');
L.push('    ugid = EXCLUDED.ugid,');
L.push('    lockguid = EXCLUDED.lockguid,');
L.push('    water_drainage = EXCLUDED.water_drainage,');
L.push('    brassrubber = EXCLUDED.brassrubber,');
L.push('    suitbelt = EXCLUDED.suitbelt,');
L.push('    slim_width_overlap = EXCLUDED.slim_width_overlap;');
L.push('');
L.push("  RAISE NOTICE 'Seed complete for owner %', owner;");
L.push('END $$;');
L.push('');

fs.writeFileSync(path.join(__dirname, '..', 'seed.sql'), L.join('\n'));
console.log('Wrote seed.sql');
console.log('glass rows:', d.glass.rows.length);
console.log('accessory rows:', d.aluminium_accessories.rows.length);
console.log('series rows:', catalog.series.length);
console.log('series_profiles rows:', profCount);
console.log('colors rows:', Array.isArray(catalog.colors) ? catalog.colors.length : 0);
console.log('cost heads mapped:', Object.keys(setting).length);
// report cost heads with no column (informational)
const mappedCols = ['aluminium','profit_percentage','labour_charge','coating','clit','wheater_strip','ss_corner_con','screw','rail','fastner','dustpad','outer_clit','sash_clit','l_pati','lockguide_cap','interlock_cap','bubstopper','ugid','lockguid','water_drainage','brassrubber','suitbelt','slidr_width_overlap','slider_height_overlap','slider_glass_overlap','slim_width_overlap','casement_width_overlap','casement_height_overlap','casement_glass_overlap','coating_selected'];
const unmapped = Object.keys(setting).filter((k) => !mappedCols.includes(k));
console.log('cost heads with NO column in our schema (not seeded):', unmapped.join(', '));
