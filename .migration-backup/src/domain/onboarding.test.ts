import { describe, expect, it } from "vitest";
import { onboardingDetailsSchema } from "@/domain/schemas";
import { familySurname, keyDatesFor, subjectFor, suggestedTitle, toCreateInput } from "./onboarding";

const look = { palette: "linen" as const, typography: "classic" as const, layout: "full_bleed" as const };

describe("onboarding", () => {
  it("suggests a title for each kind of story", () => {
    expect(suggestedTitle("personal", { name: "Sarah Ellis" })).toBe("My Life, So Far");
    expect(suggestedTitle("couple", { name: "Ana Ortega", partnerName: "Luis" })).toBe("Our Story");
    expect(suggestedTitle("family", { name: "the Ellis family" })).toBe("The Ellis Family");
    expect(suggestedTitle("parent", { name: "Rosa Delgado" })).toBe("In Rosa's Own Words");
    expect(suggestedTitle("child", { name: "Mia" })).toBe("For Mia");
    expect(suggestedTitle("someone", { name: "Mr. Okafor" })).toBe("The Stories of Mr. Okafor");
    expect(suggestedTitle("parent", { name: "Grandma June Ellis" })).toBe("In Grandma June's Own Words");
    expect(suggestedTitle("someone", { name: "Aunt Rose" })).toBe("The Stories of Aunt Rose");
  });

  it("reads family names however they're typed", () => {
    expect(familySurname("Ellis")).toBe("Ellis");
    expect(familySurname("The Ellis Family")).toBe("Ellis");
    expect(familySurname("the Joneses")).toBe("Jones");
    expect(familySurname("Ross")).toBe("Ross");
    expect(subjectFor("couple", { name: "Ana Ortega", partnerName: "Luis Ortega" })).toBe("Ana & Luis");
  });

  it("turns a typed date into a key date, and never invents one", () => {
    expect(keyDatesFor("couple", { name: "Ana", keyDate: "2012-05-04" })).toEqual([{ id: "kd_anniversary", label: "Our anniversary", kind: "anniversary", month: 5, day: 4, year: 2012, recurring: true }]);
    expect(keyDatesFor("child", { name: "Mia Ortega", keyDate: "2019-02-11" })[0]).toMatchObject({ label: "Mia's birthday", kind: "birthday" });
    expect(keyDatesFor("couple", { name: "Ana", keyDate: "" })).toEqual([]);
    expect(keyDatesFor("personal", { name: "Ana", keyDate: "2012-05-04" })).toEqual([]);
  });

  it("asks only what each kind needs", () => {
    const bad = onboardingDetailsSchema.safeParse({ kind: "couple", name: "Ana", title: "Our Story" });
    expect(bad.success).toBe(false);
    expect(bad.error?.issues[0].path).toEqual(["partnerName"]);
    expect(onboardingDetailsSchema.safeParse({ kind: "parent", name: "Rosa", title: "x" }).success).toBe(false);
    expect(onboardingDetailsSchema.safeParse({ kind: "child", name: "Mia", title: "For Mia" }).success).toBe(true);
    expect(onboardingDetailsSchema.safeParse({ kind: "child", name: "Mia", title: "For Mia", keyDate: "2019-13-40" }).success).toBe(false);
  });

  it("builds the capsule input without carrying answers a kind doesn't use", () => {
    const d = onboardingDetailsSchema.parse({ kind: "child", name: "Mia Ortega", relationship: "Daughter", title: "For Mia", keyDate: "2019-02-11", birthplace: "Lisbon", birthYear: 1950 });
    const v = toCreateInput(d, look);
    expect(v).toMatchObject({ kind: "child", subjectName: "Mia Ortega", relationship: "Daughter", title: "For Mia", birthYear: 2019, birthplace: "", layout: "type_only", startingChapter: "childhood" });
    const fam = toCreateInput(onboardingDetailsSchema.parse({ kind: "family", name: "Ellis", title: "Four Generations" }), { ...look, coverMediaId: "med_1" });
    expect(fam).toMatchObject({ subjectName: "The Ellis Family", title: "Four Generations", collectionMode: "family", relationship: "Family", layout: "full_bleed" });
  });
});

describe("date validation", () => {
  it("an age needs a number, within reason", async () => {
    const { fuzzyDateSchema } = await import("@/domain/schemas");
    expect(fuzzyDateSchema.safeParse({ precision: "age" }).success).toBe(false);
    expect(fuzzyDateSchema.safeParse({ precision: "age", age: 12 }).success).toBe(true);
    expect(fuzzyDateSchema.safeParse({ precision: "age", age: 140 }).success).toBe(false);
  });
});
