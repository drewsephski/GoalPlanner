import { promises as fs } from 'fs';
import path from 'path';

export type FallbackGoal = {
  id: string;
  userId: string;
  username: string;
  title: string;
  slug: string;
  why?: string | null;
  deadline?: string | null;
  timeCommitment?: string | null;
  biggestConcern?: string | null;
  aiPlan: {
    overview: string;
    steps: Array<{
      title: string;
      description: string;
      order: number;
    }>;
    timeline: string;
    tips: string[];
  };
  status: string;
  visibility: string;
  createdAt: string;
  isFallback: boolean;
  steps?: Array<{
    title: string;
    description?: string | null;
    dueDate?: string | null;
    orderNum: number;
    status: string;
    isFallback: boolean;
  }>;
};

const FALLBACK_GOALS_FILE = path.join(process.cwd(), 'fallback-goals.json');

async function ensureFallbackFile() {
  try {
    await fs.access(FALLBACK_GOALS_FILE);
  } catch {
    await fs.writeFile(FALLBACK_GOALS_FILE, JSON.stringify([]));
  }
}

export async function saveFallbackGoal(goalData: FallbackGoal): Promise<void> {
  await ensureFallbackFile();
  
  try {
    const data = await fs.readFile(FALLBACK_GOALS_FILE, 'utf-8');
    const fallbackGoals: FallbackGoal[] = JSON.parse(data);
    fallbackGoals.push(goalData);
    await fs.writeFile(FALLBACK_GOALS_FILE, JSON.stringify(fallbackGoals, null, 2));
  } catch (error) {
    console.error('Error saving fallback goal:', error);
    throw error;
  }
}

export async function getFallbackGoal(id: string, userId: string): Promise<FallbackGoal | null> {
  await ensureFallbackFile();
  
  try {
    const data = await fs.readFile(FALLBACK_GOALS_FILE, 'utf-8');
    const fallbackGoals: FallbackGoal[] = JSON.parse(data);
    return fallbackGoals.find(goal => goal.id === id && goal.userId === userId) || null;
  } catch (error) {
    console.error('Error retrieving fallback goal:', error);
    return null;
  }
}

export async function getFallbackGoalsByUser(userId: string): Promise<FallbackGoal[]> {
  await ensureFallbackFile();
  
  try {
    const data = await fs.readFile(FALLBACK_GOALS_FILE, 'utf-8');
    const fallbackGoals: FallbackGoal[] = JSON.parse(data);
    return fallbackGoals.filter(goal => goal.userId === userId);
  } catch (error) {
    console.error('Error retrieving fallback goals:', error);
    return [];
  }
}
