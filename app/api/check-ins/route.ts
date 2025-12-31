import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { checkIns, goals } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { updateUserStats } from '@/lib/stats/update-stats';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { goalId, type, mood, content, isPublic, imageUrl } = body;

    // Validate required fields
    if (!goalId || !type) {
      return new Response(
        JSON.stringify({ error: 'Goal ID and type are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify goal ownership
    const goal = await db.query.goals.findFirst({
      where: and(
        eq(goals.id, goalId),
        eq(goals.userId, userId)
      ),
    });

    if (!goal) {
      return new Response(JSON.stringify({ error: 'Goal not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create check-in
    const [checkIn] = await db
      .insert(checkIns)
      .values({
        goalId,
        userId,
        type: type || 'daily',
        mood: mood || null,
        content: content || null,
        imageUrl: imageUrl || null,
        isPublic: isPublic || false,
      })
      .returning();

    // Update user stats for activity
    await updateUserStats(userId, 'activity');

    return new Response(JSON.stringify({ checkIn }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating check-in:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create check-in' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { searchParams } = new URL(req.url);
    const goalId = searchParams.get('goalId');

    let query = db.query.checkIns.findMany({
      where: eq(checkIns.userId, userId),
      orderBy: [desc(checkIns.createdAt)],
      limit: 50,
      with: {
        goal: {
          columns: {
            title: true,
            slug: true,
          },
        },
      },
    });

    if (goalId) {
      query = db.query.checkIns.findMany({
        where: and(
          eq(checkIns.userId, userId),
          eq(checkIns.goalId, goalId)
        ),
        orderBy: [desc(checkIns.createdAt)],
        with: {
          goal: {
            columns: {
              title: true,
              slug: true,
            },
          },
        },
      });
    }

    const userCheckIns = await query;

    return new Response(JSON.stringify({ checkIns: userCheckIns }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch check-ins' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}