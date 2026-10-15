import { brand } from "@/config/brand";

/**
 * Questions and answers for the public site. Plain text only (they also feed structured
 * data), and honest about the preview: nothing here claims a service that isn't connected.
 */
export interface FaqGroup {
  id: string;
  title: string;
  items: { q: string; a: string }[];
}

export const faqGroups: FaqGroup[] = [
  {
    id: "starting",
    title: "Getting started",
    items: [
      { q: `What is ${brand.name}?`, a: `${brand.name} keeps the story of a life or a relationship in one private capsule: written memories, recorded answers and photographs, with dates, places and the people in them. You can explore it as a timeline or in chapters, invite people to add what they remember, prepare messages for the future, and turn it into a printed book or a physical keepsake.` },
      { q: "Whose story can a capsule hold?", a: "Your own, yours and your partner's, your family's, a parent's or grandparent's, your child's, or anyone special to you. The kind of capsule only changes which questions we suggest first and how chapters are named — any capsule can hold any kind of memory." },
      { q: "Do I need to write well, or know where to start?", a: "No. Pick a question from the library — or press Surprise Me — and answer it however is easiest: speak, type a few lines, or start from a photograph. Skip anything you'd rather not answer, save questions for later, and answer a favourite more than once." },
      { q: "Can I have more than one capsule?", a: "Yes. Many people keep one for themselves, one for their relationship and one for a parent. The Digital plan includes one capsule; the Family Plan includes up to five. Sample capsules never count." },
      { q: "Is the sample family real?", a: "No. The Ellis family, their stories and their pictures are fictional. Illustrations were made for the demo, sample voices are synthesized, and the one photograph is AI-generated. Every sample is labelled." },
    ],
  },
  {
    id: "privacy",
    title: "Privacy and safety",
    items: [
      { q: "Who can see my capsule?", a: "Only the people you invite. Capsules are never public and never listed. Within a capsule, each memory can be kept to yourself, shared with the capsule's editors, or shared with everyone you've invited." },
      { q: "Is my data encrypted?", a: "In this preview, everything stays in your own browser on your own device; nothing is sent to our servers. When hosted accounts launch we will describe exactly how data is protected in transit and at rest — we won't make security claims before they're true." },
      { q: "Do you use my stories to train AI or sell them?", a: "No. Your stories are yours. We don't sell personal data, and we won't use your memories to train models." },
      { q: "Can I delete everything?", a: "Yes. You can delete single memories (they wait in Recently deleted for a while in case of mistakes), whole capsules, or — in this preview — erase everything on this device from Settings." },
    ],
  },
  {
    id: "together",
    title: "Inviting family and friends",
    items: [
      { q: "Do the people I invite have to pay?", a: "Never. Whoever owns the capsule chooses a plan. Contributors and viewers join free — no card, no trial, no catch." },
      { q: "What can invited people do?", a: "It depends on the role you give them. Editors help run the capsule; contributors add their own stories, which you review before they join; viewers can read what's shared with them. You can change a role or remove someone at any time." },
      { q: "Can my partner and I both answer the same question?", a: "Yes, and we encourage it. Both answers are kept side by side, credited to each of you — it's often the best part." },
      { q: "How do invitations work in the preview?", a: "You get a link to share yourself — by message, email or in person. In this preview the link works in this browser only, and we never claim an email was sent: no email service is connected." },
    ],
  },
  {
    id: "recording",
    title: "Voice, photos and video",
    items: [
      { q: "Can I record voice answers?", a: "Yes, in any modern browser with a microphone. If recording isn't possible on a device, you can upload an audio file or type the answer instead." },
      { q: "Will you transcribe recordings?", a: "Not automatically, today. Recordings are kept exactly as spoken, and any transcript is one you (or someone you invite) type. We never present an invented transcript." },
      { q: "What about photo dates and places?", a: "If a photo carries a date from the camera, we offer it as a suggestion for you to confirm. We never invent a date, a place or who's in a picture — approximate dates like “Summer 1998” or “Around age 12” are welcome." },
      { q: "Can I add video?", a: "Not yet. Short video clips are next on the list; larger video libraries will need hosted storage, which arrives with accounts." },
    ],
  },
  {
    id: "plans",
    title: "Plans and payments",
    items: [
      { q: "How much does it cost?", a: "You can start free on this device. The Digital LifeCapsule is $99 a year (or $9.99 a month) and the Family Plan is $179 a year (or $17.99 a month). The Premium Physical LifeCapsule ($249) and the Printed Legacy Book (from $119) are optional add-ons. These are test prices." },
      { q: "Will I be charged in the preview?", a: "No. Checkout creates a clearly labelled demonstration order. No payment provider is connected; please don't enter real card details anywhere." },
      { q: "What happens if I stop paying?", a: "You'll always be able to download a complete copy of your capsules. We'll publish the exact policy for read-only access and retention before any paid plan launches." },
      { q: "Do you have promotions or referral rewards?", a: "Founding-member and referral offers are part of the plan. Any giveaway will only run under published rules after legal review — none is running today." },
    ],
  },
  {
    id: "keepsakes",
    title: "Physical keepsakes",
    items: [
      { q: "What is the Premium Physical LifeCapsule?", a: "A gift-ready archival kit: a fitted keepsake box, memory prompt cards, acid-free photo sleeves and letter envelopes. The kit itself would ship once paid for; personal printed inserts are made only after you approve a proof." },
      { q: "How does the Printed Legacy Book work?", a: "You choose the stories and photographs, design the cover and review a page-by-page proof. It's made to order — printed only after you approve that proof." },
      { q: "Can the physical capsule be buried?", a: "No. It's a display keepsake, not designed or rated for burial or long-term underground storage, and we won't claim otherwise." },
      { q: "Can I order one today?", a: "You can design both and place a demonstration order. Payments, printing and shipping aren't connected yet, so nothing is charged, made or sent." },
    ],
  },
  {
    id: "future",
    title: "Messages for the future",
    items: [
      { q: "Can I write a letter to be opened later?", a: "Yes — a letter, a voice message, or a letter with photographs, for a date or a milestone. You can prepare and preview them today." },
      { q: "Will they be delivered automatically?", a: "Not yet, and we'll never pretend otherwise. A message is only called “scheduled” once a real delivery service has accepted it, and delivery will only be promised once storage continuity, recipient verification and legal review are in place." },
    ],
  },
  {
    id: "keeping",
    title: "Keeping it safe",
    items: [
      { q: "Are my memories backed up?", a: "Not in this preview. What you add stays in this browser, and clearing site data can remove it. Download a copy of anything that matters." },
      { q: "Can I download everything?", a: "Yes — a complete export with your stories as readable files and structured data, plus your photographs and recordings. It's always free, on every plan." },
      { q: "What happens to a capsule if something happens to me?", a: "You can name a successor — someone you trust to look after your capsules. The verified handover process arrives with hosted accounts." },
    ],
  },
];
