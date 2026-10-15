import type { GeocodeResult } from "@/services/contracts";

/**
 * A small built-in list of cities for offline place search in the demo.
 * City centroids only (public data). This is NOT a live geocoder, the UI says so.
 */
const rows: [string, string, string, string, number, number][] = [
  ["Portland", "Maine", "United States", "US", 43.6591, -70.2568],
  ["Bangor", "Maine", "United States", "US", 44.8016, -68.7712],
  ["Bar Harbor", "Maine", "United States", "US", 44.3876, -68.2039],
  ["Boston", "Massachusetts", "United States", "US", 42.3601, -71.0589],
  ["Cambridge", "Massachusetts", "United States", "US", 42.3736, -71.1097],
  ["Arlington", "Massachusetts", "United States", "US", 42.4154, -71.1565],
  ["Gloucester", "Massachusetts", "United States", "US", 42.6159, -70.6620],
  ["Worcester", "Massachusetts", "United States", "US", 42.2626, -71.8023],
  ["Providence", "Rhode Island", "United States", "US", 41.824, -71.4128],
  ["Newport", "Rhode Island", "United States", "US", 41.4901, -71.3128],
  ["Hartford", "Connecticut", "United States", "US", 41.7658, -72.6734],
  ["New Haven", "Connecticut", "United States", "US", 41.3083, -72.9279],
  ["Burlington", "Vermont", "United States", "US", 44.4759, -73.2121],
  ["Portsmouth", "New Hampshire", "United States", "US", 43.0718, -70.7626],
  ["New York", "New York", "United States", "US", 40.7128, -74.006],
  ["Albany", "New York", "United States", "US", 42.6526, -73.7562],
  ["Buffalo", "New York", "United States", "US", 42.8864, -78.8784],
  ["Philadelphia", "Pennsylvania", "United States", "US", 39.9526, -75.1652],
  ["Pittsburgh", "Pennsylvania", "United States", "US", 40.4406, -79.9959],
  ["Baltimore", "Maryland", "United States", "US", 39.2904, -76.6122],
  ["Washington", "District of Columbia", "United States", "US", 38.9072, -77.0369],
  ["Richmond", "Virginia", "United States", "US", 37.5407, -77.436],
  ["Charleston", "South Carolina", "United States", "US", 32.7765, -79.9311],
  ["Savannah", "Georgia", "United States", "US", 32.0809, -81.0912],
  ["Atlanta", "Georgia", "United States", "US", 33.749, -84.388],
  ["Miami", "Florida", "United States", "US", 25.7617, -80.1918],
  ["Orlando", "Florida", "United States", "US", 28.5383, -81.3792],
  ["Nashville", "Tennessee", "United States", "US", 36.1627, -86.7816],
  ["New Orleans", "Louisiana", "United States", "US", 29.9511, -90.0715],
  ["Chicago", "Illinois", "United States", "US", 41.8781, -87.6298],
  ["Detroit", "Michigan", "United States", "US", 42.3314, -83.0458],
  ["Cleveland", "Ohio", "United States", "US", 41.4993, -81.6944],
  ["Minneapolis", "Minnesota", "United States", "US", 44.9778, -93.265],
  ["Milwaukee", "Wisconsin", "United States", "US", 43.0389, -87.9065],
  ["St. Louis", "Missouri", "United States", "US", 38.627, -90.1994],
  ["Kansas City", "Missouri", "United States", "US", 39.0997, -94.5786],
  ["Omaha", "Nebraska", "United States", "US", 41.2565, -95.9345],
  ["Denver", "Colorado", "United States", "US", 39.7392, -104.9903],
  ["Austin", "Texas", "United States", "US", 30.2672, -97.7431],
  ["Houston", "Texas", "United States", "US", 29.7604, -95.3698],
  ["Dallas", "Texas", "United States", "US", 32.7767, -96.797],
  ["San Antonio", "Texas", "United States", "US", 29.4241, -98.4936],
  ["Santa Fe", "New Mexico", "United States", "US", 35.687, -105.9378],
  ["Phoenix", "Arizona", "United States", "US", 33.4484, -112.074],
  ["Salt Lake City", "Utah", "United States", "US", 40.7608, -111.891],
  ["Las Vegas", "Nevada", "United States", "US", 36.1699, -115.1398],
  ["Los Angeles", "California", "United States", "US", 34.0522, -118.2437],
  ["San Diego", "California", "United States", "US", 32.7157, -117.1611],
  ["San Francisco", "California", "United States", "US", 37.7749, -122.4194],
  ["Sacramento", "California", "United States", "US", 38.5816, -121.4944],
  ["Portland", "Oregon", "United States", "US", 45.5152, -122.6784],
  ["Seattle", "Washington", "United States", "US", 47.6062, -122.3321],
  ["Anchorage", "Alaska", "United States", "US", 61.2181, -149.9003],
  ["Honolulu", "Hawaii", "United States", "US", 21.3069, -157.8583],
  ["Montréal", "Québec", "Canada", "CA", 45.5019, -73.5674],
  ["Québec City", "Québec", "Canada", "CA", 46.8139, -71.208],
  ["Toronto", "Ontario", "Canada", "CA", 43.6532, -79.3832],
  ["Ottawa", "Ontario", "Canada", "CA", 45.4215, -75.6972],
  ["Halifax", "Nova Scotia", "Canada", "CA", 44.6488, -63.5752],
  ["Vancouver", "British Columbia", "Canada", "CA", 49.2827, -123.1207],
  ["Mexico City", "", "Mexico", "MX", 19.4326, -99.1332],
  ["Havana", "", "Cuba", "CU", 23.1136, -82.3666],
  ["San Juan", "Puerto Rico", "United States", "US", 18.4655, -66.1057],
  ["London", "England", "United Kingdom", "GB", 51.5072, -0.1276],
  ["Edinburgh", "Scotland", "United Kingdom", "GB", 55.9533, -3.1883],
  ["Dublin", "Leinster", "Ireland", "IE", 53.3498, -6.2603],
  ["Galway", "Connacht", "Ireland", "IE", 53.2707, -9.0568],
  ["Paris", "Île-de-France", "France", "FR", 48.8566, 2.3522],
  ["Lyon", "Auvergne-Rhône-Alpes", "France", "FR", 45.764, 4.8357],
  ["Nice", "Provence-Alpes-Côte d'Azur", "France", "FR", 43.7102, 7.262],
  ["Amsterdam", "North Holland", "Netherlands", "NL", 52.3676, 4.9041],
  ["Brussels", "", "Belgium", "BE", 50.8503, 4.3517],
  ["Berlin", "", "Germany", "DE", 52.52, 13.405],
  ["Munich", "Bavaria", "Germany", "DE", 48.1351, 11.582],
  ["Hamburg", "", "Germany", "DE", 53.5511, 9.9937],
  ["Vienna", "", "Austria", "AT", 48.2082, 16.3738],
  ["Zürich", "", "Switzerland", "CH", 47.3769, 8.5417],
  ["Rome", "Lazio", "Italy", "IT", 41.9028, 12.4964],
  ["Florence", "Tuscany", "Italy", "IT", 43.7696, 11.2558],
  ["Venice", "Veneto", "Italy", "IT", 45.4408, 12.3155],
  ["Naples", "Campania", "Italy", "IT", 40.8518, 14.2681],
  ["Palermo", "Sicily", "Italy", "IT", 38.1157, 13.3615],
  ["Madrid", "", "Spain", "ES", 40.4168, -3.7038],
  ["Barcelona", "Catalonia", "Spain", "ES", 41.3874, 2.1686],
  ["Lisbon", "", "Portugal", "PT", 38.7223, -9.1393],
  ["Porto", "", "Portugal", "PT", 41.1579, -8.6291],
  ["Athens", "", "Greece", "GR", 37.9838, 23.7275],
  ["Stockholm", "", "Sweden", "SE", 59.3293, 18.0686],
  ["Oslo", "", "Norway", "NO", 59.9139, 10.7522],
  ["Copenhagen", "", "Denmark", "DK", 55.6761, 12.5683],
  ["Helsinki", "", "Finland", "FI", 60.1699, 24.9384],
  ["Reykjavík", "", "Iceland", "IS", 64.1466, -21.9426],
  ["Warsaw", "", "Poland", "PL", 52.2297, 21.0122],
  ["Kraków", "", "Poland", "PL", 50.0647, 19.945],
  ["Prague", "", "Czechia", "CZ", 50.0755, 14.4378],
  ["Budapest", "", "Hungary", "HU", 47.4979, 19.0402],
  ["Istanbul", "", "Türkiye", "TR", 41.0082, 28.9784],
  ["Jerusalem", "", "Israel", "IL", 31.7683, 35.2137],
  ["Cairo", "", "Egypt", "EG", 30.0444, 31.2357],
  ["Marrakesh", "", "Morocco", "MA", 31.6295, -7.9811],
  ["Lagos", "", "Nigeria", "NG", 6.5244, 3.3792],
  ["Accra", "", "Ghana", "GH", 5.6037, -0.187],
  ["Nairobi", "", "Kenya", "KE", -1.2921, 36.8219],
  ["Cape Town", "Western Cape", "South Africa", "ZA", -33.9249, 18.4241],
  ["Johannesburg", "Gauteng", "South Africa", "ZA", -26.2041, 28.0473],
  ["Mumbai", "Maharashtra", "India", "IN", 19.076, 72.8777],
  ["Delhi", "", "India", "IN", 28.7041, 77.1025],
  ["Kolkata", "West Bengal", "India", "IN", 22.5726, 88.3639],
  ["Chennai", "Tamil Nadu", "India", "IN", 13.0827, 80.2707],
  ["Karachi", "Sindh", "Pakistan", "PK", 24.8607, 67.0011],
  ["Dhaka", "", "Bangladesh", "BD", 23.8103, 90.4125],
  ["Bangkok", "", "Thailand", "TH", 13.7563, 100.5018],
  ["Hanoi", "", "Vietnam", "VN", 21.0278, 105.8342],
  ["Ho Chi Minh City", "", "Vietnam", "VN", 10.8231, 106.6297],
  ["Manila", "", "Philippines", "PH", 14.5995, 120.9842],
  ["Singapore", "", "Singapore", "SG", 1.3521, 103.8198],
  ["Hong Kong", "", "China", "HK", 22.3193, 114.1694],
  ["Shanghai", "", "China", "CN", 31.2304, 121.4737],
  ["Beijing", "", "China", "CN", 39.9042, 116.4074],
  ["Seoul", "", "South Korea", "KR", 37.5665, 126.978],
  ["Tokyo", "", "Japan", "JP", 35.6762, 139.6503],
  ["Kyoto", "", "Japan", "JP", 35.0116, 135.7681],
  ["Sydney", "New South Wales", "Australia", "AU", -33.8688, 151.2093],
  ["Melbourne", "Victoria", "Australia", "AU", -37.8136, 144.9631],
  ["Auckland", "", "New Zealand", "NZ", -36.8509, 174.7645],
  ["São Paulo", "", "Brazil", "BR", -23.5505, -46.6333],
  ["Rio de Janeiro", "", "Brazil", "BR", -22.9068, -43.1729],
  ["Buenos Aires", "", "Argentina", "AR", -34.6037, -58.3816],
  ["Santiago", "", "Chile", "CL", -33.4489, -70.6693],
  ["Lima", "", "Peru", "PE", -12.0464, -77.0428],
  ["Bogotá", "", "Colombia", "CO", 4.711, -74.0721],
  ["Kingston", "", "Jamaica", "JM", 17.9712, -76.7936],
  ["Port-au-Prince", "", "Haiti", "HT", 18.5944, -72.3074],
  ["Santo Domingo", "", "Dominican Republic", "DO", 18.4861, -69.9312],
];

export const gazetteer: GeocodeResult[] = rows.map(([locality, region, country, countryCode, lat, lng]) => ({
  name: [locality, region || country].filter(Boolean).join(", "),
  locality,
  region: region || undefined,
  country,
  countryCode,
  lat,
  lng,
}));

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function searchGazetteer(query: string, limit = 8): GeocodeResult[] {
  const q = norm(query);
  if (q.length < 2) return [];
  const scored = gazetteer
    .map((g) => {
      const loc = norm(g.locality);
      const full = norm(`${g.locality} ${g.region ?? ""} ${g.country}`);
      let score = 0;
      if (loc === q) score = 100;
      else if (loc.startsWith(q)) score = 80;
      else if (full.includes(q)) score = 50;
      else if (q.split(" ").every((t) => full.includes(t))) score = 30;
      return { g, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.g.locality.localeCompare(b.g.locality));
  return scored.slice(0, limit).map((x) => x.g);
}
