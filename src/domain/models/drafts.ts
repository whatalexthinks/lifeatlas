import type { FuzzyDate, ID, ISODateTime } from "./common";

/** An answer in progress, autosaved so nothing is lost if the tab closes. Files live in IndexedDB blobs. */
export interface CaptureDraft {
  /** One draft per capsule and person answering, e.g. "cap_margaret:invitation:emma-blue-bowl". */
  key: string;
  capsuleId: ID;
  questionId?: ID;
  /** Human label for lists, e.g. the question text. */
  label: string;
  who: string;
  text: string;
  title: string;
  date: FuzzyDate;
  placeId?: ID;
  audio?: { blobKey: string; durationSec: number; peaks: number[]; source: "microphone" | "upload"; mime: string };
  photos: { blobKey: string; caption: string; width?: number; height?: number; name: string; mime: string }[];
  updatedAt: ISODateTime;
}

export interface GatheringGuest {
  key: string;
  name: string;
  personId?: ID;
  relationship?: string;
}

/** A pass-the-device family session. Saved after every step so it can be resumed. */
export interface GatheringSession {
  id: ID;
  capsuleId: ID;
  occasion: string;
  guests: GatheringGuest[];
  questionIds: ID[];
  /** Position in the deck and whose turn it is. */
  index: number;
  turn: number;
  answers: { memoryId: ID; speakerKey: string; questionId: ID }[];
  status: "in_progress" | "finished";
  startedAt: ISODateTime;
  updatedAt: ISODateTime;
}
