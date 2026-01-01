import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { goals } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goalId, visibility } = await request.json();

    if (!goalId || !visibility) {
      return NextResponse.json({ error: 'Missing goalId or visibility' }, { status: 400 });
    }

    if (!['private', 'public', 'unlisted'].includes(visibility)) {
      return NextResponse.json({ error: 'Invalid visibility' }, { status: 400 });
    }

    // Update goal visibility (only if user owns the goal)
    const [updatedGoal] = await db
      .update(goals)
      .set({ 
        visibility,
        updatedAt: new Date()
      })
      .where(eq(goals.id, goalId))
      .returning();

    if (!updatedGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, goal: updatedGoal });
  } catch (error) {
    console.error('Error updating goal visibility:', error);
    return NextResponse.json({ error: 'Failed to update visibility' }, { status: 500 });
  }
}
