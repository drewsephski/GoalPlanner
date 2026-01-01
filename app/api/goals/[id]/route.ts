import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { goals } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const goal = await db.query.goals.findFirst({
      where: and(
        eq(goals.id, id),
        eq(goals.userId, userId)
      ),
      with: {
        steps: {
          orderBy: (steps, { asc }) => [asc(steps.orderNum)],
        },
      },
    });

    if (!goal) {
      return new Response(JSON.stringify({ error: 'Goal not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ goal }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching goal:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch goal' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { status, visibility } = body;

    // Verify ownership
    const goal = await db.query.goals.findFirst({
      where: and(
        eq(goals.id, id),
        eq(goals.userId, userId)
      ),
    });

    if (!goal) {
      return new Response(JSON.stringify({ error: 'Goal not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update goal
    const updateData: { updatedAt: Date; status?: string; completedAt?: Date | null; visibility?: string } = { updatedAt: new Date() };
    
    if (status) {
      if (!['active', 'paused', 'completed', 'abandoned'].includes(status)) {
        return new Response(JSON.stringify({ error: 'Invalid status' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      updateData.status = status;
      if (status === 'completed') {
        updateData.completedAt = new Date();
      }
    }

    if (visibility) {
      if (!['private', 'public', 'unlisted'].includes(visibility)) {
        return new Response(JSON.stringify({ error: 'Invalid visibility' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      updateData.visibility = visibility;
    }

    const [updatedGoal] = await db
      .update(goals)
      .set(updateData)
      .where(eq(goals.id, id))
      .returning();

    return new Response(JSON.stringify({ goal: updatedGoal }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating goal:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update goal' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify ownership
    const goal = await db.query.goals.findFirst({
      where: and(
        eq(goals.id, id),
        eq(goals.userId, userId)
      ),
    });

    if (!goal) {
      return new Response(JSON.stringify({ error: 'Goal not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete goal (cascade will delete steps)
    await db.delete(goals).where(eq(goals.id, id));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete goal' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}