import type { ChapterKey, StoryChapter } from "@/domain/models";

export const chapters: StoryChapter[] = [
  { id: "childhood", title: "Childhood", subtitle: "Kitchens, harbors, and the long way home", color: "slate", order: 1 },
  { id: "coming_of_age", title: "Coming of Age", subtitle: "Letters, suitcases, and first cities", color: "smoke", order: 2 },
  { id: "love", title: "Love", subtitle: "The people we chose, and who chose us", color: "terracotta", order: 3 },
  { id: "family", title: "Family", subtitle: "The years the house was full", color: "evergreen", order: 4 },
  { id: "work", title: "Work & Craft", subtitle: "What we made with our hands", color: "brass", order: 5 },
  { id: "journeys", title: "Journeys", subtitle: "Wrong turns worth taking", color: "moss", order: 6 },
  { id: "everyday", title: "Ordinary Wonders", subtitle: "Small days that turned out to be large", color: "smoke", order: 7 },
  { id: "wisdom", title: "Lessons", subtitle: "What a life teaches, if you let it", color: "evergreen", order: 8 },
];

export const chapterById = (id: ChapterKey) => chapters.find((c) => c.id === id) ?? chapters[0];

export const defaultChapterOrder: ChapterKey[] = chapters.map((c) => c.id);

export const chapterColorVar: Record<StoryChapter["color"], string> = {
  evergreen: "var(--evergreen)",
  terracotta: "var(--terracotta)",
  slate: "var(--slate)",
  smoke: "var(--smoke)",
  moss: "var(--moss)",
  brass: "var(--brass)",
};
