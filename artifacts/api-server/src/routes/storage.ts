import { Readable } from "node:stream";
import { getAuth } from "@clerk/express";
import {
  FinalizeUploadBody,
  RequestUploadUrlBody,
  type UploadFinalizeResult,
  type UploadUrlResponse,
} from "@workspace/api-zod";
import { db, mediaObjectsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import { ObjectNotFoundError, ObjectStorageService } from "../lib/objectStorage";
import { ObjectPermission } from "../lib/objectAcl";

const router: IRouter = Router();
const storage = new ObjectStorageService();
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;
const ALLOWED_MEDIA_TYPE = /^(image\/(jpeg|png|webp|gif|heic|heif)|audio\/(webm|mp4|ogg|mpeg|wav|aac)|video\/(mp4|webm|quicktime))$/i;
const OBJECT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function signedInUserId(req: Request, res: Response): string | null {
  const userId = getAuth(req).userId;
  if (!userId) res.status(401).json({ error: "Sign in to manage your private media." });
  return userId ?? null;
}

function streamResponse(response: Response, fileResponse: globalThis.Response) {
  response.status(fileResponse.status);
  fileResponse.headers.forEach((value, key) => response.setHeader(key, value));
  if (!fileResponse.body) {
    response.end();
    return;
  }
  Readable.fromWeb(fileResponse.body as ReadableStream<Uint8Array>).pipe(response);
}

router.post("/storage/uploads/request-url", async (req, res): Promise<void> => {
  const userId = signedInUserId(req, res);
  if (!userId) return;

  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid media details." });
    return;
  }
  const { name, size, contentType, capsuleId } = parsed.data;
  if (!ALLOWED_MEDIA_TYPE.test(contentType) || size > MAX_UPLOAD_BYTES) {
    res.status(400).json({ error: "Choose a supported photo, voice recording, or video under 200 MB." });
    return;
  }

  try {
    const uploadURL = await storage.getObjectEntityUploadURL();
    const objectPath = storage.normalizeObjectEntityPath(uploadURL);
    if (!/^\/objects\/uploads\/[0-9a-f-]{36}$/i.test(objectPath)) {
      throw new Error("Storage returned an invalid private object path.");
    }

    await db.insert(mediaObjectsTable).values({
      objectPath,
      ownerUserId: userId,
      capsuleId,
      name: name.trim(),
      contentType,
      byteSize: size,
    });

    res.json({
      uploadURL,
      objectPath,
      metadata: { name: name.trim(), size, contentType },
    } satisfies UploadUrlResponse);
  } catch (error) {
    req.log.error({ err: error }, "Could not create private media upload");
    res.status(500).json({ error: "We could not prepare this upload. Please try again." });
  }
});

router.post("/storage/uploads/finalize", async (req, res): Promise<void> => {
  const userId = signedInUserId(req, res);
  if (!userId) return;

  const parsed = FinalizeUploadBody.safeParse(req.body);
  if (!parsed.success || !/^\/objects\/uploads\/[0-9a-f-]{36}$/i.test(parsed.data?.objectPath ?? "")) {
    res.status(400).json({ error: "The upload details are invalid." });
    return;
  }
  const { objectPath, size, contentType, capsuleId } = parsed.data;
  const [upload] = await db.select().from(mediaObjectsTable)
    .where(and(eq(mediaObjectsTable.objectPath, objectPath), eq(mediaObjectsTable.ownerUserId, userId)))
    .limit(1);
  if (!upload) {
    res.status(403).json({ error: "This upload was not created for your account." });
    return;
  }
  if (upload.capsuleId !== capsuleId || upload.byteSize !== size || upload.contentType !== contentType) {
    res.status(400).json({ error: "The upload details do not match the reserved file." });
    return;
  }
  if (upload.finalizedAt) {
    res.json({ objectPath } satisfies UploadFinalizeResult);
    return;
  }

  try {
    const file = await storage.getObjectEntityFile(objectPath);
    const [metadata] = await file.getMetadata();
    const actualSize = Number(metadata.size);
    const actualType = String(metadata.contentType || "");
    if (!Number.isFinite(actualSize) || actualSize !== size || actualSize > MAX_UPLOAD_BYTES || actualType !== contentType) {
      await file.delete().catch(() => undefined);
      await db.delete(mediaObjectsTable).where(eq(mediaObjectsTable.objectPath, objectPath));
      res.status(400).json({ error: "The uploaded file did not match its declared type or size, so it was discarded." });
      return;
    }

    await storage.trySetObjectEntityAclPolicy(objectPath, { owner: userId, visibility: "private" });
    await db.update(mediaObjectsTable)
      .set({ finalizedAt: new Date() })
      .where(and(eq(mediaObjectsTable.objectPath, objectPath), eq(mediaObjectsTable.ownerUserId, userId)));
    res.json({ objectPath } satisfies UploadFinalizeResult);
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "The uploaded file could not be found." });
      return;
    }
    req.log.error({ err: error }, "Could not finalize private media upload");
    res.status(500).json({ error: "We could not finish saving this file." });
  }
});

router.get("/storage/public-objects/*filePath", async (req, res): Promise<void> => {
  try {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;
    const file = await storage.searchPublicObject(filePath);
    if (!file) {
      res.status(404).json({ error: "File not found." });
      return;
    }
    streamResponse(res, await storage.downloadObject(file));
  } catch (error) {
    req.log.error({ err: error }, "Could not serve public object");
    res.status(500).json({ error: "Could not serve this file." });
  }
});

router.get("/storage/objects/uploads/:objectId", async (req, res): Promise<void> => {
  const userId = signedInUserId(req, res);
  if (!userId) return;
  const objectId = req.params.objectId;
  if (typeof objectId !== "string" || !OBJECT_ID.test(objectId)) {
    res.status(404).json({ error: "Object not found." });
    return;
  }
  const objectPath = `/objects/uploads/${objectId}`;
  const [record] = await db.select().from(mediaObjectsTable)
    .where(and(
      eq(mediaObjectsTable.objectPath, objectPath),
      eq(mediaObjectsTable.ownerUserId, userId),
    ))
    .limit(1);
  if (!record?.finalizedAt) {
    res.status(404).json({ error: "Object not found." });
    return;
  }

  try {
    const file = await storage.getObjectEntityFile(objectPath);
    if (!(await storage.canAccessObjectEntity({ userId, objectFile: file, requestedPermission: ObjectPermission.READ }))) {
      res.status(403).json({ error: "You do not have access to this file." });
      return;
    }
    streamResponse(res, await storage.downloadObject(file, 0));
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Object not found." });
      return;
    }
    req.log.error({ err: error }, "Could not serve private object");
    res.status(500).json({ error: "Could not open this file." });
  }
});

router.delete("/storage/objects/uploads/:objectId", async (req, res): Promise<void> => {
  const userId = signedInUserId(req, res);
  if (!userId) return;
  const objectId = req.params.objectId;
  if (typeof objectId !== "string" || !OBJECT_ID.test(objectId)) {
    res.status(404).json({ error: "Object not found." });
    return;
  }
  const objectPath = `/objects/uploads/${objectId}`;
  const [record] = await db.select().from(mediaObjectsTable)
    .where(and(
      eq(mediaObjectsTable.objectPath, objectPath),
      eq(mediaObjectsTable.ownerUserId, userId),
    ))
    .limit(1);
  if (!record) {
    res.status(404).json({ error: "Object not found." });
    return;
  }

  try {
    const file = await storage.getObjectEntityFile(objectPath);
    if (!(await storage.canAccessObjectEntity({ userId, objectFile: file, requestedPermission: ObjectPermission.WRITE }))) {
      res.status(403).json({ error: "You do not have permission to remove this file." });
      return;
    }
    await file.delete();
    await db.delete(mediaObjectsTable).where(eq(mediaObjectsTable.objectPath, objectPath));
    res.status(204).end();
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      await db.delete(mediaObjectsTable).where(eq(mediaObjectsTable.objectPath, objectPath));
      res.status(404).json({ error: "Object not found." });
      return;
    }
    req.log.error({ err: error }, "Could not remove private object");
    res.status(500).json({ error: "Could not remove this file." });
  }
});

export default router;
