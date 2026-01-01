'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Sparkles, 
  Plus, 
  Clock, 
  CheckCircle2,
  Loader2,
  Lightbulb
} from 'lucide-react';
import { expandStepIntoSubSteps } from '@/lib/ai/step-expander';

interface StepExpanderProps {
  stepId: string;
  stepTitle: string;
  stepDescription: string | null;
  goalTitle: string;
  goalContext: {
    deadline?: string;
    timeCommitment?: string;
    biggestConcern?: string;
  };
  onSubStepsCreated?: (stepId: string, subSteps: Array<{
    title: string;
    description: string;
    estimatedTime: string;
  }>) => void;
}

export function StepExpander({ 
  stepId, 
  stepTitle, 
  stepDescription, 
  goalTitle, 
  goalContext,
  onSubStepsCreated 
}: StepExpanderProps) {
  console.log('StepExpander rendering:', { stepId, stepTitle, goalTitle });
  
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [expansion, setExpansion] = useState<{
    subSteps: Array<{
      title: string;
      description: string;
      estimatedTime: string;
    }>;
    reasoning: string;
    totalEstimatedTime: string;
  } | null>(null);

  const handleExpand = async () => {
    setIsExpanding(true);
    try {
      const result = await expandStepIntoSubSteps(
        stepTitle,
        stepDescription,
        goalTitle,
        goalContext
      );
      setExpansion(result);
    } catch (error) {
      console.error('Error expanding step:', error);
    } finally {
      setIsExpanding(false);
    }
  };

  const handleAddSubSteps = () => {
    if (expansion && onSubStepsCreated) {
      onSubStepsCreated(stepId, expansion.subSteps);
      setIsOpen(false);
      setExpansion(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="text-xs"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          Expand with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Expand Step: {stepTitle}
          </DialogTitle>
          <DialogDescription>
            Break this step down into smaller, more manageable sub-steps with AI assistance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Original Step Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Original Step</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{stepTitle}</p>
              {stepDescription && (
                <p className="text-sm text-muted-foreground mt-2">{stepDescription}</p>
              )}
            </CardContent>
          </Card>

          {/* Expansion Controls */}
          {!expansion && (
            <div className="text-center">
              <Button 
                onClick={handleExpand} 
                disabled={isExpanding}
                className="bg-gradient-to-r from-primary to-chart-2"
              >
                {isExpanding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Expanding Step...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Sub-Steps
                  </>
                )}
              </Button>
            </div>
          )}

          {/* AI Expansion Results */}
          {expansion && (
            <div className="space-y-4">
              {/* Reasoning */}
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Lightbulb className="h-4 w-4" />
                    AI Reasoning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{expansion.reasoning}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Total estimated time: {expansion.totalEstimatedTime}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Sub-Steps */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Generated Sub-Steps ({expansion.subSteps.length})
                </h4>
                
                {expansion.subSteps.map((subStep: { title: string; description: string; estimatedTime: string }, index: number) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {index + 1}
                            </Badge>
                            <h5 className="font-medium">{subStep.title}</h5>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {subStep.description}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {subStep.estimatedTime}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleAddSubSteps}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add These Sub-Steps
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setExpansion(null)}
                >
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
