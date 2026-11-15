import { and, desc, eq, ne } from 'drizzle-orm';
import { db } from './index.ts';
import { profiles, studentMemory, studyRooms, users } from './schema.ts';

export async function getOrCreateUser(uid: string, email: string, displayName?: string) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email: email || '',
        displayName: displayName || '',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: email || '',
          ...(displayName ? { displayName } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getUserAcademicBundle(uid: string, email: string, displayName?: string) {
  try {
    const user = await getOrCreateUser(uid, email, displayName);
    const [profileRows, memoryRows] = await Promise.all([
      db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1),
      db.select().from(studentMemory).where(eq(studentMemory.userId, user.id)).limit(1),
    ]);
    return {
      user,
      profile: profileRows[0] || null,
      memory: memoryRows[0] || null,
    };
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function upsertAcademicProfile(
  uid: string,
  email: string,
  fields: {
    name?: string;
    field?: string;
    university?: string;
    academicTitle?: string;
    bio?: string;
  }
) {
  try {
    const user = await getOrCreateUser(uid, email, fields.name);
    const name = (fields.name || user.displayName || 'Scholar').trim().slice(0, 80);
    const field = (fields.field || '').trim().slice(0, 80);
    const university = (fields.university || '').trim().slice(0, 120);
    const academicTitle = (fields.academicTitle || '').trim().slice(0, 80);
    const bio = (fields.bio || '').trim().slice(0, 300);

    const [saved] = await db
      .insert(profiles)
      .values({
        userId: user.id,
        name,
        field,
        university,
        academicTitle,
        bio,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          name,
          field,
          university,
          academicTitle,
          bio,
          updatedAt: new Date(),
        },
      })
      .returning();

    return saved;
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getStudentMemory(uid: string, email: string) {
  try {
    const user = await getOrCreateUser(uid, email);
    const rows = await db
      .select()
      .from(studentMemory)
      .where(eq(studentMemory.userId, user.id))
      .limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function upsertStudentMemory(
  uid: string,
  email: string,
  patch: {
    field?: string;
    university?: string;
    lastTopic?: string;
    memoryNotes?: string;
  }
) {
  try {
    const user = await getOrCreateUser(uid, email);
    const existing = await db
      .select()
      .from(studentMemory)
      .where(eq(studentMemory.userId, user.id))
      .limit(1);
    const prev = existing[0];

    const field = patch.field !== undefined ? patch.field : (prev?.field || '');
    const university = patch.university !== undefined ? patch.university : (prev?.university || '');
    const lastTopic = patch.lastTopic !== undefined ? patch.lastTopic.slice(0, 160) : (prev?.lastTopic || '');
    const memoryNotes = patch.memoryNotes !== undefined ? patch.memoryNotes.slice(0, 1500) : (prev?.memoryNotes || '');

    const [saved] = await db
      .insert(studentMemory)
      .values({
        userId: user.id,
        field,
        university,
        lastTopic,
        memoryNotes,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: studentMemory.userId,
        set: {
          field,
          university,
          lastTopic,
          memoryNotes,
          updatedAt: new Date(),
        },
      })
      .returning();

    return saved;
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function createSqlStudyRoom(
  uid: string,
  email: string,
  input: {
    roomCode: string;
    title: string;
    field?: string;
    description?: string;
    visibility?: string;
    hostName: string;
    focusDurationMin?: number | null;
    durationMin?: number;
    scheduledAt?: string | null;
  }
) {
  try {
    const user = await getOrCreateUser(uid, email, input.hostName);
    const [room] = await db
      .insert(studyRooms)
      .values({
        roomCode: input.roomCode.trim().toUpperCase(),
        title: input.title.trim().slice(0, 120),
        field: (input.field || 'General').trim().slice(0, 80),
        description: (input.description || '').trim().slice(0, 400),
        visibility: input.visibility === 'private' ? 'private' : 'public',
        status: 'open',
        hostUserId: user.id,
        hostName: input.hostName.trim().slice(0, 80),
        focusDurationMin: input.focusDurationMin ? Math.round(input.focusDurationMin) : 25,
        durationMin: input.durationMin || 60,
        scheduledAt: input.scheduledAt || null,
      })
      .returning();
    return room;
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function findOpenSqlRoomByCode(roomCode: string) {
  try {
    const clean = roomCode.trim().toUpperCase();
    if (!clean) return null;
    const rows = await db
      .select()
      .from(studyRooms)
      .where(and(eq(studyRooms.roomCode, clean), ne(studyRooms.status, 'closed')))
      .limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function listOpenSqlRooms() {
  try {
    return await db
      .select()
      .from(studyRooms)
      .where(and(eq(studyRooms.visibility, 'public'), ne(studyRooms.status, 'closed')))
      .orderBy(desc(studyRooms.createdAt))
      .limit(40);
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
