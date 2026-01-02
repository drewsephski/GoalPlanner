import { db } from '@/lib/db';
import { goals, steps, users } from '@/lib/db/schema';
import { generateGoalPlan } from '@/lib/ai/goal-planner';
import { extractStepsFromPlan } from '@/lib/ai/step-extractor';
import { generateSlug } from '@/lib/utils/slug';
import { canCreateGoal } from '@/lib/polar/subscription';
import { eq } from 'drizzle-orm';
import { ensureUserHasUsername } from '@/lib/user-utils';

// Helper function to create or get anonymous user
async function getOrCreateAnonymousUser(): Promise<string> {
  // For now, create a new anonymous user each time
  // In a production environment, you'd want to use cookies or session storage
  const newUserId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const anonymousUsername = `user_${Date.now()}`;

  try {
    await db.insert(users).values({
      id: newUserId,
      email: `${newUserId}@anonymous.local`,
      username: anonymousUsername,
      firstName: 'Anonymous',
      lastName: 'User',
    });

    // Also create user stats
    const { userStats } = await import('@/lib/db/schema');
    await db.insert(userStats).values({ userId: newUserId });

    console.log('Created anonymous user:', newUserId);
    return newUserId;
  } catch (error) {
    console.error('Error creating anonymous user:', error);
    throw new Error('Failed to create anonymous user');
  }
}

import { saveFallbackGoal, FallbackGoal } from '@/lib/fallback-storage';

async function saveGoalToFallbackStorage(goalData: Omit<FallbackGoal, 'id' | 'userId' | 'username' | 'createdAt' | 'isFallback' | 'steps'>, userId: string, username: string, extractedSteps: Array<{
  title: string;
  description: string;
  dueDate: string | null;
}> = []) {
  try {
    const fallbackGoal = {
      ...goalData,
      id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      username,
      createdAt: new Date().toISOString(),
      isFallback: true,
      steps: extractedSteps.map((step, index) => ({
        ...step,
        orderNum: index + 1,
        status: 'pending',
        isFallback: true,
      })),
    };
    await saveFallbackGoal(fallbackGoal);
    console.log('Goal saved to fallback storage:', fallbackGoal.id);
    return fallbackGoal;
  } catch (error) {
    console.error('Failed to save goal to fallback storage:', error);
    return null;
  }
}

// Helper function to retry database operations with exponential backoff
async function retryDbOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`Database operation attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

export async function POST(req: Request) {
  try {
    console.log('Goal creation request received');
    
    // Check for authenticated user first
    let userId = null;
    let isAnonymous = false;
    
    try {
      const { auth } = await import('@clerk/nextjs/server');
      const authData = await auth();
      userId = authData.userId;
      console.log('Authenticated user ID:', userId);
    } catch (error) {
      console.log('Clerk auth not available, using anonymous flow:', error);
    }

    // If no authenticated user, create or get anonymous user
    if (!userId) {
      isAnonymous = true;
      try {
        const anonymousUserId = await getOrCreateAnonymousUser();
        userId = anonymousUserId;
        console.log('Created anonymous user:', userId);
      } catch (error) {
        console.error('Failed to create anonymous user:', error);
        return new Response(JSON.stringify({ error: 'Failed to create user session' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Check subscription limits
    const canCreate = await canCreateGoal(userId);

    if (!canCreate.allowed) {
      return new Response(
        JSON.stringify({ 
          error: canCreate.reason,
          upgrade: true,
          currentCount: canCreate.currentCount,
          limit: canCreate.limit,
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await req.json();
    const { title, why, deadline, timeCommitment, biggestConcern } = body;

    // Validate required fields
    if (!title?.trim()) {
      return new Response(JSON.stringify({ error: 'Title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user info and ensure username exists
    let user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Ensure user has a username
    user = await ensureUserHasUsername(userId);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Failed to ensure user has username' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // User is now guaranteed to have a username
    const userWithUsername = user!;

    // Generate AI plan with full context
    console.log('Generating AI plan for goal:', title);
    const aiPlan = await generateGoalPlan({
      title: title.trim(),
      why: why?.trim() || '',
      deadline: deadline || '',
      timeCommitment: timeCommitment?.trim() || '',
      biggestConcern: biggestConcern?.trim() || '',
    });

    // Generate unique slug for public URL (with fallback)
    console.log('Generating slug for goal');
    let slug;
    try {
      slug = await retryDbOperation(() => generateSlug(title, userId));
    } catch (error) {
      console.error('Error generating slug:', error);
      // Fallback to simple slug generation
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substr(2, 6);
      slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}-${timestamp}-${randomSuffix}`;
      console.log('Using fallback slug:', slug);
    }

    // Extract and save steps from AI plan (with fallback)
    const extractedSteps = extractStepsFromPlan(aiPlan);
    
    // Create goal in database with fallback mechanism
    console.log('Creating goal in database');
    let newGoal: any = null;
    const goalData = {
      userId,
      title: title.trim(),
      slug,
      why: why?.trim() || null,
      deadline: deadline || null,
      timeCommitment: timeCommitment?.trim() || null,
      biggestConcern: biggestConcern?.trim() || null,
      aiPlan,
      status: 'active',
      visibility: 'private',
    };
    
    try {
      [newGoal] = await retryDbOperation(() => 
        db.insert(goals).values(goalData).returning()
      );
      console.log('Goal successfully created in database:', newGoal.id);
    } catch (error) {
      console.error('Error creating goal in database:', error);
      
      // Fallback: Create a mock goal object
      newGoal = {
        ...goalData,
        id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: new Date(),
        isFallback: true,
      };
      
      console.log('Using fallback goal object:', newGoal.id);
      
      // Try to save to fallback storage
      const fallbackGoal = await saveGoalToFallbackStorage(goalData, userId, userWithUsername.username || '', extractedSteps);
      if (fallbackGoal) {
        newGoal.id = fallbackGoal.id;
        // Merge the fallback data with the mock goal
        Object.assign(newGoal, fallbackGoal);
      }
    }

    // Try to save steps to database (or skip if fallback)
    let stepsSaved = false;
    if (extractedSteps.length > 0 && !newGoal.isFallback) {
      try {
        await retryDbOperation(() =>
          db.insert(steps).values(
            extractedSteps.map((step, index) => ({
              goalId: newGoal.id,
              orderNum: index + 1,
              title: step.title,
              description: step.description || null,
              dueDate: step.dueDate || null,
              status: 'pending',
            }))
          )
        );
        stepsSaved = true;
        console.log('Steps successfully saved to database');
      } catch (error) {
        console.error('Error saving steps to database:', error);
      }
    }

    return new Response(
      JSON.stringify({ 
        goalId: newGoal.id,
        slug: newGoal.slug,
        username: userWithUsername.username,
        isFallback: newGoal.isFallback || false,
        stepsSaved,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating goal:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create goal' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function GET() {
  try {
    // Check for authenticated user first
    let userId = null;
    try {
      const { auth } = await import('@clerk/nextjs/server');
      const authData = await auth();
      userId = authData.userId;
    } catch {
      // Clerk auth failed, continue with anonymous flow
      console.log('Authentication not available, using anonymous flow');
    }

    // If no authenticated user, create or get anonymous user
    if (!userId) {
      const anonymousUserId = await getOrCreateAnonymousUser();
      userId = anonymousUserId;
    }

    const userGoals = await db.query.goals.findMany({
      where: (goals, { eq }) => eq(goals.userId, userId),
      orderBy: (goals, { desc }) => [desc(goals.createdAt)],
      with: {
        steps: {
          orderBy: (steps, { asc }) => [asc(steps.orderNum)],
        },
      },
    });

    return new Response(JSON.stringify({ goals: userGoals }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch goals' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}