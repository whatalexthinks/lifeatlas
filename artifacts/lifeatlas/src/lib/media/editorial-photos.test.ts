import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { media, NO_PHOTO_NOTICE, PHOTO_NOTICE } from "@/data/fixtures/media";
import { extraMedia } from "@/data/fixtures/samples-couple-family";
import { capsules } from "@/data/fixtures/capsules";
import { extraCapsules } from "@/data/fixtures/samples-couple-family";
import { mockMedia } from "@/services/mock/media";
import { sampleCapsule } from "@/components/site/samples";
import { editorialPhotos, photoForPlate } from "./editorial-photos";

const samplePlateAssets = [...media, ...extraMedia].filter((asset) => asset.source.kind === "plate");

describe("sample photo integrity", () => {
  it("maps every displayed sample photograph to a supplied, optimized image", () => {
    for (const photo of Object.values(editorialPhotos)) {
      expect(existsSync(resolve(process.cwd(), "public", "media", "editorial", `${photo.slug}.webp`)), photo.slug).toBe(true);
    }
  });

  it("labels supplied photographs and clearly identifies sample stories without a photo", () => {
    const unmatchedScenes = new Set<string>();
    for (const asset of samplePlateAssets) {
      if (asset.source.kind !== "plate") continue;
      const photo = photoForPlate(asset.source.plateId);
      expect(asset.sampleNotice).toBe(photo ? PHOTO_NOTICE : NO_PHOTO_NOTICE);
      if (!photo) unmatchedScenes.add(asset.source.plateId);
    }
    expect([...unmatchedScenes].sort()).toEqual(["dock-2012", "orchard-2001", "umbrella-1998"]);
  });

  it("does not substitute generated artwork when a sample story has no matching photograph", async () => {
    const missingPhoto = samplePlateAssets.find((asset) => asset.source.kind === "plate" && !photoForPlate(asset.source.plateId));
    expect(missingPhoto).toBeDefined();
    const result = await mockMedia.resolveUrl(missingPhoto!);
    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.message).toContain("No photograph was supplied");
  });

  it("uses a supplied photo or a typographic cover for every sample capsule", () => {
    for (const fixture of [...capsules, ...extraCapsules]) {
      const capsule = sampleCapsule(fixture.id);
      if (capsule.cover.plateId) {
        expect(photoForPlate(capsule.cover.plateId)).toBeDefined();
      } else {
        expect(capsule.cover.layout).toBe("type_only");
      }
    }
  });
});
