import { useEffect, useState } from 'react';
import { fetchLands, firebaseReady } from './firebase';
import type { Property } from './types';

/** Property + market-insight fields. Extra fields have safe defaults for API rows. */
export type Land = Property & { growth_pct: number; plots_total: number; plots_available: number };

export const YEAR = 2026;
export const HORIZON = YEAR + 5;
export const PALETTE = ['#18394d', '#2f8f6b', '#d98a1f', '#8a5fbf'];
export const MAX_COMPARE = 4;

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

type Seed = {
  t: string; loc: string; c?: string; a: number; r: number; face: string; road: number; appr: string;
  ws: string; gw: number; wr: number; sc: string; scd: number; vm: string; vmd: number; mr: number;
  g: number; tot: number; left: number; im: string; f?: boolean; d: string;
};

// Sample listings for demonstration. Prices and growth rates are illustrative.
const seeds: Seed[] = [
  { t: 'Greenfield Heights – Corner Plot', loc: 'Adibatla', a: 2400, r: 6500, face: 'North-East', road: 40, appr: 'HMDA Approved', ws: '24/7 Borewell', gw: 180, wr: 5, sc: 'Adibatla Central Mall', scd: 1.8, vm: 'Adibatla Rythu Bazaar', vmd: 0.9, mr: 2.0, g: 12.5, tot: 48, left: 12, im: 'photo-1500382017468-9049fed747ef', f: true, d: 'Corner plot in a gated layout close to the aerospace and IT corridor. Wide roads, underground drainage and a reliable borewell grid.' },
  { t: 'Skyline Enclave', loc: 'Shamshabad', a: 1800, r: 9500, face: 'East', road: 60, appr: 'HMDA + RERA', ws: 'Municipal + Borewell', gw: 220, wr: 4, sc: 'Shamshabad Town Centre', scd: 2.4, vm: 'Shamshabad Rythu Bazaar', vmd: 1.4, mr: 1.2, g: 10.8, tot: 60, left: 21, im: 'photo-1500530855697-b586d89ba3ee', d: 'Premium airport-side plot with 60 ft road frontage and RERA-registered layout. Strong rental and resale demand.' },
  { t: 'Tukkuguda Meadows – Corner Plot', loc: 'Tukkuguda', a: 2000, r: 5800, face: 'West', road: 33, appr: 'DTCP Approved', ws: 'Municipal + Borewell', gw: 160, wr: 4, sc: 'Srisailam Highway Mart', scd: 3.1, vm: 'Maheshwaram Market', vmd: 2.2, mr: 1.0, g: 13.2, tot: 40, left: 9, im: 'photo-1472214103451-9374bd1c798e', f: true, d: 'Fast-appreciating pocket on the Srisailam highway with the ORR exit nearby. Only a handful of plots remain.' },
  { t: 'Maheshwaram Lakeview', loc: 'Maheshwaram', a: 2700, r: 4800, face: 'North', road: 30, appr: 'HMDA Approved', ws: 'Canal/River', gw: 140, wr: 5, sc: 'Maheshwaram Supermarket', scd: 3.6, vm: 'Kandukur Vegetable Market', vmd: 1.6, mr: 2.5, g: 11.4, tot: 72, left: 30, im: 'photo-1469474968028-56623f02e42e', d: 'Large plots beside a seasonal lake with excellent groundwater recharge. Suited to farmhouse-style homes.' },
  { t: 'Kothur Green Valley', loc: 'Kothur', a: 2250, r: 3200, face: 'East', road: 30, appr: 'DTCP Approved', ws: '24/7 Borewell', gw: 200, wr: 3, sc: 'Kothur Bazaar', scd: 4.2, vm: 'Kothur Weekly Market', vmd: 2.1, mr: 1.8, g: 9.2, tot: 90, left: 44, im: 'photo-1501854140801-50d01698950b', d: 'Budget-friendly plots near the Bangalore highway with steady infrastructure growth and clear title.' },
  { t: 'Shadnagar Orchard Plots', loc: 'Shadnagar', a: 3000, r: 3600, face: 'South-East', road: 40, appr: 'Clear Title', ws: 'Rainwater + Tanker', gw: 260, wr: 2, sc: 'Shadnagar Town Centre', scd: 5.0, vm: 'Shadnagar Rythu Bazaar', vmd: 1.1, mr: 1.5, g: 10.1, tot: 55, left: 27, im: 'photo-1506744038136-46273834b3fb', d: 'Spacious plots with mature orchard surroundings. Water relies on tankers today; a municipal line is planned.' },
  { t: 'Ibrahimpatnam Sunrise', loc: 'Ibrahimpatnam', a: 1800, r: 4200, face: 'East', road: 30, appr: 'HMDA Approved', ws: 'Municipal + Borewell', gw: 190, wr: 4, sc: 'Ibrahimpatnam Super Bazaar', scd: 2.8, vm: 'Ibrahimpatnam Market Yard', vmd: 1.3, mr: 0.8, g: 9.9, tot: 64, left: 18, im: 'photo-1441974231531-c6227db76b6e', d: 'Compact east-facing plots on the highway side with schools and clinics within a short drive.' },
  { t: 'Medchal Habitat', loc: 'Medchal', a: 2160, r: 5200, face: 'North-East', road: 40, appr: 'HMDA + RERA', ws: '24/7 Borewell', gw: 150, wr: 5, sc: 'Medchal Central', scd: 2.2, vm: 'Medchal Rythu Bazaar', vmd: 1.0, mr: 1.1, g: 10.5, tot: 80, left: 26, im: 'photo-1470071459604-3b5ec3a7fe05', f: true, d: 'North-Hyderabad plots with shallow groundwater and a daily market within walking distance.' },
  { t: 'Narsapur Countryside', loc: 'Narsapur', c: 'Medak', a: 2700, r: 3000, face: 'West', road: 30, appr: 'DTCP Approved', ws: 'Municipal + Borewell', gw: 240, wr: 3, sc: 'Narsapur Town Market', scd: 3.8, vm: 'Narsapur Vegetable Market', vmd: 1.9, mr: 2.8, g: 8.4, tot: 100, left: 61, im: 'photo-1464822759023-fed622ff2c3b', d: 'Value plots in a quiet corridor with wide frontage. Long-horizon pick with plenty of availability.' },
  { t: 'Bhongir Hillside Estate', loc: 'Bhongir', c: 'Yadadri Bhuvanagiri', a: 3150, r: 2600, face: 'North', road: 33, appr: 'Clear Title', ws: 'Rainwater + Tanker', gw: 300, wr: 2, sc: 'Bhongir Bazaar', scd: 4.5, vm: 'Bhongir Market Yard', vmd: 2.6, mr: 1.4, g: 8.1, tot: 120, left: 83, im: 'photo-1475924156734-496f6cac6ec1', d: 'Hill-view plots at the lowest entry price per sq.ft. Best for patient investors; water needs a bore investment.' }
];

export const DEMO_LANDS: Land[] = seeds.map((s, i) => ({
  id: `demo-${i + 1}`, title: s.t, locality: s.loc, city: s.c ?? 'Hyderabad', property_type: 'Plot', listing_type: 'sale',
  bedrooms: 0, bathrooms: 0, area_sqft: s.a, plot_area_sqft: s.a, price_per_sqft: s.r, price: s.a * s.r,
  facing: s.face, road_width_ft: s.road, approval_status: s.appr, water_source: s.ws, groundwater_depth_ft: s.gw,
  water_availability_rating: s.wr, shopping_center_name: s.sc, shopping_center_distance_km: s.scd,
  vegetable_market_name: s.vm, vegetable_market_distance_km: s.vmd, main_road_distance_km: s.mr,
  growth_pct: s.g, plots_total: s.tot, plots_available: s.left, cover_image: img(s.im),
  featured: !!s.f, is_featured: !!s.f, description: s.d
}) as unknown as Land);

const enrich = (p: Partial<Land>): Land => ({ growth_pct: 9, plots_total: 40, plots_available: 15, ...p }) as Land;

/** Reads the `lands` collection from Firestore; falls back to the built-in demo data if Firebase is not configured or empty. */
export function useLands() {
  const [lands, setLands] = useState<Land[]>(DEMO_LANDS);
  useEffect(() => {
    if (!firebaseReady) return;
    fetchLands<Land>().then(rows => { if (rows.length) setLands(rows.map(enrich)); }).catch(() => undefined);
  }, []);
  return lands;
}

export const num = (v: unknown) => (v == null || v === '' ? null : Number(v));
export const ppsf = (l: Land) => num(l.price_per_sqft) ?? Number(l.price) / (num(l.plot_area_sqft ?? l.area_sqft) || 1);
export const plotArea = (l: Land) => num(l.plot_area_sqft ?? l.area_sqft) || 0;

export const compact = (v: number) =>
  v >= 1e7 ? `₹${(v / 1e7).toFixed(2)} Cr` : v >= 1e5 ? `₹${(v / 1e5).toFixed(1)} L` : `₹${Math.round(v).toLocaleString('en-IN')}`;

export type Pt = { x: number; y: number };
const years = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

/** Back-cast 5 years and project 5 years (₹/sq.ft.), with a ±3.5 pt growth band. */
export function projection(l: Land) {
  const g = (l.growth_pct || 9) / 100;
  const base = ppsf(l);
  const wobble = (y: number) => 1 + Math.sin(y * 1.7 + (base % 7)) * 0.012;
  const history: Pt[] = years(YEAR - 5, YEAR).map(x => ({ x, y: Math.round((base / Math.pow(1 + g, YEAR - x)) * (x === YEAR ? 1 : wobble(x))) }));
  const forecast = (rate: number): Pt[] => years(YEAR, HORIZON).map(x => ({ x, y: Math.round(base * Math.pow(1 + rate, x - YEAR)) }));
  return { history, base: forecast(g), low: forecast(Math.max(g - 0.035, 0.02)), high: forecast(g + 0.035) };
}

/** Relative 0–100 match score across the plots being compared. */
export function scores(lands: Land[]) {
  const metrics: [(l: Land) => number, number, boolean][] = [
    [ppsf, 25, true], [l => num(l.water_availability_rating) || 0, 20, false],
    [l => num(l.vegetable_market_distance_km) || 0, 15, true], [l => num(l.shopping_center_distance_km) || 0, 15, true],
    [l => num(l.main_road_distance_km) || 0, 10, true], [l => l.growth_pct, 15, false]
  ];
  return lands.map(l => Math.round(metrics.reduce((sum, [f, w, lowerBetter]) => {
    const v = lands.map(f); const mn = Math.min(...v); const mx = Math.max(...v);
    const n = mx === mn ? 1 : (lowerBetter ? mx - f(l) : f(l) - mn) / (mx - mn);
    return sum + w * n;
  }, 0)));
}

export type Filters = { query: string; city: string; maxPrice: string; water: string; approval: string; sort: string; category: string };

export function filterLands(lands: Land[], f: Filters) {
  const has = (v: unknown, s: string) => String(v ?? '').toLowerCase().includes(s.toLowerCase());
  let out = lands.filter(l =>
    (!f.query || [l.title, l.locality, l.city].some(v => has(v, f.query))) &&
    (!f.city || has(l.city, f.city)) &&
    (!f.maxPrice || Number(l.price) <= Number(f.maxPrice)) &&
    (!f.water || has(l.water_source, f.water.includes('Tanker') ? 'Tanker' : f.water)) &&
    (!f.approval || has(l.approval_status, f.approval)) &&
    (f.category !== 'Near market' || (num(l.vegetable_market_distance_km) ?? 99) <= 2) &&
    (f.category !== 'Corner plots' || has(l.title, 'corner')) &&
    (f.category !== '24/7 water' || has(l.water_source, '24/7')) &&
    (f.category !== 'Top rated' || (num(l.water_availability_rating) ?? 0) >= 4));
  if (f.sort === 'price_asc') out = [...out].sort((a, b) => Number(a.price) - Number(b.price));
  if (f.sort === 'price_desc') out = [...out].sort((a, b) => Number(b.price) - Number(a.price));
  if (f.sort === 'price_per_sqft') out = [...out].sort((a, b) => ppsf(a) - ppsf(b));
  return out;
}
