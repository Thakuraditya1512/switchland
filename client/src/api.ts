import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import type { Booking, Property, User } from './types';
import { auth, db, firebaseConfigError } from './firebase';
import { demoProperties } from './demoProperties';
import { telanganaLocations } from './telanganaLocations';

function requireAuth() {
  if (!auth) throw new Error(firebaseConfigError || 'Firebase Authentication is not configured.');
  return auth;
}

function requireDb() {
  if (!db) throw new Error(firebaseConfigError || 'Cloud Firestore is not configured.');
  return db;
}

function currentFirebaseUser() {
  const user = requireAuth().currentUser;
  if (!user) throw new Error('Please sign in to continue.');
  return user;
}

async function requireAdmin() {
  const user = currentFirebaseUser();
  const admin = await getDoc(doc(requireDb(), 'admins', user.uid));
  if (!admin.exists()) throw new Error('Admin access is required for this action.');
  return user;
}

async function userFromFirebase(firebaseUser: FirebaseUser, createProfile = false): Promise<User> {
  const database = requireDb();
  const profileRef = doc(database, 'users', firebaseUser.uid);
  let profile = await getDoc(profileRef);

  if (!profile.exists() && createProfile) {
    await setDoc(profileRef, {
      name: firebaseUser.displayName || 'Switchland member',
      email: firebaseUser.email || '',
      createdAt: serverTimestamp()
    });
    profile = await getDoc(profileRef);
  }

  const admin = await getDoc(doc(database, 'admins', firebaseUser.uid));
  return {
    id: firebaseUser.uid,
    name: profile.data()?.name || firebaseUser.displayName || 'Switchland member',
    email: firebaseUser.email || profile.data()?.email || '',
    role: admin.exists() ? 'admin' : 'customer'
  };
}

function mapProperty(snapshot: { id: string; data: () => Record<string, unknown> }): Property {
  return { ...snapshot.data(), id: snapshot.id } as Property;
}

function mapBooking(snapshot: { id: string; data: () => Record<string, unknown> }): Booking {
  const data = snapshot.data();
  const preferred = data.preferred_date;
  const created = data.createdAt;
  return {
    id: snapshot.id,
    property_id: String(data.property_id || ''),
    property_title: String(data.property_title || 'Plot enquiry'),
    booking_type: data.booking_type === 'purchase_enquiry' ? 'purchase_enquiry' : 'site_visit',
    preferred_date: preferred instanceof Timestamp ? preferred.toDate().toISOString().slice(0, 10) : null,
    message: typeof data.message === 'string' ? data.message : null,
    status: String(data.status || 'pending'),
    created_at: created instanceof Timestamp ? created.toDate().toISOString() : new Date(0).toISOString()
  };
}

function numberOrNull(value: unknown): number | null {
  if (value === '' || value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function propertyDocument(body: Record<string, unknown>) {
  const title = String(body.title || '').trim();
  const price = Number(body.price);
  const plotArea = Number(body.plot_area_sqft ?? body.area_sqft);
  const slug = String(body.slug || `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now()}`);
  return {
    title,
    slug,
    description: String(body.description || ''),
    property_type: 'Plot',
    listing_type: 'sale',
    price,
    city: String(body.city || ''),
    locality: String(body.locality || ''),
    bedrooms: 0,
    bathrooms: 0,
    area_sqft: Number(body.area_sqft ?? plotArea),
    cover_image: String(body.cover_image || ''),
    status: 'available',
    featured: body.featured === true || body.is_featured === true,
    is_featured: body.is_featured === true || body.featured === true,
    plot_area_sqft: plotArea,
    price_per_sqft: numberOrNull(body.price_per_sqft) ?? (plotArea > 0 ? Math.round(price / plotArea) : null),
    facing: String(body.facing || 'Not specified'),
    road_width_ft: numberOrNull(body.road_width_ft),
    approval_status: String(body.approval_status || 'Pending verification'),
    water_source: String(body.water_source || 'Not specified'),
    groundwater_depth_ft: numberOrNull(body.groundwater_depth_ft),
    water_availability_rating: numberOrNull(body.water_availability_rating),
    shopping_center_name: String(body.shopping_center_name || 'Not listed'),
    shopping_center_distance_km: numberOrNull(body.shopping_center_distance_km) ?? 0,
    vegetable_market_name: String(body.vegetable_market_name || 'Not listed'),
    vegetable_market_distance_km: numberOrNull(body.vegetable_market_distance_km) ?? 0,
    main_road_distance_km: numberOrNull(body.main_road_distance_km),
    createdAt: serverTimestamp()
  };
}

export const api = {
  currentUser: async () => {
    const user = requireAuth().currentUser;
    return user ? userFromFirebase(user) : null;
  },
  register: async (body: { name: string; email: string; password: string }) => {
    const credential = await createUserWithEmailAndPassword(requireAuth(), body.email.trim(), body.password);
    try {
      await updateProfile(credential.user, { displayName: body.name.trim() });
      await setDoc(doc(requireDb(), 'users', credential.user.uid), {
        name: body.name.trim(),
        email: credential.user.email || body.email.trim(),
        createdAt: serverTimestamp()
      });
      return { user: await userFromFirebase(credential.user) };
    } catch (error) {
      await deleteUser(credential.user);
      throw error;
    }
  },
  login: async (body: { email: string; password: string }) => {
    const credential = await signInWithEmailAndPassword(requireAuth(), body.email.trim(), body.password);
    return { user: await userFromFirebase(credential.user, true) };
  },
  logout: () => signOut(requireAuth()),
  properties: async (search = '') => {
    let listed: Property[];
    let isDemo = !db;
    if (db) {
      const snapshots = await getDocs(query(collection(db, 'lands'), where('status', '==', 'available'), limit(100)));
      listed = snapshots.docs.map(mapProperty);
      if (!listed.length) {
        listed = demoProperties.map((property, index) => ({ ...property, id: property.slug || `demo-${index + 1}` }));
        isDemo = true;
      }
    } else {
      listed = demoProperties.map((property, index) => ({ ...property, id: property.slug || `demo-${index + 1}` }));
    }
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    const term = params.get('q')?.toLowerCase() || '';
    const city = params.get('city')?.toLowerCase() || '';
    const type = params.get('property_type')?.toLowerCase() || '';
    const maxPrice = Number(params.get('max_price')) || Infinity;
    const maxMarketDistance = Number(params.get('max_market_distance')) || Infinity;
    const waterSource = params.get('water_source')?.toLowerCase() || '';
    const approval = params.get('approval_status')?.toLowerCase() || '';
    const featuredOnly = params.get('featured') === 'true';
    const resolveLocation = (value: string) => telanganaLocations.find(location =>
      location.name.toLowerCase() === value || location.aliases.some(alias => alias.toLowerCase() === value)
    );
    const properties = listed
      .filter(property => {
        const district = telanganaLocations.find(location => location.name.toLowerCase() === property.locality.toLowerCase())?.district || '';
        const searchable = `${property.title} ${property.locality} ${property.city} ${district}`.toLowerCase();
        const selectedCity = resolveLocation(city);
        return (!term || searchable.includes(term))
          && (!city || searchable.includes(city) || selectedCity?.name.toLowerCase() === district.toLowerCase())
          && (!type || property.property_type.toLowerCase() === type)
          && Number(property.price) <= maxPrice
          && (!featuredOnly || property.featured || property.is_featured)
          && (!waterSource || (property.water_source || '').toLowerCase().includes(waterSource))
          && (!approval || (property.approval_status || '').toLowerCase().includes(approval))
          && (numberOrNull(property.vegetable_market_distance_km) ?? Infinity) <= maxMarketDistance;
      });
    const sort = params.get('sort');
    properties.sort((a, b) => sort === 'price_asc'
      ? Number(a.price) - Number(b.price)
      : sort === 'price_desc'
        ? Number(b.price) - Number(a.price)
        : sort === 'price_per_sqft'
          ? Number(a.price_per_sqft || Infinity) - Number(b.price_per_sqft || Infinity)
          : Number(Boolean(b.is_featured || b.featured)) - Number(Boolean(a.is_featured || a.featured)));
    return { properties, isDemo };
  },
  locations: async () => {
    if (!db) return { locations: telanganaLocations, isDemo: true };
    const snapshot = await getDocs(query(collection(db, 'locations'), orderBy('name'), limit(500)));
    if (!snapshot.empty) {
      return {
        locations: snapshot.docs.map(location => ({ ...location.data(), id: location.id })) as typeof telanganaLocations,
        isDemo: false
      };
    }
    return { locations: telanganaLocations, isDemo: true };
  },
  property: async (id: string) => {
    const demo = demoProperties.find(property => property.slug === id);
    if (!db) {
      if (!demo) throw new Error('Plot not found or no longer available.');
      return { property: { ...demo, id } };
    }
    const snapshot = await getDoc(doc(db, 'lands', id));
    if (!snapshot.exists()) {
      if (demo) return { property: { ...demo, id } };
      throw new Error('Plot not found or no longer available.');
    }
    if (snapshot.data().status !== 'available') throw new Error('Plot not found or no longer available.');
    return { property: mapProperty(snapshot) };
  },
  createBooking: async (body: { property_id: string; booking_type: 'purchase_enquiry' | 'site_visit'; preferred_date?: string | null; message?: string }) => {
    const user = currentFirebaseUser();
    const database = requireDb();
    const propertySnapshot = await getDoc(doc(database, 'lands', body.property_id));
    if (!propertySnapshot.exists()) {
      if (demoProperties.some(property => property.slug === body.property_id)) throw new Error('This is a demo plot. Seed the demo lands in Firestore before creating an enquiry.');
      throw new Error('This plot is no longer available.');
    }
    if (propertySnapshot.data().status !== 'available') throw new Error('This plot is no longer available.');
    const property = propertySnapshot.data();
    const preferredDate = body.preferred_date ? Timestamp.fromDate(new Date(`${body.preferred_date}T00:00:00Z`)) : null;
    const created = await addDoc(collection(database, 'bookings'), {
      userId: user.uid,
      property_id: body.property_id,
      property_title: property.title,
      booking_type: body.booking_type,
      preferred_date: preferredDate,
      message: body.message || '',
      status: 'pending',
      createdAt: serverTimestamp()
    });
    return { booking: { id: created.id, property_id: body.property_id, booking_type: body.booking_type, preferred_date: body.preferred_date || null, message: body.message || null, status: 'pending', created_at: new Date().toISOString() } };
  },
  myBookings: async () => {
    const user = currentFirebaseUser();
    const snapshots = await getDocs(query(collection(requireDb(), 'bookings'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')));
    return { bookings: snapshots.docs.map(mapBooking) };
  },
  adminBookings: async () => {
    await requireAdmin();
    const snapshots = await getDocs(query(collection(requireDb(), 'bookings'), orderBy('createdAt', 'desc')));
    return { bookings: snapshots.docs.map(mapBooking) };
  },
  updateBooking: async (id: string, status: string) => {
    await requireAdmin();
    await updateDoc(doc(requireDb(), 'bookings', id), { status });
    return { success: true };
  },
  createProperty: async (body: object) => {
    await requireAdmin();
    const property = propertyDocument(body as Record<string, unknown>);
    const created = await addDoc(collection(requireDb(), 'lands'), property);
    return { property: { ...property, id: created.id } };
  },
  updateProperty: async (id: string, body: object) => {
    await requireAdmin();
    const property = propertyDocument(body as Record<string, unknown>);
    delete (property as { createdAt?: unknown }).createdAt;
    await updateDoc(doc(requireDb(), 'lands', id), property);
    return { success: true };
  },
  seedDemoProperties: async () => {
    await requireAdmin();
    const database = requireDb();
    const existing = await Promise.all(demoProperties.map(property => getDoc(doc(database, 'lands', property.slug))));
    const missing = demoProperties.filter((_, index) => !existing[index].exists());
    const existingLocations = await getDocs(collection(database, 'locations'));
    const locationIds = new Set(existingLocations.docs.map(location => location.id));
    const missingLocations = telanganaLocations.filter(location => !locationIds.has(location.id));
    if (!missing.length && !missingLocations.length) return { added: 0, locationsAdded: 0 };
    const batch = writeBatch(database);
    for (const property of missing) {
      batch.set(doc(database, 'lands', property.slug), { ...property, createdAt: serverTimestamp() });
    }
    for (const location of missingLocations) {
      batch.set(doc(database, 'locations', location.id), {
        name: location.name,
        normalized_name: location.name.toLowerCase(),
        district: location.district,
        kind: location.kind,
        aliases: location.aliases,
        state: 'Telangana'
      });
    }
    await batch.commit();
    return { added: missing.length, locationsAdded: missingLocations.length };
  }
};
