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
  "how-it-works": {
    eyebrow: "A small beginning, a lasting collection", title: "A life story starts", accent: "with one question.",
    intro: "LifeAtlas brings recordings, photographs, written stories, and meaningful places into a memory capsule: a personal archive for someone you love.", visual: "archive",
    chapters: [["Give a life its own place", "Create a capsule for yourself or someone else. Add a name, a photograph, and a few details. You can change these as the story grows."], ["Gather the little things", "Pick a prompt, record an answer, or write a memory. Add dates, places, and photographs. Invite relatives to share their side of the story."], ["Explore, edit, and keep", "Find connections through a timeline, map, and story chapters. Review contributions, export a portable copy, or arrange favorite memories into a book."]],
    questions: [["Do I need to start at the beginning?", "No. Start with the story they love telling, a photograph on the mantel, or a place they remember. Dates can be approximate, and memories can be added in any order."], ["Can I try it first?", "Yes. The sample archive and studio are available without signing up. This preview saves new content in your browser; cloud accounts and delivery are not connected."]],
  },
  features: {
    eyebrow: "The LifeAtlas experience", title: "All the little things.", accent: "One connected life.", intro: "A family story has more than one format. Keep the voice, the picture, the place, and the context together.", visual: "archive",
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
    chapters: [["Ask someone specific", "Prepare an invitation around a person, a question, or a memory. The sample contributor flow shows a simple way to respond."], ["Review with care", "An organizer can review incoming stories and decide which belong in the shared collection. Not every memory needs the same audience."], ["Keep context together", "Attach a contribution to the person’s capsule so photographs and stories stay connected. The demo lets you explore roles on one device; real cross-device sharing requires the planned account service."]],
  },
  "letters-through-time": {
    eyebrow: "For a day you’re imagining", title: "A little of today.", accent: "For their tomorrow.", intro: "Draft a letter for a birthday, a new beginning, or a moment you hope to share. Write the words while they are here with you.", visual: "letter", cta: ["Prepare a letter", "/app/future-messages/new"],
    chapters: [["Write something personal", "Add a letter, a recorded message, or a photograph. Choose who it is for and what you want them to know."], ["Imagine the moment", "Explore date and milestone settings. Preview the opening experience and consider who should help carry the message forward."], ["Keep a copy today", "These are local drafts, not scheduled deliveries. Nothing will be sent automatically. Long-term delivery is a future service, and no prepaid delivery promise is sold here."]],
  },
  heirlooms: {
    eyebrow: "The heirloom collection", title: "A lifetime of memories.", accent: "Something to hold.", intro: "Turn an evolving archive into a considered edition: stories to read, photographs to turn over, and a keepsake to open together.", visual: "book", cta: ["Design a life book", "/app/heirlooms/book-builder"],
    chapters: [["The life book", "Arrange approved stories and photographs into a designed book. Choose a cover, add a dedication, and inspect the page-by-page proof before saving your design."], ["The keepsake box", "Explore a display box for a book, letters, photographs, and an archive copy. Customize the materials and inscription in the interactive builder."], ["An honest preview", "These are design experiences. Printing, manufacturing, payment, tax, and shipping are not connected. No physical product can be ordered from this preview."]],
    questions: [["Can I see each product?", "The book and keepsake box have separate design studios. The collection page in the studio links to both, and the footer includes a public guide for each."], ["Is the box designed for burial?", "No. The keepsake box is a display concept, not a burial-rated container. No durability or long-term preservation claim is made."]],
  },
  "heirlooms/book": {
    eyebrow: "The life book", title: "Their words.", accent: "Your family’s edition.", intro: "A book that feels personal before the first page: their name on the cover, your dedication inside, and the stories only they could tell.", visual: "book", cta: ["Open the book designer", "/app/heirlooms/book-builder"],
    chapters: [["Choose the chapters", "Select approved memories and arrange them into a reading order. Include photographs and captions that give the stories their setting."], ["Make it their own", "Explore cover colors, materials, a title, and a dedication. The interactive preview responds to your design choices."], ["Read the proof", "Inspect the actual page layout and return to the builder to make changes. Printing and checkout are demonstrations; no book is manufactured or shipped."]],
  },
  "heirlooms/time-capsule": {
    eyebrow: "The keepsake box", title: "Open a box.", accent: "Find a whole world.", intro: "A considered home for the objects that hold a story: a book, a letter, a photograph, and the context that makes them matter.", visual: "box", cta: ["Explore the box designer", "/app/heirlooms/capsule-builder"],
    chapters: [["Choose the finish", "Explore materials and personalize an inscription. Turn the interactive model to see the box from different angles."], ["Choose what belongs", "Build a collection around the memories you want to keep close. A copy on a drive is an extra copy, never your only archive."], ["Keep it above ground", "This is a display keepsake concept. It has no burial or environmental rating and is not available to order. Manufacturing and shipping are not connected."]],
  },
  gifts: { eyebrow: "Give a reason to begin", title: "For the person who has", accent: "a thousand stories.", intro: "Give them a place to tell those stories—and a little of your time to listen. Create a personal gift invitation with a dedication of your own.", visual: "letter", cta: ["Create a gift preview", "/gifts/build"], chapters: giftChapters },
  "gifts/parents": { eyebrow: "For your parents", title: "Before they were your parents,", accent: "they were themselves.", intro: "Ask about the first apartment, the friendship that changed everything, or the dreams they had at your age. Give your parents room to tell the whole story.", visual: "letter", cta: ["Make a gift for a parent", "/gifts/build"], chapters: giftChapters },
  "gifts/grandparents": { eyebrow: "For your grandparents", title: "There’s so much more", accent: "you haven’t asked.", intro: "Keep the everyday details, the favorite sayings, and the stories you want the next generation to know. Begin with a conversation, at their pace.", visual: "letter", cta: ["Make a gift for a grandparent", "/gifts/build"], chapters: giftChapters },
  "gifts/holiday": { eyebrow: "When everyone is together", title: "A seat at the table.", accent: "A story worth keeping.", intro: "Bring out an old photograph, pass around a question, and let one memory lead to another. A family gathering is a lovely place to begin.", visual: "letter", cta: ["Prepare a family gift", "/gifts/build"], chapters: giftChapters },
  pricing: {
    eyebrow: "Simple beginnings, room to grow", title: "One person. A whole family.", accent: "Room for every story.", intro: "Explore LifeAtlas for free. The prices below describe the proposed service; they are test prices, and no payment is taken in this preview.",
    chapters: [["Start with one storyteller", "Personal Capsule is designed around one life. Family Collection makes room for up to five storytellers. Both proposed plans include the first year of hosted editing."], ["Keep the story growing", "Living Archive is an optional annual renewal concept for continued editing after year one. It is not an active subscription, and there is no charge or automatic renewal today."], ["Choose keepsakes separately", "The book and keepsake box are optional product concepts with separate test prices. Design them in the studio; printing and fulfillment will need to be connected before sales open."]],
    questions: [["Will I be charged?", "No. Checkout creates a demonstration order. Do not enter real payment details; no payment provider is connected."], ["Is cloud storage included today?", "No. Storage figures are proposed plan allowances. New content stays in this browser on this device. Export your important files and keep independent copies."]],
  },
  preservation: {
    eyebrow: "Care begins with clarity", title: "A story worth keeping.", accent: "A copy you can keep.", intro: "An archive should make it easy to understand where your memories are, how to take them with you, and what still needs to be built.",
    chapters: [["What works today", "The studio saves new content locally in this browser. It can prepare portable exports with stories, available media, and a manifest. Download and inspect a copy of anything important."], ["What isn’t connected", "Cloud storage, managed backups, secure accounts, and independent preservation monitoring are not active. Clearing browser data or losing this device can remove local content."], ["What comes next", "Hosted accounts, backup operations, and clear service commitments are future work. Long-term preservation and future delivery will not be promised on the strength of a prototype."]],
    questions: [["How do I export?", "Open a capsule in the studio and choose its Export section. Review the included stories and media, then download a portable copy."], ["Should I upload my only copy?", "Keep your originals and independent copies. Local browser storage is useful for exploring the product, but it is not a backup service."]],
  },
  about: {
    eyebrow: "Why LifeAtlas", title: "An ordinary life is", accent: "an extraordinary story.", intro: "The details that make someone themselves are often the easiest to miss: a familiar phrase, a kitchen ritual, the way they remember a place.", visual: "archive",
    chapters: [["Make room to listen", "LifeAtlas is built around a simple beginning: ask someone a question and give their answer a place to live."], ["Keep the context", "A photograph matters differently when you know who was there and what happened next. Voices, places, and dates help carry that context forward."], ["Build with care", "This is a working product preview using a fictional family. The goal is a thoughtful family archive, with honest explanations of what works and what is still being developed."]],
  },
  faq: {
    eyebrow: "Questions, answered", title: "A little clarity.", accent: "Before you begin.", intro: "Here is what LifeAtlas does today, how to get started, and what the preview does not yet provide.",
    chapters: [], questions: [["What is a memory capsule?", "A collection for one person’s life, combining stories, recordings, photographs, dates, and places. You can explore it in chapters, on a timeline, or through a map."], ["Is the sample family real?", "No. Margaret Ellis and her family are fictional. Sample narration is synthesized, and sample artwork is illustrative."], ["Can I record my own story?", "Yes. The studio supports recording and uploading audio, writing memories, and adding photographs. Browser microphone permission is required to record. Keep your own copies of important files."], ["Where is my content saved?", "Locally in this browser, on this device. There is no connected cloud account or managed backup. Browser resets and clearing site data can remove it."], ["Can my family join from other devices?", "The preview demonstrates invitations and different roles, but secure accounts, cross-device synchronization, and invitation delivery are not connected."], ["Can I order a book or gift?", "You can design them and create demonstration orders. No charge, printed product, shipment, or email results from the preview."], ["Will future letters be delivered?", "No. They are local drafts and previews only. Nothing is scheduled for automatic delivery."], ["Can I export my memories?", "Yes. Use the Export section of a capsule to prepare a portable copy. Review your downloaded files and keep your originals too."]],
  },
  privacy: {
    eyebrow: "Preview information · policy not finalized", title: "Personal memories deserve", accent: "clear boundaries.", intro: "This page explains the current prototype. It is not a finalized privacy policy for a launched service.",
    chapters: [["Content in this preview", "Stories and uploads are kept in this browser’s local storage and IndexedDB. Secure accounts and cloud archive storage are not connected. People using the same browser profile may be able to access local content."], ["Audience controls", "Visibility and consent settings demonstrate the intended product workflow. They do not provide authenticated access control or secure sharing between devices in this build."], ["Before a public launch", "A complete policy will need to identify the service operator, hosting and processing arrangements, retention practices, and a real privacy contact. Until then, use sample or non-sensitive content to explore."]],
  },
  terms: {
    eyebrow: "Preview information · terms not finalized", title: "Explore with a", accent: "clear understanding.", intro: "LifeAtlas is a functional prototype. These notes describe the preview’s boundaries, not finalized service terms.",
    chapters: [["A demonstration service", "The interface includes sample plans, checkout, gifts, and orders. None creates a paid subscription, physical order, shipment, or delivery obligation."], ["Your content", "Only add material you have permission to use and share. Ask the storyteller before recording or contributing personal memories. Keep independent copies of content that matters."], ["Before launch", "The operator, contractual terms, customer support, billing rules, and applicable policies must be established before the service accepts real purchases or preservation commitments."]],
  },
  "data-retention": {
    eyebrow: "Preview storage information", title: "Know where it lives.", accent: "Know how to keep it.", intro: "Local browser storage makes the prototype usable without an account. It should never be confused with permanent preservation.",
    chapters: [["On this device", "New stories, edits, and media are stored in the browser profile you are using. They are not synchronized to another device or protected by a managed cloud backup."], ["When it can disappear", "Clearing site data, resetting the demo, browser storage eviction, or losing the device can remove content. There is no server recovery or retention guarantee for this preview."], ["Take a copy", "Use a capsule’s Export section to save a portable archive. Check that the downloaded files contain what you expect, and keep more than one independent copy."]],
  },
  accessibility: {
    eyebrow: "Making room for more people", title: "Stories belong", accent: "to everyone.", intro: "The experience is being designed for different ages, devices, and ways of interacting. Accessibility work is ongoing; this is not a claim of certified conformance.",
    chapters: [["A readable interface", "The visual system uses clear type, visible controls, and responsive layouts. Browser zoom and reduced-motion preferences are supported."], ["More than one way to tell it", "Memories can be written, recorded, or illustrated with photographs. Written versions can provide an alternative to listening; automatic transcription is not connected."], ["Keep improving", "Keyboard operation, screen-reader labels, audio controls, and small-screen layouts need continuing review. Known limitations and real-world feedback should shape the next release."]],
  },
  contact: {
    eyebrow: "LifeAtlas preview", title: "A work in progress.", accent: "A conversation worth having.", intro: "There is no connected support inbox or contact form in this preview. You can inspect the public project, report a reproducible issue, or explore the answers below.",
    cta: ["Open the GitHub project", "https://github.com/whatalexthinks/lifeatlas"],
    chapters: [["A product question", "The questions page covers recording, local storage, exports, invitations, and the limits of the preview."], ["A problem with the preview", "When reporting an issue on GitHub, describe the page, device, expected result, and what happened. Do not include private family stories or personal contact details in a public issue."], ["An order or delivery", "No real order or future delivery can be created here. All checkout, gift, printing, and shipping experiences are demonstrations."]],
  },
};
