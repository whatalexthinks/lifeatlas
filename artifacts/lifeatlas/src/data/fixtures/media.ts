import type { FuzzyDate, MediaAsset, Transcript } from "@/domain/models";
import { memories } from "./memories";
import audioManifest from "./audio-manifest.json";
import { editorialPhotoUrl, photoForPlate } from "@/lib/media/editorial-photos";

/**
 * Sample media.
 *  - Plates are original procedurally-illustrated artworks (src/lib/plates), 
 *    clearly labelled as illustrations, never presented as real photographs.
 *  - One generated photograph (coast-1972.webp) carried over from the preview build.
 *  - Audio is synthetic narration produced with the open Kokoro-82M model
 *    (Apache-2.0) by scripts/generate-sample-audio.py. It is NOT a real person's voice.
 */

export const PLATE_NOTICE = "Illustrated sample plate, an original artwork made for this demo, not a real photograph.";
export const PHOTO_NOTICE = "Editorial photograph supplied for this sample archive. The family stories are fictional.";
export const AUDIO_NOTICE = "Synthetic sample narration (open-source text-to-speech). Not a real person's voice.";

const T = "2026-09-03T12:00:00.000Z";

interface PlateSeed {
  id: string;
  plateId: string;
  capsuleId: string;
  caption: string;
  alt: string;
  takenDate?: FuzzyDate;
  placeId?: string;
  contributor?: string;
  width?: number;
  height?: number;
}

const plate = (p: PlateSeed): MediaAsset => ({
  id: p.id,
  capsuleId: p.capsuleId,
  kind: "image",
  source: { kind: "plate", plateId: p.plateId },
  storage: "fixture",
  mimeType: "image/svg+xml",
  width: p.width ?? 1200,
  height: p.height ?? 900,
  caption: p.caption,
  alt: p.alt,
  takenDate: p.takenDate,
  placeId: p.placeId,
  contributorName: p.contributor ?? "Sample family",
  consent: { contributorAgreed: true, print: true, share: false },
  sampleNotice: photoForPlate(p.plateId) ? "Editorial photograph supplied for this sample archive. The family stories are fictional." : PLATE_NOTICE,
  createdAt: T,
  updatedAt: T,
});

const M = "cap_margaret";
const TH = "cap_thomas";
const S = "cap_sarah";

export const plateMedia: MediaAsset[] = [
  plate({ id: "med_kitchen_1947", plateId: "kitchen-1947", capsuleId: M, caption: "Eleanor's kitchen, Saturday morning", alt: "Illustration of a 1940s kitchen: a window with gingham curtains, a loaf cooling on the table.", takenDate: { precision: "circa", year: 1947 }, placeId: "pl_portland" }),
  plate({ id: "med_breadboard_1947", plateId: "breadboard-1947", capsuleId: M, caption: "The bread board, floured", alt: "Illustration of a wooden bread board dusted with flour beside a rolling pin.", takenDate: { precision: "circa", year: 1947 }, placeId: "pl_portland", width: 900, height: 1125 }),
  plate({ id: "med_harbor_1952", plateId: "harbor-1952", capsuleId: M, caption: "Portland harbor, the long way home", alt: "Illustration of a winter harbor with fishing boats, pilings and low grey sky.", takenDate: { precision: "season", year: 1952, season: "winter" }, placeId: "pl_portland" }),
  plate({ id: "med_lighthouse_1950s", plateId: "lighthouse-1950s", capsuleId: M, caption: "The light at Cape Elizabeth, in fog", alt: "Illustration of a white lighthouse on a rocky headland softened by fog.", takenDate: { precision: "decade", decade: 1950 }, placeId: "pl_capeelizabeth", width: 900, height: 1125 }),
  plate({ id: "med_station_1958", plateId: "station-1958", capsuleId: M, caption: "The northbound platform", alt: "Illustration of a train platform with a waiting locomotive and station clock.", takenDate: { precision: "season", year: 1958, season: "summer" }, placeId: "pl_portland" }),
  plate({ id: "med_letter_1958", plateId: "letter-1958", capsuleId: M, caption: "Be curious. Be kind. Write home.", alt: "Illustration of a folded handwritten letter resting on a wool coat.", takenDate: { precision: "year", year: 1958 }, placeId: "pl_montreal", width: 900, height: 1125 }),
  plate({ id: "med_window_1961", plateId: "window-1961", capsuleId: M, caption: "The view above the bakery", alt: "Illustration of a window looking over brick rooftops, a blue suitcase on the sill.", takenDate: { precision: "month", year: 1961, month: 9 }, placeId: "pl_boston", width: 900, height: 1125 }),
  plate({ id: "med_cafe_1963", plateId: "cafe-1963", capsuleId: M, caption: "Two coffees and a napkin diagram", alt: "Illustration of a café table with two cups and a napkin with a pencil drawing.", takenDate: { precision: "season", year: 1963, season: "spring" }, placeId: "pl_boston" }),
  plate({ id: "med_umbrella_1965", plateId: "umbrella-1965", capsuleId: M, caption: "The red umbrella, June 12, 1965", alt: "Illustration of a couple under a red umbrella on rainy church steps.", takenDate: { precision: "day", year: 1965, month: 6, day: 12 }, placeId: "pl_boston", width: 900, height: 1125 }),
  plate({ id: "med_nursery_1968", plateId: "nursery-1968", capsuleId: M, caption: "The balsa-wood boats", alt: "Illustration of a nursery window with a mobile of small wooden boats.", takenDate: { precision: "month", year: 1968, month: 3 }, placeId: "pl_boston", width: 900, height: 1125 }),
  plate({ id: "med_shells_1972", plateId: "shells-1972", capsuleId: M, caption: "The little red bucket", alt: "Illustration of a red bucket and shells on wet sand at golden hour.", takenDate: { precision: "season", year: 1972, season: "summer" }, placeId: "pl_capeelizabeth" }),
  plate({ id: "med_gallery_1976", plateId: "gallery-1976", capsuleId: M, caption: "The blue bowl, first show", alt: "Illustration of a blue ceramic bowl displayed on a white plinth in a loft.", takenDate: { precision: "year", year: 1976 }, placeId: "pl_newyork", width: 900, height: 1125 }),
  plate({ id: "med_house_1979", plateId: "house-1979", capsuleId: M, caption: "The crooked porch", alt: "Illustration of a two-storey clapboard house with a slightly leaning porch and a maple tree.", takenDate: { precision: "circa", year: 1979 }, placeId: "pl_arlington" }),
  plate({ id: "med_road_1983", plateId: "road-1983", capsuleId: M, caption: "Somewhere past Nebraska", alt: "Illustration of a station wagon on a long straight road under a wide sky.", takenDate: { precision: "season", year: 1983, season: "summer" }, placeId: "pl_sanfrancisco" }),
  plate({ id: "med_cliffs_1983", plateId: "cliffs-1983", capsuleId: M, caption: "Daniel said, “Oh.”", alt: "Illustration of Pacific cliffs at dusk with a low sun over the water.", takenDate: { precision: "season", year: 1983, season: "summer" }, placeId: "pl_sanfrancisco" }),
  plate({ id: "med_bookshop_1989", plateId: "bookshop-1989", capsuleId: M, caption: "The bookshop near the tea room", alt: "Illustration of a bookshop interior with tall shelves and a ladder.", takenDate: { precision: "year", year: 1989 }, placeId: "pl_london", width: 900, height: 1125 }),
  plate({ id: "med_garden_1992", plateId: "garden-1992", capsuleId: M, caption: "The garden behind the church", alt: "Illustration of a small walled garden with clipped trees and a green bench.", takenDate: { precision: "season", year: 1992, season: "spring" }, placeId: "pl_paris" }),
  plate({ id: "med_lemons_1998", plateId: "lemons-1998", capsuleId: M, caption: "The bowl that would not stand", alt: "Illustration of a leaning ceramic bowl holding lemons.", takenDate: { precision: "year", year: 1998 }, placeId: "pl_florence", width: 900, height: 1125 }),
  plate({ id: "med_rooftops_1998", plateId: "rooftops-1998", capsuleId: M, caption: "Terracotta roofs from the workshop", alt: "Illustration of terracotta rooftops and a cathedral dome at dusk.", takenDate: { precision: "year", year: 1998 }, placeId: "pl_florence" }),
  plate({ id: "med_blanket_2005", plateId: "blanket-2005", capsuleId: M, caption: "Emma's first week", alt: "Illustration of a knitted blanket in a pool of window light.", takenDate: { precision: "month", year: 2005, month: 4 }, placeId: "pl_providence" }),
  plate({ id: "med_workshop_2013", plateId: "workshop-2013", capsuleId: M, caption: "His pencil, behind the bandsaw", alt: "Illustration of a quiet woodworking shop with tools on a pegboard.", takenDate: { precision: "year", year: 2013 }, placeId: "pl_arlington" }),
  plate({ id: "med_pancakes_2016", plateId: "pancakes-2016", capsuleId: M, caption: "The crooked first pancake", alt: "Illustration of a stack of pancakes on a blue plate, morning light.", takenDate: { precision: "year", year: 2016 }, placeId: "pl_portland", width: 900, height: 1125 }),
  plate({ id: "med_porch_2024", plateId: "porch-2024", capsuleId: M, caption: "The chair facing the water", alt: "Illustration of an empty wooden chair on a porch overlooking the sea.", takenDate: { precision: "year", year: 2024 }, placeId: "pl_portland" }),
  plate({ id: "med_bluebowl_2022", plateId: "bluebowl-2022", capsuleId: M, caption: "Whatever the week gives you", alt: "Illustration of a blue bowl on a windowsill holding sea glass and folded notes.", takenDate: { precision: "year", year: 2022 }, placeId: "pl_portland", contributor: "Emma Ellis", width: 900, height: 1125 }),
  plate({ id: "med_kiln_1986", plateId: "kiln-1986", capsuleId: M, caption: "The kiln shed at night", alt: "Illustration of a garage kiln glowing orange at night.", takenDate: { precision: "circa", year: 1986 }, placeId: "pl_arlington", contributor: "Daniel Ellis" }),
  plate({ id: "med_radio_1949", plateId: "radio-1949", capsuleId: TH, caption: "One station, Fall River", alt: "Illustration of a homemade radio on a workbench with a soldering iron.", takenDate: { precision: "year", year: 1949 }, placeId: "pl_boston" }),
  plate({ id: "med_classroom_1966", plateId: "classroom-1966", capsuleId: TH, caption: "Windows open, every season", alt: "Illustration of a classroom with a chalkboard diagram and open windows.", takenDate: { precision: "circa", year: 1966 }, placeId: "pl_boston" }),
  plate({ id: "med_canoe_1979", plateId: "canoe-1979", capsuleId: TH, caption: "You're closer than you were", alt: "Illustration of a red canoe on a still lake ringed by pines.", takenDate: { precision: "season", year: 1979, season: "summer" }, placeId: "pl_acadia" }),
  plate({ id: "med_rocker_1985", plateId: "rocker-1985", capsuleId: TH, caption: "Cherry, one winter", alt: "Illustration of a cherry-wood rocking chair in a sunlit workshop.", takenDate: { precision: "year", year: 1985 }, placeId: "pl_arlington", width: 900, height: 1125 }),
  plate({ id: "med_backyard_2010", plateId: "backyard-2010", capsuleId: TH, caption: "Whistling practice", alt: "Illustration of a summer backyard with a tree swing and long grass.", takenDate: { precision: "season", year: 2010, season: "summer" }, placeId: "pl_providence", contributor: "Emma Ellis" }),
  plate({ id: "med_dock_2012", plateId: "dock-2012", capsuleId: TH, caption: "How long the light lasts", alt: "Illustration of a wooden dock reaching into calm water at sunset.", takenDate: { precision: "season", year: 2012, season: "summer" }, placeId: "pl_portland" }),
  plate({ id: "med_nightlight_2005", plateId: "nightlight-2005", capsuleId: S, caption: "Four in the morning", alt: "Illustration of a window at night with a small lamp glowing.", takenDate: { precision: "month", year: 2005, month: 4 }, placeId: "pl_providence", width: 900, height: 1125 }),
  /* Cover portraits, abstract, never a likeness of a real person */
  plate({ id: "med_portrait_margaret", plateId: "portrait-margaret", capsuleId: M, caption: "Cover study, Margaret", alt: "Abstract illustrated portrait silhouette in profile against a sea-green ground.", width: 900, height: 1125 }),
  plate({ id: "med_portrait_thomas", plateId: "portrait-thomas", capsuleId: TH, caption: "Cover study, Thomas", alt: "Abstract illustrated portrait silhouette in profile against a warm ochre ground.", width: 900, height: 1125 }),
  plate({ id: "med_portrait_sarah", plateId: "portrait-sarah", capsuleId: S, caption: "Cover study, Sarah", alt: "Abstract illustrated portrait silhouette in profile against a slate-blue ground.", width: 900, height: 1125 }),
];

export const photoMedia: MediaAsset[] = [
  {
    id: "med_coast_1972",
    capsuleId: M,
    kind: "image",
    source: { kind: "static", url: editorialPhotoUrl("maine-family-1972") },
    storage: "fixture",
    mimeType: "image/webp",
    width: 1500,
    height: 1000,
    caption: "A summer we still talk about",
    alt: "A young family laughing together in long grass above a rocky Maine shoreline, the sea behind them.",
    takenDate: { precision: "season", year: 1972, season: "summer" },
    placeId: "pl_capeelizabeth",
    contributorName: "Sample family",
    consent: { contributorAgreed: true, print: true, share: false },
    sampleNotice: PHOTO_NOTICE,
    createdAt: T,
    updatedAt: T,
  },
];

type AudioEntry = { id: string; memoryId: string; voice: string; file: string; durationSec: number; byteSize: number; sha256: string; peaks: number[] };

const audioEntries = (audioManifest as { clips: AudioEntry[] }).clips;

export const audioMedia: MediaAsset[] = audioEntries.map((a) => {
  const mem = memories.find((m) => m.id === a.memoryId);
  return {
    id: a.id,
    capsuleId: mem?.capsuleId ?? M,
    kind: "audio" as const,
    source: { kind: "static" as const, url: a.file },
    storage: "fixture" as const,
    mimeType: "audio/mpeg",
    byteSize: a.byteSize,
    durationSec: a.durationSec,
    caption: mem ? `“${mem.title}”, read aloud` : "Sample narration",
    alt: mem ? `Synthetic narration of the story “${mem.title}”.` : "Synthetic narration",
    takenDate: mem?.date,
    placeId: mem?.placeId,
    contributorName: mem?.attribution.displayName ?? "Sample family",
    consent: { contributorAgreed: true, print: false, share: false },
    checksum: a.sha256,
    peaks: a.peaks,
    transcriptId: `tr_${a.id}`,
    sampleNotice: AUDIO_NOTICE,
    createdAt: T,
    updatedAt: T,
  };
});

export const transcripts: Transcript[] = audioEntries.map((a) => {
  const mem = memories.find((m) => m.id === a.memoryId);
  return {
    id: `tr_${a.id}`,
    mediaId: a.id,
    text: mem?.narrative ?? "",
    origin: "sample_script",
    language: "en",
    createdAt: T,
    updatedAt: T,
  };
});

export const media: MediaAsset[] = [...photoMedia, ...plateMedia, ...audioMedia];
