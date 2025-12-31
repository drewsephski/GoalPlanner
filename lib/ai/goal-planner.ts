import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

interface GoalContext {
  title: string;
  why: string;
  deadline: string;
  timeCommitment: string;
  biggestConcern: string;
}

const SYSTEM_PROMPT = `You are an expert goal achievement coach. Given a user's goal and context, generate a comprehensive, actionable, and inspiring plan to help them accomplish it.

Your response MUST be in valid JSON format with this exact structure:
{
  "overview": "Brief encouraging overview (2-3 sentences)",
  "steps": [
    {
      "title": "Step title",
      "description": "Detailed explanation with specific actions",
      "order": 1
    }
  ],
  "timeline": "Estimated completion time",
  "tips": [
    "Practical tip 1",
    "Practical tip 2"
  ]
}

IMPORTANT RULES:
1. Generate 5-8 actionable steps
2. Each step should be SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
3. Address the user's biggest concern in your plan
4. Make the timeline realistic based on their time commitment
5. First step should be a "quick win" they can do today
6. Include at least 3-5 practical tips
7. Be encouraging but realistic
8. Return ONLY valid JSON, no markdown, no explanations`;

export async function generateGoalPlan(context: GoalContext) {
  const userPrompt = `
Goal: ${context.title}

Why this matters: ${context.why}

Deadline: ${context.deadline}

Time commitment: ${context.timeCommitment}

Biggest concern: ${context.biggestConcern}

Generate a personalized action plan that addresses their concern and fits their timeline.`;

  try {
    const result = await generateText({
      model: openrouter('x-ai/grok-beta'),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.7,
    });

    // Parse JSON response
    const cleanText = result.text
      .trim()
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const plan = JSON.parse(cleanText);

    // Validate structure
    if (!plan.overview || !Array.isArray(plan.steps) || !plan.timeline || !Array.isArray(plan.tips)) {
      throw new Error('Invalid plan structure');
    }

    return plan;
  } catch (error) {
    console.error('Error generating goal plan:', error);
    
    // Fallback to basic plan
    return {
      overview: `Let's break down your goal: "${context.title}" into actionable steps.`,
      steps: [
        {
          title: 'Research and Planning',
          description: 'Gather resources and create a detailed roadmap for your goal.',
          order: 1,
        },
        {
          title: 'Start Small',
          description: 'Take your first actionable step to build momentum.',
          order: 2,
        },
        {
          title: 'Build Consistency',
          description: 'Establish a regular practice schedule.',
          order: 3,
        },
        {
          title: 'Track Progress',
          description: 'Monitor your advancement and adjust as needed.',
          order: 4,
        },
        {
          title: 'Complete and Celebrate',
          description: 'Finish strong and celebrate your achievement.',
          order: 5,
        },
      ],
      timeline: 'Based on your availability, this could take 2-3 months',
      tips: [
        'Stay consistent, even when motivation dips',
        'Break large steps into smaller tasks',
        'Celebrate small wins along the way',
      ],
    };
  }
}