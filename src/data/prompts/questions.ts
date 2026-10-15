import type { CapsuleKind, ChapterKey, Question, QuestionCategory } from "@/domain/models";

/**
 * The OurLifeCapsule question library — authored prompts in sections. Sections marked with
 * audiences were written for a kind of capsule (partners asking each other, a parent
 * writing to a child, a family across generations); the rest suit any life story.
 * Follow-ups are scripted (no AI) and offered gently after an answer.
 */

type Row = [text: string, followUps?: string[]];

const sections: { category: QuestionCategory; key: string; chapter: ChapterKey; audiences?: CapsuleKind[]; rows: Row[] }[] = [
  {
    category: "Our Story",
    key: "ourstory",
    chapter: "love",
    audiences: ["couple"],
    rows: [
      ["What did you first notice about me?", ["Did you tell anyone about me that day?"]],
      ["When did you realize this was something special?", ["Was it a big moment or a small one?"]],
      ["Tell the story of how we met — your version.", ["What do you think I'd remember differently?"]],
      ["What do you remember about our first date?", ["What were you nervous about?"]],
      ["What's a small moment together you'll never forget?", ["Why that one, do you think?"]],
      ["What did you think the first time you saw where I lived?"],
      ["When did you first say 'I love you' — or know you were about to?"],
      ["What did you want to say on our wedding day, or a day like it, that you never said?"],
    ],
  },
  {
    category: "Us, Now",
    key: "usnow",
    chapter: "everyday",
    audiences: ["couple"],
    rows: [
      ["What's something I do that makes an ordinary day better?"],
      ["What song makes you think of us?", ["Where were we when you first heard it together?"]],
      ["What's a tradition we invented without meaning to?"],
      ["What's the hardest thing we've come through together?", ["What got us through it?"]],
      ["What's your favorite room in our home, and why?"],
      ["What do we argue about that secretly makes you smile?"],
      ["Where was the best trip we've taken — and the worst?", ["What made the worst one worth it anyway?"]],
    ],
  },
  {
    category: "Our Future",
    key: "ourfuture",
    chapter: "wisdom",
    audiences: ["couple"],
    rows: [
      ["What do you hope we're doing in ten years?"],
      ["Where do you want to go together that we haven't yet?"],
      ["What do you want to remember about this year of our life?"],
      ["What would you want our children, or the people after us, to know about us?"],
      ["What promise would you make me today?"],
    ],
  },
  {
    category: "Growing Up",
    key: "growingup",
    chapter: "childhood",
    audiences: ["child"],
    rows: [
      ["What was the day you were born like for us?", ["Who was the first person we called?"]],
      ["What was your first word — and what did we think it meant?"],
      ["What made you laugh hardest when you were tiny?"],
      ["What were you completely sure about at age five?"],
      ["What's a bedtime ritual we had?", ["Which book did you make us read again and again?"]],
      ["What are you like right now, at this age, that I never want to forget?"],
      ["What did you teach me without knowing it?"],
      ["What's something you were brave about this year?"],
    ],
  },
  {
    category: "Family History",
    key: "familyhistory",
    chapter: "family",
    audiences: ["family", "parent"],
    rows: [
      ["Where does our family come from, as far back as anyone knows?", ["Who told you, and how sure were they?"]],
      ["Which family story gets retold at every gathering?", ["Who tells it best?"]],
      ["What tradition has lasted the longest in our family?", ["Who started it?"]],
      ["What dish appears at every family celebration?", ["Who makes it now?"]],
      ["Which family member would you most like to have met?"],
      ["What did the family do when times were hard?"],
      ["What object has been handed down, and who had it first?"],
      ["What should the youngest in the family know about the oldest?"],
      ["How did the family celebrate holidays when you were young?"],
    ],
  },
  {
    category: "Funny Memories",
    key: "funny",
    chapter: "everyday",
    rows: [
      ["What's the funniest thing that ever happened at a family dinner?"],
      ["What's a mistake you can laugh about now?", ["How long did it take to find it funny?"]],
      ["Who is the funniest person you've ever known?", ["What would they say about this question?"]],
      ["What's a joke or prank that still makes you smile?"],
      ["When did you laugh so hard you couldn't stop?"],
    ],
  },
  {
    category: "Values",
    key: "values",
    chapter: "wisdom",
    rows: [
      ["What do you believe now that you didn't at twenty?"],
      ["What makes a good life, in your experience?"],
      ["When did you stand up for something that mattered?"],
      ["What are you most grateful for today?"],
      ["Whose kindness changed the course of your life?"],
    ],
  },
  {
    category: "Hopes & Dreams",
    key: "dreams",
    chapter: "coming_of_age",
    rows: [
      ["What did you want to be when you grew up?", ["How close did you come?"]],
      ["What dream are you still holding onto?"],
      ["If you had one free year, what would you do with it?"],
      ["Where would you go tomorrow if you could go anywhere?"],
    ],
  },
  {
    category: "Adventures",
    key: "adventures",
    chapter: "journeys",
    rows: [
      ["What's the bravest trip you've ever taken?"],
      ["When did you get gloriously lost?", ["How did you find your way back?"]],
      ["What place surprised you the most?"],
      ["What did you pack that you've never forgotten?"],
    ],
  },
  {
    category: "Advice",
    key: "advice",
    chapter: "wisdom",
    rows: [
      ["What advice would you give your younger self?"],
      ["What should every eighteen-year-old know?"],
      ["What would you tell someone on their wedding day?"],
      ["What's the best advice you ever ignored?", ["Do you wish you'd listened?"]],
    ],
  },
  {
    category: "Childhood",
    key: "childhood",
    chapter: "childhood",
    rows: [
      ["What did your childhood kitchen smell like?", ["Who was usually cooking?", "Is there a dish you still make the same way?"]],
      ["Who made you feel safe as a child?", ["What did they do that made you feel that way?"]],
      ["What could you see from your bedroom window?", ["Did you share that room with anyone?"]],
      ["What game did you never want to end?", ["Who did you play it with?"]],
      ["Where did you go when you wanted to be alone?"],
    ],
  },
  {
    category: "Parents",
    key: "parents",
    chapter: "childhood",
    rows: [
      ["What did your parents teach you without using words?"],
      ["What is something your father said that you still remember?", ["When did you understand what he meant?"]],
      ["What do you wish you had asked your mother?"],
      ["Which family saying do you still use?", ["Where do you think it came from?"]],
      ["What did your parents do on a Saturday?"],
    ],
  },
  {
    category: "School",
    key: "school",
    chapter: "childhood",
    rows: [
      ["Who was your favorite teacher, and why?", ["Did you ever tell them?"]],
      ["What did you love learning about?"],
      ["What happened on the walk home from school?"],
      ["What were you known for at school?"],
      ["Was there a day at school you never forgot?"],
    ],
  },
  {
    category: "Friendship",
    key: "friendship",
    chapter: "coming_of_age",
    rows: [
      ["Who was your first best friend?", ["What did you do together?"]],
      ["Which friend changed the direction of your life?"],
      ["When did a friend show up for you when it mattered?"],
      ["How did you stay in touch with people before phones?"],
      ["Which friendship has lasted the longest?", ["What has kept it going?"]],
    ],
  },
  {
    category: "Love",
    key: "love",
    chapter: "love",
    rows: [
      ["How did you meet the person you fell in love with?", ["What did you notice about them first?", "Who spoke first?"]],
      ["What was your first home together like?"],
      ["What made you laugh on your wedding day?"],
      ["What did you argue about, and how did you make up?"],
      ["What did love look like on an ordinary Tuesday?"],
    ],
  },
  {
    category: "Raising a Family",
    key: "family",
    chapter: "family",
    rows: [
      ["What surprised you about becoming a parent?", ["What did you get wrong at first?"]],
      ["Which ordinary day with your children do you remember most?"],
      ["What family tradition did you invent?"],
      ["What would you tell a brand-new parent?"],
      ["What did bedtime look like in your house?"],
    ],
  },
  {
    category: "Work",
    key: "work",
    chapter: "work",
    rows: [
      ["What was your first paid job?", ["What did you spend that first paycheck on?"]],
      ["Who believed in your work before you did?"],
      ["What did a difficult job teach you?"],
      ["What work are you proudest of?", ["Who else knows about it?"]],
      ["What did you make with your own hands?"],
    ],
  },
  {
    category: "Places",
    key: "places",
    chapter: "journeys",
    rows: [
      ["Which place still feels like home?"],
      ["What do you remember about moving somewhere new?", ["What did you bring with you?"]],
      ["Describe a street you lived on, the way you'd walk it."],
      ["What place changed the way you see things?"],
      ["If we could go anywhere together, where would you take us?"],
    ],
  },
  {
    category: "Travel",
    key: "travel",
    chapter: "journeys",
    rows: [
      ["What is the best wrong turn you ever took?"],
      ["Who did you meet on a journey that you still think about?"],
      ["What did you bring home from a trip?"],
      ["Which landscape has stayed with you?"],
      ["What was the longest drive of your life?"],
    ],
  },
  {
    category: "Holidays",
    key: "holidays",
    chapter: "everyday",
    rows: [
      ["What did the holidays sound like at home?"],
      ["Who always arrived first at family gatherings?"],
      ["What was your most unexpected gift?"],
      ["Which holiday went wonderfully wrong?"],
      ["What holiday tradition should we keep?"],
    ],
  },
  {
    category: "Challenges",
    key: "challenges",
    chapter: "wisdom",
    rows: [
      ["Who helped you through a difficult season?", ["What did they do or say?"]],
      ["When did you find courage you didn't know you had?"],
      ["What helped you begin again?"],
      ["What has forgiveness meant in your life?"],
      ["What do you worry about less now than you used to?"],
    ],
  },
  {
    category: "Pride",
    key: "pride",
    chapter: "work",
    rows: [
      ["What small accomplishment meant a great deal to you?"],
      ["When did you feel most like yourself?"],
      ["What are you glad you tried?"],
      ["What is something you did that nobody saw?"],
      ["What would you like to be remembered for?"],
    ],
  },
  {
    category: "Wisdom",
    key: "wisdom",
    chapter: "wisdom",
    rows: [
      ["What advice became more useful as you got older?"],
      ["What would you tell your younger self?"],
      ["What do you know now that you wish you'd known at twenty?"],
      ["What makes a good life, to you?"],
      ["What question should we have asked you sooner?"],
    ],
  },
  {
    category: "Recipes",
    key: "recipes",
    chapter: "everyday",
    rows: [
      ["Which recipe holds a family story?", ["Who taught it to you?"]],
      ["Who taught you to cook?"],
      ["What meal would you make for everyone, one more time?"],
      ["What ingredient do you measure by feel?"],
      ["What did your family eat on Sunday nights?"],
    ],
  },
  {
    category: "Traditions",
    key: "traditions",
    chapter: "everyday",
    rows: [
      ["What tradition does only our family understand?"],
      ["What song belongs to our family?"],
      ["What object would you never throw away?", ["Where is it now?"]],
      ["How did your family celebrate birthdays?"],
      ["What tradition did you quietly let go of?"],
    ],
  },
  {
    category: "Small Ordinary Moments",
    key: "moments",
    chapter: "everyday",
    rows: [
      ["What is an ordinary day you wish you could revisit?"],
      ["What does a perfect ordinary morning look like?"],
      ["What sound instantly takes you back?"],
      ["What small kindness do you still remember?"],
      ["What made you laugh this week?"],
    ],
  },
  {
    category: "Messages to Descendants",
    key: "descendants",
    chapter: "wisdom",
    rows: [
      ["What story should the next generation hear?"],
      ["What do you hope your grandchildren know about you?"],
      ["What would you say to someone opening this in twenty years?"],
      ["What do you hope stays the same in our family?"],
      ["What story would you like to tell next?"],
    ],
  },
];

export const questionLibrary: Question[] = sections.flatMap((s) =>
  s.rows.map(([text, followUps], i) => ({
    id: `q_${s.key}_${i + 1}`,
    text,
    category: s.category,
    chapter: s.chapter,
    ...(s.audiences ? { audiences: s.audiences } : {}),
    followUps: followUps ?? [],
    custom: false,
  })),
);

export const questionCategories: QuestionCategory[] = sections.map((s) => s.category);

/** Five gentle questions for a first in-person or holiday session. */
export const starterQuestionIds = ["q_moments_1", "q_childhood_1", "q_love_1", "q_recipes_1", "q_descendants_2"];
