import { NextRequest, NextResponse } from 'next/server';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

interface StepExpansionRequest {
  stepTitle: string;
  stepDescription: string | null;
  goalTitle: string;
  goalContext: {
    deadline?: string;
    timeCommitment?: string;
    biggestConcern?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: StepExpansionRequest = await req.json();
    const { stepTitle, stepDescription, goalTitle, goalContext } = body;

    // Create a detailed prompt for the AI
    const prompt = `You are a goal-setting and project management expert. 

Please expand the following step into smaller, actionable sub-steps:

GOAL: ${goalTitle}
${goalContext.deadline ? `DEADLINE: ${goalContext.deadline}` : ''}
${goalContext.timeCommitment ? `TIME COMMITMENT: ${goalContext.timeCommitment}` : ''}
${goalContext.biggestConcern ? `BIGGEST CONCERN: ${goalContext.biggestConcern}` : ''}

STEP TO EXPAND: ${stepTitle}
${stepDescription ? `DESCRIPTION: ${stepDescription}` : ''}

Please break this step down into 3-5 specific, actionable sub-steps. For each sub-step:
1. Give it a clear, action-oriented title (max 60 characters)
2. Provide a brief description of what to do (max 150 characters)
3. Estimate the time needed in a realistic range (e.g., "30 minutes", "2-3 hours", "1 day")

Respond in valid JSON format with this exact structure:
{
  "subSteps": [
    {
      "title": "Sub-step title",
      "description": "What to do for this sub-step",
      "estimatedTime": "Time estimate"
    }
  ],
  "reasoning": "Brief explanation of why you broke it down this way (max 200 characters)",
  "totalEstimatedTime": "Total time estimate for all sub-steps"
}

Make sure your response is valid JSON that can be parsed.`;

    try {
      // Check if OpenRouter API key is configured
      if (!process.env.OPENROUTER_API_KEY) {
        console.error('OpenRouter API key not configured');
        throw new Error('OpenRouter API key not configured');
      }

      // Use OpenRouter with a capable model
      const { text } = await generateText({
        model: openrouter('google/gemini-2.5-flash'),
        prompt: prompt,
        temperature: 0.7,
      });

      console.log('AI Response:', text);

      // Extract JSON from response (handle markdown code blocks)
      let jsonText = text.trim();
      
      // Remove markdown code block wrappers if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      // Parse the AI response
      const aiResponse = JSON.parse(jsonText.trim());
      
      // Validate the response structure
      if (!aiResponse.subSteps || !Array.isArray(aiResponse.subSteps)) {
        throw new Error('Invalid AI response structure');
      }

      return NextResponse.json(aiResponse);
    } catch (aiError) {
      console.error('AI service error:', aiError);
      
      // Fallback to a structured response if AI fails
      const fallbackResponse = {
        subSteps: [
          {
            title: "Research and preparation",
            description: "Gather necessary information and prepare for the task",
            estimatedTime: "30-60 minutes"
          },
          {
            title: "Main execution",
            description: "Focus on completing the core objective",
            estimatedTime: "2-3 hours"
          },
          {
            title: "Review and finalize",
            description: "Check your work and make any needed adjustments",
            estimatedTime: "30 minutes"
          }
        ],
        reasoning: "Structured approach with preparation, execution, and review phases",
        totalEstimatedTime: "3-4.5 hours"
      };

      return NextResponse.json(fallbackResponse);
    }
  } catch (error) {
    console.error('Error expanding step:', error);
    return NextResponse.json(
      { error: 'Failed to expand step' },
      { status: 500 }
    );
  }
}
