import { db } from '@/lib/db';
import { subscriptions, goals } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function getUserSubscription(userId: string) {
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });

  return subscription;
}

export async function isProUser(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription) return false;
  
  return (
    subscription.tier === 'pro' &&
    subscription.status === 'active' &&
    (!subscription.currentPeriodEnd || new Date() < subscription.currentPeriodEnd)
  );
}

export interface SubscriptionLimits {
  maxActiveGoals: number;
  dailyCheckIns: boolean;
  advancedAI: boolean;
  customTemplates: boolean;
  analytics: boolean;
  exportData: boolean;
  removeBranding: boolean;
}

export async function getSubscriptionLimits(userId: string): Promise<SubscriptionLimits> {
  const isPro = await isProUser(userId);

  if (isPro) {
    return {
      maxActiveGoals: Infinity,
      dailyCheckIns: true,
      advancedAI: true,
      customTemplates: true,
      analytics: true,
      exportData: true,
      removeBranding: true,
    };
  }

  // Free tier limits
  return {
    maxActiveGoals: 3,
    dailyCheckIns: false,
    advancedAI: false,
    customTemplates: false,
    analytics: false,
    exportData: false,
    removeBranding: false,
  };
}

export async function canCreateGoal(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  limit?: number;
}> {
  const limits = await getSubscriptionLimits(userId);
  
  // Count active goals
  const activeGoals = await db.query.goals.findMany({
    where: and(
      eq(goals.userId, userId),
      eq(goals.status, 'active')
    ),
  });

  const currentCount = activeGoals.length;

  if (limits.maxActiveGoals === Infinity) {
    return { allowed: true };
  }

  if (currentCount >= limits.maxActiveGoals) {
    return {
      allowed: false,
      reason: 'You have reached the maximum number of active goals for free accounts',
      currentCount,
      limit: limits.maxActiveGoals,
    };
  }

  return { allowed: true, currentCount, limit: limits.maxActiveGoals };
}
