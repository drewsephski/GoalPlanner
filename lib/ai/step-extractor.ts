interface AIStep {
  title: string;
  description: string;
  order: number;
}

interface ExtractedStep {
  title: string;
  description: string;
  dueDate: string | null;
}

export function extractStepsFromPlan(aiPlan: Record<string, unknown>): ExtractedStep[] {
  if (!aiPlan?.steps || !Array.isArray(aiPlan.steps)) {
    return [];
  }

  return aiPlan.steps.map((step: AIStep) => ({
    title: step.title,
    description: step.description,
    dueDate: null, // We'll calculate this later based on timeline
  }));
}

// Calculate due dates based on timeline
export function calculateDueDates(
  steps: ExtractedStep[],
  deadline: string | null,
  startDate: Date = new Date()
): ExtractedStep[] {
  if (!deadline || steps.length === 0) {
    return steps;
  }

  const deadlineDate = new Date(deadline);
  const totalDays = Math.floor((deadlineDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysPerStep = Math.floor(totalDays / steps.length);

  return steps.map((step, index) => {
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + (daysPerStep * (index + 1)));
    
    return {
      ...step,
      dueDate: dueDate.toISOString().split('T')[0],
    };
  });
}