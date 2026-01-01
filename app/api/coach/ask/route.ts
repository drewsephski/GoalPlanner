import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { goals, checkIns } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { streamText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});


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
    const { goalId, question } = body;

    if (!goalId) {
      return new Response(
        JSON.stringify({ error: 'Goal ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch goal with full context
    const goal = await db.query.goals.findFirst({
      where: eq(goals.id, goalId),
      with: {
        steps: {
          orderBy: (steps, { asc }) => [asc(steps.orderNum)],
        },
      },
    });

    if (!goal || goal.userId !== userId) {
      return new Response(JSON.stringify({ error: 'Goal not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch recent check-ins for context
    const recentCheckIns = await db.query.checkIns.findMany({
      where: eq(checkIns.goalId, goalId),
      orderBy: [desc(checkIns.createdAt)],
      limit: 7,
    });

    // Calculate progress
    const totalSteps = goal.steps.length;
    const completedSteps = goal.steps.filter(s => s.status === 'completed').length;
    const currentStep = goal.steps.find(s => s.status === 'pending' || s.status === 'in_progress');
    
    const daysSinceStart = Math.floor(
      (new Date().getTime() - new Date(goal.startedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Build context for AI
    const context = {
      goal: {
        title: goal.title,
        why: goal.why,
        deadline: goal.deadline,
        timeCommitment: goal.timeCommitment,
        biggestConcern: goal.biggestConcern,
      },
      progress: {
        completedSteps,
        totalSteps,
        percentComplete: Math.round((completedSteps / totalSteps) * 100),
        daysSinceStart,
        currentStep: currentStep ? {
          title: currentStep.title,
          description: currentStep.description,
        } : null,
      },
      recentCheckIns: recentCheckIns.map(ci => ({
        date: ci.createdAt.toISOString().split('T')[0],
        mood: ci.mood,
        note: ci.content,
      })),
      originalPlan: goal.aiPlan,
    };

    const systemPrompt = `You are an empathetic and experienced goal achievement coach. You're helping someone work towards their goal.

CONTEXT:
Goal: ${context.goal.title}
Why it matters: ${context.goal.why}
Time commitment: ${context.goal.timeCommitment}
Biggest concern: ${context.goal.biggestConcern}

PROGRESS:
- ${context.progress.completedSteps} of ${context.progress.totalSteps} steps completed (${context.progress.percentComplete}%)
- ${context.progress.daysSinceStart} days into the journey
${context.progress.currentStep ? `- Currently working on: ${context.progress.currentStep.title}` : ''}

RECENT CHECK-INS:
${context.recentCheckIns.map(ci => `- ${ci.date}: ${ci.mood || 'no mood'} ${ci.note ? `- "${ci.note}"` : ''}`).join('\n')}

YOUR ROLE:
1. Be empathetic and understanding
2. Provide specific, actionable advice
3. Address concerns directly
4. If they're stuck, help them break things down into smaller steps
5. If they're doing well, celebrate and encourage
6. If they need to adjust the timeline or approach, suggest it honestly
7. Keep responses concise but warm (2-3 paragraphs max)

Respond in a conversational, supportive tone. You're a coach, not a robot.`;

    const userPrompt = question || 'I need help with my goal. What should I do next?';

    const result = streamText({
      model: openrouter('google/gemini-2.5-flash-lite-preview-09-2025'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      maxOutputTokens: 500,
    });

    return result.toTextStreamResponse({
      headers: {
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error in AI coach:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get coaching advice' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}