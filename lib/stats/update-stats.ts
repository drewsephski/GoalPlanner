import { db } from '@/lib/db';
import { userStats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function updateUserStats(
    userId: string,
    action: 'step_completed' | 'goal_completed' | 'activity'
) {
    const stats = await db.query.userStats.findFirst({
        where: eq(userStats.userId, userId),
    });

    if (!stats) {
        // Initialize stats if they don't exist
        await db.insert(userStats).values({ userId });
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    const lastActivity = stats.lastActivityDate;

    const updates: {
        lastActivityDate: string;
        updatedAt: Date;
        currentStreak?: number;
        longestStreak?: number;
        totalStepsCompleted?: number;
        totalGoalsCompleted?: number;
    } = {
        lastActivityDate: today,
        updatedAt: new Date(),
    };

    // Update streak
    if (lastActivity) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastActivity === yesterdayStr) {
            // Continued streak
            updates.currentStreak = stats.currentStreak + 1;
            updates.longestStreak = Math.max(stats.longestStreak, updates.currentStreak);
        } else if (lastActivity === today) {
            // Same day, no change to streak
            // Do nothing - streak continues
        } else {
            // Streak broken
            updates.currentStreak = 1;
        }
    } else {
        // First activity
        updates.currentStreak = 1;
        updates.longestStreak = 1;
    }

    // Update action-specific stats
    if (action === 'step_completed') {
        updates.totalStepsCompleted = stats.totalStepsCompleted + 1;
    } else if (action === 'goal_completed') {
        updates.totalGoalsCompleted = stats.totalGoalsCompleted + 1;
    }

    await db
        .update(userStats)
        .set(updates)
        .where(eq(userStats.userId, userId));
}