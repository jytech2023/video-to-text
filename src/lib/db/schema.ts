import { pgTable, text, timestamp, integer, uuid, boolean } from "drizzle-orm/pg-core";

export const processHistory = pgTable("process_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  url: text("url").notNull(),
  transcription: text("transcription"),
  videoUrl: text("video_url"),
  frameCount: integer("frame_count").notNull(),
  frames: text("frames"), // JSON string of frame descriptions
  durationMs: integer("duration_ms"),
  success: boolean("success").default(true).notNull(),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ProcessHistory = typeof processHistory.$inferSelect;
export type NewProcessHistory = typeof processHistory.$inferInsert;
