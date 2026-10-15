import type { LifeEvent, Persona, Person, Relationship } from "@/domain/models";

/**
 * THE ELLIS FAMILY — a fictional sample family.
 * These people do not exist and have not endorsed OurLifeCapsule.
 *
 * Family graph (all dates internally consistent):
 *   Walter Hale (1909–1981) ── Eleanor Hale (1912–1996)
 *        ├─ Peter Hale (1937–2019)
 *        └─ Margaret Ellis, née Hale (b. 1940, Portland, Maine)
 *              ══ Thomas Ellis (1938–2013), married 1965
 *                    ├─ Sarah Ellis (b. 1968)  ══ Jonah Reed (b. 1967)
 *                    │      └─ Emma Ellis (b. 2005)
 *                    └─ Daniel Ellis (b. 1971) ══ Priya Ellis (b. 1973)
 *                           └─ Leo Ellis (b. 2010)
 *   Colette Arsenault (1915–2002) — Eleanor's sister, Montréal
 *   June Whitaker (b. 1946) — Margaret's friend and fellow potter
 */

const T = "2026-09-02T14:00:00.000Z";

const person = (p: Omit<Person, "createdAt" | "updatedAt" | "isSample">): Person => ({
  ...p,
  isSample: true,
  createdAt: T,
  updatedAt: T,
});

export const people: Person[] = [
  person({ id: "per_margaret", displayName: "Margaret Ellis", givenName: "Margaret", familyName: "Ellis", birthYear: 1940, birthplaceId: "pl_portland", shortBio: "Potter, nurse's daughter, keeper of the blue bowl. Born in Portland, Maine." }),
  person({ id: "per_thomas", displayName: "Thomas Ellis", givenName: "Thomas", familyName: "Ellis", birthYear: 1938, deathYear: 2013, birthplaceId: "pl_boston", shortBio: "Physics teacher, woodworker, terrible whistler. Margaret's husband of 48 years." }),
  person({ id: "per_sarah", displayName: "Sarah Ellis", givenName: "Sarah", familyName: "Ellis", birthYear: 1968, birthplaceId: "pl_boston", shortBio: "Margaret and Thomas's daughter. Keeps the family archive." }),
  person({ id: "per_daniel", displayName: "Daniel Ellis", givenName: "Daniel", familyName: "Ellis", birthYear: 1971, birthplaceId: "pl_boston", shortBio: "Margaret and Thomas's son. Remembers every road trip argument." }),
  person({ id: "per_emma", displayName: "Emma Ellis", givenName: "Emma", familyName: "Ellis", birthYear: 2005, birthplaceId: "pl_providence", shortBio: "Sarah's daughter. Margaret's first grandchild." }),
  person({ id: "per_leo", displayName: "Leo Ellis", givenName: "Leo", familyName: "Ellis", birthYear: 2010, shortBio: "Daniel and Priya's son." }),
  person({ id: "per_jonah", displayName: "Jonah Reed", givenName: "Jonah", familyName: "Reed", birthYear: 1967, shortBio: "Sarah's husband." }),
  person({ id: "per_priya", displayName: "Priya Ellis", givenName: "Priya", familyName: "Ellis", birthYear: 1973, shortBio: "Daniel's wife." }),
  person({ id: "per_peter", displayName: "Peter Hale", givenName: "Peter", familyName: "Hale", birthYear: 1937, deathYear: 2019, birthplaceId: "pl_portland", shortBio: "Margaret's older brother. Counted every boat in Portland harbor." }),
  person({ id: "per_walter", displayName: "Walter Hale", givenName: "Walter", familyName: "Hale", birthYear: 1909, deathYear: 1981, birthplaceId: "pl_portland", shortBio: "Margaret's father. Ferry engineer on Casco Bay." }),
  person({ id: "per_eleanor", displayName: "Eleanor Hale", givenName: "Eleanor", familyName: "Hale", birthYear: 1912, deathYear: 1996, shortBio: "Margaret's mother. Never used a recipe." }),
  person({ id: "per_colette", displayName: "Colette Arsenault", givenName: "Colette", familyName: "Arsenault", birthYear: 1915, deathYear: 2002, birthplaceId: "pl_montreal", shortBio: "Eleanor's sister in Montréal." }),
  person({ id: "per_june", displayName: "June Whitaker", givenName: "June", familyName: "Whitaker", birthYear: 1946, shortBio: "Margaret's friend of fifty years and fellow potter." }),
];

export const relationships: Relationship[] = [
  { id: "rel_1", fromPersonId: "per_walter", toPersonId: "per_eleanor", kind: "spouse", since: 1934, until: 1981 },
  { id: "rel_2", fromPersonId: "per_walter", toPersonId: "per_margaret", kind: "parent" },
  { id: "rel_3", fromPersonId: "per_eleanor", toPersonId: "per_margaret", kind: "parent" },
  { id: "rel_4", fromPersonId: "per_walter", toPersonId: "per_peter", kind: "parent" },
  { id: "rel_5", fromPersonId: "per_eleanor", toPersonId: "per_peter", kind: "parent" },
  { id: "rel_6", fromPersonId: "per_peter", toPersonId: "per_margaret", kind: "sibling" },
  { id: "rel_7", fromPersonId: "per_thomas", toPersonId: "per_margaret", kind: "spouse", since: 1965, until: 2013 },
  { id: "rel_8", fromPersonId: "per_margaret", toPersonId: "per_sarah", kind: "parent" },
  { id: "rel_9", fromPersonId: "per_thomas", toPersonId: "per_sarah", kind: "parent" },
  { id: "rel_10", fromPersonId: "per_margaret", toPersonId: "per_daniel", kind: "parent" },
  { id: "rel_11", fromPersonId: "per_thomas", toPersonId: "per_daniel", kind: "parent" },
  { id: "rel_12", fromPersonId: "per_jonah", toPersonId: "per_sarah", kind: "spouse", since: 2001 },
  { id: "rel_13", fromPersonId: "per_sarah", toPersonId: "per_emma", kind: "parent" },
  { id: "rel_14", fromPersonId: "per_jonah", toPersonId: "per_emma", kind: "parent" },
  { id: "rel_15", fromPersonId: "per_priya", toPersonId: "per_daniel", kind: "spouse", since: 2006 },
  { id: "rel_16", fromPersonId: "per_daniel", toPersonId: "per_leo", kind: "parent" },
  { id: "rel_17", fromPersonId: "per_priya", toPersonId: "per_leo", kind: "parent" },
  { id: "rel_18", fromPersonId: "per_colette", toPersonId: "per_eleanor", kind: "sibling" },
  { id: "rel_19", fromPersonId: "per_june", toPersonId: "per_margaret", kind: "friend", since: 1975 },
];

export const lifeEvents: LifeEvent[] = [
  { id: "le_1", personId: "per_margaret", kind: "birth", label: "Born in Portland, Maine", date: { precision: "month", year: 1940, month: 4 }, placeId: "pl_portland" },
  { id: "le_2", personId: "per_margaret", kind: "move", label: "Moved to Boston", date: { precision: "month", year: 1961, month: 9 }, placeId: "pl_boston" },
  { id: "le_3", personId: "per_margaret", kind: "marriage", label: "Married Thomas Ellis", date: { precision: "day", year: 1965, month: 6, day: 12 }, placeId: "pl_boston" },
  { id: "le_4", personId: "per_margaret", kind: "child", label: "Sarah is born", date: { precision: "month", year: 1968, month: 3 }, placeId: "pl_boston" },
  { id: "le_5", personId: "per_margaret", kind: "child", label: "Daniel is born", date: { precision: "year", year: 1971 }, placeId: "pl_boston" },
  { id: "le_6", personId: "per_margaret", kind: "move", label: "The house in Arlington", date: { precision: "circa", year: 1979 }, placeId: "pl_arlington" },
  { id: "le_7", personId: "per_margaret", kind: "career", label: "First pottery show", date: { precision: "year", year: 1976 }, placeId: "pl_newyork" },
  { id: "le_8", personId: "per_margaret", kind: "loss", label: "Thomas dies", date: { precision: "year", year: 2013 }, placeId: "pl_arlington" },
  { id: "le_9", personId: "per_margaret", kind: "move", label: "Returns to Portland", date: { precision: "year", year: 2014 }, placeId: "pl_portland" },
];

/**
 * Demo identities. Switching persona changes what the UI shows; it is NOT
 * authentication and enforces nothing. Real enforcement is Part Two.
 */
export const personas: Persona[] = [
  {
    id: "persona_sarah",
    kind: "organizer",
    name: "Sarah Ellis",
    personId: "per_sarah",
    description: "Owner of the family capsules. Sees everything, manages invitations, billing and exports.",
    roles: [
      { capsuleId: "cap_margaret", role: "owner" },
      { capsuleId: "cap_thomas", role: "owner" },
      { capsuleId: "cap_sarah", role: "owner" },
      { capsuleId: "cap_us", role: "owner" },
      { capsuleId: "cap_family", role: "owner" },
    ],
  },
  {
    id: "persona_margaret",
    kind: "storyteller",
    name: "Margaret Ellis",
    personId: "per_margaret",
    description: "Storyteller. Answers questions and controls her own contributions.",
    roles: [
      { capsuleId: "cap_margaret", role: "storyteller" },
      { capsuleId: "cap_thomas", role: "contributor" },
      { capsuleId: "cap_family", role: "contributor" },
    ],
  },
  {
    id: "persona_emma",
    kind: "contributor",
    name: "Emma Ellis",
    personId: "per_emma",
    description: "Contributor by invitation. Adds a story, a photo or a recording.",
    roles: [
      { capsuleId: "cap_margaret", role: "contributor" },
      { capsuleId: "cap_thomas", role: "contributor" },
      { capsuleId: "cap_us", role: "viewer" },
      { capsuleId: "cap_family", role: "contributor" },
    ],
  },
  {
    id: "persona_jonah",
    kind: "viewer",
    name: "Jonah Reed",
    personId: "per_jonah",
    description: "Viewer on Margaret's capsule; co-editor of the couple's capsule he shares with Sarah.",
    roles: [
      { capsuleId: "cap_margaret", role: "viewer" },
      { capsuleId: "cap_us", role: "organizer" },
    ],
  },
  {
    id: "persona_ops",
    kind: "operations",
    name: "Operations (demo)",
    description: "Internal operations preview. Not real staff access.",
    roles: [],
  },
];
