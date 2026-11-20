import { createContext, useContext, useEffect, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, Building2, CalendarDays, Check, CheckCircle2, Droplets, LogOut, MapPin, Menu, Search, ShoppingBasket, SlidersHorizontal, Star, X } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { api } from './api';
import { auth } from './firebase';
import type { Booking, Property, User } from './types';

type Auth = { user: User | null; setUser: (user: User | null) => void };
type Compare = { ids: string[]; toggle: (id: string) => void; remove: (id: string) => void };
const AuthContext = createContext<Auth>({ user: null, setUser: () => undefined });
const CompareContext = createContext<Compare>({ ids: [], toggle: () => undefined, remove: () => undefined });
const useAuth = () => useContext(AuthContext);
const useCompare = () => useContext(CompareContext);
const money = (amount: number | string) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(amount) || 0)}`;
const number = (value?: number | string | null) => value == null ? null : Number(value);
const area = (value?: number | string | null) => number(value)?.toLocaleString('en-IN') ?? 'Not listed';
const distance = (value?: number | string | null) => number(value) == null ? 'Not listed' : `${Number(value).toFixed(1)} km`;

function Header() {
  const { user, setUser } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  async function logout() {
    await api.logout();
    setUser(null);
    navigate('/');
  }
  return <header className="header"><Link to="/" className="brand" aria-label="Switchland.in home"><img className="brandLogo" src="/switchland-logo.svg" alt="Switchland.in"/></Link><button className="mobileMenu" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X/> : <Menu/>}</button><nav className={open ? 'nav show' : 'nav'}><Link to="/properties">Browse plots</Link><Link to="/#process">How it works</Link>{user ? <><Link to="/dashboard">My dashboard</Link>{user.role === 'admin' && <Link to="/admin">Admin</Link>}<button className="navAction" onClick={logout}><LogOut size={15}/> Sign out</button></> : <><Link to="/login">Log in</Link><Link className="navCta" to="/register">Get started <ArrowRight size={15}/></Link></>}</nav></header>;
}

function CompareDock() {
  const { ids, remove } = useCompare();
  if (!ids.length) return null;
  return <aside className="compareDock" aria-live="polite"><div><b>{ids.length}/3 plots selected</b><span>{ids.length === 1 ? 'Select one more to compare' : ids.length === 2 ? 'Compare these or add one more plot' : 'Your three-plot comparison is ready'}</span></div><div className="dockActions">{ids.map((id, i) => <button key={id} className="dockRemove" onClick={() => remove(id)} aria-label={`Remove plot ${i + 1}`}><X size={14}/>{i + 1}</button>)}{ids.length >= 2 ? <Link className="button primary" to="/compare">Compare {ids.length} plots <ArrowRight size={15}/></Link> : <span className="dockHint">Choose another plot</span>}</div></aside>;
}

function Layout({ children }: { children: React.ReactNode }) {
  return <><Header/>{children}<footer className="footer"><Link to="/" className="brand" aria-label="Switchland.in home"><img className="brandLogo" src="/switchland-logo.svg" alt="Switchland.in"/></Link><p>Thoughtful land search. Confident decisions.</p><small>© {new Date().getFullYear()} Switchland.in. Property details should be independently verified.</small></footer><CompareDock/></>;
}

function PropertyCard({ property }: { property: Property }) {
  const { ids, toggle } = useCompare();
  const selected = ids.includes(property.id);
  const plotArea = property.plot_area_sqft ?? property.area_sqft;
  const water = property.water_source || 'Water details on request';
  return <article className="propertyCard"><Link to={`/property/${property.id}`} className="cardLink"><div className="propertyImage"><img src={property.cover_image} alt={property.title} onError={event => { event.currentTarget.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80'; }}/><span className="tag">Residential plot</span>{(property.featured || property.is_featured) && <span className="featured">Hot plot</span>}<span className="imageBadge"><CheckCircle2 size={13}/> Plot details</span></div><div className="propertyInfo"><div className="priceLine"><strong>{money(property.price)}</strong><span>{property.price_per_sqft ? `${money(property.price_per_sqft)}/sq.ft.` : 'For sale'}</span></div><h3>{property.title}</h3><p className="location"><MapPin size={14}/>{property.locality}, {property.city}</p><div className="productQuickFacts"><span><span className="factIcon"><SlidersHorizontal size={15}/></span><b>{area(plotArea)}</b><small>sq.ft.</small></span><span><span className="factIcon"><Droplets size={15}/></span><b>{water.includes('24/7') ? '24/7 Water' : water}</b><small>{property.water_availability_rating ? `${property.water_availability_rating}/5 water rating` : 'water status'}</small></span><span><span className="factIcon"><ShoppingBasket size={15}/></span><b>{distance(property.vegetable_market_distance_km)}</b><small>to fresh market</small></span></div><div className="cardNearby"><span>{property.shopping_center_name || 'Shopping nearby'} · {distance(property.shopping_center_distance_km)}</span><span>{property.approval_status || 'Approval details on request'}</span></div></div></Link><div className="cardActions"><button className={`compareButton ${selected ? 'selected' : ''}`} disabled={!selected && ids.length >= 3} title={!selected && ids.length >= 3 ? 'Remove a selected plot before adding another' : undefined} onClick={() => toggle(property.id)}>{selected ? <><Check size={16}/> Added</> : 'Compare'}</button><Link className="button primary visitButton" to={`/property/${property.id}#booking`}>Book visit <ArrowRight size={15}/></Link></div></article>;
}

function Home() {
  const [items, setItems] = useState<Property[]>([]);
  const [error, setError] = useState('');
  const [demoMode, setDemoMode] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  useEffect(() => { api.properties('?featured=true&property_type=Plot').then(result => { setItems(result.properties); setDemoMode(result.isDemo); setError(''); }).catch(e => setError(e.message)); }, []);
  return <Layout><section className="hero"><div className="heroContent"><div className="eyebrow"><span/> THE LAND & PLOT STORE</div><h1>Find the right<br/><em>ground to grow.</em></h1><p>Compare plots like products. Check everyday essentials, water access and the details that make a place feel right.</p><form className="searchBox" onSubmit={event => { event.preventDefault(); navigate(`/properties?q=${encodeURIComponent(query)}`); }}><Search/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search plots by city or locality"/><button>Explore plots <ArrowRight size={16}/></button></form><div className="heroTrust"><span><CheckCircle2 size={16}/> Plot details at a glance</span><span><CheckCircle2 size={16}/> Compare up to three plots</span><span><CheckCircle2 size={16}/> Arrange a site visit</span></div></div><div className="heroVisual"><img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1300&q=90" alt="Open green land"/><div className="visualNote"><span className="noteIcon"><MapPin/></span><div><b>Find your own space</b><small>Land with the details that matter</small></div></div></div></section><section className="section" id="properties"><div className="sectionHead"><div><div className="eyebrow">A PLACE FOR EVERY PLAN</div><h2>Featured plots</h2><p>Explore land selected for location, value and everyday convenience.</p></div><Link className="textLink" to="/properties">Shop all plots <ArrowRight size={16}/></Link></div>{demoMode && <p className="demoNotice">Showing sample land. Connect Firebase and seed Firestore to save real listings and enquiries.</p>}{error && <p className="error">{error}</p>}<div className="propertyGrid">{items.length ? items.slice(0, 3).map(property => <PropertyCard key={property.id} property={property}/>) : !error && <div className="emptyState">No featured plots are available yet. Check back soon.</div>}</div></section><section className="process" id="process"><div className="eyebrow">SIMPLE BY DESIGN</div><h2>Your next move, made clearer.</h2><div className="steps"><div><b>01</b><h3>Discover</h3><p>Filter plots by budget, approval, water availability and location.</p></div><div><b>02</b><h3>Compare</h3><p>Compare up to three plots side by side, including their everyday essentials.</p></div><div><b>03</b><h3>Visit</h3><p>Request a site visit or send an enquiry through your account.</p></div></div></section></Layout>;
}

function Properties() {
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [city, setCity] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [water, setWater] = useState('');
  const [approval, setApproval] = useState('');
  const [sort, setSort] = useState('');
  const [category, setCategory] = useState('All plots');
  const [items, setItems] = useState<Property[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const search = new URLSearchParams({ property_type: 'Plot' });
    if (query) search.set('q', query);
    if (city) search.set('city', city);
    if (maxPrice) search.set('max_price', maxPrice);
    if (water) search.set('water_source', water);
    if (approval) search.set('approval_status', approval);
    if (category === 'Near market') search.set('max_market_distance', '2');
    if (sort) search.set('sort', sort);
    api.properties(`?${search}`).then(result => { setItems(result.properties); setDemoMode(result.isDemo); setError(''); }).catch(e => setError(e.message));
  }, [query, city, maxPrice, water, approval, sort, category]);
  const shown = category === 'Corner plots' ? items.filter(item => item.title.toLowerCase().includes('corner')) : category === '24/7 water' ? items.filter(item => item.water_source?.toLowerCase().includes('24/7')) : items;
  const categories = ['All plots', 'Corner plots', '24/7 water', 'Near market', 'Under budget'];
  return <Layout><main className="page storePage"><div className="eyebrow">THE SWITCHLAND.IN COLLECTION</div><h1>Shop land & plots</h1><p className="lead">Compare land on price, water access and the places you visit every day.</p><div className="storeTools"><label className="storeSearch"><Search size={18}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search locality, city or plot"/></label><div className="categoryRail" role="group" aria-label="Plot categories">{categories.map(item => <button key={item} className={category === item ? 'categoryPill active' : 'categoryPill'} onClick={() => { setCategory(item); if (item === 'Under budget') setMaxPrice('5000000'); else if (category === 'Under budget') setMaxPrice(''); }}>{item}</button>)}</div></div><div className="filters storeFilters"><label><MapPin size={17}/><input value={city} onChange={event => setCity(event.target.value)} placeholder="City (e.g. Hyderabad)"/></label><select value={maxPrice} onChange={event => setMaxPrice(event.target.value)}><option value="">Any budget</option><option value="5000000">Up to ₹50 lakh</option><option value="10000000">Up to ₹1 crore</option><option value="20000000">Up to ₹2 crore</option></select><select value={water} onChange={event => setWater(event.target.value)}><option value="">Any water source</option><option value="24/7 Borewell">24/7 borewell</option><option value="Municipal + Borewell">Municipal + borewell</option><option value="Tanker">Tanker access</option></select><select value={approval} onChange={event => setApproval(event.target.value)}><option value="">Any approval</option><option value="HMDA">HMDA approved</option><option value="DTCP">DTCP approved</option><option value="Clear Title">Clear title</option><option value="RERA">RERA registered</option></select><select value={sort} onChange={event => setSort(event.target.value)}><option value="">Sort: Recommended</option><option value="price_asc">Price: Low to high</option><option value="price_desc">Price: High to low</option><option value="price_per_sqft">Price per sq.ft.</option></select></div>{demoMode && <p className="demoNotice">Showing sample land. Connect Firebase and seed Firestore to save real listings and enquiries.</p>}{error && <p className="error">{error}. Check your Firebase environment variables and Firestore rules.</p>}<div className="resultsLine"><b>{shown.length} plots</b><span>Listing details for buyer review</span></div><div className="propertyGrid">{shown.map(property => <PropertyCard key={property.id} property={property}/>)}{!shown.length && !error && <div className="emptyState">No plots match those filters. Try a different search.</div>}</div></main></Layout>;
}

function BookingPanel({ property }: { property: Property }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [kind, setKind] = useState<'purchase_enquiry' | 'site_visit'>('site_visit');
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) { navigate('/login'); return; }
    setBusy(true);
    try { await api.createBooking({ property_id: property.id, booking_type: kind, preferred_date: date || null, message }); setStatus('Your request has been submitted. Track it in your dashboard.'); setMessage(''); setDate(''); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Unable to submit request'); }
    finally { setBusy(false); }
  }
  return <aside className="bookingPanel" id="booking"><div className="eyebrow">TAKE THE NEXT STEP</div><h3>Interested in this plot?</h3><p>Send an enquiry or arrange a site visit with our team.</p><form onSubmit={submit}><div className="choice"><button type="button" className={kind === 'site_visit' ? 'selected' : ''} onClick={() => setKind('site_visit')}><CalendarDays size={16}/> Site visit</button><button type="button" className={kind === 'purchase_enquiry' ? 'selected' : ''} onClick={() => setKind('purchase_enquiry')}>Purchase enquiry</button></div>{kind === 'site_visit' && <label className="field">Preferred visit date<input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={event => setDate(event.target.value)}/></label>}<label className="field">Message (optional)<textarea rows={3} value={message} onChange={event => setMessage(event.target.value)} placeholder="Tell us what you’d like to know…"/></label><button className="button primary full" disabled={busy}>{busy ? 'Submitting…' : 'Request a site visit'} <ArrowRight size={16}/></button>{status && <p className={status.startsWith('Your request') ? 'success' : 'error'}>{status}</p>}</form></aside>;
}

function PropertyDetail() {
  const { id = '' } = useParams();
  const { ids, toggle } = useCompare();
  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { api.property(id).then(result => setProperty(result.property)).catch(e => setError(e.message)); }, [id]);
  if (error) return <Layout><main className="page"><p className="error">{error}</p><Link to="/properties">Back to plots</Link></main></Layout>;
  if (!property) return <Layout><main className="page">Loading plot…</main></Layout>;
  const selected = ids.includes(property.id);
  const principal = Number(property.price) * 0.8;
  const monthlyRate = 0.085 / 12;
  const monthlyEmi = principal * monthlyRate * Math.pow(1 + monthlyRate, 240) / (Math.pow(1 + monthlyRate, 240) - 1);
  return <Layout><main className="page detailPage"><Link to="/properties" className="backLink">← Back to plots</Link><img className="detailImage" src={property.cover_image} alt={property.title}/><div className="detailLayout"><div><div className="eyebrow">RESIDENTIAL PLOT · {property.locality.toUpperCase()}</div><h1>{property.title}</h1><p className="location"><MapPin size={16}/>{property.locality}, {property.city}</p><div className="detailPriceLine"><h2 className="detailPrice">{money(property.price)}</h2>{property.price_per_sqft && <span>{money(property.price_per_sqft)} / sq.ft.</span>}</div><div className="estimator"><div><small>Indicative 20% token</small><b>{money(Number(property.price) * .2)}</b></div><div><small>Indicative monthly EMI*</small><b>{money(monthlyEmi)} / mo</b></div><small className="estimatorNote">*Illustrative 80% financing at 8.5% for 20 years. Actual terms depend on lender approval.</small></div><h2>Key plot specifications</h2><div className="detailFacts"><span>Plot area<b>{area(property.plot_area_sqft ?? property.area_sqft)} sq.ft.</b></span><span>Facing<b>{property.facing || 'Not listed'}</b></span><span>Road width<b>{property.road_width_ft ? `${property.road_width_ft} ft` : 'Not listed'}</b></span><span>Approval<b>{property.approval_status || 'Not listed'}</b></span><span>Rate<b>{property.price_per_sqft ? `${money(property.price_per_sqft)} / sq.ft.` : 'Not listed'}</b></span><span>Main road<b>{distance(property.main_road_distance_km)}</b></span></div><h2>Neighborhood & daily needs</h2><div className="neighborhoodCard"><div><ShoppingBasket/><span>Vegetable market<b>{property.vegetable_market_name || 'Details on request'}</b><small>{distance(property.vegetable_market_distance_km)} away</small></span></div><div><Building2/><span>Shopping center<b>{property.shopping_center_name || 'Details on request'}</b><small>{distance(property.shopping_center_distance_km)} away</small></span></div><div><Droplets/><span>Water availability<b>{property.water_source || 'Details on request'}</b><small>{property.groundwater_depth_ft ? `${property.groundwater_depth_ft} ft groundwater` : 'Groundwater depth not listed'} · {property.water_availability_rating ? `${property.water_availability_rating}/5 rating` : 'rating not listed'}</small></span></div></div><h2>About this plot</h2><p className="description">{property.description}</p></div><BookingPanel property={property}/></div></main><div className="detailSticky"><button className={`compareButton ${selected ? 'selected' : ''}`} disabled={!selected && ids.length >= 3} title={!selected && ids.length >= 3 ? 'Remove a selected plot before adding another' : undefined} onClick={() => toggle(property.id)}>{selected ? <><Check size={16}/> Added</> : 'Add to compare'}</button><a className="button primary" href="#booking">Book site visit <ArrowRight size={15}/></a></div></Layout>;
}

const compareRows = [
  { section: 'Price & value' },
  { label: 'Total price', key: 'price', format: (p: Property) => money(p.price), better: 'lower' as const },
  { label: 'Price / sq.ft.', key: 'price_per_sqft', format: (p: Property) => p.price_per_sqft ? money(p.price_per_sqft) : 'Not listed', better: 'lower' as const },
  { label: 'Plot area', key: 'plot_area_sqft', format: (p: Property) => `${area(p.plot_area_sqft ?? p.area_sqft)} sq.ft.` },
  { label: 'Facing', key: 'facing', format: (p: Property) => p.facing || 'Not listed' },
  { label: 'Road width', key: 'road_width_ft', format: (p: Property) => p.road_width_ft ? `${p.road_width_ft} ft` : 'Not listed' },
  { label: 'Approval status', key: 'approval_status', format: (p: Property) => p.approval_status || 'Not listed' },
  { section: 'Water availability' },
  { label: 'Water source', key: 'water_source', format: (p: Property) => p.water_source || 'Not listed' },
  { label: 'Groundwater depth', key: 'groundwater_depth_ft', format: (p: Property) => p.groundwater_depth_ft ? `${p.groundwater_depth_ft} ft` : 'Not listed' },
  { label: 'Availability rating', key: 'water_availability_rating', format: (p: Property) => <span className="rating">{[1, 2, 3, 4, 5].map(star => <Star key={star} size={13} fill={star <= (p.water_availability_rating || 0) ? 'currentColor' : 'none'}/>)}</span>, better: 'higher' as const },
  { section: 'Nearby daily essentials' },
  { label: 'Shopping center', key: 'shopping_center_distance_km', format: (p: Property) => <>{p.shopping_center_name || 'Not listed'}<small>{distance(p.shopping_center_distance_km)} · est. {number(p.shopping_center_distance_km) == null ? '—' : `${Math.max(3, Math.round(Number(p.shopping_center_distance_km) * 3))} min drive`}</small></>, better: 'lower' as const },
  { label: 'Vegetable market', key: 'vegetable_market_distance_km', format: (p: Property) => <>{p.vegetable_market_name || 'Not listed'}<small>{distance(p.vegetable_market_distance_km)} · {Number(p.vegetable_market_distance_km) <= 1.5 ? 'Walkable' : 'Short drive'}</small></>, better: 'lower' as const }
];

const plotColors = ['#286d60', '#bd8b3c', '#54799a'];
const projectionRates = [{ label: 'Low scenario', rate: 0.03 }, { label: 'Illustrative scenario', rate: 0.05 }, { label: 'High scenario', rate: 0.08 }];
const projectionValue = (price: number | string, rate: number, year: number) => Number(price) * Math.pow(1 + rate, year);
const compactMoney = (value: number) => value >= 10000000 ? `₹${(value / 10000000).toFixed(1)}Cr` : `₹${(value / 100000).toFixed(0)}L`;

function ProjectionChart({ plots }: { plots: Property[] }) {
  const width = 760;
  const height = 270;
  const left = 64;
  const right = 18;
  const top = 14;
  const bottom = 38;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const years = [0, 1, 2, 3, 4, 5];
  const values = plots.flatMap(plot => [Number(plot.price), projectionValue(plot.price, 0.03, 5), projectionValue(plot.price, 0.08, 5)]);
  const minValue = Math.min(...values) * 0.92;
  const maxValue = Math.max(...values) * 1.04;
  const x = (year: number) => left + (year / 5) * chartWidth;
  const y = (value: number) => top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
  const ticks = [0, 1, 2, 3].map(step => minValue + ((maxValue - minValue) * step) / 3);

  return <section className="projectionPanel"><div className="projectionHeading"><div><div className="eyebrow">PLANNING SCENARIO</div><h2>Illustrative 5-year value range</h2></div><span>Not a price prediction</span></div><div className="projectionChartWrap"><svg className="projectionChart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Illustrative plot price scenarios over five years"><title>Illustrative 3%, 5%, and 8% annual appreciation scenarios. Not a forecast.</title>{ticks.map((tick, index) => <g key={index}><line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} stroke="#e5ebed"/><text x={left - 8} y={y(tick) + 4} textAnchor="end" className="chartAxisLabel">{compactMoney(tick)}</text></g>)}{years.map(year => <g key={year}><line x1={x(year)} x2={x(year)} y1={top} y2={height - bottom} stroke="#f1f3f4"/><text x={x(year)} y={height - 13} textAnchor="middle" className="chartAxisLabel">{year === 0 ? 'Today' : `Year ${year}`}</text></g>)}{plots.map((plot, index) => {const low = years.map(year => ({ x: x(year), y: y(projectionValue(plot.price, 0.03, year)) }));const high = years.map(year => ({ x: x(year), y: y(projectionValue(plot.price, 0.08, year)) }));const base = years.map(year => `${x(year)},${y(projectionValue(plot.price, 0.05, year))}`).join(' ');const band = [...high, ...low.slice().reverse()].map(point => `${point.x},${point.y}`).join(' ');return <g key={plot.id}><polygon points={band} fill={plotColors[index % plotColors.length]} fillOpacity=".11"/><polyline points={base} fill="none" stroke={plotColors[index % plotColors.length]} strokeWidth="2.5"/><circle cx={x(5)} cy={y(projectionValue(plot.price, 0.05, 5))} r="4" fill={plotColors[index % plotColors.length]}/></g>;})}</svg></div><div className="projectionLegend">{plots.map((plot, index) => <span key={plot.id}><i style={{ backgroundColor: plotColors[index % plotColors.length] }}/>{plot.title}</span>)}</div><p className="projectionDisclaimer">Illustration only: assumes fixed annual growth of 3%, 5% and 8%, compounded for five years. It is not based on verified market data and does not predict or guarantee future prices.</p></section>;
}

function ComparePage() {
  const { ids, remove } = useCompare();
  const [plots, setPlots] = useState<Property[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { if (ids.length >= 2) Promise.all(ids.map(id => api.property(id))).then(results => { setPlots(results.map(result => result.property)); setError(''); }).catch(e => setError(e.message)); else setPlots([]); }, [ids.join('|')]);
  if (ids.length < 2) return <Layout><main className="page"><div className="eyebrow">SIDE-BY-SIDE</div><h1>Compare land</h1><p className="lead">Select two or three plots to compare value, water availability and nearby essentials.</p><Link className="button primary" to="/properties">Browse plots</Link></main></Layout>;
  if (error) return <Layout><main className="page"><p className="error">{error}</p></main></Layout>;
  if (plots.length !== ids.length) return <Layout><main className="page">Loading comparison…</main></Layout>;
  return <Layout><main className="page comparePage"><div className="compareTitle"><div><div className="eyebrow">SIDE-BY-SIDE</div><h1>Compare your plots</h1></div><Link to="/properties" className="textLink">Add or change plots</Link></div><div className="compareColumns"><div className="comparePlotHead" style={{ gridTemplateColumns: `repeat(${plots.length}, minmax(0, 1fr))` }}>{plots.map((plot, i) => <div className="comparePlot" key={plot.id}><button className="removeCompare" onClick={() => remove(plot.id)} aria-label={`Remove plot ${i + 1}`}><X size={15}/></button><img src={plot.cover_image} alt={plot.title}/><span className="plotLetter">PLOT {String.fromCharCode(65 + i)}</span><b>{plot.title}</b><strong>{money(plot.price)}</strong><small className="projectionSummary">5-year scenario range<br/>{money(projectionValue(plot.price, .03, 5))}–{money(projectionValue(plot.price, .08, 5))}</small><Link to={`/property/${plot.id}`}>View plot details</Link><Link className="button primary compareVisit" to={`/property/${plot.id}#booking`}>Book site visit</Link></div>)}</div><ProjectionChart plots={plots}/>{compareRows.map(row => 'section' in row ? <div className="compareSection" key={row.section}>{row.section}</div> : <div className="compareRow" key={row.key} style={{ gridTemplateColumns: `repeat(${plots.length}, minmax(0, 1fr))` }}><div className="compareLabel">{row.label}</div>{plots.map(plot => {const values = row.better ? plots.map(item => number(item[row.key as keyof Property] as number | string | null)) : [];const measured = values.filter((value): value is number => value != null);const best = measured.length ? (row.better === 'lower' ? Math.min(...measured) : Math.max(...measured)) : null;const hasWinner = best != null && measured.some(value => value !== best);const isWinner = hasWinner && values[plots.indexOf(plot)] === best;return <div key={plot.id} className={`compareValue ${isWinner ? 'winner' : ''}`}>{row.format(plot)}</div>;})}</div>)}</div></main></Layout>;
}

function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();
  async function submit(event: React.FormEvent) { event.preventDefault(); setBusy(true); setError(''); try { const result = mode === 'register' ? await api.register({ name, email, password }) : await api.login({ email, password }); setUser(result.user); navigate('/dashboard'); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to continue'); } finally { setBusy(false); } }
  return <Layout><main className="authWrap"><div className="authCard"><div className="brandmark large"><Building2/></div><div className="eyebrow">WELCOME TO SWITCHLAND.IN</div><h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1><p>{mode === 'login' ? 'Sign in to manage your plot enquiries.' : 'Keep track of your next move.'}</p><form onSubmit={submit}>{mode === 'register' && <label className="field">Full name<input required value={name} onChange={event => setName(event.target.value)} placeholder="Your name"/></label>}<label className="field">Email address<input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com"/></label><label className="field">Password<input required minLength={8} type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters"/></label>{error && <p className="error">{error}</p>}<button className="button primary full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={16}/></button></form><p className="authSwitch">{mode === 'login' ? 'New to Switchland.in? ' : 'Already have an account? '}<Link to={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? 'Create an account' : 'Sign in'}</Link></p></div></main></Layout>;
}

function Dashboard() {
  const [items, setItems] = useState<Booking[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { api.myBookings().then(result => setItems(result.bookings)).catch(e => setError(e.message)); }, []);
  return <Layout><main className="page"><div className="eyebrow">YOUR ESTATEHUB ACCOUNT</div><h1>My dashboard</h1><p className="lead">Keep track of plot enquiries and visit requests.</p>{error && <p className="error">{error}</p>}<div className="bookingList">{items.map(booking => <div className="bookingRow" key={booking.id}><div><b>{booking.property_title || 'Plot enquiry'}</b><p>{booking.booking_type === 'site_visit' ? 'Site visit' : 'Purchase enquiry'} · {booking.preferred_date || 'Date to be confirmed'}</p><small>Submitted {new Date(booking.created_at).toLocaleDateString('en-IN')}</small></div><span className={`status ${booking.status}`}>{booking.status.replace('_', ' ')}</span></div>)}{!items.length && !error && <div className="emptyState">No enquiries yet. <Link to="/properties">Explore plots</Link> to get started.</div>}</div></main></Layout>;
}

function Admin() {
  const [items, setItems] = useState<Booking[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  function refresh() { api.adminBookings().then(result => setItems(result.bookings)).catch(e => setError(e.message)); }
  useEffect(() => { refresh(); }, []);
  async function seedDemo() {
    setNotice('');
    try { const result = await api.seedDemoProperties(); setNotice(result.added ? `Added ${result.added} demo plots.` : 'The demo plots are already in Firestore.'); }
    catch (e) { setNotice(e instanceof Error ? e.message : 'Unable to seed demo plots.'); }
  }
  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const payload: Record<string, unknown> = { ...data, property_type: 'Plot', listing_type: 'sale', bedrooms: 0, bathrooms: 0, area_sqft: Number(data.plot_area_sqft), featured: data.is_featured === 'true', is_featured: data.is_featured === 'true' };
    for (const key of ['price', 'plot_area_sqft', 'price_per_sqft', 'road_width_ft', 'groundwater_depth_ft', 'water_availability_rating', 'shopping_center_distance_km', 'vegetable_market_distance_km', 'main_road_distance_km']) payload[key] = data[key] ? Number(data[key]) : null;
    try { await api.createProperty(payload); setNotice('Plot created successfully.'); form.reset(); refresh(); }
    catch (e) { setNotice(e instanceof Error ? e.message : 'Unable to create plot'); }
  }
  async function change(id: string, status: string) { try { await api.updateBooking(id, status); refresh(); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update'); } }
  return <Layout><main className="page"><div className="eyebrow">MANAGEMENT CONSOLE</div><h1>Admin dashboard</h1><p className="lead">Manage incoming enquiries and add land listings.</p>{error && <p className="error">{error}</p>}<div className="adminGrid"><section className="adminPanel"><h2>Recent enquiries</h2>{items.map(booking => <div className="bookingRow" key={booking.id}><div><b>{booking.property_title}</b><p>{booking.booking_type.replace('_', ' ')} · {booking.status}</p><small>{booking.message || 'No message provided'}</small></div><select value={booking.status} onChange={event => change(booking.id, event.target.value)}><option value="pending">Pending</option><option value="contacted">Contacted</option><option value="confirmed">Confirmed</option><option value="closed">Closed</option></select></div>)}{!items.length && <p>No enquiries received yet.</p>}</section><section className="adminPanel"><h2>Add a plot</h2><button className="button primary full" type="button" onClick={seedDemo}>Seed 10 demo plots</button>{notice && <p>{notice}</p>}<form onSubmit={add}><label className="field">Plot title<input name="title" required minLength={4}/></label><label className="field">Price (INR)<input name="price" required type="number" min="1"/></label><div className="formPair"><label className="field">City<input name="city" required defaultValue="Hyderabad"/></label><label className="field">Locality<input name="locality" required/></label></div><div className="formPair"><label className="field">Plot area (sq.ft.)<input name="plot_area_sqft" required type="number" min="1"/></label><label className="field">Price / sq.ft.<input name="price_per_sqft" type="number" min="1"/></label></div><div className="formPair"><label className="field">Facing<input name="facing" placeholder="East"/></label><label className="field">Road width (ft)<input name="road_width_ft" type="number" min="1"/></label></div><label className="field">Approval status<input name="approval_status" placeholder="HMDA Approved"/></label><label className="field">Water source<input name="water_source" required placeholder="Municipal + Borewell"/></label><div className="formPair"><label className="field">Groundwater depth (ft)<input name="groundwater_depth_ft" type="number" min="1"/></label><label className="field">Water rating (1–5)<input name="water_availability_rating" type="number" min="1" max="5"/></label></div><label className="field">Shopping center name<input name="shopping_center_name" required/></label><div className="formPair"><label className="field">Distance (km)<input name="shopping_center_distance_km" required type="number" min="0" step="0.1"/></label><label className="field">Vegetable market<input name="vegetable_market_name" required/></label></div><div className="formPair"><label className="field">Market distance (km)<input name="vegetable_market_distance_km" required type="number" min="0" step="0.1"/></label><label className="field">Main road (km)<input name="main_road_distance_km" type="number" min="0" step="0.1"/></label></div><label className="field">Image URL<input name="cover_image" type="url" required defaultValue="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85"/></label><label className="field">Description<textarea name="description" required minLength={10} rows={3}/></label><label className="field inlineField"><input name="is_featured" type="checkbox" value="true"/> Feature this plot</label><input type="hidden" name="area_sqft" value="1200"/><button className="button primary full">Publish plot</button></form></section></div></main></Layout>;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState('');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  useEffect(() => {
    if (!auth) { setReady(true); return; }
    return onAuthStateChanged(auth, firebaseUser => {
      setAuthError('');
      if (!firebaseUser) { setUser(null); setReady(true); return; }
      setReady(false);
      api.currentUser()
        .then(setUser)
        .catch(error => { setUser(null); setAuthError(error instanceof Error ? error.message : 'Unable to load your account.'); })
        .finally(() => setReady(true));
    }, error => { setAuthError(error.message); setReady(true); });
  }, []);
  function toggleCompare(id: string) { setCompareIds(current => current.includes(id) ? current.filter(item => item !== id) : current.length < 3 ? [...current, id] : current); }
  if (!ready) return <div className="loading">Switchland.in</div>;
  if (authError) return <main className="loading"><h1>Unable to load account</h1><p>{authError}</p><p>Check Firebase Authentication, Firestore rules, and network access.</p></main>;
  return <AuthContext.Provider value={{ user, setUser }}><CompareContext.Provider value={{ ids: compareIds, toggle: toggleCompare, remove: id => setCompareIds(current => current.filter(item => item !== id)) }}><Routes><Route path="/" element={<Home/>}/><Route path="/properties" element={<Properties/>}/><Route path="/property/:id" element={<PropertyDetail/>}/><Route path="/compare" element={<ComparePage/>}/><Route path="/login" element={<AuthPage mode="login"/>}/><Route path="/register" element={<AuthPage mode="register"/>}/><Route path="/dashboard" element={user ? <Dashboard/> : <AuthPage mode="login"/>}/><Route path="/admin" element={user?.role === 'admin' ? <Admin/> : <AuthPage mode="login"/>}/><Route path="*" element={<Layout><main className="page"><h1>Page not found</h1><Link to="/">Return home</Link></main></Layout>}/></Routes></CompareContext.Provider></AuthContext.Provider>;
}
