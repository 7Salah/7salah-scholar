import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  name: text('name').notNull(),
  field: text('field').default(''),
  university: text('university').default(''),
  academicTitle: text('academic_title').default(''),
  bio: text('bio').default(''),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const studyRooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  roomCode: text('room_code').notNull().unique(),
  title: text('title').notNull(),
  field: text('field').notNull().default('General'),
  description: text('description').default(''),
  visibility: text('visibility').notNull().default('public'),
  status: text('status').notNull().default('open'),
  hostUserId: integer('host_user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  hostName: text('host_name').notNull(),
  focusDurationMin: integer('focus_duration_min').default(25),
  durationMin: integer('duration_min').default(60),
  scheduledAt: text('scheduled_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const studentMemory = pgTable('student_memory', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  field: text('field').default(''),
  university: text('university').default(''),
  lastTopic: text('last_topic').default(''),
  memoryNotes: text('memory_notes').default(''),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  memory: one(studentMemory, {
    fields: [users.id],
    references: [studentMemory.userId],
  }),
  rooms: many(studyRooms),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const studyRoomsRelations = relations(studyRooms, ({ one }) => ({
  host: one(users, {
    fields: [studyRooms.hostUserId],
    references: [users.id],
  }),
}));

export const studentMemoryRelations = relations(studentMemory, ({ one }) => ({
  user: one(users, {
    fields: [studentMemory.userId],
    references: [users.id],
  }),
}));
