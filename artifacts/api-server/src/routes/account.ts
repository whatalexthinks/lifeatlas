import { getAuth } from "@clerk/express";
import { PutAccountSnapshotBody } from "@workspace/api-zod";
import { accountSnapshotsTable, db } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";

const router: IRouter = Router();
const MAX_SNAPSHOT_BYTES = 2 * 1024 * 1024;

router.get("/account/snapshot", async (req, res): Promise<void> => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Sign in to access your capsule workspace." });
    return;
  }

  const [snapshot] = await db
    .select()
    .from(accountSnapshotsTable)
    .where(eq(accountSnapshotsTable.userId, userId))
    .limit(1);

  res.json({
    data: snapshot?.data ?? null,
    version: snapshot?.version ?? 0,
    updatedAt: snapshot?.updatedAt?.toISOString() ?? null,
  });
});

router.put("/account/snapshot", async (req, res): Promise<void> => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Sign in to save your capsule workspace." });
    return;
  }

  const parsed = PutAccountSnapshotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "The capsule workspace is not in a supported format." });
    return;
  }

  if (Buffer.byteLength(JSON.stringify(parsed.data.data), "utf8") > MAX_SNAPSHOT_BYTES) {
    res.status(413).json({ error: "This capsule workspace is too large to save." });
    return;
  }

  const [snapshot] = await db
    .insert(accountSnapshotsTable)
    .values({
      userId,
      data: parsed.data.data,
      version: 1,
    })
    .onConflictDoUpdate({
      target: accountSnapshotsTable.userId,
      set: {
        data: parsed.data.data,
        version: sql`${accountSnapshotsTable.version} + 1`,
        updatedAt: new Date(),
      },
      setWhere: eq(accountSnapshotsTable.version, parsed.data.version),
    })
    .returning();

  if (!snapshot) {
    res.status(409).json({ error: "This workspace changed in another session. Reload before saving again." });
    return;
  }

  res.json({
    data: snapshot.data,
    version: snapshot.version,
    updatedAt: snapshot.updatedAt.toISOString(),
  });
});

export default router;
