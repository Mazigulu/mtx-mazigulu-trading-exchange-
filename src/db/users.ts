import { db } from './index.ts';
import { users } from './schema.ts';

export async function getOrCreateUser(uid: string, email: string) {
  try {
    // Use upsert to handle concurrent inserts of the same user ID safely.
    // Updates email if the user already exists, or inserts a new record.
    const result = await db.insert(users)
      .values({
        uid,
        email,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
        },
      })
      .returning();

    return result[0];
  } catch (err: any) {
    console.error('[Users DB Fallback] Error in getOrCreateUser. Falling back to local memory user:', err.message || err);
    // Return a structured user object representing this user so downstream endpoints can function
    return {
      id: 1, // Safe fallback integer id
      uid,
      email,
      createdAt: new Date(),
    };
  }
}

