import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { username } = body;

    if (!username || typeof username !== 'string') {
      return new Response(JSON.stringify({ error: 'Username is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Validate username format
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return new Response(
        JSON.stringify({ error: 'Username must be 3-30 characters' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!/^[a-z0-9_-]+$/.test(cleanUsername)) {
      return new Response(
        JSON.stringify({ 
          error: 'Username can only contain letters, numbers, hyphens, and underscores' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if username is taken
    const existing = await db.query.users.findFirst({
      where: eq(users.username, cleanUsername),
    });

    if (existing && existing.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Username already taken' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Update username
    await db
      .update(users)
      .set({ 
        username: cleanUsername,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating username:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update username' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}