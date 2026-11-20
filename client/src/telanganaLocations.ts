export type TelanganaLocation = {
  id: string;
  name: string;
  district: string;
  kind: 'district' | 'town' | 'locality';
  aliases: string[];
};

const districts = [
  'Adilabad', 'Bhadradri Kothagudem', 'Hanumakonda', 'Hyderabad', 'Jagtial',
  'Jangaon', 'Jayashankar Bhupalpally', 'Jogulamba Gadwal', 'Kamareddy',
  'Karimnagar', 'Khammam', 'Kumuram Bheem Asifabad', 'Mahabubabad',
  'Mahabubnagar', 'Mancherial', 'Medak', 'Medchal-Malkajgiri', 'Mulugu',
  'Nagarkurnool', 'Nalgonda', 'Narayanpet', 'Nirmal', 'Nizamabad', 'Peddapalli',
  'Rajanna Sircilla', 'Rangareddy', 'Sangareddy', 'Siddipet', 'Suryapet',
  'Vikarabad', 'Wanaparthy', 'Warangal', 'Yadadri Bhuvanagiri'
];

const towns: [name: string, district: string, aliases?: string[]][] = [
  ['Adilabad', 'Adilabad'], ['Utnoor', 'Adilabad'], ['Ichoda', 'Adilabad'],
  ['Kothagudem', 'Bhadradri Kothagudem'], ['Bhadrachalam', 'Bhadradri Kothagudem'],
  ['Palvancha', 'Bhadradri Kothagudem'], ['Asifabad', 'Kumuram Bheem Asifabad'],
  ['Kagaznagar', 'Kumuram Bheem Asifabad'], ['Hanumakonda', 'Hanumakonda'],
  ['Warangal', 'Warangal'], ['Jagtial', 'Jagtial'], ['Korutla', 'Jagtial'],
  ['Metpally', 'Jagtial'], ['Jangaon', 'Jangaon'], ['Ghanpur Station', 'Jangaon'],
  ['Bhupalpally', 'Jayashankar Bhupalpally'], ['Parkal', 'Hanumakonda'],
  ['Gadwal', 'Jogulamba Gadwal'], ['Alampur', 'Jogulamba Gadwal'],
  ['Kamareddy', 'Kamareddy'], ['Banswada', 'Kamareddy'],
  ['Karimnagar', 'Karimnagar'], ['Huzurabad', 'Karimnagar'],
  ['Khammam', 'Khammam'], ['Madhira', 'Khammam'],
  ['Mahabubabad', 'Mahabubabad'], ['Dornakal', 'Mahabubabad'],
  ['Mahabubnagar', 'Mahabubnagar'], ['Jadcherla', 'Mahabubnagar'],
  ['Mancherial', 'Mancherial'], ['Bellampalli', 'Mancherial'],
  ['Mandamarri', 'Mancherial'], ['Medak', 'Medak'], ['Narsapur', 'Medak'],
  ['Medchal', 'Medchal-Malkajgiri'], ['Kompally', 'Medchal-Malkajgiri'],
  ['Ghatkesar', 'Medchal-Malkajgiri'], ['Boduppal', 'Medchal-Malkajgiri'],
  ['Mulugu', 'Mulugu'], ['Eturnagaram', 'Mulugu'],
  ['Nagarkurnool', 'Nagarkurnool'], ['Kalwakurthy', 'Nagarkurnool'],
  ['Achampet', 'Nagarkurnool'], ['Nalgonda', 'Nalgonda'],
  ['Miryalaguda', 'Nalgonda'], ['Devarakonda', 'Nalgonda'],
  ['Narayanpet', 'Narayanpet'], ['Makthal', 'Narayanpet'],
  ['Nirmal', 'Nirmal'], ['Bhainsa', 'Nirmal'], ['Nizamabad', 'Nizamabad'],
  ['Armoor', 'Nizamabad'], ['Bodhan', 'Nizamabad'],
  ['Peddapalli', 'Peddapalli'], ['Ramagundam', 'Peddapalli'],
  ['Godavarikhani', 'Peddapalli'], ['Sircilla', 'Rajanna Sircilla'],
  ['Vemulawada', 'Rajanna Sircilla'], ['Shadnagar', 'Rangareddy'],
  ['Chevella', 'Rangareddy'], ['Ibrahimpatnam', 'Rangareddy'],
  ['Shamshabad', 'Rangareddy'], ['Rajendranagar', 'Rangareddy'],
  ['Sangareddy', 'Sangareddy'], ['Zaheerabad', 'Sangareddy'],
  ['Patancheru', 'Sangareddy'], ['Isnapur', 'Sangareddy'],
  ['Siddipet', 'Siddipet'], ['Gajwel', 'Siddipet'],
  ['Suryapet', 'Suryapet'], ['Kodad', 'Suryapet'],
  ['Vikarabad', 'Vikarabad'], ['Tandur', 'Vikarabad'],
  ['Wanaparthy', 'Wanaparthy'], ['Kothakota', 'Wanaparthy'],
  ['Bhongir', 'Yadadri Bhuvanagiri', ['Bhuvanagiri']],
  ['Yadagirigutta', 'Yadadri Bhuvanagiri', ['Yadadri']],
  ['Alair', 'Yadadri Bhuvanagiri']
];

const hyderabadLocalities = [
  'Abids', 'Ameerpet', 'Alwal', 'Amberpet', 'Attapur', 'Bachupally',
  'Banjara Hills', 'Begumpet', 'Beeramguda', 'Bowenpally', 'Chandanagar',
  'Charminar', 'Dilsukhnagar', 'East Marredpally', 'Financial District',
  'Gachibowli', 'Habsiguda', 'Hafeezpet', 'Himayatnagar', 'Hitech City',
  'Jubilee Hills', 'Kachiguda', 'Kapra', 'Khairatabad', 'Kondapur',
  'Kukatpally', 'Kushaiguda', 'LB Nagar', 'Madhapur', 'Malkajgiri',
  'Manikonda', 'Mehdipatnam', 'Miyapur', 'Moosapet', 'Musheerabad',
  'Nacharam', 'Nallagandla', 'Nampally', 'Nanakramguda', 'Neredmet',
  'Old City', 'Peerzadiguda', 'Pocharam', 'Pragathi Nagar', 'Punjagutta',
  'Ramanthapur', 'Sainikpuri', 'Saroornagar', 'Secunderabad', 'Serilingampally',
  'Tellapur', 'Tarnaka', 'Tolichowki', 'Uppal', 'Vanasthalipuram', 'Yousufguda'
];

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const entries: TelanganaLocation[] = [
  ...districts.map(name => ({
    id: `district-${slug(name)}`,
    name,
    district: name,
    kind: 'district' as const,
    aliases: name === 'Medchal-Malkajgiri' ? ['Medchal Malkajgiri', 'Medchal'] : []
  })),
  ...towns.map(([name, district, aliases = []]) => ({
    id: `town-${slug(name)}`,
    name,
    district,
    kind: 'town' as const,
    aliases
  }))
];

const existingNames = new Set(entries.map(location => location.name.toLowerCase()));
for (const name of hyderabadLocalities) {
  if (!existingNames.has(name.toLowerCase())) {
    entries.push({
      id: `locality-${slug(name)}`,
      name,
      district: 'Hyderabad',
      kind: 'locality',
      aliases: []
    });
  }
}

export const telanganaLocations = entries;
