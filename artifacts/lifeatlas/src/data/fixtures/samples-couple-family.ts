import type { Capsule, CapsuleMembership, FutureMessage, FuzzyDate, MediaAsset, Memory, MemoryAttribution, Place } from "@/domain/models";
import { NO_PHOTO_NOTICE, PHOTO_NOTICE } from "./media";
import { photoForPlate } from "@/lib/media/editorial-photos";

/**
 * Two more sample capsules for the fictional Ellis family:
 *  - "Our Story", Sarah Ellis and Jonah Reed (married 2001), a couples capsule.
 *  - "The Ellis Family", four generations, told by several people.
 * Written for this demo. These people do not exist; nothing here is a real testimonial.
 * Dates are consistent with the rest of the fixtures (people.ts, memories.ts).
 */

const T = "2026-09-10T12:00:00.000Z";
const US = "cap_us";
const FAM = "cap_family";

/* ------------------------------- Places ------------------------------- */

export const extraPlaces: Place[] = [
  { id: "pl_stow", name: "Stow, Massachusetts", nickname: "The orchard", locality: "Stow", region: "Massachusetts", country: "United States", countryCode: "US", point: { lat: 42.4368, lng: -71.5062 }, precision: "city", visibility: "family", source: "fixture" },
  { id: "pl_halifax", name: "Halifax, Nova Scotia", locality: "Halifax", region: "Nova Scotia", country: "Canada", countryCode: "CA", point: { lat: 44.6488, lng: -63.5752 }, precision: "city", visibility: "family", source: "fixture" },
];

/* ------------------------------ Capsules ------------------------------ */

export const extraCapsules: Capsule[] = [
  {
    id: US,
    kind: "couple",
    subjectName: "Sarah & Jonah",
    preferredName: "Sarah & Jonah",
    peopleIds: ["per_sarah", "per_jonah"],
    relationship: "Partner",
    relationshipKind: "partner",
    title: "Our Story",
    description: "A broken umbrella, an orchard wedding, and twenty-five years of Sunday pancakes.",
    dedication: "For the two of us, and for Emma, who came along and made it three.",
    theme: { palette: "terracotta", typography: "italic" },
    cover: { mediaId: "med_us_orchard", layout: "full_bleed", focalY: 55 },
    status: "active",
    collectionMode: "in_person",
    defaultPrivacy: "family",
    startingChapter: "love",
    chapterOrder: ["love", "coming_of_age", "journeys", "family", "everyday", "work", "wisdom", "childhood"],
    featuredMemoryId: "mem_us_met",
    ownerPersonId: "per_sarah",
    familyGroupId: "fam_ellis",
    keyDates: [
      { id: "kd_us_met", label: "The day we met", kind: "anniversary", month: 10, day: 17, year: 1998, recurring: true },
      { id: "kd_us_wedding", label: "Our wedding anniversary", kind: "anniversary", month: 6, day: 16, year: 2001, recurring: true },
      { id: "kd_us_emma", label: "Emma's birthday", kind: "birthday", month: 3, day: 9, year: 2005, recurring: true },
    ],
    isSample: true,
    viewerEnabled: true,
    createdAt: "2026-09-10T20:00:00.000Z",
    updatedAt: "2026-10-12T21:00:00.000Z",
  },
  {
    id: FAM,
    kind: "family",
    subjectName: "The Ellis Family",
    preferredName: "the Ellises",
    peopleIds: ["per_walter", "per_eleanor", "per_margaret", "per_thomas", "per_sarah", "per_daniel", "per_jonah", "per_priya", "per_emma", "per_leo"],
    relationship: "Family",
    relationshipKind: "other",
    title: "Four Generations, One Table",
    description: "From Walter's ferry on Casco Bay to Leo's first fish, the stories the whole family tells.",
    dedication: "Leave the light on. Someone's always on their way home.",
    theme: { palette: "evergreen", typography: "classic" },
    cover: { mediaId: "med_fam_table", layout: "full_bleed", focalY: 45 },
    status: "active",
    collectionMode: "family",
    defaultPrivacy: "family",
    startingChapter: "childhood",
    chapterOrder: ["childhood", "family", "everyday", "journeys", "work", "love", "coming_of_age", "wisdom"],
    featuredMemoryId: "mem_fam_ferry",
    ownerPersonId: "per_sarah",
    familyGroupId: "fam_ellis",
    keyDates: [
      { id: "kd_fam_thanks", label: "Thanksgiving at the long table", kind: "milestone", month: 11, day: 26, year: 2026, recurring: false },
      { id: "kd_fam_margaret", label: "Margaret's birthday", kind: "birthday", month: 4, day: 21, year: 1940, recurring: true },
      { id: "kd_fam_thomas", label: "Remembering Thomas", kind: "remembrance", month: 2, day: 3, year: 2013, recurring: true },
    ],
    isSample: true,
    viewerEnabled: true,
    createdAt: "2026-09-12T18:00:00.000Z",
    updatedAt: "2026-10-11T17:00:00.000Z",
  },
];

const mb = (id: string, capsuleId: string, personId: string, role: CapsuleMembership["role"]): CapsuleMembership => ({ id, capsuleId, personId, role, status: "active", grantedAt: "2026-09-12T18:00:00.000Z", enforcement: "simulated" });

export const extraMemberships: CapsuleMembership[] = [
  mb("mb_us_1", US, "per_sarah", "owner"),
  mb("mb_us_2", US, "per_jonah", "organizer"),
  mb("mb_us_3", US, "per_emma", "viewer"),
  mb("mb_fam_1", FAM, "per_sarah", "owner"),
  mb("mb_fam_2", FAM, "per_margaret", "contributor"),
  mb("mb_fam_3", FAM, "per_daniel", "organizer"),
  mb("mb_fam_4", FAM, "per_priya", "contributor"),
  mb("mb_fam_5", FAM, "per_emma", "contributor"),
  mb("mb_fam_6", FAM, "per_jonah", "contributor"),
  mb("mb_fam_7", FAM, "per_leo", "viewer"),
];

/* -------------------------------- Media -------------------------------- */

const plate = (id: string, plateId: string, capsuleId: string, caption: string, alt: string, takenDate?: FuzzyDate, placeId?: string, portrait = false): MediaAsset => ({
  id,
  capsuleId,
  kind: "image",
  source: { kind: "plate", plateId },
  storage: "fixture",
  mimeType: photoForPlate(plateId) ? "image/webp" : "application/octet-stream",
  width: portrait ? 900 : 1200,
  height: portrait ? 1125 : 900,
  caption,
  alt: photoForPlate(plateId)?.alt ?? "",
  takenDate,
  placeId,
  contributorName: "Sample family",
  consent: { contributorAgreed: true, print: true, share: false },
  sampleNotice: photoForPlate(plateId) ? PHOTO_NOTICE : NO_PHOTO_NOTICE,
  createdAt: T,
  updatedAt: T,
});

export const extraMedia: MediaAsset[] = [
  plate("med_us_umbrella", "umbrella-1998", US, "Newbury Street, the umbrella that didn't survive", "Illustration of two people under a red umbrella on wet church steps in the rain.", { precision: "season", year: 1998, season: "autumn" }, "pl_boston", true),
  plate("med_us_bookshop", "bookshop-1998", US, "The bookshop on Charles Street", "Illustration of tall bookshelves crowded with books in warm light.", { precision: "month", year: 1998, month: 12 }, "pl_boston", true),
  plate("med_us_orchard", "orchard-2001", US, "The orchard, June 16th", "Illustration of a wedding supper under fruit trees, string lights over a long white table and two figures.", { precision: "day", year: 2001, month: 6, day: 16 }, "pl_stow"),
  plate("med_us_florence", "rooftops-2000", US, "Florence from the borrowed balcony", "Illustration of terracotta rooftops and a cathedral dome under a pale sky.", { precision: "season", year: 2001, season: "summer" }, "pl_florence"),
  plate("med_us_road", "roadtrip-2003", US, "Somewhere past Truro, Nova Scotia", "Illustration of the view through a car windscreen: a coast road, the sea, a folded map on the dashboard.", { precision: "season", year: 2003, season: "summer" }, "pl_halifax"),
  plate("med_us_night", "nightlight-2004", US, "The first night home", "Illustration of a night window with a crescent moon and a small lamp glowing on the sill.", { precision: "month", year: 2005, month: 3 }, "pl_providence", true),
  plate("med_us_pancakes", "pancakes-2012", US, "Pancake Sunday, the usual", "Illustration of a stack of pancakes on a blue-rimmed plate with a cup of coffee.", { precision: "decade", decade: 2010 }, "pl_providence", true),
  plate("med_us_porch", "porch-2025", US, "Two coffees on the porch", "Illustration of a porch with an empty chair and a blanket, the sea beyond the rail.", { precision: "season", year: 2025, season: "summer" }, "pl_providence"),
  plate("med_fam_ferry", "ferry-1934", FAM, "Walter's ferry leaving the slip", "Illustration in black and white of a coastal ferry with a smoking stack leaving a wooden pier.", { precision: "circa", year: 1934 }, "pl_portland"),
  plate("med_fam_kitchen", "kitchen-1950", FAM, "Eleanor's kitchen, no recipe in sight", "Illustration in sepia of a kitchen with a radio on the shelf and dough on the table.", { precision: "circa", year: 1950 }, "pl_portland"),
  plate("med_fam_letter", "letter-1952", FAM, "A letter from Aunt Colette", "Illustration in sepia of a handwritten letter and its envelope.", { precision: "year", year: 1952 }, "pl_montreal", true),
  plate("med_fam_pie", "pie-1979", FAM, "The lopsided pie, cooling", "Illustration of a lattice pie cooling on a window sill with a garden beyond.", { precision: "circa", year: 1979 }, "pl_arlington"),
  plate("med_fam_canoe", "canoe-1985", FAM, "Paddling lessons at Acadia", "Illustration of two figures in a red canoe on a still lake beneath pine-covered hills.", { precision: "season", year: 1985, season: "summer" }, "pl_acadia"),
  plate("med_fam_dock", "dock-2018", FAM, "The dock where Leo caught (and released) it", "Illustration of a wooden dock reaching into a lake at sunset.", { precision: "season", year: 2018, season: "summer" }, "pl_acadia"),
  plate("med_fam_table", "table-2019", FAM, "Everyone at one table", "Illustration of a long family table set for dinner, people gathered on both sides, evening light in the window.", { precision: "month", year: 2019, month: 11 }, "pl_arlington"),
];

/* ------------------------------ Memories ------------------------------- */

const sarahWife: MemoryAttribution = { personId: "per_sarah", displayName: "Sarah Ellis", relationship: "Wife", via: "sample" };
const sarahMother: MemoryAttribution = { ...sarahWife, relationship: "Mother" };
const jonah: MemoryAttribution = { personId: "per_jonah", displayName: "Jonah Reed", relationship: "Husband", via: "sample" };
const margaret: MemoryAttribution = { personId: "per_margaret", displayName: "Margaret Ellis", relationship: "Grandmother", via: "sample" };
const daniel: MemoryAttribution = { personId: "per_daniel", displayName: "Daniel Ellis", relationship: "Son", via: "sample" };
const priya: MemoryAttribution = { personId: "per_priya", displayName: "Priya Ellis", relationship: "Daughter-in-law", via: "sample" };
const emma: MemoryAttribution = { personId: "per_emma", displayName: "Emma Ellis", relationship: "Granddaughter", via: "sample" };

interface Seed extends Partial<Memory> {
  id: string;
  capsuleId: string;
  title: string;
  date: FuzzyDate;
  chapter: Memory["chapter"];
  narrative: string;
  attribution: MemoryAttribution;
  createdAt: string;
}

const memory = (s: Seed): Memory => ({
  quote: undefined,
  placeId: undefined,
  peopleIds: [],
  tags: [],
  photoIds: [],
  privacy: "family",
  status: "approved",
  consent: { print: true, export: true, share: false },
  pinned: false,
  revisions: [],
  storage: "fixture",
  updatedAt: s.createdAt,
  ...s,
});

export const extraMemories: Memory[] = [
  /* -------------------------- Sarah & Jonah -------------------------- */
  memory({
    id: "mem_us_met",
    capsuleId: US,
    title: "The broken umbrella on Newbury Street",
    date: { precision: "day", year: 1998, month: 10, day: 17 },
    placeId: "pl_boston",
    chapter: "love",
    quote: "He offered me half an umbrella. It turned inside out before we reached the corner.",
    narrative:
      "It was raining the way it only rains in Boston in October, sideways, and personally. I was standing in a church doorway on Newbury Street waiting for it to ease, and a man I'd never seen before stepped in beside me with a very cheap red umbrella.\n\nHe offered me half of it. We made it eleven steps before the wind turned it inside out, and instead of apologising he started laughing, and so did I. We stood in that doorway for forty minutes. By the time the rain stopped I knew he taught eighth-grade science, hated olives and was terrible at directions.\n\nHe still has the umbrella. It has never been fixed.",
    peopleIds: ["per_sarah", "per_jonah"],
    tags: ["How we met", "Boston", "Rain"],
    photoIds: ["med_us_umbrella"],
    questionId: "q_ourstory_3",
    attribution: sarahWife,
    pinned: true,
    createdAt: "2026-09-10T20:30:00.000Z",
  }),
  memory({
    id: "mem_us_notice_jonah",
    capsuleId: US,
    title: "What I first noticed, Jonah's answer",
    date: { precision: "day", year: 1998, month: 10, day: 17 },
    placeId: "pl_boston",
    chapter: "love",
    quote: "You laughed before I did. That was the whole thing.",
    narrative:
      "Your laugh. I heard it before I saw your face, because the umbrella had flipped up over both of us and you were the first one to start laughing. Most people would have been annoyed. You looked at this ruined thing and found it funny.\n\nThen I noticed you were reading a library book about lighthouses, and I asked about it, and you talked for ten minutes about your grandfather's ferry. I thought: I want to hear the rest of that.",
    peopleIds: ["per_sarah"],
    tags: ["Questions for each other"],
    questionId: "q_ourstory_1",
    attribution: jonah,
    createdAt: "2026-09-14T21:00:00.000Z",
  }),
  memory({
    id: "mem_us_notice_sarah",
    capsuleId: US,
    title: "What I first noticed, Sarah's answer",
    date: { precision: "day", year: 1998, month: 10, day: 17 },
    placeId: "pl_boston",
    chapter: "love",
    narrative:
      "Honestly? Your terrible umbrella. And that you didn't pretend it was a good one.\n\nThen that you asked a real question about the book I was carrying and actually waited for the answer. You still do that. It's rarer than people think.",
    peopleIds: ["per_jonah"],
    tags: ["Questions for each other"],
    questionId: "q_ourstory_1",
    attribution: sarahWife,
    createdAt: "2026-09-14T21:10:00.000Z",
  }),
  memory({
    id: "mem_us_bookshop",
    capsuleId: US,
    title: "Our first date: the bookshop on Charles Street",
    date: { precision: "month", year: 1998, month: 12 },
    placeId: "pl_boston",
    chapter: "coming_of_age",
    narrative:
      "We were supposed to have dinner. Instead we walked into a second-hand bookshop to get out of the cold and didn't come out until it closed. We each picked a book for the other one, he chose me a field guide to New England birds, I chose him a cookbook, which he has used exactly twice.\n\nThe owner made us tea in chipped mugs and let us sit in the back by the radiator. We never did have dinner that night. We split a bag of roasted chestnuts on the walk home.",
    peopleIds: ["per_sarah", "per_jonah"],
    tags: ["Firsts", "Books"],
    photoIds: ["med_us_bookshop"],
    questionId: "q_ourstory_4",
    attribution: sarahWife,
    createdAt: "2026-09-11T19:00:00.000Z",
  }),
  memory({
    id: "mem_us_wedding",
    capsuleId: US,
    title: "The wedding in the orchard",
    date: { precision: "day", year: 2001, month: 6, day: 16 },
    placeId: "pl_stow",
    chapter: "love",
    quote: "My father whistled through the whole first dance. Badly. On purpose, I think.",
    narrative:
      "We got married in an apple orchard in Stow because neither of us wanted a hall. It had rained all week and the grass was still soft, so half the guests took their shoes off. Mum made the cake. It leaned.\n\nWhat I remember most isn't the vows, it's my father whistling through our whole first dance, badly, on purpose, until everyone was laughing and nobody was nervous any more. He was always good at that.",
    peopleIds: ["per_sarah", "per_jonah", "per_margaret", "per_thomas"],
    tags: ["Wedding", "Milestone"],
    photoIds: ["med_us_orchard"],
    attribution: sarahWife,
    pinned: true,
    createdAt: "2026-09-12T20:00:00.000Z",
  }),
  memory({
    id: "mem_us_florence",
    capsuleId: US,
    title: "Ten days in Florence on a borrowed guidebook",
    date: { precision: "season", year: 2001, season: "summer" },
    placeId: "pl_florence",
    chapter: "journeys",
    narrative:
      "My mother lent us her guidebook from 1966, with her notes in the margins. Half the restaurants she circled had closed decades ago, so we started a game: find what's there now, and write it next to hers.\n\nWe came home with the guidebook fuller than when we left. It's on the shelf beside hers now, two generations of 'go here' in pencil.",
    peopleIds: ["per_sarah", "per_jonah"],
    tags: ["Honeymoon", "Travel"],
    photoIds: ["med_us_florence"],
    attribution: jonah,
    createdAt: "2026-09-16T19:00:00.000Z",
  }),
  memory({
    id: "mem_us_road",
    capsuleId: US,
    title: "Driving to Nova Scotia with no plan at all",
    date: { precision: "season", year: 2003, season: "summer" },
    placeId: "pl_halifax",
    chapter: "journeys",
    narrative:
      "Jonah's rule: no reservations, no itinerary, turn left whenever the sea is on the right. We ended up sleeping in the car twice and in a lighthouse keeper's spare room once, which is a story by itself.\n\nI still have the map from that trip. He drew the route on it afterwards in red pen, including every wrong turn, and wrote 'worth it' along the bottom.",
    peopleIds: ["per_sarah", "per_jonah"],
    tags: ["Road trip", "Adventures"],
    photoIds: ["med_us_road"],
    questionId: "q_usnow_7",
    attribution: sarahWife,
    createdAt: "2026-09-18T20:00:00.000Z",
  }),
  memory({
    id: "mem_us_emma",
    capsuleId: US,
    title: "The night Emma came home",
    date: { precision: "month", year: 2005, month: 3 },
    placeId: "pl_providence",
    chapter: "family",
    narrative:
      "We drove home from the hospital at eleven miles an hour. Every car behind us honked. Jonah didn't care.\n\nThat first night none of us slept. We sat by the window with the little lamp on, taking turns holding her, and talked about absolutely nothing, what we'd name a dog, whether the moon looked bigger. I think it was the happiest I've ever been and the most tired.",
    peopleIds: ["per_sarah", "per_jonah", "per_emma"],
    tags: ["Emma", "Family"],
    photoIds: ["med_us_night"],
    attribution: sarahWife,
    createdAt: "2026-09-20T21:00:00.000Z",
  }),
  memory({
    id: "mem_us_pancakes",
    capsuleId: US,
    title: "Pancake Sundays",
    date: { precision: "decade", decade: 2010 },
    placeId: "pl_providence",
    chapter: "everyday",
    narrative:
      "Nobody decided it. One Sunday Jonah made pancakes, the next Sunday Emma asked for them, and that was that, fifteen years and counting. He makes them in the shape of the week's best thing: a fish after Leo's fishing trip, a very lumpy car the week Emma got her licence.\n\nWe've had Sundays apart, of course. But whoever is home makes them anyway.",
    peopleIds: ["per_jonah", "per_emma"],
    tags: ["Traditions", "Little moments"],
    photoIds: ["med_us_pancakes"],
    questionId: "q_usnow_3",
    attribution: sarahWife,
    createdAt: "2026-09-22T20:00:00.000Z",
  }),
  memory({
    id: "mem_us_hard",
    capsuleId: US,
    title: "The winter of hospital corridors",
    date: { precision: "season", year: 2013, season: "winter" },
    placeId: "pl_arlington",
    chapter: "work",
    narrative:
      "The hardest thing we came through was my father's last winter. I drove to Arlington three times a week. Jonah never once asked me to stay home; he just made sure there was a full tank and a thermos in the car, and that Emma had dinner, and that I didn't have to explain anything when I got back.\n\nI didn't know until much later that he'd been sleeping in the chair by the door so he'd hear me come in.",
    peopleIds: ["per_sarah", "per_jonah", "per_thomas"],
    tags: ["Hard times"],
    questionId: "q_usnow_4",
    attribution: sarahWife,
    privacy: "organizers",
    createdAt: "2026-09-25T22:00:00.000Z",
  }),
  memory({
    id: "mem_us_porch",
    capsuleId: US,
    title: "A small moment: two coffees on the porch",
    date: { precision: "season", year: 2025, season: "summer" },
    placeId: "pl_providence",
    chapter: "everyday",
    quote: "Nothing happened. That's why I want to remember it.",
    narrative:
      "A Tuesday in July. Emma had gone back to her apartment, the house was quiet, and we sat on the porch with coffee and didn't say much for an hour.\n\nNothing happened. That's why I want to remember it.",
    peopleIds: ["per_sarah", "per_jonah"],
    tags: ["Little moments"],
    photoIds: ["med_us_porch"],
    questionId: "q_ourstory_5",
    attribution: jonah,
    createdAt: "2026-10-12T21:00:00.000Z",
  }),

  /* -------------------------- The Ellis Family -------------------------- */
  memory({
    id: "mem_fam_ferry",
    capsuleId: FAM,
    title: "Walter's ferry, and the whistle he always answered",
    date: { precision: "circa", year: 1934 },
    placeId: "pl_portland",
    chapter: "childhood",
    quote: "Two short, one long. Every child on Peaks Island knew it meant my father.",
    narrative:
      "My father, Walter Hale, was the engineer on the Casco Bay ferry for thirty years. He wasn't the captain, he'd tell you that very firmly, but he was the reason the thing ran.\n\nHe had a signal on the whistle: two short, one long. If you were on the dock and heard it, you waved, and he'd answer from the engine room with the same. Every child on Peaks Island knew it meant him. My brother Peter counted every boat in the harbor, but he only ever waved at that one.",
    peopleIds: ["per_walter", "per_peter"],
    tags: ["Great-grandfather", "Portland", "Work"],
    photoIds: ["med_fam_ferry"],
    questionId: "q_familyhistory_2",
    attribution: margaret,
    pinned: true,
    createdAt: "2026-09-12T19:00:00.000Z",
  }),
  memory({
    id: "mem_fam_recipe",
    capsuleId: FAM,
    title: "Eleanor never used a recipe",
    date: { precision: "circa", year: 1950 },
    placeId: "pl_portland",
    chapter: "everyday",
    narrative:
      "People ask for my mother's bread recipe and I have to tell them the truth: there wasn't one. There was a bowl, a radio, and her hands.\n\nWhen Sarah was small I tried to write it down while I baked it with her. The card says '3 big handfuls (Mum's handfuls, so more like 4)' and 'until it stops being sticky and starts being sulky.' That card is the closest thing this family has to an heirloom recipe.",
    peopleIds: ["per_eleanor", "per_sarah"],
    tags: ["Recipes", "Traditions"],
    photoIds: ["med_fam_kitchen"],
    questionId: "q_familyhistory_4",
    attribution: margaret,
    createdAt: "2026-09-13T16:00:00.000Z",
  }),
  memory({
    id: "mem_fam_colette",
    capsuleId: FAM,
    title: "Letters from Aunt Colette in Montréal",
    date: { precision: "year", year: 1952 },
    placeId: "pl_montreal",
    chapter: "family",
    narrative:
      "My mother's sister Colette wrote every Sunday for fifty years, half in English and half in French depending on how tired she was. My mother read them aloud at the kitchen table and skipped the parts she thought weren't for children, which of course were the parts we most wanted.\n\nThere's a shoebox of them in Sarah's attic. Nobody has read them all. Someone should.",
    peopleIds: ["per_colette", "per_eleanor"],
    tags: ["Letters", "Montréal"],
    photoIds: ["med_fam_letter"],
    attribution: margaret,
    createdAt: "2026-09-14T15:00:00.000Z",
  }),
  memory({
    id: "mem_fam_pie",
    capsuleId: FAM,
    title: "The Thanksgiving pie has to be lopsided",
    date: { precision: "circa", year: 1979 },
    placeId: "pl_arlington",
    chapter: "everyday",
    quote: "If it comes out even, we've done it wrong.",
    narrative:
      "The first year in the Arlington house, the oven tilted. Mum's apple pie came out with all the filling at one end, and Dad declared it the best pie she'd ever made.\n\nThe oven was fixed in 1981. The pie has been deliberately lopsided ever since. If it comes out even, we've done it wrong. Emma made it for the first time last year and propped one side of the dish on a spoon.",
    peopleIds: ["per_margaret", "per_thomas", "per_emma"],
    tags: ["Thanksgiving", "Traditions"],
    photoIds: ["med_fam_pie"],
    questionId: "q_familyhistory_3",
    attribution: sarahMother,
    createdAt: "2026-09-15T18:00:00.000Z",
  }),
  memory({
    id: "mem_fam_canoe",
    capsuleId: FAM,
    title: "Dad's paddling lessons at Acadia",
    date: { precision: "season", year: 1985, season: "summer" },
    placeId: "pl_acadia",
    chapter: "journeys",
    narrative:
      "Every August Dad rented the same red canoe and taught one of us to paddle 'properly', which meant quietly. You weren't allowed to talk until you could cross the lake without splashing.\n\nI was fourteen before I managed it. When we reached the far side he said, 'Now you can talk,' and I realised I didn't want to. I think that was the lesson.",
    peopleIds: ["per_thomas", "per_daniel"],
    tags: ["Summers", "Thomas"],
    photoIds: ["med_fam_canoe"],
    attribution: daniel,
    createdAt: "2026-09-17T20:00:00.000Z",
  }),
  memory({
    id: "mem_fam_leo",
    capsuleId: FAM,
    title: "Leo's first fish (and its immediate release)",
    date: { precision: "season", year: 2018, season: "summer" },
    placeId: "pl_acadia",
    chapter: "journeys",
    narrative:
      "Leo was eight and had been fishing off the dock for three days without a bite. When the fish finally came he was so shocked he dropped the rod, grabbed the line with both hands, landed it, looked at it, and said 'Sorry', and let it go.\n\nDaniel wanted a photo. There isn't one. Leo says that's how it should be.",
    peopleIds: ["per_leo", "per_daniel"],
    tags: ["Leo", "Summers"],
    photoIds: ["med_fam_dock"],
    attribution: priya,
    createdAt: "2026-09-21T17:00:00.000Z",
  }),
  memory({
    id: "mem_fam_table",
    capsuleId: FAM,
    title: "Everyone at one table",
    date: { precision: "month", year: 2019, month: 11 },
    placeId: "pl_arlington",
    chapter: "family",
    narrative:
      "The last time all of us fit around one table: Mum at the end, Daniel and Priya, Jonah and me, Emma home from her first semester, Leo under it for most of the meal.\n\nWe went around the table and everyone had to say one thing they were grateful for. Leo said 'the table,' and everyone laughed, and then nobody could think of a better answer.",
    peopleIds: ["per_margaret", "per_daniel", "per_priya", "per_sarah", "per_jonah", "per_emma", "per_leo"],
    tags: ["Gatherings", "Thanksgiving"],
    photoIds: ["med_fam_table"],
    attribution: sarahMother,
    createdAt: "2026-09-23T19:00:00.000Z",
  }),
  memory({
    id: "mem_fam_light",
    capsuleId: FAM,
    title: "Why we say 'leave the light on'",
    date: { precision: "unknown", note: "Before Margaret was born" },
    placeId: "pl_portland",
    chapter: "wisdom",
    narrative:
      "My grandmother kept a lamp in the front window every night my father was out on the late ferry. When he retired she kept doing it anyway, 'in case someone else is on their way home.'\n\nEvery one of us says it now when someone leaves after dinner. Most of the grandchildren don't know where it comes from. Now they will.",
    peopleIds: ["per_walter"],
    tags: ["Family sayings"],
    attribution: margaret,
    createdAt: "2026-09-26T16:00:00.000Z",
  }),
  memory({
    id: "mem_fam_emma",
    capsuleId: FAM,
    title: "What the youngest should know about the oldest",
    date: { precision: "year", year: 2026 },
    chapter: "wisdom",
    narrative:
      "That Grandma Margaret was a potter before she was a grandmother, and a nurse's daughter before that, and that she still thinks the best part of any day is the hour before anyone else is awake.\n\nAnd that every person at our table was once the youngest at someone else's. I didn't understand that until I started recording these.",
    peopleIds: ["per_margaret", "per_emma"],
    tags: ["Generations"],
    questionId: "q_familyhistory_8",
    attribution: emma,
    createdAt: "2026-10-11T17:00:00.000Z",
  }),
  memory({
    id: "mem_fam_bowl_pending",
    capsuleId: FAM,
    title: "The canoe was green, not red",
    date: { precision: "season", year: 1985, season: "summer" },
    placeId: "pl_acadia",
    chapter: "journeys",
    narrative: "With respect to my brother-in-law: the canoe at Acadia was green. I have the photograph somewhere to prove it. Everything else about the story is true.",
    peopleIds: ["per_daniel"],
    tags: ["Corrections"],
    attribution: { personId: "per_jonah", displayName: "Jonah Reed", relationship: "Son-in-law", via: "invitation" },
    status: "submitted",
    createdAt: "2026-10-13T08:30:00.000Z",
  }),
];

/* ----------------------------- Future letter ----------------------------- */

export const extraFutureMessages: FutureMessage[] = [
  {
    id: "fm_us_thirty",
    token: "for-our-thirtieth",
    capsuleId: US,
    authorName: "Sarah Ellis",
    authorPersonId: "per_sarah",
    title: "For our thirtieth anniversary",
    dedication: "Open in the orchard, if it's still there.",
    body: "Jonah, if you're reading this, we made it to thirty. I want to write down what our life looks like right now, so that in five years we can see what changed and what didn't. Emma is in her second year of work and calls on Sundays. Pancakes are still happening. The umbrella is still broken.\n\nI hope we still sit on the porch and say nothing for an hour.",
    format: "letter",
    attachmentIds: ["med_us_porch"],
    recipient: { name: "Jonah Reed", relationship: "Husband", contactStatus: "not_provided" },
    release: { kind: "date", date: "2031-06-16", requiresReconfirmationEveryYears: 2 },
    restrictions: { recipientOnly: true, allowFamilyAfterOpening: false },
    status: "draft",
    isExample: false,
    history: [{ status: "draft", at: "2026-10-01T21:00:00.000Z" }],
    createdAt: "2026-10-01T21:00:00.000Z",
    updatedAt: "2026-10-01T21:00:00.000Z",
  },
];
