'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle2, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { StepExpander } from './StepExpander';
import { StepDetail } from './StepDetail';

interface StepItemProps {
  step: {
    id: string;
    title: string;
    description: string | null;
    dueDate: string | null;
    status: string;
    completedAt: Date | null;
    orderNum: number;
  };
  stepNumber: number;
  onToggle: () => void;
  disabled?: boolean;
  goalTitle?: string;
  goalContext?: {
    deadline?: string;
    timeCommitment?: string;
    biggestConcern?: string;
  };
  onSubStepsCreated?: (stepId: string, subSteps: Array<{
    title: string;
    description: string;
    estimatedTime: string;
  }>) => void;
  onStatusChange?: (stepId: string, newStatus: string) => void;
  onSubStepToggle?: (subStepId: string) => void;
  subSteps?: Array<{
    id: string;
    title: string;
    description: string;
    completed: boolean;
    orderNum: number;
  }>;
}

export function StepItem({ 
  step, 
  stepNumber, 
  onToggle, 
  disabled, 
  goalTitle, 
  goalContext, 
  onSubStepsCreated,
  onStatusChange,
  onSubStepToggle,
  subSteps
}: StepItemProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [expandedSubSteps, setExpandedSubSteps] = useState<Record<string, boolean>>({});

  const isCompleted = step.status === 'completed';

  // Debug logging
  console.log('StepItem rendered for step:', step.id, 'subSteps:', subSteps);

  const handleStepClick = (e: React.MouseEvent) => {
    // Prevent opening detail if clicking on checkbox or buttons
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input[type="checkbox"]')) {
      return;
    }
    setIsDetailOpen(true);
  };

  // const handleSubStepToggle = (subStepId: string) => {
  //   setExpandedSubSteps(prev => ({
  //     ...prev,
  //     [subStepId]: !prev[subStepId]
  //   }));
  // };

  const handleAccordionToggle = (stepId: string) => {
    setExpandedSubSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const handleSubStepCheckboxToggle = (subStepId: string) => {
    if (onSubStepToggle) {
      onSubStepToggle(subStepId);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(step.id, newStatus);
    }
  };

  return (
    <>
      <div 
        className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={handleStepClick}
      >
        <Checkbox
          checked={isCompleted}
          onCheckedChange={onToggle}
          disabled={disabled}
          className="mt-1"
          onClick={(e) => e.stopPropagation()}
        />
        
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                {stepNumber}. {step.title}
              </p>
              {step.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {step.description}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {goalTitle && goalContext && onSubStepsCreated && !isCompleted && (
                <StepExpander
                  stepId={step.id}
                  stepTitle={step.title}
                  stepDescription={step.description}
                  goalTitle={goalTitle}
                  goalContext={goalContext}
                  onSubStepsCreated={onSubStepsCreated}
                />
              )}
              {isCompleted && (
                <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Done
                </Badge>
              )}
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Due Date & Completed Date */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {step.dueDate && !isCompleted && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Due {format(new Date(step.dueDate), 'MMM d')}
              </div>
            )}
            {step.completedAt && (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Completed {format(new Date(step.completedAt), 'MMM d, yyyy')}
              </div>
            )}
          </div>

          {/* Sub-steps Accordion */}
          {subSteps && subSteps.length > 0 && (
            <div className="mt-3 border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAccordionToggle(step.id)}
                  className="h-6 px-2 text-xs font-medium"
                >
                  {expandedSubSteps[step.id] ? (
                    <ChevronDown className="h-3 w-3 mr-1" />
                  ) : (
                    <ChevronRight className="h-3 w-3 mr-1" />
                  )}
                  AI Sub-Steps ({subSteps.length})
                </Button>
                <div className="text-xs text-muted-foreground">
                  {subSteps.filter(s => s.completed).length}/{subSteps.length} completed
                </div>
              </div>
              
              {/* Individual Sub-steps */}
              {expandedSubSteps[step.id] && (
                <div className="space-y-2 ml-4">
                  {subSteps.map((subStep, index) => (
                    <div key={subStep.id} className="flex items-start gap-2 p-2 rounded-md bg-muted/30 border-l-2 border-primary/30">
                      <Checkbox
                        checked={subStep.completed}
                        onCheckedChange={() => handleSubStepCheckboxToggle(subStep.id)}
                        className="mt-0.5 h-4 w-4"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${subStep.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {index + 1}. {subStep.title}
                        </p>
                        {subStep.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {subStep.description}
                          </p>
                        )}
                      </div>
                      {subStep.completed && (
                        <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Step Detail Dialog */}
      {goalTitle && goalContext && (
        <StepDetail
          step={step}
          stepNumber={stepNumber}
          goalTitle={goalTitle}
          goalContext={goalContext}
          onToggle={onToggle}
          onStatusChange={handleStatusChange}
          onSubStepsCreated={onSubStepsCreated}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
        />
      )}
    </>
  );
}

export default StepItem;