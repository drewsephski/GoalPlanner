import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { steps } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { reorderData } = await req.json();

    if (!Array.isArray(reorderData) || reorderData.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid reorder data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate each reorder item
    for (const item of reorderData) {
      if (!item.stepId || typeof item.orderNum !== 'number') {
        return new Response(JSON.stringify({ error: 'Invalid reorder item format' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Better approach: Get each step individually to verify ownership
    for (const item of reorderData) {
      const step = await db.query.steps.findFirst({
        where: eq(steps.id, item.stepId),
        with: {
          goal: true,
        },
      });

      if (!step || step.goal.userId !== userId) {
        return new Response(JSON.stringify({ error: 'Step not found or access denied' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Update order for each step
    const updatePromises = reorderData.map(({ stepId, orderNum }) =>
      db
        .update(steps)
        .set({ orderNum })
        .where(eq(steps.id, stepId))
    );

    await Promise.all(updatePromises);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error reordering steps:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to reorder steps' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
