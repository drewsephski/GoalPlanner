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

function analyzeGoalType(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('learn') || lowerTitle.includes('study') || lowerTitle.includes('master') || lowerTitle.includes('course') || lowerTitle.includes('skill')) {
    return 'Learning/Education';
  } else if (lowerTitle.includes('fit') || lowerTitle.includes('run') || lowerTitle.includes('weight') || lowerTitle.includes('gym') || lowerTitle.includes('exercise') || lowerTitle.includes('health')) {
    return 'Fitness/Health';
  } else if (lowerTitle.includes('business') || lowerTitle.includes('start') || lowerTitle.includes('company') || lowerTitle.includes('entrepreneur') || lowerTitle.includes('startup')) {
    return 'Business/Entrepreneurship';
  } else if (lowerTitle.includes('write') || lowerTitle.includes('book') || lowerTitle.includes('create') || lowerTitle.includes('art') || lowerTitle.includes('music') || lowerTitle.includes('design')) {
    return 'Creative/Artistic';
  } else if (lowerTitle.includes('career') || lowerTitle.includes('job') || lowerTitle.includes('promotion') || lowerTitle.includes('professional')) {
    return 'Career/Professional';
  } else if (lowerTitle.includes('save') || lowerTitle.includes('money') || lowerTitle.includes('financial') || lowerTitle.includes('invest')) {
    return 'Financial';
  } else if (lowerTitle.includes('travel') || lowerTitle.includes('trip') || lowerTitle.includes('visit')) {
    return 'Travel/Experience';
  } else {
    return 'Personal Development';
  }
}

const SYSTEM_PROMPT = `You are an expert goal achievement coach and life strategist. Given a user's goal and context, generate a highly personalized, actionable, and inspiring plan that takes into account their specific situation.

Your response MUST be in valid JSON format with this exact structure:
{
  "overview": "Brief encouraging overview (2-3 sentences) that acknowledges their specific goal and context",
  "steps": [
    {
      "title": "Step title",
      "description": "Detailed explanation with specific actions tailored to their goal type and constraints",
      "order": 1
    }
  ],
  "timeline": "Specific timeline based on their deadline and time commitment",
  "tips": [
    "Practical tip 1",
    "Practical tip 2"
  ]
}

CRITICAL RULES:
1. Generate 5-8 actionable steps specifically tailored to the goal type (e.g., learning goals get different steps than business goals)
2. Each step should be SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
3. DIRECTLY address their biggest concern in multiple steps and tips
4. Make timeline realistic based on their specific time commitment and deadline
5. First step should be a "quick win" they can complete in under 30 minutes
6. Include 3-5 practical tips that address their specific concerns and goal type
7. Consider the goal category (learning, fitness, business, creative, etc.) and customize accordingly
8. Be encouraging but realistic about challenges
9. Return ONLY valid JSON, no markdown, no explanations

GOAL-SPECIFIC GUIDELINES:
- Learning goals: Include research, practice, feedback, and milestone steps
- Fitness goals: Include assessment, progression, nutrition, and recovery steps  
- Business goals: Include market research, planning, execution, and scaling steps
- Creative goals: Include inspiration, creation, refinement, and sharing steps
- Career goals: Include skill assessment, development, networking, and application steps`;

export async function generateGoalPlan(context: GoalContext) {
  const userPrompt = `
GOAL DETAILS:
Goal: ${context.title}
Why this matters: ${context.why}
Deadline: ${context.deadline}
Time commitment: ${context.timeCommitment}
Biggest concern: ${context.biggestConcern}

CONTEXT ANALYSIS:
- Goal type appears to be: ${analyzeGoalType(context.title)}
- Time availability: ${context.timeCommitment}
- Motivation: ${context.why}
- Main obstacle: ${context.biggestConcern}

Generate a highly personalized action plan that specifically addresses their concern, fits their timeline, and matches their goal type. Make every step actionable and relevant to their specific situation.`;

  try {
    const result = await generateText({
      model: openrouter('google/gemini-2.5-flash-lite-preview-09-2025'),
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
    const goalType = analyzeGoalType(context.title);
    
    const baseSteps = [
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
    ];

    // Customize steps based on goal type
    let customizedSteps = baseSteps;
    if (goalType === 'Learning/Education') {
      customizedSteps = [
        { title: 'Define Learning Objectives', description: 'Clearly define what you want to learn and why it matters.', order: 1 },
        { title: 'Gather Learning Resources', description: 'Find courses, books, and tools for your learning journey.', order: 2 },
        { title: 'Create Study Schedule', description: 'Set aside dedicated time for learning and practice.', order: 3 },
        { title: 'Practice and Apply', description: 'Apply what you learn through projects or exercises.', order: 4 },
        { title: 'Get Feedback', description: 'Share your progress and get input from others.', order: 5 },
      ];
    } else if (goalType === 'Fitness/Health') {
      customizedSteps = [
        { title: 'Assess Current Fitness', description: 'Evaluate your current fitness level and set realistic benchmarks.', order: 1 },
        { title: 'Create Workout Plan', description: 'Design a balanced exercise routine that fits your schedule.', order: 2 },
        { title: 'Focus on Nutrition', description: 'Plan meals that support your fitness goals.', order: 3 },
        { title: 'Track Progress', description: 'Monitor workouts, measurements, and how you feel.', order: 4 },
        { title: 'Adjust and Advance', description: 'Gradually increase intensity as you get stronger.', order: 5 },
      ];
    }

    return {
      overview: `Let's break down your goal: "${context.title}" into actionable steps tailored to your ${goalType.toLowerCase()} journey.`,
      steps: customizedSteps,
      timeline: 'Based on your availability, this could take 2-3 months',
      tips: [
        'Stay consistent, even when motivation dips',
        'Break large steps into smaller tasks',
        'Celebrate small wins along the way',
        context.biggestConcern ? `Address your concern about ${context.biggestConcern} directly` : 'Stay focused on your why',
      ],
    };
  }
}