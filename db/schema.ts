import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const rooms = sqliteTable('rooms', {
  code: text('code').primaryKey(),
  state: text('state').notNull(),
  version: integer('version').notNull().default(0),
  presence: text('presence').notNull().default('[0,0,0,0]'),
  expiresAt: integer('expires_at').notNull(),
}, table => [index('idx_rooms_expiry').on(table.expiresAt)]);
