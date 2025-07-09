import { eq } from 'drizzle-orm';
import { users } from '../../shared/schema';
import { db } from '../db';

/**
 * Check if a user is an admin based on their user ID
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const user = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user.length > 0 && user[0].isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Check if a user with given email is admin (legacy support)
 */
export async function isEmailAdmin(email: string): Promise<boolean> {
  try {
    const user = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user.length > 0 && user[0].isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status by email:', error);
    // Fallback to hardcoded admin for development
    return email === 'admin@example.com';
  }
}
