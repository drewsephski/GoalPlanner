interface ExpandedSubStep {
  title: string;
  description: string;
  estimatedTime: string; // e.g., "2 hours", "1 day"
}

interface StepExpansionResponse {
  subSteps: ExpandedSubStep[];
  reasoning: string;
  totalEstimatedTime: string;
}

export async function expandStepIntoSubSteps(
  stepTitle: string,
  stepDescription: string | null,
  goalTitle: string,
  goalContext: {
    deadline?: string;
    timeCommitment?: string;
    biggestConcern?: string;
  }
): Promise<StepExpansionResponse> {
  try {
    const response = await fetch('/api/ai/expand-step', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stepTitle,
        stepDescription,
        goalTitle,
        goalContext,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to expand step');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error expanding step:', error);
    // Fallback response
    return {
      subSteps: [
        {
          title: "Research and planning",
          description: "Gather necessary information and create a detailed plan",
          estimatedTime: "1-2 hours"
        },
        {
          title: "Execution",
          description: "Complete the main task based on your plan",
          estimatedTime: "2-4 hours"
        },
        {
          title: "Review and refine",
          description: "Review your work and make improvements",
          estimatedTime: "30 minutes"
        }
      ],
      reasoning: "Breaking down the task into research, execution, and review phases for better organization",
      totalEstimatedTime: "3.5-6.5 hours"
    };
  }
}
