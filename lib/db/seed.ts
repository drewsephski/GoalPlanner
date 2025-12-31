import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from './index';
import { achievements } from './schema';

const initialAchievements = [
  {
    id: 'first_step',
    name: 'First Step',
    description: 'Complete your first step',
    icon: '🎯',
    tier: 'bronze',
    sortOrder: 1,
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    tier: 'bronze',
    sortOrder: 2,
  },
  {
    id: 'resilient',
    name: 'Resilient',
    description: 'Get unstuck and keep going',
    icon: '💪',
    tier: 'silver',
    sortOrder: 3,
  },
  {
    id: 'finisher',
    name: 'Finisher',
    description: 'Complete your first goal',
    icon: '🏆',
    tier: 'gold',
    sortOrder: 4,
  },
  {
    id: 'ambitious',
    name: 'Ambitious',
    description: 'Have 3 active goals simultaneously',
    icon: '🚀',
    tier: 'silver',
    sortOrder: 5,
  },
  {
    id: 'viral',
    name: 'Viral',
    description: 'Your public goal gets 100 views',
    icon: '📈',
    tier: 'gold',
    sortOrder: 6,
  },
  {
    id: 'century',
    name: 'Century',
    description: 'Maintain a 100-day streak',
    icon: '💯',
    tier: 'diamond',
    sortOrder: 7,
  },
  {
    id: 'legend',
    name: 'Legend',
    description: 'Complete 10 goals',
    icon: '👑',
    tier: 'diamond',
    sortOrder: 8,
  },
];

async function seed() {
  console.log('Seeding achievements...');
  
  for (const achievement of initialAchievements) {
    await db.insert(achievements).values(achievement).onConflictDoNothing();
  }
  
  console.log('✅ Achievements seeded');
}

seed().catch(console.error);