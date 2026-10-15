import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** Private media object ownership and upload finalization state. */
export const mediaObjectsTable = pgTable("media_objects", {
  objectPath: text("object_path").primaryKey(),
  ownerUserId: text("owner_user_id").notNull(),
  capsuleId: text("capsule_id").notNull(),
  name: text("name").notNull(),
  contentType: text("content_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  finalizedAt: timestamp("finalized_at", { withTimezone: true }),
});
