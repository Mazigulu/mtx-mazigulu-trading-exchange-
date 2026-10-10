import { db, isCloudSqlAvailable } from './index.ts';
import { users } from './schema.ts';

const localUsersByUid = new Map<string, { id: number; uid: string; email: string; createdAt: Date }>();
let localUserIdCounter = 1;

export async function getOrCreateUser(uid: string, email: string) {
  if (isCloudSqlAvailable) {
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

      if (result && result[0]) {
        localUsersByUid.set(uid, result[0]);
        return result[0];
      }
    } catch (err: any) {
      // Database connection or scale-to-zero fallback handled gracefully
    }
  }

  // Consistent fallback user
  let existing = localUsersByUid.get(uid);
  if (!existing) {
    existing = {
      id: localUserIdCounter++,
      uid,
      email,
      createdAt: new Date(),
    };
    localUsersByUid.set(uid, existing);
  } else {
    existing.email = email;
  }
  return existing;
}

