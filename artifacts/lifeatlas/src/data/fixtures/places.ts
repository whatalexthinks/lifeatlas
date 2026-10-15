import type { Place } from "@/domain/models";

/**
 * City / landmark-level places only. No residential addresses.
 * Coordinates are public city centroids or public landmarks.
 */
export const places: Place[] = [
  { id: "pl_portland", name: "Portland, Maine", locality: "Portland", region: "Maine", country: "United States", countryCode: "US", point: { lat: 43.6591, lng: -70.2568 }, precision: "city", visibility: "family", source: "fixture" },
  { id: "pl_capeelizabeth", name: "Portland Head Light", nickname: "The lighthouse", locality: "Cape Elizabeth", region: "Maine", country: "United States", countryCode: "US", point: { lat: 43.6231, lng: -70.2079 }, precision: "landmark", visibility: "family", source: "fixture" },
  { id: "pl_montreal", name: "Montréal, Québec", locality: "Montréal", region: "Québec", country: "Canada", countryCode: "CA", point: { lat: 45.5019, lng: -73.5674 }, precision: "city", visibility: "family", source: "fixture" },
  { id: "pl_boston", name: "Boston, Massachusetts", locality: "Boston", region: "Massachusetts", country: "United States", countryCode: "US", point: { lat: 42.3601, lng: -71.0589 }, precision: "city", visibility: "family", source: "fixture" },
  { id: "pl_arlington", name: "Arlington, Massachusetts", nickname: "The house with the crooked porch", locality: "Arlington", region: "Massachusetts", country: "United States", countryCode: "US", point: { lat: 42.4154, lng: -71.1565 }, precision: "city", visibility: "family", source: "fixture" },
  { id: "pl_newyork", name: "New York, New York", locality: "New York", region: "New York", country: "United States", countryCode: "US", point: { lat: 40.7128, lng: -74.006 }, precision: "city", visibility: "family", source: "fixture" },
  { id: "pl_sanfrancisco", name: "San Francisco, California", locality: "San Francisco", region: "California", country: "United States", countryCode: "US", point: { lat: 37.7749, lng: -122.4194 }, precision: "city", visibility: "family", source: "fixture" },
  { id: "pl_london", name: "London, England", locality: "London", region: "England", country: "United Kingdom", countryCode: "GB", point: { lat: 51.5072, lng: -0.1276 }, precision: "city", visibility: "family", source: "fixture" },
  { id: "pl_paris", name: "Paris, France", locality: "Paris", region: "Île-de-France", country: "France", countryCode: "FR", point: { lat: 48.8566, lng: 2.3522 }, precision: "city", visibility: "family", source: "fixture" },
  { id: "pl_florence", name: "Florence, Italy", locality: "Florence", region: "Tuscany", country: "Italy", countryCode: "IT", point: { lat: 43.7696, lng: 11.2558 }, precision: "city", visibility: "family", source: "fixture" },
  { id: "pl_acadia", name: "Acadia National Park", nickname: "Where Dad taught us to paddle", locality: "Mount Desert Island", region: "Maine", country: "United States", countryCode: "US", point: { lat: 44.3386, lng: -68.2733 }, precision: "landmark", visibility: "family", source: "fixture" },
  { id: "pl_providence", name: "Providence, Rhode Island", locality: "Providence", region: "Rhode Island", country: "United States", countryCode: "US", point: { lat: 41.824, lng: -71.4128 }, precision: "city", visibility: "family", source: "fixture" },
];
