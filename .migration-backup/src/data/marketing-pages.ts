import { brand } from "@/config/brand";
/** Public routes share a visual system, with page-specific product explanations. */
export type MarketingPage = {
  eyebrow: string;
  title: string;
  accent: string;
  intro: string;
  cta?: [string, string];
  visual?: "archive" | "book" | "box" | "letter" | "map";
  chapters: [string, string][];
  questions?: [string, string][];
};

const giftChapters: [string, string][] = [
  ["Make it personal", "Choose a capsule, add the recipient’s name, and write a dedication. The gift begins with your words, before they record a single memory."],
  ["Give them a gentle beginning", "Start with an invitation to tell a story, not an assignment to write a memoir. A photograph or one good question is enough."],
  ["Keep adding together", "You can contribute memories of your own and prepare a book when the collection feels ready. There is no need to finish a whole life in one sitting."],
];

export const marketingPages: Record<string, MarketingPage> = {
  features: {
    eyebrow: `The ${brand.name} experience`, title: "All the little things.", accent: "One connected life.", intro: "A family story has more than one format. Keep the voice, the picture, the place, and the context together.", visual: "archive",
    chapters: [["A voice you recognize", "Record an answer, add an audio file, or write in your own words. Guided questions help start conversations without deciding how they should end."], ["A story you can explore", "Use chapters, dates, photographs, and map locations to browse a life from different angles. Approximate dates make room for imperfect memories."], ["A collection you shape", "Review contributions, choose visibility settings, export ordinary files, and design a book. The preview makes these workflows available with fictional sample data."]],
  },
  storytelling: {
    eyebrow: "The art of asking", title: "They have the stories.", accent: "You have the time.", intro: "You don’t need to conduct an interview. Sit down together, pick a question, and follow the thread wherever it leads.", visual: "archive", cta: ["Explore the question library", "/app/capsules/cap_margaret/questions"],
    chapters: [["Start somewhere familiar", "Childhood kitchens. First jobs. Ordinary Sundays. Questions about everyday life often uncover the details a formal biography leaves out."], ["Keep their voice", "Record directly in the browser or upload an existing audio file. Add a title and a written version when helpful. The storyteller’s own recording stays at the center."], ["Let it be unfinished", "Save a draft and return to it. Add a photograph later. A short memory told in their own words can be more meaningful than a polished chapter."]],
  },
  "memory-map": {
    eyebrow: "The places that shaped a life", title: "Everywhere they went.", accent: "Everything it meant.", intro: "A first home, a familiar coastline, a city that changed everything. Give each memory a place, then explore the connections.", visual: "map", cta: ["Explore Margaret’s map", "/view/cap_margaret/map"],
    chapters: [["Place a memory", "Choose a location when you add a story. Use the level of detail you are comfortable keeping; a town can be enough."], ["Follow the years", "Move between decades and see which places belong to each chapter. Memories connect the map to the timeline."], ["See the journey", "Explore a route across meaningful places. Open a memory to hear the voice and read the story behind the point on the map."]],
  },
  "family-collaboration": {
    eyebrow: "A little from everyone", title: "One family.", accent: "So many perspectives.", intro: "The same day can become a different story in every person’s memory. Make room for all of them in one collection.", visual: "archive", cta: ["Try a sample invitation", "/contribute/emma-blue-bowl"],
    chapters: [["Ask someone specific", "Prepare an invitation around a person, a question, or a memory. The sample contributor flow shows a simple way to respond."], ["Review with care", "An editor can review incoming stories and decide which belong in the shared collection. Not every memory needs the same audience."], ["Keep context together", "Attach a contribution to the person’s capsule so photographs and stories stay connected. The demo lets you explore roles on one device; real cross-device sharing requires the planned account service."]],
  },
  "letters-through-time": {
    eyebrow: "For a day you’re imagining", title: "A little of today.", accent: "For their tomorrow.", intro: "Draft a letter for a birthday, a new beginning, or a moment you hope to share. Write the words while they are here with you.", visual: "letter", cta: ["Prepare a letter", "/app/future-messages/new"],
    chapters: [["Write something personal", "Add a letter, a recorded message, or a photograph. Choose who it is for and what you want them to know."], ["Imagine the moment", "Explore date and milestone settings. Preview the opening experience and consider who should help carry the message forward."], ["Keep a copy today", "These are local drafts, not scheduled deliveries. Nothing will be sent automatically. Long-term delivery is a future service, and no prepaid delivery promise is sold here."]],
  },
  heirlooms: {
    eyebrow: "The heirloom collection", title: "A lifetime of memories.", accent: "Something to hold.", intro: "Turn an evolving archive into a considered edition: stories to read, photographs to turn over, and a keepsake to open together.", visual: "book", cta: ["Design a Legacy Book", "/app/heirlooms/book-builder"],
    chapters: [["The Printed Legacy Book", "Arrange approved stories and photographs into a designed book. Choose a cover, add a dedication, and inspect the page-by-page proof before saving your design."], ["The Premium Physical LifeCapsule", "Explore a display box for a book, letters, photographs, and an archive copy. Customize the materials and inscription in the interactive builder."], ["An honest preview", "These are design experiences. Printing, manufacturing, payment, tax, and shipping are not connected. No physical product can be ordered from this preview."]],
    questions: [["Can I see each product?", "The book and keepsake box have separate design studios. The collection page in the studio links to both, and the footer includes a public guide for each."], ["Is the box designed for burial?", "No. The keepsake box is a display concept, not a burial-rated container. No durability or long-term preservation claim is made."]],
  },
  "heirlooms/book": {
    eyebrow: "The Printed Legacy Book", title: "Their words.", accent: "Your family’s edition.", intro: "A book that feels personal before the first page: their name on the cover, your dedication inside, and the stories only they could tell.", visual: "book", cta: ["Open the book designer", "/app/heirlooms/book-builder"],
    chapters: [["Choose the chapters", "Select approved memories and arrange them into a reading order. Include photographs and captions that give the stories their setting."], ["Make it their own", "Explore cover colors, materials, a title, and a dedication. The interactive preview responds to your design choices."], ["Read the proof", "Inspect the actual page layout and return to the builder to make changes. Printing and checkout are demonstrations; no book is manufactured or shipped."]],
  },
  "heirlooms/time-capsule": {
    eyebrow: "The Premium Physical LifeCapsule", title: "Open a box.", accent: "Find a whole world.", intro: "A considered home for the objects that hold a story: a book, a letter, a photograph, and the context that makes them matter.", visual: "box", cta: ["Explore the box designer", "/app/heirlooms/capsule-builder"],
    chapters: [["Choose the finish", "Explore materials and personalize an inscription. Turn the interactive model to see the box from different angles."], ["Choose what belongs", "Build a collection around the memories you want to keep close. A copy on a drive is an extra copy, never your only archive."], ["Keep it above ground", "This is a display keepsake concept. It has no burial or environmental rating and is not available to order. Manufacturing and shipping are not connected."]],
  },
  "gifts/parents": { eyebrow: "For your parents", title: "Before they were your parents,", accent: "they were themselves.", intro: "Ask about the first apartment, the friendship that changed everything, or the dreams they had at your age. Give your parents room to tell the whole story.", visual: "letter", cta: ["Make a gift for a parent", "/gifts/build"], chapters: giftChapters },
  "gifts/grandparents": { eyebrow: "For your grandparents", title: "There’s so much more", accent: "you haven’t asked.", intro: "Keep the everyday details, the favorite sayings, and the stories you want the next generation to know. Begin with a conversation, at their pace.", visual: "letter", cta: ["Make a gift for a grandparent", "/gifts/build"], chapters: giftChapters },
  "gifts/holiday": { eyebrow: "When everyone is together", title: "A seat at the table.", accent: "A story worth keeping.", intro: "Bring out an old photograph, pass around a question, and let one memory lead to another. A family gathering is a lovely place to begin.", visual: "letter", cta: ["Prepare a family gift", "/gifts/build"], chapters: giftChapters },
  preservation: {
    eyebrow: "Care begins with clarity", title: "A story worth keeping.", accent: "A copy you can keep.", intro: "An archive should make it easy to understand where your memories are, how to take them with you, and what still needs to be built.",
    chapters: [["What works today", "The studio saves new content locally in this browser. It can prepare portable exports with stories, available media, and a manifest. Download and inspect a copy of anything important."], ["What isn’t connected", "Cloud storage, managed backups, secure accounts, and independent preservation monitoring are not active. Clearing browser data or losing this device can remove local content."], ["What comes next", "Hosted accounts, backup operations, and clear service commitments are future work. Long-term preservation and future delivery will not be promised on the strength of a prototype."]],
    questions: [["How do I export?", "Open a capsule in the studio and choose its Export section. Review the included stories and media, then download a portable copy."], ["Should I upload my only copy?", "Keep your originals and independent copies. Local browser storage is useful for exploring the product, but it is not a backup service."]],
  },
  "data-retention": {
    eyebrow: "Preview storage information", title: "Know where it lives.", accent: "Know how to keep it.", intro: "Local browser storage makes the prototype usable without an account. It should never be confused with permanent preservation.",
    chapters: [["On this device", "New stories, edits, and media are stored in the browser profile you are using. They are not synchronized to another device or protected by a managed cloud backup."], ["When it can disappear", "Clearing site data, resetting the demo, browser storage eviction, or losing the device can remove content. There is no server recovery or retention guarantee for this preview."], ["Take a copy", "Use a capsule’s Export section to save a portable archive. Check that the downloaded files contain what you expect, and keep more than one independent copy."]],
  },
  accessibility: {
    eyebrow: "Making room for more people", title: "Stories belong", accent: "to everyone.", intro: "The experience is being designed for different ages, devices, and ways of interacting. Accessibility work is ongoing; this is not a claim of certified conformance.",
    chapters: [["A readable interface", "The visual system uses clear type, visible controls, and responsive layouts. Browser zoom and reduced-motion preferences are supported."], ["More than one way to tell it", "Memories can be written, recorded, or illustrated with photographs. Written versions can provide an alternative to listening; automatic transcription is not connected."], ["Keep improving", "Keyboard operation, screen-reader labels, audio controls, and small-screen layouts need continuing review. Known limitations and real-world feedback should shape the next release."]],
  },
};
