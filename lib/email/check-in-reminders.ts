import { db } from '@/lib/db';
import { users, goals, checkIns } from '@/lib/db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { sendEmail, dailyCheckInEmail } from './index';

export async function sendDailyCheckInReminders() {
  console.log('Starting daily check-in reminders...');

  try {
    // Get all users with active goals
    const allUsers = await db.query.users.findMany({
      with: {
        goals: {
          where: eq(goals.status, 'active'),
          orderBy: desc(goals.createdAt),
        },
      },
    });

    const usersWithActiveGoals = allUsers.filter(u => u.goals.length > 0);

    console.log(`Found ${usersWithActiveGoals.length} users with active goals`);

    for (const user of usersWithActiveGoals) {
      // Check if they've checked in today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaysCheckIn = await db.query.checkIns.findFirst({
        where: and(
          eq(checkIns.userId, user.id),
          gte(checkIns.createdAt, today)
        ),
      });

      if (todaysCheckIn) {
        console.log(`User ${user.id} already checked in today`);
        continue;
      }

      // Get their most recent active goal
      const activeGoal = user.goals[0];

      // Send reminder email
      const emailHtml = dailyCheckInEmail(
        user.firstName || 'there',
        activeGoal.title
      );

      await sendEmail({
        to: user.email,
        subject: `How's your goal going? 💪`,
        html: emailHtml,
      });

      console.log(`Sent reminder to ${user.email}`);
    }

    console.log('Daily check-in reminders complete!');
  } catch (error) {
    console.error('Error sending check-in reminders:', error);
    throw error;
  }
}