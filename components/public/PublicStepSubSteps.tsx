'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Sparkles, Loader2 } from 'lucide-react';

interface PublicStepSubStepsProps {
  stepTitle: string;
  stepDescription: string | null;
  goalTitle: string;
  goalContext: {
    deadline?: string;
    timeCommitment?: string;
    biggestConcern?: string;
  };
}

interface SubStep {
  title: string;
  description: string;
  estimatedTime: string;
}

interface StepExpansion {
  subSteps: SubStep[];
  reasoning: string;
  totalEstimatedTime: string;
}

export function PublicStepSubSteps({
  stepTitle,
  stepDescription,
  goalTitle,
  goalContext,
}: PublicStepSubStepsProps) {
  const [expansion, setExpansion] = useState<StepExpansion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubSteps = async () => {
      setIsLoading(true);
      setError(null);
      
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
          throw new Error('Failed to fetch sub-steps');
        }

        const result = await response.json();
        setExpansion(result);
      } catch (err) {
        console.error('Error fetching sub-steps:', err);
        setError('Unable to load action steps');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubSteps();
  }, [stepTitle, stepDescription, goalTitle, goalContext]);

  if (isLoading) {
    return (
      <div className="p-4 bg-primary/5 border-t">
        <div className="flex items-center gap-2 mb-3">
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
          <span className="text-sm font-medium text-primary">Loading AI-generated action steps...</span>
        </div>
      </div>
    );
  }

  if (error || !expansion) {
    return (
      <div className="p-4 bg-muted/30 border-t">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Action Steps</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {error || 'No action steps available for this step.'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-primary/5 border-t">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-primary">AI-Generated Action Steps</span>
      </div>
      
      <div className="space-y-2">
        {expansion.subSteps.map((subStep, index) => (
          <div key={index} className="p-3 bg-background rounded border border-primary/20">
            <div className="flex items-start gap-2 mb-2">
              <Badge variant="outline" className="text-xs bg-primary/10">
                {index + 1}
              </Badge>
              <div className="flex-1">
                <h5 className="font-medium text-sm">{subStep.title}</h5>
                <p className="text-xs text-muted-foreground mt-1">
                  {subStep.description}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                  <Clock className="h-3 w-3" />
                  {subStep.estimatedTime}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 p-2 bg-primary/10 rounded border border-primary/20">
        <p className="text-xs text-primary">
          <strong>AI Reasoning:</strong> {expansion.reasoning}
        </p>
        <div className="flex items-center gap-1 text-xs text-primary mt-1">
          <Clock className="h-3 w-3" />
          <strong>Total estimated time:</strong> {expansion.totalEstimatedTime}
        </div>
      </div>
    </div>
  );
}
