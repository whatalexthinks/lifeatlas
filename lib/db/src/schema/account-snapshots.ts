import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** One private, versioned cloud copy of the signed-in account's capsule workspace. */
export const accountSnapshotsTable = pgTable("account_snapshots", {
  userId: text("user_id").primaryKey(),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AccountSnapshotRow = typeof accountSnapshotsTable.$inferSelect;
